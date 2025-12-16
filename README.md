# Stars, Streets, and Sleep

Stars, Streets, and Sleep is a data visualization project that explores how nighttime light pollution relates to the emotional tone of dreams. The project combines dream emotion data with satellite-based measures of nighttime brightness to examine whether urban light environments shape how dreams feel.

## Motivation
Dreaming is something most people experience regularly, but the environments we sleep in are rarely considered when thinking about dream emotion. I was interested in whether exposure to artificial light at night might be connected to the emotions people experience while dreaming, especially in dense urban settings. This project is also personally motivated by my own habit of dream journaling and my interest in environmental data and visual storytelling.

## Data
The project uses two primary data sources. Dream emotion data come from the DreamDrop dataset and include measures such as valence, arousal, dominance, and common emotional themes. Nighttime light data come from VIIRS Day/Night Band satellite imagery, summarized as monthly average radiance. The analysis focuses on dreams recorded in Toronto and Mississauga, matched to the corresponding month of light exposure.

## Methods
I cleaned and prepared the data in R, aggregating dream emotions and aligning them with monthly light measurements. Rather than focusing on prediction, the analysis is exploratory and emphasizes patterns across cities, months, and emotion categories. The visualizations are built with HTML, CSS, and D3.js to allow interactive comparison and exploration.

## Visualizations
The site presents interactive visuals that show how the distribution of dream emotions changes across different nighttime light levels. Radial charts are used to emphasize proportional differences between emotions, while categorical layouts allow comparisons across cities and months. The visual design intentionally balances scientific clarity with a softer, dream-like aesthetic.

## Status
This project was developed as a course final project and is still being refined. Future iterations may include additional interaction, clearer annotations, and expanded contextual explanation.

## Author
Nadya Konadu
