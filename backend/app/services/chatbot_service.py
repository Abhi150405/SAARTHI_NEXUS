from google import genai
from google.genai import types
import logging
import os
import re
from app.core.config import settings

class ChatbotService:
    def __init__(self):
        self.client = None
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
                logging.error(f"Gemini Initialization Error: {e}")

    async def get_chat_response_stream(self, query: str, context_string: str):
        if not self.client:
            yield "I'm having trouble connecting to my AI core."
            return

        is_hii = query.strip().lower() == "hii"
        intro_instruction = "Start your response with 'Hello! I am Saarthi, the Official AI Placement Assistant for PICT.' and then ask how you can help." if is_hii else "CRITICAL: Answer the question ONLY using the provided Context Data. Do not use outside knowledge."

        prompt = (
            f"You are Saarthi, the Official AI Placement Assistant for PICT. "
            f"STRICT RULE: You must base your answer ONLY on the Context Data provided below. "
            f"If the Context Data is 'No specific database records found for this query.' or if the information required to answer the question is not present in the Context Data, "
            f"clearly state that you don't have that information in your database and suggest the user to contact the T&P cell for more details. "
            f"DO NOT make up any numbers or facts not present in the Context Data. "
            f"\n\nContext Data:\n{context_string}\n\n"
            f"User Query: {query}\n\n"
            f"{intro_instruction}\n"
            f"Instructions: Respond in a professional and concise manner. Bold key metrics like salary or hiring counts with <b> and </b>. Use bullet points (•) for lists."
        )

        try:
            config = types.GenerateContentConfig(
                temperature=0.4,
                top_p=0.95,
                top_k=40,
                max_output_tokens=2048,
            )
            
            # Try gemini-flash-latest for better quota availability
            model_to_use = "gemini-flash-latest"
            
            try:
                response = self.client.models.generate_content_stream(
                    model=model_to_use,
                    contents=prompt,
                    config=config
                )
                for chunk in response:
                    if chunk.text:
                        yield chunk.text
            except Exception as first_err:
                logging.warning(f"Primary model {model_to_use} failed: {first_err}. Trying fallback...")
                # Fallback to gemini-flash-latest if 1.5-flash fails
                fallback_model = "gemini-flash-latest"
                response = self.client.models.generate_content_stream(
                    model=fallback_model,
                    contents=prompt,
                    config=config
                )
                for chunk in response:
                    if chunk.text:
                        yield chunk.text
        except Exception as e:
            logging.error(f"Gemini Streaming Error: {e}")
            yield "Sorry, I encountered an error while processing your request."

chatbot_service = ChatbotService()
