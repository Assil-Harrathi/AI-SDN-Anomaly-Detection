import time
import random

from src.data_generator import generate_data
from src.logger import save_log, save_report


class AnomalyPipeline:

    def __init__(
        self,
        detector,
        agent,
        log_path,
        report_path,
        interval=2
    ):
        self.detector = detector
        self.agent = agent
        self.log_path = log_path
        self.report_path = report_path
        self.interval = interval

    def run(self):

        while True:

            data = generate_data(
                anomaly=random.random() < 0.2
            )

            detection = self.detector.predict(data)

            save_log(
                data,
                detection,
                self.log_path
            )

            print("\n" + "=" * 60)
            print("REAL-TIME DATA")
            print("=" * 60)
            print(data)

            print("\nDETECTION")
            print(detection)

            if detection["anomaly"]:

                print("\nANOMALY DETECTED")

                analysis = self.agent.analyze(
                    data,
                    detection
                )

                save_report(
                    data,
                    detection,
                    analysis,
                    self.report_path
                )

                print("\nAI ANALYSIS")
                print("=" * 60)
                print(analysis)

                print("\nREPORT SAVED")
                print(self.report_path)

            else:
                print("\nNORMAL OBSERVATION")

            time.sleep(self.interval)