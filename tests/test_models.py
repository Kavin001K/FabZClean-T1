import pytest
from src.app.models import Service, Customer, Order, Worker, Track
from src.app.utils.security import hash_password

def test_service_model(app):
    """Test Service model."""
    with app.app_context():
        service = Service(
            name="Test Service",
            price=100.00,
            duration_minutes=60,
            status="active"
        )
        assert service.name == "Test Service"
        assert float(service.price) == 100.00
        assert service.status == "active"

def test_customer_model(app):
    """Test Customer model."""
    with app.app_context():
        customer = Customer(
            name="Test Customer",
            email="test@example.com",
            phone="1234567890",
            password_hash=hash_password("password123"),
            is_active=True
        )
        assert customer.name == "Test Customer"
        assert customer.email == "test@example.com"
        assert customer.is_active is True

def test_order_model(app, test_customer, test_service):
    """Test Order model and relationships."""
    with app.app_context():
        order = Order(
            order_number="ORD-001",
            customer_id=test_customer.id,
            service_id=test_service.id,
            total_cost=150.00,
            status="created"
        )
        assert order.order_number == "ORD-001"
        assert order.customer_id == test_customer.id
        assert order.service_id == test_service.id
        assert order.customer == test_customer
        assert order.service == test_service

def test_track_model(app, test_order, test_worker):
    """Test Track model and relationships."""
    with app.app_context():
        track = Track(
            order_id=test_order.id,
            worker_id=test_worker.id,
            action="picked_up",
            location="Warehouse A"
        )
        assert track.order_id == test_order.id
        assert track.worker_id == test_worker.id
        assert track.action == "picked_up"
        assert track.order == test_order
        assert track.worker == test_worker

def test_model_relationships(app, test_customer, test_service):
    """Test model relationships."""
    with app.app_context():
        order = Order(
            order_number="ORD-002",
            customer_id=test_customer.id,
            service_id=test_service.id,
            total_cost=200.00
        )
        from src.app.extensions import db
        db.session.add(order)
        db.session.commit()
        
        # Test customer.orders relationship
        assert order in test_customer.orders.all()
        
        # Test order.customer relationship
        assert order.customer == test_customer
        assert order.service == test_service

