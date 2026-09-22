from datetime import date
import pytest
from backend.analytics import ratio, change, goal_metrics, debt_plan, forecast, health_score, summarize
from backend.validation import number, record

def tx(month, amount, kind='Expense', category='Food'):
    return {'date': month + '-01', 'amount': amount, 'type': kind, 'category': category}

def test_ratios_zero_and_negative_cash_flow():
    assert ratio(1, 0) is None
    assert ratio(-20, 100) == -20
    assert change(150, 100) == 50
    assert change(10, 0) is None

def test_goal_contribution_and_overdue():
    goal = {'target': 1200, 'current': 200, 'target_date': '2026-11-01'}
    result = goal_metrics(goal, date(2026, 1, 1))
    assert result['required_monthly'] == 100
    assert result['months_remaining'] == 10
    assert goal_metrics(goal, date(2027, 1, 1))['overdue']

def test_zero_interest_repayment():
    result = debt_plan([{'name': 'Loan', 'balance': 1000, 'rate': 0, 'payment': 100}], 100)
    assert result['months'] == 5
    assert result['interest'] == 0

def test_strategy_order_and_extra_payment():
    debts = [{'name': 'Small', 'balance': 1000, 'rate': 5, 'payment': 100}, {'name': 'High', 'balance': 5000, 'rate': 25, 'payment': 200}]
    assert debt_plan(debts, strategy='snowball')['order'] == ['Small', 'High']
    assert debt_plan(debts)['order'] == ['High', 'Small']
    assert debt_plan(debts, 200)['months'] < debt_plan(debts)['months']
    assert debt_plan(debts, 200)['interest'] < debt_plan(debts)['interest']

def test_negative_amortization_is_not_promised_payoff():
    assert not debt_plan([{'name': 'Loan', 'balance': 10000, 'rate': 36, 'payment': 10}])['payable']
    assert debt_plan([])['months'] == 0

def test_prediction_baseline_and_trend_excludes_partial_month():
    assert forecast([], '2025-06')['prediction'] is None
    baseline = forecast([tx('2025-01', 100)], '2025-02')
    assert not baseline['adequate']
    assert baseline['prediction'] == 100
    trend = forecast([tx(f'2025-0{i}', i * 100) for i in range(1, 5)] + [tx('2025-05', 999999)], '2025-05')
    assert trend['adequate']
    assert trend['prediction'] == pytest.approx(600)
    assert len(trend['history']) == 4

def test_health_empty_and_reweighted():
    assert health_score(0, 0, [], [], [], [], {})['score'] is None
    score = health_score(1000, 500, [], [], [], [], {'emergency_fund': 3000})
    assert score['score'] == 100
    assert sum(f['maximum'] for f in score['factors']) == pytest.approx(100)
    assert len(score['factors']) == 3

def test_summary_uses_records_not_profile_estimates():
    rows = [tx('2025-01', 1000, 'Income', 'Salary'), tx('2025-01', 200)]
    result = summarize(rows, [{'id': 'b', 'category': 'Food', 'amount': 100}], [], [], [], {'monthly_income': 999999}, '2025-01')
    assert result['income'] == 1000
    assert result['expenses'] == 200
    assert result['net'] == 800
    assert result['savings_rate'] == 80
    assert result['budgets'][0]['utilization'] == 200

@pytest.mark.parametrize('bad', [-1, float('nan'), float('inf'), True, 'hello', None])
def test_invalid_numbers(bad):
    with pytest.raises(ValueError):
        number(bad, 'Amount')

def test_invalid_transaction_category():
    with pytest.raises(ValueError):
        record('transactions', {'type': 'Income', 'amount': 100, 'category': 'Food', 'description': 'test', 'date': '2025-01-01'})
