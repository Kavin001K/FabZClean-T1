#!/usr/bin/env bash
set -e

echo "🚀 Bootstrapping FabZClean development environment..."

# Create virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv .venv
fi

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source .venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Set Flask app
export FLASK_APP=src.app
export FLASK_ENV=development

# Initialize database
echo "🗄️  Initializing database..."
flask db upgrade || flask db init || true
flask db migrate -m "Initial migration" || true
flask db upgrade

# Create test admin user (optional)
echo "👤 Creating test admin user..."
python3 << EOF
from src.app import create_app
from src.app.extensions import db
from src.app.models.customer import Customer
from src.app.utils.security import hash_password

app = create_app("dev")
with app.app_context():
    # Check if admin exists
    admin = Customer.query.filter_by(email="admin@fabzclean.com").first()
    if not admin:
        admin = Customer(
            name="Admin User",
            email="admin@fabzclean.com",
            password_hash=hash_password("admin123"),
            is_active=True
        )
        db.session.add(admin)
        db.session.commit()
        print("✅ Admin user created: admin@fabzclean.com / admin123")
    else:
        print("ℹ️  Admin user already exists")
EOF

echo "✅ Bootstrap complete!"
echo ""
echo "To start the development server:"
echo "  source .venv/bin/activate"
echo "  export FLASK_APP=src.app"
echo "  flask run --host=0.0.0.0 --port=5000"

