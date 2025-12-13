import pandas as pd
import numpy as np

df_real = pd.read_csv("../../data/cleaned/dreams_with_light.csv")
df_real["data_type"] = "real" 

df_real["date"] = pd.to_datetime(df_real["date"])
df_real["year_month"] = pd.to_datetime(df_real["date"]).dt.to_period("M").dt.to_timestamp()

min_dreams = 20             
CITIES = df_real["city"].unique()  # get unique cities
numeric_cols = [
    "sentiment_neg", "sentiment_neu", "sentiment_pos",
    "valence_mean", "arousal_mean", "dominance_mean",
    "mean_rad", "max_rad", "sum_rad"
]
categorical_cols = [
    "country_code", "admin1", "city", "gender", "type", "impact",
    "mood", "theme", "perspective", "recurring", "lucidity"
]
text_cols = ["keywords", "emotions_top3"]

def generate_synthetic_data(city_df, city_name):
    synth_list = [] # synthetic rows

    months_dfreal = city_df["month"].unique() # get unique months
    minmonth_dfreal = city_df["month"].min()
    maxmonth_dfreal = city_df["month"].max() # last real month recorded
    
    all_months = list(range(1, 13))
    full_months = [m for m in all_months if m not in months_dfreal]
    
    monthly = city_df.groupby("year_month")[numeric_cols].mean().sort_index() # table of monthly avgs of quantitatve cols
    
    # interpolate 
    date_range = pd.date_range("2025-01-01", "2025-12-01", freq="MS") # build a list a list of every month to dec
    monthly_interp = monthly.reindex(date_range) # reindex: adds rows for the months missing, interpolate: follow the trend of the values (linear trend) we have to predict nans, reset_index: let year_month be normal col
    monthly_interp = monthly_interp.fillna(method="bfill")
    monthly_interp = monthly_interp.interpolate()
    monthly_interp = monthly_interp.reset_index().rename(columns={"index": "year_month"}) # rename index col to year_month
    
    monthly_interp["month"] = monthly_interp["year_month"].dt.month # get month num
    monthly_interp = monthly_interp[monthly_interp["month"].isin(full_months)] # keeps only the rows w/ missing vals so months w missing vald\s
    
    # threshold 20 dreams a month
    for _, row in monthly_interp.iterrows(): # over each month = row
        month = row["month"]
        
        real_rows = city_df[city_df["month"] == month] # df w dreams for that month
        n_real = len(real_rows) # num of real dreams
        n_needed = max(0, min_dreams - n_real) # num of synthetic ones i need
        
        sample_source = real_rows if len(real_rows) > 0 else city_df
        # if the month has real dreams → use those rows, else → use all real dreams from the city
        
        for i in range(n_needed):
            base = sample_source.sample(1).iloc[0]  # pick 1 random real dream row to copy structure from (iloc[0] turns it into a single row)
            new = {}
            
            # set date
            day = np.random.randint(1, 29)  # pick a random day (1–28)
            new_date = pd.Timestamp(year=2025, month=month, day=day)   # build the full date 
            new["date"] = new_date
            new["year"] = 2025
            new["month"] = month
            new["year_month"] = pd.Timestamp(2025, month, 1)
            new["data_type"] = "synthetic"    # mark this row as synthetic
            
            # copy categorical
            for col in categorical_cols:
                new[col] = base[col]  # copy category values from the real dream I sampled
            for col in text_cols:
                new[col] = base[col]    # copy text fields (keywords, emotion strings) from the real dream
            
            # interpolated numeric fields w noise
            for col in numeric_cols: 
                mean_val = float(row[col])  # get the interpolated monthly average for this num
                noise = np.random.normal(0, 0.02)     # add a tiny random noise
                new[col] = mean_val + noise
            
            synth_list.append(new)
    
    return pd.DataFrame(synth_list)



synthetic_data = []

for city in CITIES:
    city_df = df_real[df_real["city"] == city].copy() # df w real dreams for tgat city
    synth_city_df = generate_synthetic_data(city_df, city)  # generate synthetic dreams for that city
    synthetic_data.append(synth_city_df)

df_synth = pd.concat(synthetic_data, ignore_index=True)

df_final = pd.concat([df_real, df_synth], ignore_index=True)
df_final = df_final.sort_values("date")
toronto_march_vals = df_final.loc[
    (df_final["city"] == "Toronto") & (df_final["month"] == 3),
    ["mean_rad", "max_rad", "sum_rad"]
].iloc[0]

df_final.loc[
    (df_final["city"] == "Toronto") & (df_final["month"] == 4),
    ["mean_rad", "max_rad", "sum_rad"]
] = toronto_march_vals.values
# Toronto January VIIRS values
df_final.loc[
    (df_final["city"] == "Toronto") & (df_final["month"] == 1),
    ["mean_rad", "max_rad", "sum_rad"]] = [65.72076968, 455.2600098, 233956.6618]

# Mississauga January VIIRS values
df_final.loc[
    (df_final["city"] == "Mississauga") & (df_final["month"] == 1),
    ["mean_rad", "max_rad", "sum_rad"]] = [44.621985, 285.519989, 72063.10586]
df_final.to_csv("dreams_with_light_full_2025.csv", index=False)

