import os
from functools import lru_cache
from pymongo import MongoClient, ASCENDING
from dotenv import load_dotenv

load_dotenv('.env.local')

@lru_cache(maxsize=1)
def database():
    client = MongoClient(os.environ['MONGODB_URI'], serverSelectionTimeoutMS=8000, connectTimeoutMS=8000, maxPoolSize=10)
    db = client.get_default_database()
    db.users.create_index('email', unique=True)
    for name in ['transactions', 'budgets', 'goals', 'debts', 'investments', 'alerts', 'health_scores', 'predictions', 'chat_sessions']:
        db[name].create_index([('user_id', ASCENDING)])
    db.transactions.create_index([('user_id', 1), ('date', -1)])
    db.budgets.create_index([('user_id', 1), ('month', 1), ('category', 1)], unique=True)
    db.alerts.create_index([('user_id', 1), ('key', 1)], unique=True)
    db.health_scores.create_index([('user_id', 1), ('month', 1)], unique=True)
    db.predictions.create_index([('user_id', 1), ('month', 1)], unique=True)
    db.rate_limits.create_index('expires_at', expireAfterSeconds=0)
    return db

def public(doc):
    if not doc:
        return None
    return {('id' if key == '_id' else key): str(value) if key == '_id' else value for key, value in doc.items() if key not in ['password_hash', 'auth_version']}
