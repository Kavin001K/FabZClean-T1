import os
from flask import Flask, jsonify
from .config import DevelopmentConfig, ProductionConfig, TestingConfig
from .extensions import db, migrate, jwt, cors, limiter
from .utils.logger import setup_logging

config_map = {
    "dev": DevelopmentConfig,
    "prod": ProductionConfig,
    "test": TestingConfig,
}

def create_app(config_name="dev"):
    app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), "static"), static_url_path="/static")
    app.config.from_object(config_map.get(config_name, DevelopmentConfig))
    
    setup_logging(app)
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config["CORS_ALLOWED_ORIGINS"]}})
    limiter.init_app(app)
    
    # Register blueprints
    from .api.auth.routes import bp as auth_bp
    from .api.services.routes import bp as services_bp
    from .api.orders.routes import bp as orders_bp
    from .api.customers.routes import bp as customers_bp
    from .api.workers.routes import bp as workers_bp
    from .api.tracks.routes import bp as tracks_bp
    from .admin.routes import bp as admin_bp
    
    app.register_blueprint(auth_bp, url_prefix="/api/v1/auth")
    app.register_blueprint(services_bp, url_prefix="/api/v1/services")
    app.register_blueprint(orders_bp, url_prefix="/api/v1/orders")
    app.register_blueprint(customers_bp, url_prefix="/api/v1/customers")
    app.register_blueprint(workers_bp, url_prefix="/api/v1/workers")
    app.register_blueprint(tracks_bp, url_prefix="/api/v1/tracks")
    app.register_blueprint(admin_bp, url_prefix="/admin")
    
    # Health check endpoint
    @app.route("/healthz", methods=["GET"])
    def health():
        try:
            db.session.execute("SELECT 1")
            return jsonify(status="ok", db="ok"), 200
        except Exception as e:
            return jsonify(status="error", db=str(e)), 500
    
    return app

