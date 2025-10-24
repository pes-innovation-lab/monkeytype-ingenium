import json

# Read the JSON file
with open("output.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# Filter the quotes
filtered_quotes = []

for quote in data["quotes"]:
    # Check if length is less than 300
    if quote["length"] < 300:
        # Only keep if source is "projects.json"
        if quote["source"] == "projects.json":
            filtered_quotes.append(quote)
        # If source is not "projects.json", skip (delete) this quote
    else:
        # If length >= 300, keep the quote regardless of source
        filtered_quotes.append(quote)

# Update the data with filtered quotes
data["quotes"] = filtered_quotes

# Write back to file (or a new file)
with open("english.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(
    f"Original quotes: {len(data['quotes']) + (len([q for q in data.get('quotes', [])]) - len(filtered_quotes))}"
)
print(f"Filtered quotes: {len(filtered_quotes)}")
print(
    f"Removed: {len(data['quotes']) - len(filtered_quotes) if 'quotes' in data else 0}"
)
