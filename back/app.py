from flask import Flask, request, jsonify, send_file, make_response
from flask_cors import CORS
import cv2
import tensorflow as tf
import os.path
import numpy as np
import io
import magic
from json import dumps

app = Flask(__name__)
CORS(app,expose_headers=["X-Process-Texts"]) # autorise le frontend à appeler cette API

PATH=os.path.dirname(os.path.realpath(__file__))
ALLOWED = {"image/png", "image/jpg", "image/jpeg", "image/gif"}
model=tf.keras.models.load_model(PATH+"/modelMNIST.keras")

def process_image(img: np.ndarray) -> tuple[np.ndarray, str]:
    pred_norm=cv2.resize(img, dsize=(28, 28), interpolation=cv2.INTER_CUBIC)
    pred_norm = cv2.bitwise_not(pred_norm)
    test=np.array([pred_norm])
    y_pred=model.predict(test,verbose=0)
    y_pred_classes = np.argmax(y_pred, axis=1)
    texts={
        "classe":np.array2string(y_pred_classes[0]),
        "precision":np.array2string(np.argmax(y_pred, axis=0)*100)
    }
    return pred_norm, texts

@app.route("/process", methods=["POST"])
def process():
    if "file" not in request.files:
        return jsonify({"error": "Aucun fichier envoyé"}), 400

    file = request.files["file"]

    file_bytes = file.read()
    if magic.from_buffer(file_bytes, mime=True) not in ALLOWED:
        return jsonify({"error": "Fichier non valide"}), 400

    np_img = np.frombuffer(file_bytes, np.uint8)
    img = cv2.imdecode(np_img, cv2.IMREAD_GRAYSCALE)
    processed,text_fields = process_image(img)

    _, buffer = cv2.imencode('.png', processed)
    output = io.BytesIO(buffer.tobytes())
    reponse = make_response(send_file(output, mimetype="image/png"))
    reponse.headers["X-Process-Texts"] = dumps(text_fields)
    return reponse

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)