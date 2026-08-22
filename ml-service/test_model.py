from ultralytics import YOLO

print("Loading model...")
model = YOLO("pothole_model.pt")

print("Model loaded successfully!")
print("Class names:", model.names)

# A real, stable pothole photo from Wikimedia Commons
test_image = "test.jpg"

print("\nRunning test inference on a sample pothole image...")
results = model.predict(test_image, conf=0.25)

for result in results:
    if result.boxes is not None and len(result.boxes) > 0:
        print(f"Detected {len(result.boxes)} object(s)")
        for box in result.boxes:
            conf = box.conf[0].item()
            print(f"  - confidence: {conf:.2f}")
    else:
        print("No detections in this test image.")

print("\nModel test complete.")