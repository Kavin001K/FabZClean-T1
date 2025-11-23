import qrcode
from PIL import Image
import os
import json

QR_DIR = os.path.join(os.getcwd(), "static", "qr")
os.makedirs(QR_DIR, exist_ok=True)

def generate_order_qr(order_number: str, payload: dict) -> str:
    """
    Generate QR code for an order.
    
    Args:
        order_number: Unique order number
        payload: Dictionary to encode in QR code
        
    Returns:
        Relative path to QR code image
    """
    filename = f"{order_number}.png"
    path = os.path.join(QR_DIR, filename)
    
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(json.dumps(payload))
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    img.save(path)
    
    return f"/static/qr/{filename}"

