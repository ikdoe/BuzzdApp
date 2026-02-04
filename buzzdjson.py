import json

INPUT_FILE = "cached_places_harrisonburg.json"
OUTPUT_FILE = "reduced_places.json"

# -----------------------------

def rating_bucket(r):
    if r is None:
        return "unknown"
    if r >= 4.3:
        return "high"
    if r >= 3.5:
        return "medium"
    return "low"

# -----------------------------

def classify_type(types):
    if not types:
        return "unknown"

    t = [x.lower() for x in types]

    if "night_club" in t:
        return "club"
    if "bar" in t and "restaurant" in t:
        return "bar+restaurant"
    if "bar" in t:
        return "bar"
    if "restaurant" in t:
        return "restaurant"
    if "brewery" in t:
        return "brewery"
    if "cafe" in t:
        return "cafe"

    return t[0]

# -----------------------------

def reduce_places():
    with open(INPUT_FILE, "r") as f:
        data = json.load(f)

    places = data["response"]["results"]
    reduced = []

    for p in places:
        loc = p.get("geometry", {}).get("location", {})
        rating = p.get("rating")

        phone = (
            p.get("international_phone_number")
            or p.get("formatted_phone_number")
        )

        opening = p.get("opening_hours", {})

        reduced_place = {
            "name": p.get("name"),
            "rating": rating,
            "rating_level": rating_bucket(rating),
            "user_ratings_total": p.get("user_ratings_total"),
            "open_now": opening.get("open_now"),

            # phone still included
            "phone": phone,

            "lat": loc.get("lat"),
            "lng": loc.get("lng"),
            "address": p.get("vicinity"),
            "type": classify_type(p.get("types")),
            "price_level": p.get("price_level")
        }

        reduced.append(reduced_place)

    with open(OUTPUT_FILE, "w") as f:
        json.dump(reduced, f, indent=2)

    print(f"Saved {len(reduced)} places to {OUTPUT_FILE}")

# -----------------------------

if __name__ == "__main__":
    reduce_places()
