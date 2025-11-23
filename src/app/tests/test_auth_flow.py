def test_register_login(client):
    """Test customer registration and login flow."""
    # Register
    rv = client.post("/api/v1/auth/register", json={
        "name": "Test User",
        "email": "test@example.com",
        "password": "testpass123"
    })
    assert rv.status_code == 201
    data = rv.get_json()
    assert "access_token" in data
    assert "refresh_token" in data
    
    # Login
    rv2 = client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "testpass123"
    })
    assert rv2.status_code == 200
    data2 = rv2.get_json()
    assert "access_token" in data2

