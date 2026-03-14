import google.generativeai as genai
import logging
import os
import re
from app.core.config import settings

class ChatbotService:
    def __init__(self):
        self.model_gen = None
        self.initialize_gemini()

    def initialize_gemini(self):
        api_key = settings.GEMINI_API_KEY
        if api_key:
            try:
                import certifi
                os.environ['SSL_CERT_FILE'] = certifi.where()
                genai.configure(api_key=api_key)
                
                available_models = [m.name for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]
                preferred_models = ['models/gemini-1.5-flash', 'models/gemini-1.5-pro', 'models/gemini-pro']
                
                chosen_model = next((pm for pm in preferred_models if pm in available_models), None)
                if not chosen_model and available_models:
                    chosen_model = available_models[0]
                    
                if chosen_model:
                    self.model_gen = genai.GenerativeModel(
                        model_name=chosen_model.replace('models/', ''),
                        generation_config={
                            "temperature": 0.4,
                            "top_p": 0.95,
                            "top_k": 40,
                            "max_output_tokens": 2048,
                        }
                    )
            except Exception as e:
                logging.error(f"Gemini Initialization Error: {e}")

    async def get_chat_response_stream(self, query: str, context_string: str):
        if not self.model_gen:
            yield "I'm having trouble connecting to my AI core."
            return

        is_hii = query.strip().lower() == "hii"
        intro_instruction = "Start your response with 'Hello! I am Saarthi, the Official AI Placement Assistant for PICT.' and then ask how you can help." if is_hii else "CRITICAL: DO NOT start your response with an introduction. Answer the question directly."

        prompt = (
            f"You are Saarthi, the Official AI Placement Assistant for PICT. "
            f"{intro_instruction} "
            f"Context Data: {context_string}. "
            f"User: {query}. "
            f"Instructions: Respond in paragraphs, bold key points with <b> and </b>. Use bullet points (•) only if needed."
        )

        response = self.model_gen.generate_content(prompt, stream=True)
        for chunk in response:
            if hasattr(chunk, 'text') and chunk.text:
                yield chunk.text

chatbot_service = ChatbotService()
