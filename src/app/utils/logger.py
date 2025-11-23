import logging
import sys
from logging.handlers import RotatingFileHandler
import json

class JsonFormatter(logging.Formatter):
    def format(self, record):
        payload = {
            "level": record.levelname,
            "message": record.getMessage(),
            "name": record.name,
        }
        if record.exc_info:
            payload["exc"] = self.formatException(record.exc_info)
        return json.dumps(payload)

def setup_logging(app):
    level = app.config.get("LOG_LEVEL", "INFO")
    handler = RotatingFileHandler("fabzclean.log", maxBytes=10*1024*1024, backupCount=5)
    handler.setFormatter(JsonFormatter())
    app.logger.setLevel(level)
    app.logger.addHandler(handler)
    app.logger.addHandler(logging.StreamHandler(sys.stdout))
