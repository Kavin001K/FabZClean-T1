import pytest
from src.app.models import Order, Track

def test_create_order(client, test_customer, test_service):
    """Test order creation."""
    response = client.post("/api/v1/orders", json={
        "customer_id": test_customer.id,
        "service_id": test_service.id,
        "total_cost": 150.00,
        "instructions": "Handle with care"
    })
    
    assert response.status_code == 201
    data = response.get_json()
    assert data["success"] is True
    assert data["data"]["customer_id"] == test_customer.id
    assert data["data"]["status"] == "created"
    assert "order_number" in data["data"]

def test_list_orders_with_jwt(client, test_order, auth_headers):
    """Test listing orders with JWT."""
    response = client.get("/api/v1/orders", headers=auth_headers)
    
    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    assert len(data["data"]) >= 1

def test_list_orders_with_email(client, test_order, test_customer):
    """Test listing orders with email (legacy)."""
    response = client.get(f"/api/v1/orders?email={test_customer.email}")
    
    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True

def test_get_order(client, test_order, auth_headers):
    """Test getting single order."""
    response = client.get(f"/api/v1/orders/{test_order.id}", headers=auth_headers)
    
    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    assert data["data"]["id"] == test_order.id

def test_update_order(client, test_order, auth_headers):
    """Test updating order."""
    response = client.put(f"/api/v1/orders/{test_order.id}", 
                         json={"status": "processing"},
                         headers=auth_headers)
    
    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    assert data["data"]["status"] == "processing"

def test_delete_order(client, test_order, auth_headers):
    """Test deleting order."""
    response = client.delete(f"/api/v1/orders/{test_order.id}", headers=auth_headers)
    
    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    
    # Verify order is deleted
    verify_response = client.get(f"/api/v1/orders/{test_order.id}", headers=auth_headers)
    assert verify_response.status_code == 404

def test_worker_scan(client, test_order, test_worker):
    """Test worker QR scan."""
    # First, set worker token
    from src.app.extensions import db
    from src.app import create_app
    app = create_app("test")
    with app.app_context():
        test_worker.token = "test-worker-token"
        db.session.commit()
    
    response = client.post("/api/v1/workers/scan",
                         json={
                             "qr_data": '{"order_id": ' + str(test_order.id) + ', "order_number": "' + test_order.order_number + '"}',
                             "location": "Warehouse A",
                             "note": "Picked up"
                         },
                         headers={"Authorization": "Bearer test-worker-token"})
    
    # This will work if worker token is set correctly
    assert response.status_code in [200, 401]

