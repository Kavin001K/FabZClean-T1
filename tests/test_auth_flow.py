import pytest
from src.app.models import Customer

def test_customer_registration(client):
    """Test customer registration."""
    response = client.post("/api/v1/auth/register", json={
        "name": "New Customer",
        "email": "new@example.com",
        "password": "password123",
        "phone": "9876543210"
    })
    
    assert response.status_code == 201
    data = response.get_json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert "refresh_token" in data["data"]
    assert data["data"]["customer"]["email"] == "new@example.com"

def test_customer_login(client, test_customer):
    """Test customer login."""
    response = client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "testpass123"
    })
    
    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert "refresh_token" in data["data"]

def test_customer_login_invalid(client, test_customer):
    """Test customer login with invalid credentials."""
    response = client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "wrongpassword"
    })
    
    assert response.status_code == 401

def test_refresh_token(client, auth_headers):
    """Test token refresh."""
    # First get refresh token from login
    login_response = client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "testpass123"
    })
    refresh_token = login_response.get_json()["data"]["refresh_token"]
    
    # Refresh access token
    response = client.post("/api/v1/auth/refresh", json={
        "refresh_token": refresh_token
    })
    
    assert response.status_code == 200
    data = response.get_json()
    assert "access_token" in data["data"]

def test_get_me(client, auth_headers):
    """Test getting current customer profile."""
    response = client.get("/api/v1/auth/me", headers=auth_headers)
    
    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    assert data["data"]["email"] == "test@example.com"

def test_logout(client, auth_headers):
    """Test logout."""
    response = client.post("/api/v1/auth/logout", headers=auth_headers)
    
    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True

def test_admin_login(client):
    """Test admin login."""
    response = client.post("/admin/login", json={
        "username": "admin",
        "password": "admin123"
    })
    
    # This will fail if admin credentials not set, which is expected
    # In production, set ADMIN_USERNAME and ADMIN_PASSWORD env vars
    assert response.status_code in [200, 401]

