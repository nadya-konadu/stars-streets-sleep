import json
import pandas as pd

with open('dreams.json', 'r') as file:
    data = json.load(file)


rows = []


for record in data['records']:
    dreamer = record['dreamer']
    # Get info at the dreamer level
    gender = dreamer.get('gender')
    city_dreamer = dreamer.get('city')
    admin1 = dreamer.get('admin1')
    country_code = dreamer.get('country_code')

    # dreams per dreamer
    for dream in record['dreams']:
        row = {
            "date": dream.get("date"),
            "country_code": dream.get("country_code", country_code),
            "admin1": dream.get("admin1", admin1),
            "city": dream.get("city", city_dreamer),
            "gender": gender,
            "type": dream.get("app_tags", {}).get("type"),
            "impact": dream.get("app_tags", {}).get("impact"),
            "mood": dream.get("app_tags", {}).get("mood"),
            "theme": dream.get("app_tags", {}).get("theme"),
            "perspective": dream.get("app_tags", {}).get("perspective"),
            "recurring": dream.get("app_tags", {}).get("recurring"),
            "lucidity": dream.get("app_tags", {}).get("lucidity"),
            "keywords": ", ".join(dream.get("app_tags", {}).get("keywords", [])),
            "sentiment_neg": dream.get("affect", {}).get("sentiment_neg"),
            "sentiment_neu": dream.get("affect", {}).get("sentiment_neu"),
            "sentiment_pos": dream.get("affect", {}).get("sentiment_pos"),
            "valence_mean": dream.get("affect", {}).get("valence_mean"),
            "arousal_mean": dream.get("affect", {}).get("arousal_mean"),
            "dominance_mean": dream.get("affect", {}).get("dominance_mean"),
            "emotions_top3": ", ".join([f"{e[0]}:{e[1]}" for e in dream.get("affect", {}).get("emotions_top3", [])])
        }
        rows.append(row)

# df
df = pd.DataFrame(rows)

# export to csv
df.to_csv("/Users/nadyakonadu/Documents/DataVis_Proj/Data_Cleaning/dreams_cleaned.csv", index=False)