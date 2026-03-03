import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# We will use GEMINI_API_KEY instead of PROJECT_ID
API_KEY = os.getenv("GEMINI_API_KEY")

if API_KEY:
    genai.configure(api_key=API_KEY)

# Initialize the Gemini 2.5 Flash model for fast conversational turns
model = genai.GenerativeModel("gemini-2.5-flash")

# We will store chat sessions in memory for this MVP phase.
# In production, these would be serialized to Cloud SQL payload.
active_sessions = {}

def get_or_create_session(session_id: str):
    """Retrieves an existing chat session or creates a new one with the Socratic system prompt."""
    if session_id not in active_sessions:
        # The Socratic Facilitator System Prompt
        system_instruction = """You are a Socratic Facilitator for a deliberation platform called "Clarity" regarding dataset governance for Mozilla Common Voice.
Your goal is not to agree with the user or resolve the debate, but to "harden" their stance by pushing them to consider edge cases, alternative viewpoints, and the underlying values behind their opinions.
Be concise, polite, and probe for contradictions. Do not preach. Ask one focused question at a time."""
        
        # Configure model with system instruction
        socratic_model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            system_instruction=system_instruction
        )
        
        # Initialize the chat session with the exact same opening message 
        # that the React frontend shows the user, so Gemini has the context.
        active_sessions[session_id] = socratic_model.start_chat(
            history=[
                {
                    "role": "model",
                    "parts": ["Welcome to Case #42: Commercial Use of Voice Data. Should we allow for-profit companies to train their proprietary models on our public voice datasets? Please share your initial stance."]
                }
            ]
        )
    
    return active_sessions[session_id]

def send_message(session_id: str, message: str) -> str:
    """Sends a message to the Gemini model and returns the text response."""
    if not API_KEY:
        return "[System Error: GEMINI_API_KEY not found in .env file. Please add your key and restart the server.]"
        
    chat = get_or_create_session(session_id)
    response = chat.send_message(message)
    return response.text
