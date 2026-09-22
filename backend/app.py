from flask import Flask, jsonify
from pymongo.errors import DuplicateKeyError, PyMongoError
from werkzeug.exceptions import HTTPException
from backend import auth, records, insights, demo

def create_app():
    app = Flask(__name__)
    app.config['MAX_CONTENT_LENGTH'] = 64 * 1024
    for module in [auth, records, insights, demo]:
        module.register_routes(app)

    @app.get('/api/status')
    def status():
        return jsonify(data={'status': 'ok', 'service': 'FinSaathi Flask API'})

    @app.errorhandler(ValueError)
    def invalid(error):
        return jsonify(error=str(error)), 400

    @app.errorhandler(DuplicateKeyError)
    def duplicate(error):
        return jsonify(error='An account or budget with these details already exists.'), 409

    @app.errorhandler(PyMongoError)
    def database_error(error):
        return jsonify(error='Database is temporarily unavailable. Please try again.'), 503

    @app.errorhandler(HTTPException)
    def http_error(error):
        return jsonify(error=error.description), error.code

    @app.errorhandler(Exception)
    def unexpected(error):
        app.logger.error('Unhandled request failure: %s', type(error).__name__)
        return jsonify(error='Unable to complete this request. Please try again.'), 500

    @app.after_request
    def headers(response):
        response.headers['Cache-Control'] = 'no-store'
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['Referrer-Policy'] = 'same-origin'
        return response
    return app
