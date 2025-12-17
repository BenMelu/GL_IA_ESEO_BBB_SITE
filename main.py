from flask import Flask, request, jsonify, send_file, make_response, Response, render_template
from flask_cors import CORS
import cv2
import ultralytics as u
import tensorflow as tf
import os.path
import numpy as np
import io
import magic
from json import dumps
import pandas as pd
import joblib
import threading
import time
import socketio

app = Flask(__name__)
CORS(app,expose_headers=["X-Process-Texts"]) # autorise le frontend à appeler cette API


PATH=os.path.dirname(os.path.realpath(__file__))
PATH=PATH+"/back"
PATH_MODEL=PATH+"/weights"
ALLOWED = {"image/png", "image/jpg", "image/jpeg", "image/gif"}
URL_ESP="http://192.168.137.55:81/stream"


modelT=tf.keras.models.load_model(PATH+"/modelTita.keras")
modelCH=tf.keras.models.load_model(PATH+"/IA_chats_chiens.keras")
modelM=tf.keras.models.load_model(PATH+"/modelMNIST.keras")
model=u.YOLO(PATH_MODEL+"/best.pt")

camera_started = False

latest_frame = None
lock = threading.Lock()

def camera_thread():
    global latest_frame

    while True:
        print("Connexion au flux ESP32...")
        cap = cv2.VideoCapture(URL_ESP)

        if not cap.isOpened():
            print("Impossible d'ouvrir le flux, nouvel essai dans 2 sec")
            time.sleep(2)
            continue

        print("Flux ESP32 connecté.")

        while True:
            ret, frame = cap.read()

            if not ret:
                print("Frame perdue: essaie de reconnexion...")
                cap.release()
                time.sleep(1)
                break

            # Exemple de traitement (à remplacer)
            img=cv2.resize(frame, (800, 600))
            detection=model(img,stream=True,verbose=False)
            for bbox in detection[0].boxes:
                x1,y1,x2,y2=bbox.xyxy[0]
                class_name=detection[0].names[int(bbox.cls[0])]
                conf = float(bbox.conf[0])
                cv2.rectangle(img,(int(x1),int(y1)),(int(x2),int(y2)),(0,0,255),3)
                cv2.putText(img,f"{class_name}: {conf:.2f}",(int(x1), max(int(y1) - 5, 10)), cv2.FONT_HERSHEY_SIMPLEX,5, (0,0,255), 3)

            # Stockage thread-safe
            with lock:
                latest_frame = img

        time.sleep(0.01)

def broadcast_frames():
    while True:
        with lock:
            frame = latest_frame.copy() if latest_frame is not None else None

        if frame is None:
            time.sleep(0.05)
            continue

        ret, buffer = cv2.imencode(".jpg", frame)
        if ret:
            socketio.emit("video_frame", buffer.tobytes())

        time.sleep(0.03)

def process_image(img: np.ndarray,multiclass: bool) -> tuple[np.ndarray, str]:
    match multiclass:
        case True:
            pred_norm=cv2.resize(img, dsize=(28, 28), interpolation=cv2.INTER_CUBIC)
            pred_norm = cv2.bitwise_not(pred_norm)
            test=np.array([pred_norm])
            y_pred=modelM.predict(test,verbose=0)
        case False:
            pred_norm=cv2.resize(img, dsize=(250, 250), interpolation=cv2.INTER_LANCZOS4)
            test=np.array([pred_norm])
            y_pred=modelCH.predict(test,verbose=0)
    y_pred_classes = np.argmax(y_pred, axis=1)
    texts={
        "classe":np.array2string(y_pred_classes[0]),
        "precision":np.array2string(np.round(y_pred.max()*100,2))
    }
    return pred_norm, texts

def process_form(df: pd.DataFrame):
    X_pred=df.astype('float64',False)
    scaler = joblib.load("/back/scalerTita.save")
    X_pred_norm = scaler.transform(X_pred)
    pred=modelT.predict(X_pred_norm)
    texts={
        "tauxSurvie":np.array2string(np.round(pred[0][0]*100,2))
        }
    return texts


@socketio.on("connect")
def start_camera():
    global camera_started
    if not camera_started:
        t = threading.Thread(target=camera_thread, daemon=True)
        t.start()
        threading.Thread(target=broadcast_frames, daemon=True).start()
        camera_started = True
    return "Camera started"

"""@app.route("/video_feed")
def video_feed():
    global camera_started

    if not camera_started:
        t = threading.Thread(target=camera_thread, daemon=True)
        t.start()
        camera_started = True

    return Response(generate_frames(),mimetype='multipart/x-mixed-replace; boundary=frame')"""

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


@app.route("/")
def index():
    return render_template("index.html")

"""if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)"""