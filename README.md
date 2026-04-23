# Clarity: Stake-Weighted Deliberation Platform

Clarity is a next-generation governance platform designed to transition linguistic data oversight from traditional "individual consent" models to a **collective, stake-weighted deliberation system**. Built for use with Mozilla Common Voice (MCV), it ensures that those with the highest "expressed stake" in a dataset—vetted contributors—lead the governance of its future.

---

## 🌊 The Deliberation Flow

Clarity follows a strict three-tier architectural flow to ensure high-integrity decision-making:

### 1. Phase One: Socratic Intake (Position Hardening)
Before a user can cast a single vote, they must engage with an asynchronous **Socratic AI Facilitator** (Gemini 2.5 Flash).
- **Cognitive Partnership**: The AI serves as a partner, not a judge. It probes the user's initial stance, asking clarifying questions.
- **Boundary Negotiation**: The agent presents "what-if" scenarios and contradictory perspectives derived from other participants to ensure the user’s contribution is unique and robust.
- **Values Elicitation**: The facilitator identifies and records core values (e.g., "Linguistic Diversity," "Commercial Non-Exploitation").
- **Contradiction Prodding**: If a stance conflicts with the user's stored values, the agent prods for justification—forcing the user to either defend the contradiction or update their values.
- **Synthesis**: Once reached 80% clarity, the AI synthesizes the entire conversation into a single, high-fidelity **Stance Summary**.

### 2. Phase Two: Weighted Quadratic Voting (Influence Allocation)
After "Hardening" their position, the user enters the community voting pool.
- **Credit-Based Influence**: Users receive "Civic Credits" based on the quantity and quality of their verified Mozilla Common Voice contributions.
- **Semantic Clustering**: All community perspectives are vectorized (Vertex AI `text-embedding-004`) and displayed based on semantic similarity to the user's own refined stance.
- **Quadratic Commitment**: Users spend credits to support positions. However, influence scales quadratically (`Cost = Votes²`). This prevents "Whales" from dominating every topic while allowing them to signal high intensity on specific, critical cases.
- **Perspectives**: Users can **Join** an existing perspective cluster or **Publish a New Precedent** if their view is truly unique (>90% semantic difference).

### 3. Phase Three: Audit & Consensus (Dynamic Synthesis)
Clarity does not treat consensus as a simple average; it is a live, auditable state.
- **Dynamic Maintenance**: As votes are cast, the "Community Rationale" is recalculated.
- **Rationale Synthesis**: The system generates a summary of the *reasoned justifications* collected during Socratic dialogues, rather than just raw vote tallies.
- **Audit Trails**: Every position change and "Value vs. Stance" justification is logged for transparency.

---

## 🛠 Case Lifecycle

The **Case** is the atomic unit of the platform. Instead of abstract policy debates, users deliberate on concrete, grounded scenarios (e.g., "AI Training for Kinyarwanda Data").

1. **User-Proposed Cases**: Participants can upload scenarios but must first pass a Socratic review where the AI checks for redundancy against the current library.
2. **AI Provocations**: The system analyzes existing rules (e.g., "No commercial use") and generates "edge-case provocations" to proactively identify policy gaps.
3. **Resolution**: Cases reach a conclusion once they meet a specific stake-weighted threshold or time limit.

---

## 🚀 Technical Stack

- **Frontend**: Vite + React + Vanilla CSS (Aesthetics-First Design)
- **Backend**: FastAPI (Python 3.11+) + Docker
- **Database**: Google Cloud SQL (PostgreSQL) + `pgvector` for semantic search
- **AI Infrastructure**: 
    - **Vertex AI SDK**: Utilizing identity-based authentication (no API keys in source).
    - **Gemini 2.5 Flash**: Orchestrating Socratic dialogues and orientation.
    - **Vertex Embeddings**: Vectorizing stances for quadratic clustering.
- **Hosting**:
    - **Frontend**: Firebase Hosting (Multisite: Prod & Demo)
    - **Backend**: Google Cloud Run (Serverless)

---

## ⚠️ Troubleshooting AI Connectivity

If the chat returns a **`[DIAGNOSTIC] Model Garden 404`**:
1. Go to the **Google Cloud Console**.
2. Navigate to **Vertex AI > Model Garden**.
3. Enable **Gemini 2.5 Flash** for your project. 
4. Ensure the service account `...-compute@developer.gserviceaccount.com` has the **Vertex AI User** (`roles/aiplatform.user`) role.

---

## 📜 Governance Data Integrity
Clarity maintains financial and semantic integrity through automated cleanup:
- **Case Deletion**: Automatically refunds all spent civic credits to participants.
- **User Deletion**: Purges all associated stances, chat transcripts, and decrements community weights.
- **Deduplication**: Enforces a "One Stance per Case" rule via persistent session resurrection.
