# alembic/env.py

import os
import sys
from logging.config import fileConfig
from sqlalchemy import engine_from_config
from sqlalchemy import pool

# add src to path so we can import app package
sys.path.insert(0, os.path.abspath(os.path.join(os.getcwd(), "src")))

from alembic import context
from app import create_app
from app.extensions import db
from app.models import service, customer, order, worker, track  # import models so metadata is available

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
fileConfig(config.config_file_name)

# Retrieve DB URL from env if set, otherwise use SQLALCHEMY_DATABASE_URI from Flask config
app = create_app(os.getenv("FLASK_CONFIG", "dev"))
with app.app_context():
    target_metadata = db.metadata

def get_url():
    url = os.getenv("DATABASE_URL")
    if url:
        return url
    return app.config.get("SQLALCHEMY_DATABASE_URI")

def run_migrations_offline():
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = get_url()
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

