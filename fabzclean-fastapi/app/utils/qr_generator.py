import qrcode
import os
import json
from PIL import Image

QR_DIR = os.path.join(os.getcwd(), "static", "qr")
os.makedirs(QR_DIR, exist_ok=True)

def generate_order_qr(order_number: str, payload: dict) -> str:
    filename = f"{order_number}.png"
    path = os.path.join(QR_DIR, filename)
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(json.dumps(payload))
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    img.save(path)
    return f"/static/qr/{filename}"

