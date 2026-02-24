# Clarity for Mozilla Common Voice

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

---

## Current Project Phase: Frontend Demonstration

This repository currently houses the **Frontend Demo Phase** inside the `frontend/` directory. All backend routing, Cloud SQL connections, and AI integrations are currently mocked to showcase the UI, interaction flow, and visual architecture.

To run the frontend demonstration locally:

1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start the Vite server: `npm run dev`
4. Open your browser and navigate to `http://localhost:5173/`

*© 2026. Developed at The University of Texas at Austin.*
