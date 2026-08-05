"""
chatbot_service.py  (refactored — multi-agent pipeline)
--------------------------------------------------------

Pipeline per request:
  1. Analyzer Agent  → extract intent + entities (decides if DB context needed)
  2. [Context fetch happens in the endpoint — passed in as context_string]
  3. Reasoner Agent  → generate answer via llm_router (local → Gemini fallback)
  4. Formatter Agent → clean up output text

The endpoint streams the response to the frontend.
No direct Gemini or Ollama calls happen here — everything goes via llm_router.

Backward-compatible:
  - Public interface unchanged: get_chat_response_stream(query, context_string)
  - Returns an async generator of text chunks (same as before)
"""

import logging
from typing import AsyncGenerator

from app.agents.analyzer  import analyze
from app.agents.reasoner  import reason
from app.agents.formatter import format_chat_output
from app.llm.llm_router   import generate_response_stream


class ChatbotService:
    """
    Multi-agent chatbot service.

    Flow:
      analyze → (context already fetched by endpoint) → reason → format → stream
    """

    async def get_chat_response_stream(
        self, query: str, context_string: str, is_first: bool = False
    ) -> AsyncGenerator[str, None]:
        """
        Entry point called by the /api/chatbot/chat endpoint.
        Passes via the LLMRouter so it can dynamically choose local vs Gemini.

        Args:
            query          : Raw user message.
            context_string : Pre-fetched DB records (formatted string).
            is_first       : True if this is the very first user message in the current session.

        Yields:
            Text chunks (str) to be streamed to the client.
        """
        if not query.strip():
            yield "Please provide a valid question."
            return

        try:
            # ── Step 1: Analyze intent (side effect only right now, can be used later) ──
            analysis = await analyze(query)
            logging.info(
                f"ChatbotService: intent={analysis.get('intent')} "
                f"needs_context={analysis.get('needs_context')}"
            )

            # ── Step 2: Build the Reasoner prompt with context ─────────────────
            # We pass the context_string exactly as received from the endpoint
            # (already filtered and formatted by the DB retrieval logic there).

            # ── Step 3: Stream from Reasoner via LLM router ───────────────────
            # generate_response_stream handles local→Gemini fallback transparently.
            full_response_parts = []
            async for chunk in generate_response_stream(
                _build_reasoner_prompt(query, context_string, is_first)
            ):
                # Hardcoded safety replacement — absolutely no dollars allowed
                chunk = chunk.replace("$", "₹")
                chunk = chunk.replace("dollars", "Rupees")
                chunk = chunk.replace("USD", "INR")
                
                full_response_parts.append(chunk)
                yield chunk

            # ── Step 4: Format (side effect only) ────────────────────────────
            full_text = "".join(full_response_parts)
            logging.debug(f"ChatbotService: response length = {len(full_text)} chars")

        except Exception as e:
            logging.error(f"ChatbotService pipeline error: {e}", exc_info=True)
            yield "Sorry, I encountered an error while processing your request."


def _build_reasoner_prompt(query: str, context: str, is_first: bool = False) -> str:
    """
    Constructs the full prompt that will be passed to llm_router for streaming.
    """
    greeting_rule = (
        "6. This is the user's FIRST message. Start your response with a warm, welcoming greeting to introduce yourself.\n"
        if is_first else
        "6. DO NOT start your response with greetings or conversational filler like 'Hi there, how can I assist you today?'. Jump straight into answering the exact query.\n"
    )

    return (
        "You are Saarthi, the Official AI Placement Assistant for PICT "
        "(Pune Institute of Computer Technology).\n"
        "Your goal is to provide 100% ACCURATE information about PICT placements "
        "using the provided Database Context when available.\n\n"
        f"--- DATABASE CONTEXT ---\n{context}\n--- END CONTEXT ---\n\n"
        f"USER QUERY: {query}\n\n"
        "RULES:\n"
        "1. If the DATABASE CONTEXT contains relevant PICT stats (salary, company names, hiring numbers), "
        "quote them EXACTLY.\n"
        "2. All salary values are in Indian Rupees (₹) per annum. Always display salary as '₹X LPA'. "
        "NEVER use the $ sign. NEVER use the word 'dollars' or 'USD'. You must use ₹.\n"
        "3. For general queries (interview tips, resume advice, career paths), use your AI knowledge freely, but NEVER mention specific company names relative to PICT unless they are in the context.\n"
        "4. **STRICT NEGATIVE CONSTRAINT**: NEVER mention companies like HCL, Wipro, or any others if they are NOT in the DATABASE CONTEXT. Do not say 'Companies like HCL/Wipro also visit' if they aren't listed.\n"
        "5. If a company is not in the context, state that you don't have records for it instead of guessing.\n"
        f"{greeting_rule}"
        "7. Maintain a professional, direct, and encouraging tone.\n"
        "8. EXPERIENCE LINKS: If the DATABASE CONTEXT includes an EXPERIENCE_LINK for an interview experience, "
        "you MUST include it in your response as a clickable HTML link EXACTLY like this: "
        "<a href='EXPERIENCE_LINK_VALUE' style='color:#F97316;font-weight:bold;text-decoration:underline;'>📖 Read Full Experience →</a>. "
        "Place this link right after mentioning that experience. Never omit it if it is provided.\n\n"
        "Formatting: Wrap numbers, company names, and salary values in <b>...</b> HTML bold tags. "
        "Use bullet points (•) for lists. Do NOT use markdown **bold** — use HTML <b> tags only."
    )


# Module-level singleton — drop-in replacement for the old chatbot_service
chatbot_service = ChatbotService()
