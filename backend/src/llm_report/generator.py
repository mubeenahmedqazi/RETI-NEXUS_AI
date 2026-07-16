# src/llm_report/generator.py

import os
import json
import requests
from dotenv import load_dotenv
from .prompt_templates import CLINICAL_SYSTEM_PROMPT, get_report_prompt

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

    def generate_clinical_report(self, raw_report_dict):
        try:
            # Enforce key check before sending the API call
            if not self.api_key:
                return "[-] Error: GROQ_API_KEY is not set. Please check your .env file."

            json_string = json.dumps(raw_report_dict, indent=2)
            user_prompt = get_report_prompt(json_string)
            
            payload = {
                "model": "llama-3.1-8b-instant",
                "messages": [
                    {
                        "role": "system",
                        "content": CLINICAL_SYSTEM_PROMPT
                    },
                    {
                        "role": "user",
                        "content": user_prompt
                    }
                ],
                "temperature": 0.2
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