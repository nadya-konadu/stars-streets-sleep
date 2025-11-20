import pandas as pd

dreams = pd.read_csv("dreams_cleaned.csv")

dreams['date'] = pd.to_datetime(dreams['date'])
dreams['year'] = dreams['date'].dt.year
dreams['month'] = dreams['date'].dt.month

viirs = pd.read_csv("VIIRS_data.csv")

viirs['year'] = viirs['month'].str.split('-').str[0].astype(int)
viirs['month'] = viirs['month'].str.split('-').str[1].astype(int)

print(dreams['city'].unique())
print(viirs['city'].unique())

merged_df = pd.merge(
    dreams,
    viirs[['city','year','month','mean_rad','max_rad','sum_rad']],
    on=['city','year','month'],
    how='left'
)

print(merged_df.head())

merged_df.to_csv("dreams_with_light.csv", index=False)
