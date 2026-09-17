class AnomalyAgent:

    def __init__(self, gemini):
        self.gemini = gemini

    def analyze(self, data, detection):

        prompt = f"""
You are an AI infrastructure anomaly analysis agent.

Analyze the following anomaly detected by an Isolation Forest model.

Metrics:
{data}

Detection:
{detection}

Provide:
1. Anomaly explanation
2. Most likely causes
3. Severity: LOW, MEDIUM or HIGH
4. Recommended actions
5. Monitoring recommendations

Be concise and technical.
"""

        return self.gemini.analyze(prompt)