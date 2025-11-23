import logging, sys
from logging.handlers import RotatingFileHandler

def configure_logging():
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    handler = RotatingFileHandler("fabzclean.log", maxBytes=10*1024*1024, backupCount=5)
    fmt = logging.Formatter('%(asctime)s %(levelname)s %(name)s %(message)s')
    handler.setFormatter(fmt)
    logger.addHandler(handler)
    logger.addHandler(logging.StreamHandler(sys.stdout))

