# Clarity for Mozilla Common Voice

## Current Status: Live MVP

The interactive Socratic Intake platform is now deployed and live on Google Cloud:
- **Frontend (Firebase Hosting):** [https://project-0582302d-40e8-4c33-95f.web.app/](https://project-0582302d-40e8-4c33-95f.web.app/)
- **Backend (Cloud Run):** [https://clarity-backend-vldn7akxra-uc.a.run.app/](https://clarity-backend-vldn7akxra-uc.a.run.app/)

The frontend React UI (`frontend/`) is securely hooked up to the FastAPI python backend (`backend/`) which brokers communication with Google's Socratic AI models. Both components can also be launched locally for immediate testing or demoing.

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

The architecture is a modern three-tier system designed for rapid iteration, modularity, and $0 sustainable hosting.

### Tech Stack
- **Frontend:** React with Tailwind CSS, secured by **Firebase Authentication**.
- **Backend:** FastAPI / Python (deployed via Docker on Google Cloud Run).
- **Database:** **SQLite via SQLAlchemy ORM**. 
  - *Note: To maintain a zero-cost infrastructure, the platform targets a local SQLite file which is dynamically mounted via Google Cloud Storage FUSE volumes on Cloud Run instead of expensive PostgreSQL instances.*
- **AI Infrastructure:** Vertex AI (Gemini 2.5 Flash) powers the Socratic Facilitator, the AI Case Synthesizer, and the deliberation pipeline.

---

## 🚀 v2 Platform Upgrades (Recent Implementations)

The following major features were recently engineered to transition the platform from a theoretical wireframe into a fully-functional MVP:

0. Added a new sample case about dataset licensing
1. **Quadratic Voting Interface:** Replaced binary thumbs-up/down voting with a dynamic range slider that visually calculates and deducts the quadratic cost ($Cost = Votes^2$) from the user's available Civic Credit Pool.
2. **Forced Peer-Perspective Review:** Engineered a timer-locked `Review.jsx` component that forces users to spend at least 30 seconds reading adversarial viewpoints before allowing them to vote, algorithmically reducing echo chambers. - basically, emphasizing peer perspectives more befoore the voting stage based on what we read in the papers
3. **SQLite Cloud Persistence:** Re-architected the Python `llm_service.py` to strip away volatile memory sessions. Trancripts, Clarity Scores, and Identified Values are now securely read from and written to a Google Cloud Storage-mounted `clarity.db` SQLite schema.
4. **Socratic Quota Tuning:** Implemented a "Ghost Prompt" interceptor. The model generously increases clarity metrics when the user provides rationale, but is hard-coded to intercept at precisely the 6th user-exchange to forcefully conclude the debate and assign an 80+ score, preventing endless conversational loops. - this probably needs to be tuned more to not be a hard boundary and just act "more aggressively" when nearing the boundary, because a hard boundary means that incomplete perspectives might proceed prematurely.
5. **Firebase Auth & Customization:** Protected the deliberation routes utilizing `AuthContext`. Built out the new `Profile.jsx` civic dashboard and the `CreateCase.jsx` portal allowing community leads to automatically synthesize abstract topics into concrete policy cases using AI. Currently not connected to an actual authentication API for demo/testing purposes.
6. Decided against having a marker showing your "rank" within the community/the weight of your voice because I felt like it would discourage people from participating if they're "ranked lower" within their own community, and I think the most important thing with a deliberation platform (from my perspective) is to have as much participation as possible, even if the benefit could be that people distribute their votes more broadly when they have a lot of credits to be used/if they're highly ranked.

### ❓ Open Questions for Advisor / Professor
- **Database Scaling Strategy:** *The platform currently operates a local SQLite ledger dynamically mounted to Google Cloud Storage FUSE. This achieves a sustainable $0 cost model ideal for the MVP. Going forward, should we maintain this high-efficiency architecture, or begin allocating research funds for dedicated, high-concurrency PostgreSQL instances (like Google Cloud SQL or Supabase) to support mass traffic?*

- TBD: Figuring out how to get data on contributions from Mozilla Common Voice. Possible API to use based on if there is relevant data to be used from it?: https://datacollective.mozillafoundation.org/api-reference

*© 2026. Developed at The University of Texas at Austin.*
