import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")

genai.configure(api_key=api_key)
available_models = [m.name for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]

with open('model_list.txt', 'w') as f:
    f.write(str(available_models))
