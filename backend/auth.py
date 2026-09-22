import os
import hashlib
from datetime import datetime, timedelta, timezone
from functools import wraps
from urllib.parse import urlparse
import jwt
from bson import ObjectId
from flask import request, g, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from backend.db import database, public
from backend import validation as v

COOKIE = 'finsaathi_session'

def now():
    return datetime.now(timezone.utc).isoformat()

def require_user(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            claims = jwt.decode(request.cookies.get(COOKIE, ''), os.environ['JWT_SECRET'], algorithms=['HS256'], audience='finsaathi', issuer='finsaathi')
            user = database().users.find_one({'_id': ObjectId(claims['sub'])})
            if not user or user.get('auth_version', 0) != claims.get('version', 0):
                raise ValueError()
        except (jwt.PyJWTError, ValueError, KeyError):
            return jsonify(error='Please sign in to continue.'), 401
        g.user = user
        g.uid = str(user['_id'])
        return fn(*args, **kwargs)
    return wrapper

def issue(user):
    issued = datetime.now(timezone.utc)
    token = jwt.encode({'sub': str(user['_id']), 'iat': issued, 'exp': issued + timedelta(days=7), 'aud': 'finsaathi', 'iss': 'finsaathi', 'version': user.get('auth_version', 0)}, os.environ['JWT_SECRET'], algorithm='HS256')
    response = jsonify(data=public(user))
    response.set_cookie(COOKIE, token, httponly=True, secure=bool(os.environ.get('VERCEL')), samesite='Lax', max_age=604800, path='/')
    return response

def rate_limit(identity, action, maximum=20):
    instant = datetime.now(timezone.utc)
    window = int(instant.timestamp()) // 900
    key = hashlib.sha256(f'{action}:{identity}:{window}'.encode()).hexdigest()
    count = database().rate_limits.find_one_and_update({'_id': key}, {'$inc': {'count': 1}, '$setOnInsert': {'expires_at': instant + timedelta(minutes=30)}}, upsert=True, return_document=True)
    return count['count'] <= maximum

def register_routes(app):
    @app.before_request
    def same_origin():
        if request.method in ['POST', 'PATCH', 'PUT', 'DELETE']:
            origin = request.headers.get('Origin')
            allowed_hosts = {request.host}
            if not os.environ.get('VERCEL'):
                allowed_hosts.update({'localhost:3000', '127.0.0.1:3000'})
            if request.headers.get('Sec-Fetch-Site') == 'cross-site' or (origin and urlparse(origin).netloc not in allowed_hosts):
                return jsonify(error='Cross-origin requests are not permitted.'), 403
            if not request.is_json:
                return jsonify(error='Use a JSON request body.'), 415
            if not isinstance(request.get_json(), dict):
                return jsonify(error='Expected a JSON object.'), 400

    @app.post('/api/auth/register')
    def register():
        data = request.get_json()
        email = v.email(data.get('email'))
        password = v.password(data.get('password'))
        name = v.text(data.get('name'), 'Name', 100)
        if not rate_limit(request.remote_addr or '', 'register', 15):
            return jsonify(error='Too many attempts. Please try again in 15 minutes.'), 429
        user = {'name': name, 'email': email, 'password_hash': generate_password_hash(password), 'onboarded': False, 'currency': 'INR', 'auth_version': 0, 'created_at': now(), 'updated_at': now()}
        user['_id'] = database().users.insert_one(user).inserted_id
        return issue(user)

    @app.post('/api/auth/login')
    def login():
        data = request.get_json()
        email = v.email(data.get('email'))
        password = v.text(data.get('password'), 'Password', 128)
        if not rate_limit(email, 'login'):
            return jsonify(error='Too many attempts. Please try again in 15 minutes.'), 429
        user = database().users.find_one({'email': email})
        if not user or not check_password_hash(user['password_hash'], password):
            return jsonify(error='Email or password is incorrect.'), 401
        return issue(user)

    @app.get('/api/auth/me')
    @require_user
    def me():
        return jsonify(data=public(g.user))

    @app.post('/api/auth/logout')
    @require_user
    def logout():
        database().users.update_one({'_id': g.user['_id']}, {'$inc': {'auth_version': 1}})
        response = jsonify(data={'message': 'Signed out.'})
        response.delete_cookie(COOKIE, path='/')
        return response

    @app.post('/api/auth/password')
    @require_user
    def change_password():
        data = request.get_json()
        if not rate_limit(g.uid, 'password', 10):
            return jsonify(error='Too many attempts. Try again later.'), 429
        if not check_password_hash(g.user['password_hash'], v.text(data.get('current_password'), 'Current password', 128)):
            return jsonify(error='Current password is incorrect.'), 400
        new_hash = generate_password_hash(v.password(data.get('password')))
        database().users.update_one({'_id': g.user['_id']}, {'$set': {'password_hash': new_hash, 'updated_at': now()}, '$inc': {'auth_version': 1}})
        return issue(database().users.find_one({'_id': g.user['_id']}))
