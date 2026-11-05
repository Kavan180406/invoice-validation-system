# Satellite Anomaly Prediction

This project predicts the time until the next satellite anomaly using space-weather data.

## Models
- Linear Regression
- Support Vector Regression (SVR)
- Modified Naive Bayes

## Data
The notebook uses GOES-16 and GOES-17 anomaly records along with:
- Sunspot number
- F10.7 solar flux
- Month
- Satellite

The anomaly dataset is downloaded automatically in Google Colab. If the download fails, the Excel file can be uploaded manually.

## Run

Open `satellite_anomaly_forecasting.ipynb` in Google Colab and run all cells from top to bottom.

For local Jupyter:

```bash
pip install numpy pandas matplotlib scikit-learn openpyxl requests
```

Then open the notebook and run the cells in order.

## Output

The notebook:
- creates the time-to-event dataset
- trains the three models
- compares training and test MAE
- shows prediction plots
- reports the best test result

## Files

```text
satellite_anomaly_forecasting.ipynb
satellite_anomaly_prediction_report.pdf
README.md
```
