from google import genai
import os
import logging
import json
import re
from app.core.config import settings
import PyPDF2
import docx
import io
import asyncio


class ResumeService:
    def __init__(self):
        self.client = None
        # Using flash-latest for better quota availability
        self.model_name = "gemini-flash-latest" 
        self.initialize_gemini()

    def initialize_gemini(self):
        api_key = settings.GEMINI_API_KEY
        if api_key:
            try:
                import certifi
                os.environ['SSL_CERT_FILE'] = certifi.where()
                self.client = genai.Client(api_key=api_key)
            except Exception as e:
                logging.error(f"Resume Service Gemini Init Error: {e}")

    def extract_text(self, file_content, filename):
        text = ""
        try:
            if filename.endswith('.pdf'):
                pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
                for page in pdf_reader.pages:
                    text += (page.extract_text() or "")
            elif filename.endswith('.docx'):
                doc = docx.Document(io.BytesIO(file_content))
                for para in doc.paragraphs:
                    text += para.text + "\n"
            else:
                text = file_content.decode('utf-8', errors='ignore')
        except Exception as e:
            logging.error(f"Text extraction error: {e}")
        return text

    async def analyze_resume(self, text, max_retries=2):
        if not self.client:
            logging.error("Resume Analysis Error: Gemini client not initialized")
            return None
            
        prompt = (
            "Analyze the following resume text and extract the key information in a structured JSON format. "
            "Return ONLY the JSON object with the following keys: "
            "'skills' (a list of technical and soft skills), "
            "'experience_years' (estimated total years of experience as a number), "
            "'education' (highest degree mentioned), "
            "'summary' (a brief professional summary extracted from the resume), "
            "'key_achievements' (list of 3-4 notable projects or accomplishments). "
            "\n\nResume Text:\n" + text
        )

        for attempt in range(max_retries + 1):
            try:
                # Primary attempt
                try:
                    response = self.client.models.generate_content(
                        model=self.model_name,
                        contents=prompt,
                        config={
                            'temperature': 0.1,
                            'top_p': 0.95,
                            'max_output_tokens': 2048,
                        }
                    )
                except Exception as e:
                    error_msg = str(e).upper()
                    if "RESOURCE_EXHAUSTED" in error_msg or "429" in error_msg or "500" in error_msg:
                        logging.warning(f"Primary model {self.model_name} failed, trying fallback gemini-flash-latest...")
                        response = self.client.models.generate_content(
                            model="gemini-flash-latest",
                            contents=prompt
                        )
                    else:
                        raise e
                
                if not response or not response.text:
                    if attempt < max_retries:
                        logging.warning(f"Gemini empty response on attempt {attempt+1}, retrying...")
                        await asyncio.sleep(2)
                        continue
                    logging.error("Gemini Resume Analysis Error: Empty response after retries")
                    return None

                # Find JSON in response
                text_response = response.text
                match = re.search(r'\{.*\}', text_response, re.DOTALL)
                if match:
                    try:
                        return json.loads(match.group())
                    except json.JSONDecodeError:
                        logging.error(f"Failed to parse JSON from Gemini response: {text_response[:200]}")
                        return None
                
                logging.error(f"Gemini Resume Analysis Error: JSON not found in response: {text_response[:100]}")
                return None

            except Exception as e:
                error_msg = str(e).upper()
                logging.error(f"Gemini Resume Analysis Error (Attempt {attempt+1}): {error_msg}")
                
                if "RESOURCE_EXHAUSTED" in error_msg or "429" in error_msg:
                    if attempt < max_retries:
                        # If the error provides a retry delay, we could use it, 
                        # but simple exponential backoff is often enough.
                        wait_time = (attempt + 1) * 5 
                        logging.warning(f"Gemini rate limit hit. Retrying in {wait_time}s...")
                        await asyncio.sleep(wait_time)
                        continue
                    else:
                        logging.error("Maximum retries reached for Gemini API due to rate limiting.")
                        raise e # Re-raise if retries exhausted
                
                # For other errors, return None after logging
                logging.error(f"Unexpected error in analyze_resume: {e}", exc_info=True)
                return None


resume_service = ResumeService()
