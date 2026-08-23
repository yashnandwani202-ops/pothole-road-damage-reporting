# Pothole & Road Damage Reporting with Auto-Prioritization

AI-powered pothole and road damage reporting system with automatic repair prioritization, built for Smart India Hackathon (SIH).

## Problem

Roads get damaged, and citizens currently complain across scattered platforms (Twitter, local apps) with no unified way for municipal bodies to see and prioritize repairs.

## Solution

Citizens photo-upload potholes with their location. An AI model detects and scores the severity of the damage, the road's classification (residential/arterial/highway) is looked up automatically, and a priority score is generated so municipal corporations can see the most urgent repairs first.

## Architecture

This project has three independent services that work together:

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────────┐
│  React Frontend  │ ───► │  Express Backend  │ ───► │  Flask + YOLOv8 ML   │
│  (port 5173)     │      │  (port 5000)       │      │  Service (port 5001) │
└─────────────────┘      └──────────────────┘      └─────────────────────┘
                                    │
                                    ▼
                          OpenStreetMap Overpass API
                          (road classification lookup)
```

- **Frontend** (`/src`) — React + Vite. Citizen reporting page (photo upload + GPS capture) and a municipal dashboard (priority-ranked table with status tracking).
- **Backend** (`/backend`) — Node.js + Express. Handles report storage, orchestrates calls to the ML service and OpenStreetMap, and computes the final priority score.
- **ML Service** (`/ml-service`) — Python + Flask + YOLOv8 (Ultralytics). Runs real pothole detection on uploaded images and returns a severity score based on detected pothole size and count.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, Vite, React Router |
| Backend | Node.js, Express.js, Multer (file uploads) |
| AI/ML | Python, Flask, YOLOv8 (Ultralytics), PyTorch (CPU) |
| Location/Traffic | Browser Geolocation API, OpenStreetMap Overpass API |

## How It Works

1. A citizen opens the **Report** page, uploads a photo of a pothole, and captures their GPS location.
2. The image is sent to the **Express backend**, which forwards it to the **Flask ML service**.
3. A **pretrained YOLOv8 model** (fine-tuned for pothole detection) analyzes the image and returns the number of potholes detected, their bounding boxes, and a computed severity (minor / moderate / severe).
4. The backend separately queries the **OpenStreetMap Overpass API** using the report's GPS coordinates to classify the road (residential / arterial / highway) as a proxy for traffic importance.
5. These two signals are combined into a single **priority score**, and the report is stored.
6. Municipal staff view all reports on the **Dashboard**, sortable by priority/severity/report count and filterable by status, and can update each report's status (reported → verified → in progress → resolved).

## Running Locally

You need **three terminals running simultaneously**.

### 1. ML Service (Flask + YOLOv8)

```bash
cd ml-service
python -m venv venv
venv\Scripts\activate        # on Windows
pip install -r requirements.txt
python app.py
```

Runs on `http://localhost:5001`.

### 2. Backend (Express)

```bash
cd backend
npm install
node server.js
```

Runs on `http://localhost:5000`.

### 3. Frontend (React)

```bash
npm install
npm run dev
```

Runs on `http://localhost:5173`.

Then open `http://localhost:5173/report` to submit a report, and `http://localhost:5173/dashboard` to view the prioritized list.

## Current Limitations / Next Steps

This is an active work-in-progress build for SIH. Known gaps we're transparent about:

- **No persistent database yet** — reports are stored in memory and reset when the backend restarts. Next step: SQLite or MongoDB.
- **No duplicate-report clustering yet** — multiple citizens reporting the same pothole currently create separate entries rather than being merged.
- **OpenStreetMap Overpass API is a free public service** — it can be slow or rate-limited at scale; a production version would likely want a cached or paid alternative.
- **Severity scoring is a heuristic** (based on detected pothole size/count), not independently validated against ground-truth repair costs — a reasonable starting point that could be calibrated further with real municipal data.

## Contributors

Built as part of Smart India Hackathon (SIH).