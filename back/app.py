from flask import Flask, request, jsonify, send_file, make_response, Response
from flask_cors import CORS
import cv2
import tensorflow as tf
import os.path
import numpy as np
import io
import magic
from json import dumps
import pandas as pd
import joblib


app = Flask(__name__)
CORS(app,expose_headers=["X-Process-Texts"]) # autorise le frontend à appeler cette API


PATH=os.path.dirname(os.path.realpath(__file__))
PATH_MODEL=PATH+"/weights"
ALLOWED = {"image/png", "image/jpg", "image/jpeg", "image/gif"}


modelT=tf.keras.models.load_model(PATH+"/modelTita.keras")
modelCH=tf.keras.models.load_model(PATH+"/IA_chats_chiens.keras")
modelM=tf.keras.models.load_model(PATH+"/modelMNIST.keras")


def process_image(img: np.ndarray,multiclass: bool) -> tuple[np.ndarray, str]:
    match multiclass:
        case True:
            pred_norm=cv2.resize(img, dsize=(28, 28), interpolation=cv2.INTER_CUBIC)
            pred_norm = cv2.bitwise_not(pred_norm)
            test=np.array([pred_norm])
            y_pred=modelM.predict(test,verbose=0)
            text_class=np.array2string(np.argmax(y_pred, axis=1)[0])
        case False:
            pred_norm=cv2.resize(img, dsize=(250, 250), interpolation=cv2.INTER_LANCZOS4)
            test=np.array([pred_norm])
            y_pred=modelCH.predict(test,verbose=0)
            if np.argmax(y_pred, axis=1)[0]==0:
                text_class="chat"
            else:
                text_class="chien"
    texts={
        "classe":text_class,
        "precision":np.array2string(np.round(y_pred.max()*100,2))
    }
    return pred_norm, texts

def process_form(df: pd.DataFrame):
    X_pred=df.astype('float64',False)
    scaler = joblib.load("back/scalerTita.save")
    X_pred_norm = scaler.transform(X_pred)
    pred=modelT.predict(X_pred_norm)
    texts={
        "tauxSurvie":np.array2string(np.round(pred[0][0]*100,2))
        }
    return texts

@app.route("/process", methods=["POST"])
def process():
    onglet_actif = int(request.args.get("ml"))
    if onglet_actif==1:
        data = request.form.to_dict()   # Récupère les données du formulaire
        df = pd.DataFrame([data])
        text=process_form(df)
        return jsonify(text)
    else:
        if "file" not in request.files:
                return jsonify({"error": "Aucun fichier envoyé"}), 400
        file = request.files["file"]
        file_bytes = file.read()
        if magic.from_buffer(file_bytes, mime=True) not in ALLOWED:
            return jsonify({"error": "Fichier non valide"}), 400
        np_img = np.frombuffer(file_bytes, np.uint8)
        img = cv2.imdecode(np_img, cv2.IMREAD_GRAYSCALE)
        match onglet_actif:
            case 2:
                processed,text_fields = process_image(img,multiclass=False)
            case 3:
                processed,text_fields = process_image(img,multiclass=True)
        _, buffer = cv2.imencode('.png', processed)
        output = io.BytesIO(buffer.tobytes())
        reponse = make_response(send_file(output, mimetype="image/png"))
        reponse.headers["X-Process-Texts"] = dumps(text_fields)
        return reponse

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)