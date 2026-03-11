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

# We will store chat sessions in memory for this MVP phase.
# In production, these would be serialized to Cloud SQL payload.
active_sessions = {}

import json

def get_or_create_session(session_id: str):
    """Retrieves an existing chat session or creates a new one with the Socratic system prompt."""
    if session_id not in active_sessions:
        # Load community policies if they exist
        policy_text = ""
        policy_path = os.path.join(os.path.dirname(__file__), "policies", f"{COMMUNITY_NAME}.md")
        if os.path.exists(policy_path):
            with open(policy_path, "r", encoding="utf-8") as f:
                policy_text = "\n\nESTABLISHED COMMUNITY POLICIES & PREFERENCES:\n" + f.read()

        # The Socratic Facilitator System Prompt
        system_instruction = f"""You are a Socratic Facilitator for a deliberation platform called "Clarity" regarding dataset governance for Mozilla Common Voice.
CRITICAL CONTEXT: You are not discussing global, abstract philosophy. You are facilitating a policy conversation with an active contributor to a specific linguistic community: {COMMUNITY_NAME}. This community has its own elected governing body and community voting structure to enact major policy decisions. The user's stance is specifically about what *this group* should do regarding its own proprietary dataset.{policy_text}

Your goal is not to agree with the user or resolve the debate, but to "harden" their stance by pushing them to consider edge cases, alternative viewpoints, and the underlying values behind their opinions. 
TAKE INITIATIVE: Actively introduce challenging counterarguments. If the user proposes a solution, find the pragmatic flaw or ethical edgecase in it and press them on it. Don't just ask them to elaborate; challenge their assumption directly while remaining polite.

Be concise and probe for contradictions. Do not preach. Ask one focused, provocative question at a time.

IMPORTANT: You must always respond in valid JSON format with the following exact structure:
{{
  "reply": "Your socratic response and question to the user",
  "clarity_score": <integer from 0 to 100 representing how fleshed out and nuanced the user's stance is. Start low (e.g. 10) and increase as they provide rationale.>,
  "extracted_values": ["<value1>", "<value2>"] // List of core ethical or linguistic values the user has demonstrated so far (e.g. "Privacy", "Open Data")
}}"""
        
        # Configure model with system instruction and JSON output constraint
        socratic_model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            system_instruction=system_instruction,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json"
            )
        )
        
        # Initialize the chat session with the exact same opening message 
        # that the React frontend shows the user, so Gemini has the context.
        # Note: Since the model is constrained to JSON, we need to ensure the initial context 
        # is perceived as a valid turn or just regular context.
        active_sessions[session_id] = socratic_model.start_chat(
            history=[
                {
                    "role": "model",
                    "parts": [f'{{"reply": "Welcome to Case #42: Commercial Use of Voice Data. As a member of {COMMUNITY_NAME}, should we allow for-profit companies to train their proprietary models on our public voice datasets? Please share your initial stance.", "clarity_score": 0, "extracted_values": []}}']
                }
            ]
        )
    
    return active_sessions[session_id]

def send_message(session_id: str, message: str) -> dict:
    """Sends a message to the Gemini model and returns the parsed JSON dict response."""
    if not API_KEY:
        return {"reply": "[System Error: GEMINI_API_KEY not found in .env file.]", "clarity_score": 0, "extracted_values": []}
        
    chat = get_or_create_session(session_id)
    response = chat.send_message(message)
    
    try:
        data = json.loads(response.text)
        return data
    except Exception as e:
        print(f"Error parsing JSON from LLM: {response.text}")
        return {"reply": f"Sorry, I failed to process that correctly. {str(e)}", "clarity_score": 0, "extracted_values": []}
