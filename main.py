import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

from config import (
    MODEL_PATH,
    LOG_PATH,
    REPORT_PATH,
    GEMINI_MODEL,
    INTERVAL
)

from src.detector import AnomalyDetector
from src.gemini_client import GeminiClient
from src.anomaly_agent import AnomalyAgent
from src.pipeline import AnomalyPipeline


def main():

    api_key = os.getenv("GEMINI_API_KEY")

    print("API KEY FOUND:", bool(api_key))

    if not api_key:
        raise ValueError(
            f"GEMINI_API_KEY introuvable dans {BASE_DIR / '.env'}"
        )

    detector = AnomalyDetector(
        MODEL_PATH
    )

    gemini = GeminiClient(
        api_key,
        GEMINI_MODEL
    )

    agent = AnomalyAgent(
        gemini
    )

    pipeline = AnomalyPipeline(
        detector=detector,
        agent=agent,
        log_path=LOG_PATH,
        report_path=REPORT_PATH,
        interval=INTERVAL
    )

    pipeline.run()


if __name__ == "__main__":
    main()