import math
import re
from datetime import date

EXPENSE_CATEGORIES = ['Food', 'Housing', 'Transportation', 'Shopping', 'Entertainment', 'Utilities/Bills', 'Healthcare', 'Education', 'EMI/Debt', 'Investment', 'Travel', 'Other']
INCOME_CATEGORIES = ['Salary', 'Business', 'Freelance', 'Allowance', 'Investment Income', 'Other']

def text(value, name, maximum=200, required=True):
    if not isinstance(value, str) or len(value.strip()) > maximum or (required and not value.strip()):
        raise ValueError(f'{name} is required and must be at most {maximum} characters.')
    return value.strip()

def number(value, name, minimum=0, maximum=1e12):
    if isinstance(value, bool):
        raise ValueError(f'{name} must be a valid number.')
    try:
        result = float(value)
    except (ValueError, TypeError):
        raise ValueError(f'{name} must be a valid number.')
    if not math.isfinite(result) or not minimum <= result <= maximum:
        raise ValueError(f'{name} must be between {minimum:g} and {maximum:g}.')
    return round(result, 2)

def choice(value, name, options):
    if value not in options:
        raise ValueError(f'Choose a valid {name}.')
    return value

def day(value, name='Date'):
    try:
        result = date.fromisoformat(value)
        if result.year < 1900 or result.year > 2200:
            raise ValueError()
        return result.isoformat()
    except (TypeError, ValueError):
        raise ValueError(f'{name} must be a valid date.')

def month(value):
    if not isinstance(value, str) or not re.fullmatch(r'\d{4}-(0[1-9]|1[0-2])', value):
        raise ValueError('Month must use YYYY-MM format.')
    day(value + '-01')
    return value

def email(value):
    value = text(value, 'Email', 254).lower()
    if not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', value):
        raise ValueError('Enter a valid email address.')
    return value

def password(value):
    if not isinstance(value, str) or not 10 <= len(value) <= 128 or not re.search('[A-Za-z]', value) or not re.search('[0-9]', value):
        raise ValueError('Use 10–128 characters with at least one letter and one number.')
    return value

def profile(data):
    result = {}
    for key in ['name', 'occupation', 'age_range']:
        if key in data:
            result[key] = text(data[key], key.replace('_', ' ').title(), 100, key == 'name')
    if 'email' in data:
        result['email'] = email(data['email'])
    for key in ['monthly_income', 'monthly_expenses', 'savings', 'emergency_fund', 'investment_capacity', 'current_investments', 'investment_horizon']:
        if key in data:
            result[key] = number(data[key], key.replace('_', ' ').title(), maximum=100 if key == 'investment_horizon' else 1e12)
    if 'risk' in data:
        result['risk'] = choice(data['risk'], 'risk tolerance', ['Conservative', 'Moderate', 'Aggressive'])
    if 'currency' in data:
        result['currency'] = choice(data['currency'], 'currency', ['INR'])
    if 'onboarded' in data:
        if not isinstance(data['onboarded'], bool):
            raise ValueError('Invalid onboarding status.')
        result['onboarded'] = data['onboarded']
    return result

def record(kind, data):
    if not isinstance(data, dict):
        raise ValueError('Expected an object.')
    if kind == 'transactions':
        tx_type = choice(data.get('type'), 'type', ['Income', 'Expense'])
        recurring = data.get('recurring', False)
        if not isinstance(recurring, bool):
            raise ValueError('Recurring must be true or false.')
        return {'type': tx_type, 'amount': number(data.get('amount'), 'Amount', .01), 'category': choice(data.get('category'), 'category', INCOME_CATEGORIES if tx_type == 'Income' else EXPENSE_CATEGORIES), 'description': text(data.get('description'), 'Description'), 'date': day(data.get('date')), 'payment_method': choice(data.get('payment_method', 'UPI'), 'payment method', ['UPI', 'Cash', 'Debit Card', 'Credit Card', 'Bank Transfer', 'Other']), 'recurring': recurring}
    if kind == 'budgets':
        return {'month': month(data.get('month')), 'category': choice(data.get('category'), 'category', ['Total'] + EXPENSE_CATEGORIES), 'amount': number(data.get('amount'), 'Budget', .01)}
    result = {'name': text(data.get('name'), 'Name')}
    if kind == 'goals':
        result.update(category=choice(data.get('category'), 'category', ['Emergency Fund', 'Education', 'Travel', 'Electronics', 'Vehicle', 'Home', 'Retirement', 'Other']), target=number(data.get('target'), 'Target', .01), current=number(data.get('current', 0), 'Current savings'), target_date=day(data.get('target_date'), 'Target date'), priority=choice(data.get('priority', 'Medium'), 'priority', ['High', 'Medium', 'Low']))
        if result['current'] > result['target']:
            raise ValueError('Current savings cannot exceed the target.')
        result['completed'] = result['current'] >= result['target']
    elif kind == 'debts':
        result.update(type=choice(data.get('type'), 'debt type', ['Education Loan', 'Personal Loan', 'Credit Card', 'Vehicle Loan', 'Other']), balance=number(data.get('balance'), 'Balance', .01), rate=number(data.get('rate'), 'Annual interest', 0, 100), payment=number(data.get('payment'), 'Monthly payment', .01), due_date=day(data['due_date']) if data.get('due_date') else '')
    elif kind == 'investments':
        result.update(type=choice(data.get('type'), 'investment type', ['Fixed Deposit', 'Mutual Fund', 'Equity', 'Gold', 'PPF', 'EPF', 'Bonds', 'Other']), amount=number(data.get('amount'), 'Invested amount', .01), monthly=number(data.get('monthly', 0), 'Monthly contribution'))
    return result
