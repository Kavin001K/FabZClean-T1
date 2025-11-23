import os, sys
sys.path.insert(0, os.path.abspath(os.path.join(os.getcwd(), "app")))
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
from app.db.base import Base
from app.core.config import get_settings
# import models to register metadata
from app import models  # ensure models package imports submodels

config = context.config
fileConfig(config.config_file_name)
settings = get_settings()
target_metadata = Base.metadata

def get_url():
    return settings.DATABASE_URL

def run_migrations_online():
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = get_url()
    connectable = engine_from_config(configuration, prefix="sqlalchemy.", poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    context.configure(url=get_url(), target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()
else:
    run_migrations_online()

