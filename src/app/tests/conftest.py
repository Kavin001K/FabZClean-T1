import pytest
from app import create_app
from app.extensions import db as _db
from flask import Flask

@pytest.fixture(scope='session')
def app():
    app = create_app("test")
    with app.app_context():
        _db.create_all()
        yield app
        _db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

