import csv
import io
from bson import ObjectId
from flask import g, request, jsonify, Response
from backend.db import database, public
from backend.auth import require_user, now
from backend import validation as v
from backend.analytics import shift_month

KINDS = ['transactions', 'budgets', 'goals', 'debts', 'investments']

def owner_id(value):
    if not ObjectId.is_valid(value):
        raise ValueError('Invalid record ID.')
    return {'_id': ObjectId(value), 'user_id': g.uid}

def csv_response(rows):
    stream = io.StringIO()
    fields = ['date', 'description', 'type', 'category', 'amount', 'payment_method', 'recurring']
    writer = csv.DictWriter(stream, fieldnames=fields, extrasaction='ignore')
    writer.writeheader()
    for row in rows:
        safe = {k: ("'" + val if isinstance(val, str) and val.startswith(('=', '+', '-', '@', '\t', '\r')) else val) for k, val in row.items()}
        writer.writerow(safe)
    return Response(stream.getvalue(), mimetype='text/csv', headers={'Content-Disposition': 'attachment; filename=finsaathi-transactions.csv'})

def register_routes(app):
    @app.patch('/api/profile')
    @require_user
    def profile():
        data = v.profile(request.get_json())
        data['updated_at'] = now()
        database().users.update_one({'_id': g.user['_id']}, {'$set': data})
        return jsonify(data=public(database().users.find_one({'_id': g.user['_id']})))

    @app.route('/api/records/<kind>', methods=['GET', 'POST'])
    @require_user
    def records(kind):
        if kind not in KINDS:
            return jsonify(error='Not found.'), 404
        collection = database()[kind]
        if request.method == 'POST':
            doc = v.record(kind, request.get_json())
            doc.update(user_id=g.uid, created_at=now(), updated_at=now())
            doc['_id'] = collection.insert_one(doc).inserted_id
            return jsonify(data=public(doc)), 201
        query = {'user_id': g.uid}
        if kind == 'transactions':
            if request.args.get('start') or request.args.get('end'):
                query['date'] = {}
                for param, operator in [('start', '$gte'), ('end', '$lte')]:
                    if request.args.get(param):
                        query['date'][operator] = v.day(request.args[param])
            if request.args.get('type'):
                query['type'] = v.choice(request.args['type'], 'type', ['Income', 'Expense'])
            if request.args.get('category'):
                query['category'] = v.choice(request.args['category'], 'category', v.EXPENSE_CATEGORIES + v.INCOME_CATEGORIES)
            if request.args.get('search'):
                import re
                query['description'] = {'$regex': re.escape(v.text(request.args['search'], 'Search', 100)), '$options': 'i'}
            sort = v.choice(request.args.get('sort', 'newest'), 'sort', ['newest', 'oldest', 'amount'])
            cursor = collection.find(query).sort('amount' if sort == 'amount' else 'date', 1 if sort == 'oldest' else -1)
            if request.args.get('export') == 'csv':
                return csv_response(cursor)
            page = int(v.number(request.args.get('page', 1), 'Page', 1, 100000))
            total = collection.count_documents(query)
            return jsonify(data={'items': [public(d) for d in cursor.skip((page - 1) * 20).limit(20)], 'total': total, 'page': page})
        if kind == 'budgets' and request.args.get('month'):
            query['month'] = v.month(request.args['month'])
        return jsonify(data=[public(d) for d in collection.find(query).sort('created_at', -1)])

    @app.route('/api/records/<kind>/<record_id>', methods=['PATCH', 'DELETE'])
    @require_user
    def mutate(kind, record_id):
        if kind not in KINDS:
            return jsonify(error='Not found.'), 404
        query = owner_id(record_id)
        collection = database()[kind]
        old = collection.find_one(query)
        if not old:
            return jsonify(error='Record not found.'), 404
        if request.method == 'DELETE':
            collection.delete_one(query)
            return jsonify(data={'message': 'Record deleted.'})
        doc = v.record(kind, {**old, **request.get_json()})
        doc['updated_at'] = now()
        collection.update_one(query, {'$set': doc})
        return jsonify(data=public(collection.find_one(query)))

    @app.post('/api/goals/<record_id>/contribute')
    @require_user
    def contribute(record_id):
        amount = v.number(request.get_json().get('amount'), 'Contribution', .01)
        query = owner_id(record_id)
        goal = database().goals.find_one(query)
        if not goal:
            return jsonify(error='Goal not found.'), 404
        if goal['current'] + amount > goal['target']:
            raise ValueError('Contribution exceeds the remaining goal amount.')
        # Compare-and-set prevents concurrent contributions from exceeding the target.
        result = database().goals.update_one({**query, 'current': goal['current']}, {'$inc': {'current': amount}, '$set': {'updated_at': now(), 'completed': goal['current'] + amount >= goal['target']}, '$push': {'contributions': {'amount': amount, 'date': now()[:10]}}})
        if not result.modified_count:
            return jsonify(error='Goal changed. Refresh and try again.'), 409
        return jsonify(data=public(database().goals.find_one(query)))

    @app.post('/api/budgets/copy')
    @require_user
    def copy_budget():
        month = v.month(request.get_json().get('month'))
        rows = list(database().budgets.find({'user_id': g.uid, 'month': shift_month(month, -1)}))
        count = 0
        for row in rows:
            doc = {'user_id': g.uid, 'month': month, 'category': row['category'], 'amount': row['amount'], 'created_at': now(), 'updated_at': now()}
            result = database().budgets.update_one({'user_id': g.uid, 'month': month, 'category': row['category']}, {'$setOnInsert': doc}, upsert=True)
            count += bool(result.upserted_id)
        return jsonify(data={'message': f'Copied {count} budgets. Existing limits were preserved.'})
