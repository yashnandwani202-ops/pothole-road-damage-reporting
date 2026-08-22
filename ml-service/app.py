from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO
import tempfile
import os

app = Flask(__name__)
CORS(app)

print("Loading pothole detection model...")
model = YOLO("pothole_model.pt")
print("Model loaded. Flask server starting...")


def compute_severity(detections):
    """
    Turn raw YOLO detections into a severity label + score.
    Heuristic: more potholes and/or larger bounding box area = higher severity.
    This is a reasonable starting point; you can refine it later with real-world calibration.
    """
    if not detections:
        return "minor", 0.15  # no potholes detected — treat as low severity

    # Use the largest detected pothole's relative area + how many were found
    max_area_ratio = max(d["area_ratio"] for d in detections)
    count = len(detections)

    # Combine size and count into a single 0-1 score
    score = min(1.0, max_area_ratio * 2 + count * 0.05)

    if score >= 0.7:
        severity = "severe"
    elif score >= 0.4:
        severity = "moderate"
    else:
        severity = "minor"

    return severity, round(score, 2)


@app.route("/detect", methods=["POST"])
def detect():
    print("Files received:", list(request.files.keys()))
    print("Form fields received:", list(request.form.keys()))
    if "image" not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    file = request.files["image"]

    # Save to a temp file since YOLO needs a file path or array, not a raw stream
    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
        file.save(tmp.name)
        tmp_path = tmp.name

    try:
        results = model.predict(tmp_path, conf=0.25, verbose=False)
        result = results[0]

        detections = []
        img_h, img_w = result.orig_shape

        if result.boxes is not None:
            for box in result.boxes:
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                confidence = box.conf[0].item()
                box_area = (x2 - x1) * (y2 - y1)
                area_ratio = box_area / (img_w * img_h)

                detections.append({
                    "confidence": round(confidence, 2),
                    "bbox": [round(x1, 1), round(y1, 1), round(x2, 1), round(y2, 1)],
                    "area_ratio": round(area_ratio, 4),
                })

        severity, severity_score = compute_severity(detections)

        return jsonify({
            "pothole_count": len(detections),
            "detections": detections,
            "severity": severity,
            "severityScore": severity_score,
        })

    finally:
        os.remove(tmp_path)  # clean up the temp file either way


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(port=5001, debug=True)