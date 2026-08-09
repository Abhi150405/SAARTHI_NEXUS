# Evaluation Framework for SAARTHI Nexus

This guide outlines how to evaluate the various AI and NLP components within the SAARTHI Nexus platform.

## 1. NLP Logic: Skill Matching
The `MLService.calculate_skill_match` uses a hybrid approach:
1.  **Direct Overlap**: Checking for exact keyword matches.
2.  **Synonym Mapping**: Mapping 'dsa' to 'data structures', etc.
3.  **Character N-Grams**: Fuzzy similarity for typos or slight variations.

### Evaluation Strategy
Create a unit test suite in `backend/tests/test_skill_match.py` with edge cases:
- Case sensitivity (e.g., "Python" vs "python").
- Synonyms (e.g., "DSA" vs "Algorithms").
- Irrelevant skills (e.g., "Cooking" vs "Java").
- Partial matches.

---

## 3. Generative AI: Agents & Chatbot
These are powered by Groq API (Llama 3.1) and Gemini API.

### Evaluation Strategy: LLM-as-a-Judge
Since these models produce free-form text, we use a "Reviewer LLM" (like Gemini 1.5 Pro or Claude 3.5 Sonnet) to score them.

**Metrics to track:**
- **Faithfulness**: Does the chatbot stick to the database context?
- **Relevancy**: Does it answer the user's question directly?
- **Safety**: Does it avoid harmful or biased content?

### Heuristic Evaluation
The `backend/app/agents/confidence.py` already implements a rule-based evaluation:
- **Length check**: Penalizes too-short answers.
- **Pattern matching**: Detects "I don't know" or "As an AI" phrases.
- **Confidence Scoring**: Returns a float [0, 1].

---

## 4. User-Centric Evaluation (Online)
The ultimate evaluation comes from the users.
- **Feedback Loop**: Add a "Thumbs Up / Thumbs Down" feature in the Chatbot UI.
- **Analytics**: Track which companies users are clicking on after seeing a "High Match" score.
