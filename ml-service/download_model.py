from huggingface_hub import hf_hub_download
import shutil

print("Downloading pretrained pothole detection model...")

downloaded_path = hf_hub_download(
    repo_id="keremberke/yolov8n-pothole-segmentation",
    filename="best.pt"
)

shutil.copy(downloaded_path, "pothole_model.pt")

print("Done! Model saved as pothole_model.pt in this folder.")