import json
from pathlib import Path

# List of quotes to add
quotes_list = [
    "The more you hydrate the better you can cry",
    "Life is just the process of moving from worse to better scams",
    "You guys would be an absolute hr issue.",
    "Im an awesome person as indicated my my awsm pfp"
]

json_path = Path(__file__).parent.parent / "static/quotes/english.json"

# Load existing data if file exists
if json_path.exists():
    with open(json_path, "r") as f:
        output = json.load(f)
else:
    output = {
        "language": "english",
        "groups": [[0, 100], [101, 300], [301, 600], [601, 9999]],
        "quotes": [],
    }

# Find the next available ID
existing_ids = [q["id"] for q in output["quotes"]]
next_id = max(existing_ids, default=0) + 1

for quote in quotes_list:
    output["quotes"].append(
        {"text": quote, "source": "script", "id": next_id, "length": len(quote)}
    )
    next_id += 1

with open(json_path, "w") as f:
    json.dump(output, f, indent=2)


