"""Deterministic ratios, transparent scoring, OLS forecasting, debt simulation."""
import calendar
from datetime import date
import numpy as np
import pandas as pd

def ratio(a, b):
    return round(a / b * 100, 2) if b > 0 else None

def change(current, previous):
    return ratio(current - previous, previous)

def shift_month(value, delta):
    y, m = map(int, value[:7].split('-'))
    index = y * 12 + m - 1 + delta
    return f'{index // 12:04d}-{index % 12 + 1:02d}'

def recurring_obligations(transactions, today=None):
    """Estimate the next monthly occurrence, without creating a transaction."""
    today = today or date.today()
    latest = {}
    for transaction in transactions:
        if transaction.get('recurring') and transaction['type'] == 'Expense':
            key = (transaction['category'], transaction['description'].strip().lower())
            if key not in latest or transaction['date'] > latest[key]['date']:
                latest[key] = transaction
    result = []
    for transaction in latest.values():
        recorded = date.fromisoformat(transaction['date'])
        month = max(today.strftime('%Y-%m'), shift_month(recorded.isoformat(), 1))
        year, value = map(int, month.split('-'))
        due = date(year, value, min(recorded.day, calendar.monthrange(year, value)[1]))
        if due < today:
            year, value = map(int, shift_month(month, 1).split('-'))
            due = date(year, value, min(recorded.day, calendar.monthrange(year, value)[1]))
        result.append({'name': transaction['description'], 'category': transaction['category'], 'amount': transaction['amount'], 'due_date': due.isoformat()})
    return sorted(result, key=lambda item: item['due_date'])

def goal_metrics(goal, today=None):
    today = today or date.today()
    target = date.fromisoformat(goal['target_date'])
    months = max(1, (target.year - today.year) * 12 + target.month - today.month + (target.day > today.day))
    remaining = max(0, goal['target'] - goal['current'])
    return {**goal, 'progress': min(100, ratio(goal['current'], goal['target']) or 0), 'remaining': round(remaining, 2), 'months_remaining': months, 'required_monthly': round(remaining / months, 2), 'overdue': target < today and remaining > 0}

def forecast(transactions, selected_month):
    # Only completed months train the model: partial months would bias it down.
    cutoff = min(selected_month, date.today().strftime('%Y-%m'))
    expenses = [t for t in transactions if t['type'] == 'Expense' and t['date'][:7] < cutoff]
    if not expenses:
        return {'prediction': None, 'method': 'Insufficient history', 'adequate': False, 'history': [], 'categories': [], 'explanation': 'Add expenses from completed months to establish a baseline. Current partial-month spending is excluded from training.', 'month': shift_month(selected_month, 1)}
    frame = pd.DataFrame(expenses)
    frame['month'] = frame['date'].str[:7]
    months = pd.period_range(frame['month'].min(), shift_month(cutoff, -1), freq='M').astype(str).tolist()[-24:]
    sums = frame.groupby('month')['amount'].sum()
    values = np.array([float(sums.get(m, 0)) for m in months])
    adequate = len(values) >= 4
    def estimate(series):
        if adequate:
            x = np.arange(len(series), dtype=float)
            slope, intercept = np.linalg.lstsq(np.column_stack([x, np.ones(len(x))]), series, rcond=None)[0]
            # Forecast the month following the selected month (two steps from last complete).
            return max(0, float(intercept + slope * (len(series) + 1)))
        return float(np.mean(series[-3:]))
    prediction = round(estimate(values), 2)
    categories = []
    for category, group in frame.groupby('category'):
        by_month = group.groupby('month')['amount'].sum()
        categories.append({'name': category, 'amount': round(estimate(np.array([float(by_month.get(m, 0)) for m in months])), 2)})
    return {'prediction': prediction, 'method': 'Ordinary least squares linear regression' if adequate else 'Recent completed-month average', 'adequate': adequate, 'history': [{'month': m, 'expenses': round(float(v), 2)} for m, v in zip(months, values)], 'categories': categories, 'month': shift_month(selected_month, 1), 'explanation': f'{len(values)} completed calendar months; missing months between records count as zero. ' + ('A straight line is fitted to month index and expenses using NumPy least squares. This is a trend estimate, not a guarantee or calibrated confidence interval.' if adequate else 'Fewer than four months are available. The average of up to three recent completed months is a baseline, not a trained forecast.')}

def debt_plan(debts, extra=0, strategy='avalanche'):
    ordered = sorted(debts, key=lambda d: d['balance'] if strategy == 'snowball' else -d['rate'])
    balances = [float(d['balance']) for d in ordered]
    budget = sum(d['payment'] for d in ordered) + extra
    interest = 0
    schedule = []
    if not ordered:
        return {'months': 0, 'interest': 0, 'order': [], 'schedule': [], 'payable': True}
    for month in range(1, 601):
        available = budget
        for i, d in enumerate(ordered):
            charge = balances[i] * d['rate'] / 1200
            interest += charge
            balances[i] += charge
            payment = min(balances[i], d['payment'], available)
            balances[i] = max(0, balances[i] - payment)
            available -= payment
        for i in range(len(ordered)):
            payment = min(balances[i], available)
            balances[i] -= payment
            available -= payment
        if month <= 12 or month % 12 == 0:
            schedule.append({'month': month, 'balance': round(sum(balances), 2)})
        if sum(balances) < .01:
            return {'months': month, 'interest': round(interest, 2), 'order': [d['name'] for d in ordered], 'schedule': schedule, 'payable': True}
    return {'months': None, 'interest': round(interest, 2), 'order': [d['name'] for d in ordered], 'schedule': schedule, 'payable': False}

def health_score(income, expenses, budgets, debts, goals, investments, profile):
    factors = []
    def add(name, weight, value, formula, action):
        if value is not None:
            factors.append({'name': name, 'weight': weight, 'fraction': max(0, min(1, value)), 'formula': formula, 'action': action})
    add('Savings rate', 25, max(0, (income - expenses) / income) / .2 if income > 0 else None, 'Net cash flow / income, with full credit at 20% savings.', 'Build a consistent savings margin before increasing discretionary spending.')
    total_budget = next((b['amount'] for b in budgets if b['category'] == 'Total'), sum(b['amount'] for b in budgets))
    add('Budget discipline', 20, max(0, 1 - max(0, expenses - total_budget) / total_budget) if total_budget > 0 else None, 'Full credit within budget; proportional reduction for overspending.', 'Review exceeded categories and choose realistic limits.')
    payment = sum(d['payment'] for d in debts)
    add('Debt management', 20, max(0, 1 - payment / income) if debts and income > 0 else (1 if not debts else None), '1 − monthly debt payments / income; no debt earns full credit.', 'Review high-interest debt and test an affordable extra payment.')
    add('Emergency fund', 15, profile.get('emergency_fund', 0) / (expenses * 6) if expenses > 0 else None, 'Emergency fund / six months of recorded expenses.', 'Build an accessible reserve for essential expenses.')
    add('Goal progress', 10, sum(min(1, g['current'] / g['target']) for g in goals) / len(goals) if goals else None, 'Average saved / target across goals.', 'Set aside the required monthly contribution for priority goals.')
    capacity = profile.get('investment_capacity', 0)
    add('Investment contributions', 10, sum(i['monthly'] for i in investments) / capacity if capacity > 0 else None, 'Declared monthly investment contributions / stated capacity; this is not a verified payment history.', 'Review whether your declared investing amount is affordable.')
    total_weight = sum(f['weight'] for f in factors)
    for f in factors:
        f['maximum'] = round(f['weight'] / total_weight * 100, 2)
        f['points'] = round(f['fraction'] * f['maximum'], 2)
    # A debt-free empty account is not enough evidence for a meaningful score.
    meaningful = income > 0 or expenses > 0
    score = round(sum(f['points'] for f in factors)) if meaningful else None
    status = 'Not enough data' if score is None else 'Excellent' if score >= 90 else 'Very Good' if score >= 75 else 'Good' if score >= 60 else 'Fair' if score >= 40 else 'Needs Attention'
    return {'score': score, 'status': status, 'factors': factors if meaningful else [], 'recommendations': [f['action'] for f in factors if f['fraction'] < .8] if meaningful else ['Add income and expense records to calculate your score.'], 'explanation': 'A transparent educational indicator, not a credit score. Applicable factors are reweighted to 100. Profile estimates are not substituted for recorded cash flow.'}

def summarize(transactions, budgets, goals, debts, investments, profile, month, start=None, end=None):
    start = start or month + '-01'
    y, m = map(int, month.split('-'))
    end = end or f'{month}-{calendar.monthrange(y, m)[1]}'
    selected = [t for t in transactions if start <= t['date'] <= end]
    previous_month = shift_month(month, -1)
    previous = [t for t in transactions if t['date'][:7] == previous_month]
    income = round(sum(t['amount'] for t in selected if t['type'] == 'Income'), 2)
    expenses = round(sum(t['amount'] for t in selected if t['type'] == 'Expense'), 2)
    previous_expenses = sum(t['amount'] for t in previous if t['type'] == 'Expense')
    categories = {}
    weekly = {}
    day_type = {'Weekday': 0, 'Weekend': 0}
    for t in selected:
        if t['type'] != 'Expense':
            continue
        categories[t['category']] = categories.get(t['category'], 0) + t['amount']
        d = date.fromisoformat(t['date'])
        week = f'Week {(d.day - 1) // 7 + 1}'
        weekly[week] = weekly.get(week, 0) + t['amount']
        day_type['Weekend' if d.weekday() >= 5 else 'Weekday'] += t['amount']
    category_list = sorted([{'name': k, 'amount': round(v, 2), 'share': ratio(v, expenses)} for k, v in categories.items()], key=lambda x: -x['amount'])
    history = []
    for delta in range(-5, 1):
        key = shift_month(month, delta)
        rows = [t for t in transactions if t['date'][:7] == key]
        history.append({'month': key, 'income': round(sum(t['amount'] for t in rows if t['type'] == 'Income'), 2), 'expenses': round(sum(t['amount'] for t in rows if t['type'] == 'Expense'), 2)})
    enriched_budgets = [{**b, 'spent': expenses if b['category'] == 'Total' else round(categories.get(b['category'], 0), 2), 'utilization': ratio(expenses if b['category'] == 'Total' else categories.get(b['category'], 0), b['amount']) or 0} for b in budgets]
    total_budget = next((b['amount'] for b in budgets if b['category'] == 'Total'), sum(b['amount'] for b in budgets))
    elapsed = max(1, (min(date.today(), date.fromisoformat(end)) - date.fromisoformat(start)).days + 1)
    prediction = forecast(transactions, month)
    health = health_score(income, expenses, budgets, debts, goals, investments, profile)
    insights = []
    if category_list:
        insights.append(f"{category_list[0]['name']} is your largest category at {category_list[0]['share']:.0f}% of recorded expenses.")
        insights.append(f"Your top three categories account for {sum(c['share'] for c in category_list[:3]):.0f}% of expenses.")
    delta = change(expenses, previous_expenses)
    if delta is not None:
        insights.append(f'Recorded expenses are {abs(delta):.1f}% {"higher" if delta >= 0 else "lower"} than the previous full month. A partial month is not a like-for-like comparison.')
    suggestions = []
    historical = [t for t in transactions if t['type'] == 'Expense' and shift_month(month, -3) <= t['date'][:7] < month]
    historical_months = len(set(t['date'][:7] for t in historical))
    if historical_months:
        for category in sorted(set(t['category'] for t in historical)):
            amount = sum(t['amount'] for t in historical if t['category'] == category) / historical_months
            suggestions.append({'category': category, 'amount': round(amount, 2), 'months': historical_months})
    return {'month': month, 'start': start, 'end': end, 'income': income, 'expenses': expenses, 'net': round(income - expenses, 2), 'savings_rate': ratio(income - expenses, income), 'total_budget': total_budget, 'remaining_budget': round(total_budget - expenses, 2) if total_budget else None, 'expense_change': delta, 'income_change': change(income, sum(t['amount'] for t in previous if t['type'] == 'Income')), 'average_daily': round(expenses / elapsed, 2), 'categories': category_list, 'history': history, 'weekly': [{'name': k, 'amount': v} for k, v in sorted(weekly.items())], 'day_type': [{'name': k, 'amount': v} for k, v in day_type.items()], 'pattern': 'Insufficient history' if delta is None else 'Increasing' if delta > 5 else 'Decreasing' if delta < -5 else 'Stable', 'budgets': enriched_budgets, 'budget_suggestions': suggestions, 'goals': [goal_metrics(g) for g in goals], 'debts': debts, 'debt_total': round(sum(d['balance'] for d in debts), 2), 'debt_payments': round(sum(d['payment'] for d in debts), 2), 'debt_to_income': ratio(sum(d['payment'] for d in debts), income), 'investments': investments, 'invested': round(sum(i['amount'] for i in investments), 2), 'investing_monthly': round(sum(i['monthly'] for i in investments), 2), 'health': health, 'prediction': prediction, 'insights': insights, 'recent': sorted(selected, key=lambda t: t['date'], reverse=True)[:8]}
