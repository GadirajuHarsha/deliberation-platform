import os
import json
import traceback
import vertexai
from vertexai.generative_models import GenerativeModel, Content, Part, GenerationConfig
from database import SessionLocal, ChatSession
from dotenv import load_dotenv

load_dotenv()

# System constants
PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT", "info-deliberation-tooling-prod")
# Default to us-central1 but allow override for institutional discovery
LOCATION = os.getenv("VERTEX_LOCATION", "us-central1")
COMMUNITY_NAME = os.getenv("COMMUNITY_NAME", "The Kinyarwanda Language Resource Group")

# Initialize Vertex AI
try:
    vertexai.init(project=PROJECT_ID, location=LOCATION)
except Exception as init_err:
    print(f"[LLM] Vertex AI Initialization failed: {init_err}", flush=True)

def get_system_instruction():
    """Returns the Socratic Facilitator system prompt."""
    policy_text = ""
    policy_path = os.path.join(os.path.dirname(__file__), "policies", f"{COMMUNITY_NAME}.md")
    if os.path.exists(policy_path):
        with open(policy_path, "r", encoding="utf-8") as f:
            policy_text = "\n\nESTABLISHED COMMUNITY POLICIES:\n" + f.read()

    return f"""You are a Neutral Socratic Facilitator for \"Clarity\", a deliberation platform for dataset governance.

CONTEXT: You are facilitating a structured policy dialogue with a contributor to {COMMUNITY_NAME}.

YOUR ROLE: Help the user develop a well-reasoned, specific stance by highlighting the core ethical trade-offs of the case. 
TONE: Maintain a professional, inquisitive, and impartial tone. Do not take a side or use loaded language. Focus on logical consistency and value discovery.
ONE QUESTION PER TURN. SCORE HONESTLY (10-100). 
OUTPUT JSON ONLY:
{{
  "reply": "Your question",
  "clarity_score": <int>,
  "extracted_values": []
}}"""

def send_message(session_id: str, message: str, case_context: str = None) -> dict:
    """Sends a message using the Vertex AI SDK with robust diagnostic fallbacks."""
    db = SessionLocal()
    try:
        # 1. Retrieve DB Record
        record = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if not record:
            return {"reply": "[System Error: Session not found.]", "clarity_score": 0, "extracted_values": []}

        # 2. Preparation of Content for Generation (Stateless)
        # Use gemini-2.5-flash (Latest stable version in your environment)
        model = GenerativeModel(
            "gemini-2.5-flash",
            system_instruction=get_system_instruction()
        )
        
        response_schema = {
            "type": "OBJECT",
            "properties": {
                "reply": {"type": "STRING"},
                "clarity_score": {"type": "INTEGER"},
                "extracted_values": {"type": "ARRAY", "items": {"type": "STRING"}}
            },
            "required": ["reply", "clarity_score", "extracted_values"]
        }
        
        generation_config = GenerationConfig(
            response_mime_type="application/json",
            response_schema=response_schema,
            temperature=0.7
        )
        
        # 3. Dynamic Prompt Injection for Quota Reaching
        system_suffix = ""
        history_len = len(record.transcript)
        if history_len >= 13: 
            system_suffix = "\n\n[SYSTEM DIRECTIVE: CRITICAL TIMEOUT. Conclude now.]"
        elif history_len >= 7:
            system_suffix = "\n\n[SYSTEM DIRECTIVE: Push for resolution.]"
        
        contents = []
        for i, m in enumerate(record.transcript):
            role = "user" if m.get("role") == "user" else "model"
            msg_parts = m.get("parts", [])
            text_parts = [str(p) for p in msg_parts]
            
            # IDENTITY FIX: Vertex AI history MUST begin with 'user'
            if i == 0 and role == "model":
                continue

            # Suffix injection (concatenation avoids Part setter error)
            if i == len(record.transcript) - 1 and role == "user" and system_suffix and text_parts:
                text_parts[0] += system_suffix

            parts = [Part.from_text(t) for t in text_parts]
            contents.append(Content(role=role, parts=parts))

        # 4. Generate response with Diagnostic Transparency
        try:
            response = model.generate_content(
                contents,
                generation_config=generation_config
            )
        except Exception as api_err:
            err_msg = str(api_err)
            print(f"[LLM] Vertex SDK Failure: {err_msg}", flush=True)
            
            # DIAGNOSTIC FEEDBACK: Tell the user exactly why it failed so they can fix it in Console
            diagnostic_reply = "I'm having trouble connecting right now. Please try again in a moment."
            if "404" in err_msg or "NOT_FOUND" in err_msg:
                diagnostic_reply = f"[DIAGNOSTIC] Model Garden 404: The Gemini 1.5 model is not enabled for project '{PROJECT_ID}' in '{LOCATION}'. Please enable it in the GCP Console."
            elif "403" in err_msg or "PERMISSION_DENIED" in err_msg:
                diagnostic_reply = f"[DIAGNOSTIC] IAM 403: Service Account lacks 'roles/aiplatform.user' in project '{PROJECT_ID}'."

            return {
                "reply": diagnostic_reply,
                "clarity_score": record.clarity_score,
                "extracted_values": record.identified_values or []
            }
        
        try:
            data = json.loads(response.text)
        except Exception as e:
            data = {"reply": response.text.strip(), "clarity_score": record.clarity_score, "extracted_values": []}

        record.clarity_score = data.get("clarity_score", record.clarity_score)
        record.identified_values = data.get("extracted_values", record.identified_values)
        db.commit()
        return data
        
    finally:
        db.close()

def generate_opening_context(case_title: str, case_description: str) -> str:
    """Generates an impartial, detailed opening orientation question."""
    try:
        system_instr = (
            f"You are a professional Socratic Facilitator for '{COMMUNITY_NAME}'. "
            "Your goal is to orient the user to a specific deliberation case. "
            "1. Start by providing a high-level summary of the case dilemma based on the title and description. "
            "2. Then, ask an insightful opening question that highlights the core ethical trade-off. "
            "Ensure the response is comprehensive enough that a user who forgot the details can understand the context fully. "
            "TONE: Impartial, professional, and balanced. Avoid biased or dramatic language."
        )
        model = GenerativeModel(
            "gemini-2.5-flash",
            system_instruction=system_instr
        )
        prompt = f"Case: {case_title}\nDescription: {case_description}\n\nOne sentence provocative question:"
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"[LLM] Opening context failed: {e}", flush=True)
        # Standard provocative fallback
        return f"If {COMMUNITY_NAME} approves '{case_title}', are we advancing our linguistic future or facilitating corporate extraction?"

def synthesize_perspective(transcript: list) -> str:
    """Synthesizes a transcript."""
    try:
        model = GenerativeModel("gemini-2.5-flash")
        history_text = "\n".join([f"{t['role'].upper()}: {' '.join([str(p) for p in t['parts']])}" for t in transcript])
        prompt = f"Synthesize this stance into 1 paragraph:\n\n{history_text}"
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        return "Thinking about the conversation..."

def generate_embedding(text: str) -> list[float]:
    """Generates an embedding vector."""
    from vertexai.language_models import TextEmbeddingModel
    try:
        model = TextEmbeddingModel.from_pretrained("text-embedding-004")
        embeddings = model.get_embeddings([text])
        return [float(f) for f in embeddings[0].values]
    except Exception as e:
        return []
