from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_PATH = r"C:\Users\Tech Master\Desktop\projet\models\isolation_forest.joblib"

LOG_PATH = r"C:\Users\Tech Master\Desktop\projet\data\logs.jsonl"

REPORT_PATH = r"C:\Users\Tech Master\Desktop\projet\data\anomaly_reports.jsonl"

GEMINI_MODEL = "gemini-3.5-flash"

INTERVAL = 2