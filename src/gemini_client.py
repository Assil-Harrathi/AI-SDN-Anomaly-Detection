from google import genai

class GeminiClient:

    def __init__(self, api_key, model):
        self.client = genai.Client(api_key=api_key)
        self.model = model

    def analyze(self, prompt):
        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt
        )

        return response.text