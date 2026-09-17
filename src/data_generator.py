from faker import Faker
import random

fake = Faker()

def generate_data(anomaly=False):
    if anomaly:
        return {
            "cpu_usage": random.uniform(85, 100),
            "ram_usage": random.uniform(90, 100),
            "disk_usage": random.uniform(50, 80),
            "network_in": random.uniform(500, 1000),
            "network_out": random.uniform(800, 1500),
            "disk_read": random.uniform(500, 1000),
            "disk_write": random.uniform(400, 800),
            "temperature": random.uniform(80, 100),
            "process_count": random.uniform(400, 700)
        }

    return {
        "cpu_usage": random.uniform(20, 70),
        "ram_usage": random.uniform(30, 80),
        "disk_usage": random.uniform(20, 70),
        "network_in": random.uniform(50, 400),
        "network_out": random.uniform(50, 500),
        "disk_read": random.uniform(50, 400),
        "disk_write": random.uniform(30, 300),
        "temperature": random.uniform(35, 70),
        "process_count": random.uniform(50, 300)
    }