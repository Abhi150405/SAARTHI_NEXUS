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

        is_hii = query.strip().lower() in ["hii", "hi", "hello", "hey"]
        
        # Determine instruction based on whether we have database context
        has_context = context_string != "No specific database records found for this query."
        
        prompt = (
            f"You are Saarthi, the Official AI Placement Assistant for PICT. "
            f"Your goal is to provide 100% ACCURATE information about PICT placements using the provided Database Context when available. "
            f"\n\n--- DATABASE CONTEXT ---\n{context_string}\n--- END CONTEXT ---\n\n"
            f"USER QUERY: {query}\n\n"
            f"RULES:\n"
            f"1. IF the USER QUERY asks for PICT-specific stats (salary, company names, hiring numbers) and the information is in the DATABASE CONTEXT, you MUST provide it exactly as listed. 100% accuracy is required.\n"
            f"2. IF the information is NOT in the DATABASE CONTEXT, or for general queries (interview tips, resume advice, career paths), use your general AI knowledge to be as helpful as possible.\n"
            f"3. NEVER make up or guess PICT-specific numbers, years, or company details if they aren't in the provided context.\n"
            f"4. Always maintain a professional and encouraging tone.\n"
            f"5. Start your response with a friendly greeting if the user said 'hi' or similar.\n"
            f"\nFormatting: Use <b>bold</b> for all numbers, company names, and salary figures. Use bullet points (•) for lists."
        )

        try:
            config = types.GenerateContentConfig(
                temperature=0.5,  # Lower temperature for better factual consistency
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
