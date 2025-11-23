import pytest
from src.app import create_app
from src.app.extensions import db
from src.app.models import Service, Customer, Order, Worker, Track
from src.app.utils.security import hash_password

@pytest.fixture
def app():
    """Create application for testing."""
    app = create_app("test")
    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()

@pytest.fixture
def client(app):
    """Create test client."""
    return app.test_client()

@pytest.fixture
def test_customer(app):
    """Create a test customer."""
    with app.app_context():
        customer = Customer(
            name="Test Customer",
            email="test@example.com",
            phone="1234567890",
            password_hash=hash_password("testpass123"),
            is_active=True
        )
        db.session.add(customer)
        db.session.commit()
        return customer

@pytest.fixture
def test_service(app):
    """Create a test service."""
    with app.app_context():
        service = Service(
            name="Test Service",
            price=100.00,
            duration_minutes=60,
            status="active"
        )
        db.session.add(service)
        db.session.commit()
        return service

@pytest.fixture
def test_order(app, test_customer, test_service):
    """Create a test order."""
    with app.app_context():
        order = Order(
            order_number="ORD-TEST-001",
            customer_id=test_customer.id,
            service_id=test_service.id,
            total_cost=100.00,
            status="created"
        )
        db.session.add(order)
        db.session.commit()
        return order

@pytest.fixture
def test_worker(app):
    """Create a test worker."""
    with app.app_context():
        worker = Worker(
            name="Test Worker",
            email="worker@example.com"
        )
        db.session.add(worker)
        db.session.commit()
        return worker

@pytest.fixture
def auth_headers(client, test_customer):
    """Get JWT token for test customer."""
    response = client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "testpass123"
    })
    token = response.get_json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def admin_session(client):
    """Create admin session."""
    with client.session_transaction() as sess:
        sess["admin_logged_in"] = True
        sess["admin_username"] = "admin"
    return client

