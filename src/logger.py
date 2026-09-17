import json
from datetime import datetime


def save_log(data, detection, path):

    event = {
        "timestamp": datetime.now().isoformat(),
        "data": data,
        "detection": detection
    }

    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(event, ensure_ascii=False) + "\n")


def save_report(data, detection, analysis, path):

    report = {
        "timestamp": datetime.now().isoformat(),
        "metrics": data,
        "detection": detection,
        "ai_analysis": analysis
    }

    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(report, ensure_ascii=False) + "\n")