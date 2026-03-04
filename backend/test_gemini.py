import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
# Check both GEMINI_API_KEY and GOOGLE_API_KEY
api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")

if not api_key:
    # Try reading the .env file manually if load_dotenv failed
    if os.path.exists(".env"):
        with open(".env", "r") as f:
            for line in f:
                if "API_KEY=" in line:
                    api_key = line.split("=")[1].strip()
                    break

if not api_key:
    print("API Key still not found!")
else:
    print(f"Using API key: {api_key[:10]}...")
    genai.configure(api_key=api_key)
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content("Say hello", stream=True)
        print("Response: ", end="")
        for chunk in response:
            print(chunk.text, end="", flush=True)
        print("\nSuccess!")
    except Exception as e:
        print(f"Error: {e}")
