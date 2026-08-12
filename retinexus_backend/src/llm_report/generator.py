# src/llm_report/generator.py

import os
import re
import json
import requests
from dotenv import load_dotenv
from .prompt_templates import (
    CLINICAL_SYSTEM_PROMPT,
    get_report_prompt,
    PATIENT_INTERPRETATION_SYSTEM_PROMPT,
    get_patient_interpretation_prompt,
)

# Load .env file variables automatically from your backend directory
load_dotenv()

class LLMReportGenerator:
    def __init__(self):
        # Fetch the key dynamically from the loaded environment variables
        api_key = os.getenv("GROQ_API_KEY")
        
        if api_key:
            api_key = api_key.strip().replace('"', '').replace("'", "")
        else:
            api_key = ""
            
        self.api_key = api_key
        self.url = "https://api.groq.com/openai/v1/chat/completions"

    def _chat(self, system_prompt, user_prompt, temperature=0.2):
        if not self.api_key:
            return "[-] Error: GROQ_API_KEY is not set. Please check your .env file."

        try:
            payload = {
                "model": "llama-3.1-8b-instant",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": temperature,
            }

            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }

            response = requests.post(self.url, headers=headers, json=payload)
            response_data = response.json()

            if response.status_code == 200:
                return response_data['choices'][0]['message']['content']
            else:
                return f"[-] Free Gateway API Error {response.status_code}: {json.dumps(response_data)}"

        except Exception as e:
            return f"[-] Error generating LLM report via Free Gateway: {str(e)}"

    def generate_clinical_report(self, raw_report_dict):
        json_string = json.dumps(raw_report_dict, indent=2)
        user_prompt = get_report_prompt(json_string)
        return self._chat(CLINICAL_SYSTEM_PROMPT, user_prompt)

    def generate_patient_interpretation(self, raw_report_dict):
        """Returns a dict with 'summary' (one paragraph, covers the eye/DR finding) plus
        'heart', 'kidney', 'brain' short clinical notes."""
        json_string = json.dumps(raw_report_dict, indent=2)
        user_prompt = get_patient_interpretation_prompt(json_string)
        raw_text = self._chat(PATIENT_INTERPRETATION_SYSTEM_PROMPT, user_prompt, temperature=0.3)
        return self._parse_organ_interpretation(raw_text)

    @staticmethod
    def _parse_organ_interpretation(raw_text):
        fallback = {"summary": "", "heart": "", "kidney": "", "brain": ""}

        if not raw_text or raw_text.startswith("[-]"):
            return fallback

        try:
            cleaned = raw_text.strip()
            # Some models wrap JSON in ```json ... ``` fences despite instructions — strip them.
            if cleaned.startswith("```"):
                cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", cleaned, flags=re.MULTILINE).strip()

            data = json.loads(cleaned)
            return {
                "summary": str(data.get("summary", "")).strip(),
                "heart": str(data.get("heart", "")).strip(),
                "kidney": str(data.get("kidney", "")).strip(),
                "brain": str(data.get("brain", "")).strip(),
            }
        except (json.JSONDecodeError, AttributeError, TypeError):
            return fallback