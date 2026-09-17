import json
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from config import MODEL_PATH, LOG_PATH, REPORT_PATH, GEMINI_MODEL
from src.detector import AnomalyDetector
from src.gemini_client import GeminiClient
from src.anomaly_agent import AnomalyAgent
from src.logger import save_log, save_report


BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

app = FastAPI(
    title="Real-Time Anomaly Detection API",
    version="1.0.0"
)

detector = AnomalyDetector(MODEL_PATH)

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError("GEMINI_API_KEY introuvable")

gemini = GeminiClient(
    api_key,
    GEMINI_MODEL
)

agent = AnomalyAgent(gemini)


class Metrics(BaseModel):
    cpu_usage: float
    ram_usage: float
    disk_usage: float
    network_in: float
    network_out: float
    disk_read: float
    disk_write: float
    temperature: float
    process_count: float


@app.get("/")
def root():

    return {
        "message": "Anomaly Detection API",
        "status": "running"
    }


@app.get("/health")
def health():

    return {
        "status": "healthy",
        "model": "Isolation Forest",
        "ai_agent": "Gemini"
    }


@app.get("/reports")
def get_reports(limit: int = 50):

    report_path = Path(REPORT_PATH)

    if not report_path.exists():
        return []

    with open(report_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    reports = []

    for line in lines:
        line = line.strip()

        if not line:
            continue

        try:
            reports.append(json.loads(line))
        except json.JSONDecodeError:
            continue

    # Les plus récents en premier
    reports.reverse()

    return reports[:limit]


@app.post("/detect")
def detect(metrics: Metrics):

    data = metrics.model_dump()

    detection = detector.predict(data)

    save_log(
        data,
        detection,
        LOG_PATH
    )

    response = {
        "metrics": data,
        "detection": detection
    }

    if detection["anomaly"]:

        analysis = agent.analyze(
            data,
            detection
        )

        save_report(
            data,
            detection,
            analysis,
            REPORT_PATH
        )

        response["ai_analysis"] = analysis
        response["report_saved"] = True

    else:

        response["ai_analysis"] = None
        response["report_saved"] = False

    return response