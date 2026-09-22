"""Exercise a temporary real Atlas account; remove only test-owned data afterwards.

Run against local Flask test client by default, or a deployed URL argument.
"""
import sys
import uuid
import requests
from datetime import date
from backend.app import create_app
from backend.db import database

base = sys.argv[1].rstrip('/') if len(sys.argv) > 1 else None
identities = []
clients = [requests.Session(), requests.Session()] if base else [create_app().test_client(), create_app().test_client()]

def call(client, method, path, body=None, expected=200):
    if base:
        response = client.request(method, base + '/api' + path, json=body, timeout=60)
        payload = response.json() if 'application/json' in response.headers.get('Content-Type', '') else None
    else:
        response = client.open('/api' + path, method=method, json=body)
        payload = response.json
    assert response.status_code == expected, (path, response.status_code, payload)
    return payload.get('data') if payload else None

try:
    for i, client in enumerate(clients):
        email = f'qa-{uuid.uuid4().hex}@example.com'
        password = 'Qa-' + uuid.uuid4().hex
        user = call(client, 'POST', '/auth/register', {'name': 'QA Verification', 'email': email, 'password': password})
        identities.append((user['id'], email, password))
        call(client, 'PATCH', '/profile', {'occupation': 'Student', 'monthly_income': 60000, 'monthly_expenses': 20000, 'savings': 20000, 'emergency_fund': 10000, 'risk': 'Moderate', 'investment_capacity': 5000, 'investment_horizon': 5, 'onboarded': True})
    first, second = clients
    month = date.today().strftime('%Y-%m')
    transaction = call(first, 'POST', '/records/transactions', {'type': 'Income', 'amount': 60000, 'category': 'Salary', 'description': 'QA salary', 'date': month+'-01'}, 201)
    call(first, 'POST', '/records/transactions', {'type': 'Expense', 'amount': 5000, 'category': 'Food', 'description': '=QA formula safety', 'date': month+'-02'}, 201)
    call(second, 'PATCH', '/records/transactions/'+transaction['id'], {'amount': 1}, 404)
    call(second, 'DELETE', '/records/transactions/'+transaction['id'], {}, 404)
    assert call(second, 'GET', '/records/transactions')['total'] == 0
    call(first, 'POST', '/records/budgets', {'month': month, 'category': 'Food', 'amount': 5500}, 201)
    goal = call(first, 'POST', '/records/goals', {'name': 'QA goal', 'category': 'Travel', 'target': 10000, 'current': 0, 'target_date': '2027-12-01', 'priority': 'High'}, 201)
    call(first, 'POST', '/goals/'+goal['id']+'/contribute', {'amount': 2000})
    call(first, 'POST', '/records/debts', {'name': 'QA loan', 'type': 'Personal Loan', 'balance': 10000, 'rate': 10, 'payment': 1000}, 201)
    call(first, 'POST', '/records/investments', {'name': 'QA fund', 'type': 'Mutual Fund', 'amount': 5000, 'monthly': 1000}, 201)
    data = call(first, 'GET', '/dashboard?month='+month)
    assert data['income'] == 60000 and data['expenses'] == 5000
    assert data['goals'][0]['current'] == 2000
    assert data['budgets'][0]['utilization'] > 90
    assert data['invested'] == 5000
    assert data['health']['score'] is not None
    for path in ['/analytics','/predictions','/health','/reports','/alerts','/debts/plan?strategy=snowball&extra=500','/debts/plan?strategy=avalanche&extra=500']:
        call(first, 'GET', path)
    chat = call(first, 'POST', '/assistant', {'message': 'Summarize my recorded monthly income and expenses.'})
    print('Groq available:', chat['available'])
    call(first, 'POST', '/auth/logout', {})
    call(first, 'GET', '/auth/me', expected=401)
    call(first, 'POST', '/auth/login', {'email': identities[0][1], 'password': identities[0][2]})
    assert call(first, 'GET', '/dashboard')['expenses'] == 5000
    call(second, 'POST', '/demo-data', {})
    assert call(second, 'GET', '/predictions')['prediction']['adequate']
    call(second, 'DELETE', '/demo-data', {})
    assert call(second, 'GET', '/records/transactions')['total'] == 0
    print('PASS: registration, onboarding, CRUD, isolation, analytics, budgets, goals, debt strategies, investments, health, prediction, alerts, assistant, reports, persistence, demo/reset.')
finally:
    db = database()
    from bson import ObjectId
    for uid, _, _ in identities:
        for collection in ['transactions','budgets','goals','debts','investments','alerts','health_scores','predictions','chat_sessions']:
            db[collection].delete_many({'user_id': uid})
        db.users.delete_one({'_id': ObjectId(uid)})
