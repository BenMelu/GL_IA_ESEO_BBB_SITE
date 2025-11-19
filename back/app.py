from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from PIL import Image, ImageOps, ImageFilter
import cv2
import io
import imghdr

app = Flask(__name__)
CORS(app) # autorise le frontend à appeler cette API

ALLOWED = {"png", "jpg", "jpeg", "gif"}

def process_image(img: Image.Image) -> Image.Image:
    img = img.convert("RGBA")
    img.thumbnail((1024, 1024))
    img=ImageOps.grayscale(img).convert('RGBA')
    #img = ImageOps.autocontrast(img)
    #img = img.filter(ImageFilter.UnsharpMask(radius=1, percent=120, threshold=3))
    return img

@app.route("/process", methods=["POST"])
def process():
    if "file" not in request.files:
        return jsonify({"error": "Aucun fichier envoyé"}), 400

    file = request.files["file"]

    file_bytes = file.read()
    if imghdr.what(None, file_bytes) not in ALLOWED:
        return jsonify({"error": "Fichier non valide"}), 400

    img = Image.open(io.BytesIO(file_bytes))
    processed = process_image(img)

    output = io.BytesIO()
    processed.save(output, format="PNG")
    output.seek(0)

    return send_file(output, mimetype="image/png")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)