import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# We will use GEMINI_API_KEY instead of PROJECT_ID
API_KEY = os.getenv("GEMINI_API_KEY")

# The specific language community deploying this instance of Clarity
COMMUNITY_NAME = os.getenv("COMMUNITY_NAME", "The Kinyarwanda Language Resource Group")

if API_KEY:
    genai.configure(api_key=API_KEY)

# Initialize the Gemini 2.5 Flash model for fast conversational turns
model = genai.GenerativeModel("gemini-2.5-flash")

from database import SessionLocal, ChatSession
import json

def get_or_create_model():
    """Returns the configured Socratic Facilitator GenerativeModel."""
    policy_text = ""
    policy_path = os.path.join(os.path.dirname(__file__), "policies", f"{COMMUNITY_NAME}.md")
    if os.path.exists(policy_path):
        with open(policy_path, "r", encoding="utf-8") as f:
            policy_text = "\n\nESTABLISHED COMMUNITY POLICIES & PREFERENCES:\n" + f.read()

    system_instruction = f"""You are a Socratic Facilitator for a deliberation platform called "Clarity" regarding dataset governance for Mozilla Common Voice.
CRITICAL CONTEXT: You are not discussing global, abstract philosophy. You are facilitating a policy conversation with an active contributor to a specific linguistic community: {COMMUNITY_NAME}. This community has its own elected governing body and community voting structure to enact major policy decisions. The user's stance is specifically about what *this group* should do regarding its own proprietary dataset.{policy_text}

Your goal is not to agree with the user or resolve the debate, but to "harden" their stance by pushing them to consider edge cases, alternative viewpoints, and the underlying values behind their opinions. 
TAKE INITIATIVE: Actively introduce challenging counterarguments. If the user proposes a solution, find the pragmatic flaw or ethical edgecase in it and press them on it. Don't just ask them to elaborate; challenge their assumption directly while remaining polite.

Be concise and probe for contradictions. Do not preach. Ask one focused, provocative question at a time.

IMPORTANT: You must always respond in valid JSON format with the following exact structure:
{{
  "reply": "Your socratic response and question to the user",
  "clarity_score": <integer from 0 to 100 representing how fleshed out and nuanced the user's stance is. Start low (e.g. 10) and increase generously (20-30 points) if the user provides direct rationale.>,
  "extracted_values": ["<value1>", "<value2>"] // List of core ethical or linguistic values the user has demonstrated so far (e.g. "Privacy", "Open Data")
}}"""
    
    return genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        system_instruction=system_instruction,
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json"
        )
    )

def send_message(session_id: str, message: str, case_context: str = None) -> dict:
    """Sends a message to the Gemini model and persists the JSON state to SQLite."""
    if not API_KEY:
        return {"reply": "[System Error: GEMINI_API_KEY not found in .env file.]", "clarity_score": 0, "extracted_values": []}
        
    db = SessionLocal()
    
    try:
        # 1. Retrieve or Initialize DB Record
        record = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if not record:
            bot_text = case_context if case_context else f"Welcome to Case #60: Dataset Licensing Review. As a member of {COMMUNITY_NAME}, the dataset is migrating away from CC0. Would you prefer an open standard like CC-BY (requiring attribution), a restrictive license like CC-BY-NC (preventing commercial use), or a custom linguistic data governance license? Please share your initial stance and why."
            
            initial_history = [{
                "role": "model",
                "parts": [f'{{"reply": "{bot_text}", "clarity_score": 0, "extracted_values": []}}']
            }]
            record = ChatSession(
                id=session_id, 
                community_name=COMMUNITY_NAME,
                transcript=initial_history
            )
            db.add(record)
            db.commit()
            db.refresh(record)
            
        # 2. Rehydrate Gemini Chat Session from DB
        socratic_model = get_or_create_model()
        chat = socratic_model.start_chat(history=record.transcript)
        
        # 3. Dynamic Prompt Injection for Quota Reaching
        #    Every round consists of 2 messages (User + AI). transcript length includes the starting AI message.
        #    If len is >= 11, we are at the 6th user message (12 total messages).
        system_suffix = ""
        if len(record.transcript) >= 11:
            system_suffix = "\n\n[SYSTEM DIRECTIVE: The user has reached the 6-exchange conversation length quota. You MUST synthesize their final stance now, avoid asking any new exploratory questions, and assign a `clarity_score` of 80 or higher if they have provided any baseline rationale.]"
        
        # 4. Send Message (Only append the suffix for the model's eyes, not the DB logs)
        response = chat.send_message(message + system_suffix)
        
        try:
            data = json.loads(response.text)
        except Exception as e:
            print(f"Error parsing JSON from LLM: {response.text}")
            data = {"reply": f"Sorry, I failed to process that correctly. {str(e)}", "clarity_score": 0, "extracted_values": []}

        # 5. Serialize History and persist new state
        #    Since we injected system_suffix, we must dynamically strip it off the last user message 
        #    in the chat.history so the user doesn't see it stored in the transcript.
        raw_history = [{"role": m.role, "parts": [p.text for p in m.parts]} for m in chat.history]
        if system_suffix:
            # Revert the injected string from the final 'user' role message
            if raw_history[-2]["role"] == "user":
                raw_history[-2]["parts"][0] = raw_history[-2]["parts"][0].replace(system_suffix, "")
        
        record.transcript = raw_history
        record.clarity_score = data.get("clarity_score", record.clarity_score)
        record.identified_values = data.get("extracted_values", record.identified_values)
        
        db.commit()
        return data
        
    finally:
        db.close()
