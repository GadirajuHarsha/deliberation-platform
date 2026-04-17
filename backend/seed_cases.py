"""
Seed script for baseline community cases.
Uses the POST /cases API endpoint so that generate_opening_context()
is called for each case, producing a real LLM-generated opening message.
IDs are assigned sequentially by the database — NOT hardcoded.

Run this ONCE against a fresh database.
Usage: python seed_cases.py [API_URL]
  API_URL defaults to http://127.0.0.1:8000
"""

import urllib.request
import urllib.error
import json
import sys
import time

API_URL = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000"

CASES = [
    {
        "title": "Dataset Licensing Review",
        "description": (
            "The current dataset is released under CC0. What license would you like the dataset to be "
            "licensed under moving forward (e.g., CC-BY, CC-BY-NC, or a Custom Governance model)? "
            "And how should this transition impact previously collected data?"
        ),
        "community_id": "kinyarwanda"
    },
    {
        "title": "Commercial Use of Voice Data",
        "description": (
            "Should we allow for-profit companies to train their proprietary models on our public voice datasets? "
            "Or should we restrict commercial use strictly to public-good or open-source ventures?"
        ),
        "community_id": "kinyarwanda"
    },
    {
        "title": "Synthetic Data Generation Thresholds",
        "description": (
            "How much synthetic (AI-generated) voice data is acceptable before a community dataset loses its "
            "'ground truth' human authenticity? Set the acceptable ratio."
        ),
        "community_id": "kinyarwanda"
    },
    {
        "title": "Monetization of Indigenous Languages",
        "description": (
            "A large tech firm wants to pay licensing fees for exclusive 2-year access to a newly compiled "
            "low-resource language dataset. Should the community accept the funds for further research?"
        ),
        "community_id": "kinyarwanda"
    },
]

def create_case(case):
    data = json.dumps(case).encode("utf-8")
    req = urllib.request.Request(
        f"{API_URL}/cases",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read().decode())
            return result
    except urllib.error.HTTPError as e:
        print(f"  HTTP Error {e.code}: {e.read().decode()}")
        return None
    except Exception as e:
        print(f"  Error: {e}")
        return None

def main():
    print(f"Seeding cases via {API_URL}...\n")
    
    # Check if cases already exist
    try:
        existing = json.loads(urllib.request.urlopen(f"{API_URL}/cases", timeout=10).read())
        if existing:
            print(f"Database already has {len(existing)} case(s). Skipping seed.")
            print("To reseed: delete all cases via the admin dashboard first, then run this script again.")
            return
    except Exception as e:
        print(f"Could not reach API at {API_URL}: {e}")
        sys.exit(1)

    for i, case in enumerate(CASES, 1):
        print(f"[{i}/{len(CASES)}] Creating '{case['title']}'...")
        result = create_case(case)
        if result and "id" in result:
            print(f"  ✓ Created as Case #{result['id']}")
            print(f"  Opening message: {result.get('initial_message', '(none)')[:80]}...")
        else:
            print(f"  ✗ Failed to create case.")
        # Small delay to avoid hammering the LLM API
        if i < len(CASES):
            time.sleep(2)

    print("\nSeeding complete.")

if __name__ == "__main__":
    main()
