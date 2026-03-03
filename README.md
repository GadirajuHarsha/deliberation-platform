# Clarity for Mozilla Common Voice

## Current Developer Phase: Backend MVP Integration

This repository currently houses the **Interactive Intake Demo Phase**. The frontend React UI (`frontend/`) is securely hooked up to a live FastAPI python backend (`backend/`) which brokers communication with Google's Socratic AI models. Both components can be launched locally for immediate testing or demoing.

### 🚀 How to Run Locally

You can launch both the frontend and backend servers simultaneously using the provided root startup script.

1. Ensure you have Node.js and Python installed.
2. In the `backend` directory, create a `.env` file and add your Google AI Studio API key (this file is gitignored to protect your credentials when sharing the repository):
   ```env
   GEMINI_API_KEY="your_api_key_here"
   ```
3. From the project root, simply double click the **`start.bat`** file, or run it in your terminal:
   ```bash
   .\start.bat
   ```
   *This will automatically activate your virtual environment, launch Uvicorn on `localhost:8000`, and launch the Vite dev server on `localhost:5173`.*

> **UI Mock Mode Toggle:** If you wish to share the frontend with a non-technical stakeholder or review the platform without configuring the `.env` AI keys, simply use the `Frontend Sample Mode / Backend Linked Mode` toggle located right above the Socratic chat UI to force the system to return mocked JSON responses rather than live model queries!

---

Clarity is a case-grounded deliberation platform designed to transition linguistic data governance from an individualistic "notice and consent" model to a collective, stake-weighted system. By anchoring influence in real-world contributions to communities (like Mozilla Common Voice), the platform ensures that those with the highest "expressed stake" lead governance decisions.

---

## Project Vision & Lifecycle

Traditional online voting often devolves into abstract policy debates, echo chambers, or polarized binaries. Clarity solves this through a structured, multi-phase deliberation lifecycle focused on concrete scenarios:

### 1. Case Generation
The "case" is the atomic unit of the platform. Instead of debating abstract rules, users deliberate on concrete, case-grounded scenarios (e.g., "Case #42: Should Company X use this dataset?"). 
- **User Proposed:** Users can upload scenarios. A Socratic LLM compares the proposal against the current library to prevent redundancy, forcing the user to justify its uniqueness.
- **LLM Generated Provocations:** The required AI infrastructure automatically analyzes abstract rules and generates edge-case "provocations" to proactively test policy gaps.

### 2. Socratic Intake (Position Hardening)
To ensure high-integrity deliberation, the platform utilizes an asynchronous Socratic LLM agent as a cognitive partner.
- **Boundary Negotiation:** The agent presents "what-if" scenarios and contradictory perspectives derived from other participants.
- **Values Elicitation:** The agent identifies and records core values (e.g., "Linguistic Diversity").
- **Contradiction Prodding:** If a user's stance conflicts with their stored values, the agent prods for justification until the user refines their position or defends the nuance.

### 3. Weighted Quadratic Voting
After Socratic dialogue, the user’s stance is locked and they enter the voting phase.
- **Influence Allocation:** Credits are granted based on the quantity and quality of verified dataset contributions.
- **Quadratic Voting ($Cost = Votes^2$):** Users spend credits to support their own position or those of peers. Diminishing returns prevent large stakeholders from dominating every topic while allowing them to signal high intensity on specific cases.
- **Similarity Sorting:** Peer perspectives (derived from the Intake phase) are displayed in a feed ordered by decreasing similarity to the user's refined stance. Consensus conclusions are hidden until voting is complete to prevent herd behavior.

### 4. Continuous Audit & Consensus Layer
The platform treats consensus as a live, dynamic state rather than a static average.
- **Dynamic Maintenance:** AI actively recalculates the Community Consensus, accounting for stake-weighting, vote shifts, and the reasoned justifications collected during Intake.
- **Misalignment Alerts:** If the concrete case consensus contradicts a high-level abstract platform policy, the system triggers a revision thread, forcing the community to update the abstract policy to reflect the case-based reality.
- **Immutable Ledger:** The system maintains a transparent audit history of every unique position, quadratic weight, and "Position vs. Value" contradictions.

---

## Technical Architecture

The architecture is a modern three-tier system designed for rapid iteration, AI integration, and scalable similarity searching.

### Tech Stack
- **Frontend:** React with Tailwind CSS (hosted on Firebase Hosting)
- **Backend:** FastAPI / Python (deployed via Docker on Google Cloud Run)
- **Database:** Google Cloud SQL (PostgreSQL) + `pgvector` for similarity search
- **AI Infrastructure:**
  - **All AI Interaction:** Vertex AI (Gemini 1.5 Pro and Gemini 1.5 Flash) powers the Socratic Facilitator, Consensus Synthesis, and all embedding generation.

### Optimization Nuances
- **User Value Ledger:** To minimize token usage, the system passes only a distilled JSON object of "Identified Values" and "Current Stance" each turn during the Socratic Intake, rather than the full conversation history.



*© 2026. Developed at The University of Texas at Austin.*
