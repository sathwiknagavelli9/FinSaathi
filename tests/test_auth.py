from backend.app import create_app

def test_protected_endpoints_reject_anonymous():
    client = create_app().test_client()
    for path in ['/api/auth/me', '/api/dashboard', '/api/records/transactions', '/api/assistant', '/api/reports', '/api/alerts']:
        assert client.get(path).status_code == 401

def test_cross_origin_mutations_rejected():
    client = create_app().test_client()
    result = client.post('/api/auth/login', json={}, headers={'Origin': 'https://malicious.example'})
    assert result.status_code == 403

def test_non_json_mutations_rejected():
    client = create_app().test_client()
    assert client.post('/api/auth/login', data='email=x').status_code == 415

def test_invalid_json_values_are_rejected():
    client = create_app().test_client()
    assert client.post('/api/auth/register', json={'email': 'invalid'}).status_code == 400
