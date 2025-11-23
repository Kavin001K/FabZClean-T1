#!/usr/bin/env python3
"""
SQLite to MySQL Migration Script

This script migrates data from the original SQLite database to MySQL.
It handles data type conversions, enum mappings, and relationship preservation.
"""

import os
import sys
import json
from datetime import datetime
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.app import create_app
from src.app.extensions import db
from src.app.models import Service, Customer, Order, Worker, Track

def migrate_sqlite_to_mysql(sqlite_path, mysql_url):
    """Migrate data from SQLite to MySQL."""
    app = create_app("dev")
    
    with app.app_context():
        # Create SQLite engine
        sqlite_engine = create_engine(f"sqlite:///{sqlite_path}")
        sqlite_session = sessionmaker(bind=sqlite_engine)()
        
        # Create MySQL session
        mysql_engine = create_engine(mysql_url)
        mysql_session = sessionmaker(bind=mysql_engine)()
        
        migration_log = {
            "started_at": datetime.utcnow().isoformat(),
            "services": 0,
            "customers": 0,
            "orders": 0,
            "workers": 0,
            "tracks": 0,
            "errors": []
        }
        
        try:
            # Migrate Services
            print("Migrating services...")
            sqlite_services = sqlite_session.execute(text("SELECT * FROM services")).fetchall()
            for row in sqlite_services:
                try:
                    service = Service(
                        id=row.id if hasattr(row, 'id') else None,
                        name=row.name,
                        price=float(row.price) if row.price else 0.0,
                        duration_minutes=row.duration_minutes if hasattr(row, 'duration_minutes') else None,
                        status=row.status if hasattr(row, 'status') else "active"
                    )
                    mysql_session.merge(service)
                    migration_log["services"] += 1
                except Exception as e:
                    migration_log["errors"].append(f"Service {row.id}: {str(e)}")
            
            # Migrate Customers
            print("Migrating customers...")
            sqlite_customers = sqlite_session.execute(text("SELECT * FROM customers")).fetchall()
            for row in sqlite_customers:
                try:
                    customer = Customer(
                        id=row.id if hasattr(row, 'id') else None,
                        name=row.name,
                        email=row.email,
                        phone=row.phone if hasattr(row, 'phone') else None,
                        password_hash=row.password_hash if hasattr(row, 'password_hash') else "migrated",
                        is_active=True
                    )
                    mysql_session.merge(customer)
                    migration_log["customers"] += 1
                except Exception as e:
                    migration_log["errors"].append(f"Customer {row.id}: {str(e)}")
            
            # Migrate Orders
            print("Migrating orders...")
            sqlite_orders = sqlite_session.execute(text("SELECT * FROM orders")).fetchall()
            for row in sqlite_orders:
                try:
                    order = Order(
                        id=row.id if hasattr(row, 'id') else None,
                        order_number=row.order_number if hasattr(row, 'order_number') else f"ORD-{row.id}",
                        customer_id=row.customer_id,
                        service_id=row.service_id if hasattr(row, 'service_id') else None,
                        pickup_date=datetime.fromisoformat(row.pickup_date) if hasattr(row, 'pickup_date') and row.pickup_date else None,
                        instructions=row.instructions if hasattr(row, 'instructions') else None,
                        total_cost=float(row.total_cost) if hasattr(row, 'total_cost') and row.total_cost else 0.0,
                        status=row.status if hasattr(row, 'status') else "created",
                        qr_code_path=row.qr_code_path if hasattr(row, 'qr_code_path') else None
                    )
                    mysql_session.merge(order)
                    migration_log["orders"] += 1
                except Exception as e:
                    migration_log["errors"].append(f"Order {row.id}: {str(e)}")
            
            # Migrate Workers
            print("Migrating workers...")
            sqlite_workers = sqlite_session.execute(text("SELECT * FROM workers")).fetchall()
            for row in sqlite_workers:
                try:
                    worker = Worker(
                        id=row.id if hasattr(row, 'id') else None,
                        name=row.name,
                        email=row.email if hasattr(row, 'email') else None,
                        token=row.token if hasattr(row, 'token') else None
                    )
                    mysql_session.merge(worker)
                    migration_log["workers"] += 1
                except Exception as e:
                    migration_log["errors"].append(f"Worker {row.id}: {str(e)}")
            
            # Migrate Tracks
            print("Migrating tracks...")
            sqlite_tracks = sqlite_session.execute(text("SELECT * FROM tracks")).fetchall()
            for row in sqlite_tracks:
                try:
                    track = Track(
                        id=row.id if hasattr(row, 'id') else None,
                        order_id=row.order_id,
                        worker_id=row.worker_id if hasattr(row, 'worker_id') and row.worker_id else None,
                        action=row.action,
                        note=row.note if hasattr(row, 'note') else None,
                        location=row.location if hasattr(row, 'location') else None
                    )
                    mysql_session.merge(track)
                    migration_log["tracks"] += 1
                except Exception as e:
                    migration_log["errors"].append(f"Track {row.id}: {str(e)}")
            
            mysql_session.commit()
            migration_log["completed_at"] = datetime.utcnow().isoformat()
            
            print("\n✅ Migration complete!")
            print(f"Services: {migration_log['services']}")
            print(f"Customers: {migration_log['customers']}")
            print(f"Orders: {migration_log['orders']}")
            print(f"Workers: {migration_log['workers']}")
            print(f"Tracks: {migration_log['tracks']}")
            
            if migration_log["errors"]:
                print(f"\n⚠️  {len(migration_log['errors'])} errors occurred:")
                for error in migration_log["errors"][:10]:
                    print(f"  - {error}")
            
            # Save log
            with open("migration_log.json", "w") as f:
                json.dump(migration_log, f, indent=2)
            
        except Exception as e:
            mysql_session.rollback()
            print(f"❌ Migration failed: {e}")
            raise
        finally:
            sqlite_session.close()
            mysql_session.close()

if __name__ == "__main__":
    sqlite_path = sys.argv[1] if len(sys.argv) > 1 else "fabzclean.db"
    mysql_url = sys.argv[2] if len(sys.argv) > 2 else os.getenv("DATABASE_URL")
    
    if not mysql_url:
        print("Usage: python migrate_sqlite_to_mysql.py <sqlite_path> <mysql_url>")
        print("Or set DATABASE_URL environment variable")
        sys.exit(1)
    
    migrate_sqlite_to_mysql(sqlite_path, mysql_url)

