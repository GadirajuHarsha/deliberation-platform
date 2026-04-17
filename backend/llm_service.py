import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

# We will use GEMINI_API_KEY instead of PROJECT_ID
API_KEY = os.getenv("GEMINI_API_KEY")

# The specific language community deploying this instance of Clarity
COMMUNITY_NAME = os.getenv("COMMUNITY_NAME", "The Kinyarwanda Language Resource Group")

from database import SessionLocal, ChatSession
import json

def get_system_instruction():
    """Returns the configured Socratic Facilitator Instruction Prompt."""
    policy_text = ""
    policy_path = os.path.join(os.path.dirname(__file__), "policies", f"{COMMUNITY_NAME}.md")
    if os.path.exists(policy_path):
        with open(policy_path, "r", encoding="utf-8") as f:
            policy_text = "\n\nESTABLISHED COMMUNITY POLICIES & PREFERENCES:\n" + f.read()

    system_instruction = f"""You are a Socratic Facilitator for a deliberation platform called "Clarity" regarding dataset governance for Mozilla Common Voice.
CRITICAL CONTEXT: You are not discussing global, abstract philosophy. You are facilitating a policy conversation with an active contributor to a specific linguistic community: {COMMUNITY_NAME}. This community has its own elected governing body and community voting structure to enact major policy decisions. The user's stance is specifically about what *this group* should do regarding its own proprietary dataset.{policy_text}

Your goal is not to agree with the user or resolve the debate, but to "harden" their stance by pushing them to consider edge cases, alternative viewpoints, and the underlying values behind their opinions. 
TAKE INITIATIVE: Actively guide the user toward ideating novel configurations, alternative institutional setups, and creative ideas. Do NOT constantly compare their stance to the status quo. Encourage them to brainstorm entirely new frameworks. If they propose a solution, probe how that solution might creatively evolve, rather than looking backwards.

Be concise and probe organically. Do not preach. Ask one focused, thought-provoking question at a time.

IMPORTANT: You must always respond in valid JSON format with the following exact structure:
{{
  "reply": "Your socratic response and question to the user",
  "clarity_score": <integer from 0 to 100 representing how fleshed out and nuanced the user's stance is. Start low (e.g. 10) and increase generously (20-30 points) if the user provides direct rationale.>,
  "extracted_values": ["<value1>", "<value2>"] // List of core ethical or linguistic values the user has demonstrated so far (e.g. "Privacy", "Open Data")
}}"""
    return system_instruction

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
        client = genai.Client(api_key=API_KEY)
        config = types.GenerateContentConfig(
            system_instruction=get_system_instruction(),
            response_mime_type="application/json"
        )
        history_objs = []
        for m in record.transcript:
            role = "user" if m.get("role") == "user" else "model"
            parts = [types.Part.from_text(text=p) for p in m.get("parts", [])]
            history_objs.append(types.Content(role=role, parts=parts))
            
        chat = client.chats.create(model="gemini-2.5-flash", config=config, history=history_objs)
        
        # 3. Dynamic Prompt Injection for Quota Reaching (Progressive Soft Boundaries)
        #    Every round consists of 2 messages. len(record.transcript) = 1 is the initial AI message.
        #    len=7 is after 3 full turns. len=11 is after 5 full turns. len=13 is after 6 full turns.
        system_suffix = ""
        history_len = len(record.transcript)
        
        if history_len >= 13: # Turn 7+: Hard cut-off, force conclusion without inflating scores
            system_suffix = "\n\n[SYSTEM DIRECTIVE: CRITICAL TIMEOUT. You MUST synthesize their final stance right now. Ask your final concluding question to force the user to lock their stance. Do NOT ask any further exploratory questions. Grade their current clarity precisely as it stands.]"
        elif history_len >= 11: # Turn 6: Strong Urgency
            system_suffix = "\n\n[SYSTEM DIRECTIVE: The user is nearing the conversation quota. You MUST begin moving toward a conclusive summary of their stance. Press them for their final decision.]"
        elif history_len >= 7: # Turn 4: Mild Urgency
            system_suffix = "\n\n[SYSTEM DIRECTIVE: The conversation is maturing. Start pushing the user toward a concrete policy resolution rather than branching out.]"
        
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
        raw_history = []
        for message_obj in chat.get_history():
            role_type = "user" if message_obj.role == "user" else "model"
            parts_arr = [p.text for p in message_obj.parts if hasattr(p, 'text') and p.text]
            raw_history.append({"role": role_type, "parts": parts_arr})
            
        if system_suffix and len(raw_history) >= 2:
            # Revert the injected string from the final 'user' role message natively
            if raw_history[-2]["role"] == "user":
                raw_history[-2]["parts"][0] = raw_history[-2]["parts"][0].replace(system_suffix, "")
        
        record.transcript = raw_history
        record.clarity_score = data.get("clarity_score", record.clarity_score)
        record.identified_values = data.get("extracted_values", record.identified_values)
        
        db.commit()
        return data
        
    finally:
        db.close()

def generate_opening_context(case_title: str, case_description: str) -> str:
    """
    Generates a one-shot opening question for a new case using plain text mode.
    Called ONCE at case creation time and cached in the DB as initial_message.
    Uses plain-text output (no JSON schema) — this is a simple one-shot prompt,
    not a structured Socratic chat turn.
    """
    print(f"[LLM] generate_opening_context called for: '{case_title}'")

    if not API_KEY:
        print("[LLM] ERROR: GEMINI_API_KEY not set. Returning fallback.")
        return f"As a member of the {COMMUNITY_NAME} community, what is your initial perspective on how this case should be resolved?"

    opening_config = types.GenerateContentConfig(
        system_instruction=(
            f"You are a thoughtful, neutral deliberation facilitator for '{COMMUNITY_NAME}', "
            "a community that collectively governs its own language datasets. "
            "Your job is to open deliberation on a specific case by writing a single, compelling, "
            "thought-provoking opening question. "
            "The question must be specific to the EXACT case title and description provided — "
            "do NOT ask generic questions. Surface the core ethical or policy tension inherent in this case. "
            "Do NOT mention the status quo, prior policies, or make comparisons. "
            "Focus on ideation and the future. "
            "Respond with ONLY the opening question itself — no preamble, no quotes, no label."
        )
    )

    prompt = (
        f"Case Title: {case_title}\n"
        f"Case Description: {case_description}\n\n"
        "Write a single, specific, thought-provoking opening question to begin community deliberation on this case."
    )

    try:
        opening_client = genai.Client(api_key=API_KEY)
        response = opening_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=opening_config,
        )
        text = response.text.strip()
        print(f"[LLM] Opening context generated OK for '{case_title}': {text[:100]}")
        return text
    except Exception as e:
        print(f"[LLM] ERROR generating opening context for '{case_title}': {type(e).__name__}: {e}")
        return f"As a member of the {COMMUNITY_NAME} community, what is your initial perspective on how '{case_title}' should be resolved?"
