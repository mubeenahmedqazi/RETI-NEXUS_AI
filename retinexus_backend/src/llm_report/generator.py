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
    LONGITUDINAL_SYSTEM_PROMPT,
    get_longitudinal_prompt,
    DETAILED_ANALYSIS_SYSTEM_PROMPT,
    get_detailed_analysis_prompt,
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
        # llama-3.1-8b-instant was retired by Groq (404 model_not_found on new keys).
        # openai/gpt-oss-20b is the closest current equivalent (fast, small, instruction-
        # following). Override via GROQ_MODEL if Groq's catalog changes again.
        self.model = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b").strip()

    def _chat(self, system_prompt, user_prompt, temperature=0.2):
        if not self.api_key:
            return "[-] Error: GROQ_API_KEY is not set. Please check your .env file."

        try:
            payload = {
                "model": self.model,
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

    def generate_longitudinal_analysis(self, visits, detailed_analyses=None):
        """`visits` is a chronological (oldest-first) list of compact per-visit dicts
        (grade, risk factors, biomarkers, lesion counts). `detailed_analyses` is an
        optional list of compact prior Detailed Analysis summaries for the same
        patient, weighed into the same narrative. Returns a dict with the trend
        narrative, or a fallback dict if the LLM call/parse fails."""
        detailed_analyses = detailed_analyses or []
        visits_json = json.dumps(visits, indent=2)
        detailed_json = json.dumps(detailed_analyses, indent=2)
        user_prompt = get_longitudinal_prompt(visits_json, len(visits), detailed_json, len(detailed_analyses))
        raw_text = self._chat(LONGITUDINAL_SYSTEM_PROMPT, user_prompt, temperature=0.3)
        return self._parse_longitudinal(raw_text)

    def generate_detailed_test_analysis(self, test_name, extracted_text, current_report, previous_reports):
        """Correlates an uploaded follow-up test's OCR'd text with the patient's current
        screening findings and recent visit history. Returns a dict with testSummary,
        correlatedFindings, expectedProblems, recommendations, and urgency."""
        current_json = json.dumps(current_report, indent=2)
        previous_json = json.dumps(previous_reports, indent=2)
        user_prompt = get_detailed_analysis_prompt(test_name, extracted_text, current_json, previous_json)
        raw_text = self._chat(DETAILED_ANALYSIS_SYSTEM_PROMPT, user_prompt, temperature=0.25)
        return self._parse_detailed_analysis(raw_text)

    @staticmethod
    def _strip_json_fences(raw_text):
        cleaned = raw_text.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", cleaned, flags=re.MULTILINE).strip()
        return cleaned

    @classmethod
    def _parse_organ_interpretation(cls, raw_text):
        fallback = {
            "summary": "",
            "heart": "",
            "kidney": "",
            "brain": "",
            "predictedRisk1Year": "",
            "predictedRisk5Year": "",
            "suggestedTests": [],
        }

        if not raw_text or raw_text.startswith("[-]"):
            return fallback

        try:
            data = json.loads(cls._strip_json_fences(raw_text))
            tests = data.get("suggestedTests", [])
            if not isinstance(tests, list):
                tests = []
            return {
                "summary": str(data.get("summary", "")).strip(),
                "heart": str(data.get("heart", "")).strip(),
                "kidney": str(data.get("kidney", "")).strip(),
                "brain": str(data.get("brain", "")).strip(),
                "predictedRisk1Year": str(data.get("predictedRisk1Year", "")).strip(),
                "predictedRisk5Year": str(data.get("predictedRisk5Year", "")).strip(),
                "suggestedTests": [str(t).strip() for t in tests if str(t).strip()][:2],
            }
        except (json.JSONDecodeError, AttributeError, TypeError):
            return fallback

    @classmethod
    def _parse_longitudinal(cls, raw_text):
        fallback = {
            "overallTrend": "stable",
            "summary": "",
            "heartTrend": "",
            "kidneyTrend": "",
            "brainTrend": "",
            "keyChanges": [],
            "recommendation": "",
        }

        if not raw_text or raw_text.startswith("[-]"):
            return fallback

        try:
            data = json.loads(cls._strip_json_fences(raw_text))
            changes = data.get("keyChanges", [])
            if not isinstance(changes, list):
                changes = []
            trend = str(data.get("overallTrend", "stable")).strip().lower()
            if trend not in ("improving", "stable", "worsening", "mixed"):
                trend = "stable"
            return {
                "overallTrend": trend,
                "summary": str(data.get("summary", "")).strip(),
                "heartTrend": str(data.get("heartTrend", "")).strip(),
                "kidneyTrend": str(data.get("kidneyTrend", "")).strip(),
                "brainTrend": str(data.get("brainTrend", "")).strip(),
                "keyChanges": [str(c).strip() for c in changes if str(c).strip()][:4],
                "recommendation": str(data.get("recommendation", "")).strip(),
            }
        except (json.JSONDecodeError, AttributeError, TypeError):
            return fallback

    @classmethod
    def _parse_detailed_analysis(cls, raw_text):
        fallback = {
            "clinicalSummary": "",
            "testFindings": "",
            "organFindings": {"heart": "", "kidney": "", "brain": ""},
            "redFlags": [],
            "recommendations": [],
            "urgency": "routine",
        }

        if not raw_text or raw_text.startswith("[-]"):
            return fallback

        try:
            data = json.loads(cls._strip_json_fences(raw_text))
            organ = data.get("organFindings", {})
            if not isinstance(organ, dict):
                organ = {}
            red_flags = data.get("redFlags", [])
            recommendations = data.get("recommendations", [])
            urgency = str(data.get("urgency", "routine")).strip().lower()
            if urgency not in ("routine", "priority", "urgent"):
                urgency = "routine"
            return {
                "clinicalSummary": str(data.get("clinicalSummary", "")).strip(),
                "testFindings": str(data.get("testFindings", "")).strip(),
                "organFindings": {
                    "heart": str(organ.get("heart", "")).strip(),
                    "kidney": str(organ.get("kidney", "")).strip(),
                    "brain": str(organ.get("brain", "")).strip(),
                },
                "redFlags": [str(f).strip() for f in red_flags if str(f).strip()][:5] if isinstance(red_flags, list) else [],
                "recommendations": [str(r).strip() for r in recommendations if str(r).strip()][:5] if isinstance(recommendations, list) else [],
                "urgency": urgency,
            }
        except (json.JSONDecodeError, AttributeError, TypeError):
            return fallback