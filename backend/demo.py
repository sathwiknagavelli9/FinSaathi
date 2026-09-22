from datetime import date
from flask import g, request, jsonify
from backend.db import database
from backend.auth import require_user, now
from backend.analytics import shift_month
from backend.records import KINDS

def register_routes(app):
    @app.post('/api/demo-data')
    @require_user
    def load():
        db = database()
        if any(db[kind].count_documents({'user_id': g.uid}) for kind in KINDS):
            return jsonify(error='Demo data can only be loaded into an empty financial workspace. Remove existing data first.'), 409
        current = date.today().strftime('%Y-%m')
        batches = {kind: [] for kind in KINDS}
        def insert(kind, data):
            batches[kind].append({**data, 'user_id': g.uid, 'demo': True, 'created_at': now(), 'updated_at': now()})
        for delta in range(-6, 1):
            month = shift_month(current, delta)
            insert('transactions', {'type': 'Income', 'amount': 65000 + (delta + 6) * 500, 'category': 'Salary', 'description': 'Demo · Monthly salary', 'date': month + '-01', 'payment_method': 'Bank Transfer', 'recurring': True})
            for index, (category, base) in enumerate([('Housing', 14500), ('Food', 6200), ('Transportation', 2900), ('Shopping', 3200), ('Utilities/Bills', 2100), ('Entertainment', 1800), ('Healthcare', 900), ('EMI/Debt', 4200), ('Investment', 5000)]):
                day = min(2 + index * 2, date.today().day) if delta == 0 else 2 + index * 2
                insert('transactions', {'type': 'Expense', 'amount': round(base * (1 + (delta + 3) * .018 + (index % 3) * .015), 2), 'category': category, 'description': 'Demo · ' + category, 'date': f'{month}-{day:02d}', 'payment_method': 'UPI', 'recurring': category in ['Housing', 'Utilities/Bills', 'EMI/Debt', 'Investment']})
        for category, amount in [('Total', 45000), ('Food', 6500), ('Shopping', 3500), ('Housing', 15000), ('Transportation', 3500)]:
            insert('budgets', {'category': category, 'amount': amount, 'month': current})
        for name, category, target, saved, months in [('Emergency reserve', 'Emergency Fund', 200000, 80000, 12), ('A well-earned holiday', 'Travel', 90000, 28000, 10), ('New laptop', 'Electronics', 100000, 45000, 8)]:
            insert('goals', {'name': name, 'category': category, 'target': target, 'current': saved, 'target_date': shift_month(current, months) + '-01', 'priority': 'High' if category == 'Emergency Fund' else 'Medium', 'completed': False, 'contributions': []})
        insert('debts', {'name': 'Education loan', 'type': 'Education Loan', 'balance': 180000, 'rate': 9.5, 'payment': 4200, 'due_date': shift_month(current, 1) + '-05'})
        insert('debts', {'name': 'Credit card balance', 'type': 'Credit Card', 'balance': 18000, 'rate': 30, 'payment': 2000, 'due_date': date.today().isoformat()})
        for name, kind, amount, monthly in [('Index fund', 'Mutual Fund', 85000, 5000), ('Term deposit', 'Fixed Deposit', 50000, 0), ('Retirement savings', 'PPF', 30000, 1500)]:
            insert('investments', {'name': name, 'type': kind, 'amount': amount, 'monthly': monthly})
        for kind, documents in batches.items():
            if documents:
                db[kind].insert_many(documents)
        return jsonify(data={'message': 'Fictional demo data loaded. Your profile values were preserved.'})

    @app.delete('/api/demo-data')
    @require_user
    def remove_demo():
        for kind in KINDS:
            database()[kind].delete_many({'user_id': g.uid, 'demo': True})
        for kind in ['alerts', 'health_scores', 'predictions']:
            database()[kind].delete_many({'user_id': g.uid})
        return jsonify(data={'message': 'Demo records removed.'})

    @app.delete('/api/financial-data')
    @require_user
    def reset():
        if request.get_json().get('confirmation') != 'RESET':
            return jsonify(error='Type RESET to confirm.'), 400
        for kind in KINDS + ['alerts', 'health_scores', 'predictions', 'chat_sessions']:
            database()[kind].delete_many({'user_id': g.uid})
        return jsonify(data={'message': 'Financial records cleared. Your account and profile are preserved.'})
