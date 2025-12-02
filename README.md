# 💳 Credit Card Default Risk Prediction (SQL → ML)

A complete **SQL-first** data science project demonstrating feature engineering and machine learning for credit risk assessment using the **UCI Credit Card Default dataset**.

## 🎯 Project Objective

Predict which credit card customers will default on their next payment using:
- **SQL** for feature engineering from normalized banking tables
- **Python ML** for training classification models (Logistic Regression, Random Forest, XGBoost, LightGBM)

## 📊 Dataset

**UCI Default of Credit Card Clients Dataset** (30,000 customers)
- 6 months of payment history, bill statements, and payment amounts
- Demographics: age, sex, education, marital status
- Target: Binary default indicator (default rate ~22%)

## 🗂️ Project Structure

```
credit-default-sql-ml/
├── data/
│   ├── load_data.py              # Downloads UCI dataset
│   ├── credit_default_raw.csv    # Raw data (generated)
│   ├── credit_default.db         # SQLite database (generated)
│   └── predictions.csv           # Model predictions (generated)
├── sql/
│   ├── schema.sql                # Database schema (6 tables)
│   ├── populate_tables.py        # Populates tables from CSV
│   └── feature_engineering.sql   # SQL feature engineering queries
├── notebooks/
│   └── train_model.ipynb         # ML training notebook
├── requirements.txt
└── README.md
```

## 🗄️ Database Schema

Normalized into 6 relational tables:
1. `customers` - Demographics (age, sex, education, marriage)
2. `credit_accounts` - Credit limits
3. `payment_status` - Monthly repayment delays (PAY_0 to PAY_6)
4. `statements` - Monthly bill amounts (BILL_AMT1-6)
5. `payments` - Monthly payment amounts (PAY_AMT1-6)
6. `labels` - Default target variable

## 🔧 SQL Feature Engineering

Advanced queries using:
- **CTEs** for modular feature construction
- **Aggregations** for utilization ratios and payment behavior
- **Joins** across 5 tables to create customer-level features

Key engineered features:
- Average/max credit utilization (6 months)
- Number of late payments and serious delays
- Payment-to-bill ratios
- Average repayment status

---

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- macOS: Homebrew (for OpenMP library)

### Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd credit-default-sql-ml
```

### Step 2: Create Virtual Environment

```bash
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 4: Install OpenMP (macOS only - required for XGBoost)

```bash
brew install libomp
brew link --force libomp
```

### Step 5: Load UCI Dataset

```bash
cd data
python load_data.py
```

This downloads the UCI Credit Card Default dataset and saves it as `credit_default_raw.csv`.

### Step 6: Create Database & Populate Tables

```bash
cd ../sql
python populate_tables.py
```

This creates `credit_default.db` with normalized tables AND runs feature engineering SQL automatically.

### Step 7: Run the ML Notebook

```bash
cd notebooks
jupyter notebook train_model.ipynb
```

Or run all cells in order from Jupyter interface.

---

## 🏃 One-Liner Setup (after cloning)

```bash
# Full setup in one command
python3 -m venv venv && source venv/bin/activate && \
pip install -r requirements.txt && \
brew install libomp && brew link --force libomp && \
cd data && python load_data.py && \
cd ../sql && python populate_tables.py && \
cd ../notebooks && jupyter notebook train_model.ipynb
```

---

## 🤖 Machine Learning Pipeline

**Models evaluated:**
- Logistic Regression (baseline)
- Random Forest
- XGBoost (best performer)
- LightGBM

**Metrics:** AUC-ROC, Precision, Recall, F1-Score

## 📈 Results

| Model | AUC-ROC |
|-------|---------|
| Logistic Regression | 0.749 |
| Random Forest | 0.766 |
| **XGBoost** | **0.767** |
| LightGBM | 0.766 |

**Top predictive features:**
1. `max_delay_ever` - Maximum payment delay (months)
2. `total_serious_delays` - Count of 2+ month delays
3. `avg_repay_status` - Average repayment status
4. `avg_payment` - Average monthly payment amount
5. `avg_utilization` - Average credit utilization ratio

## 📤 Output

After running the notebook, predictions are saved to `data/predictions.csv`:

| Column | Description |
|--------|-------------|
| `customer_id` | Unique customer identifier |
| `actual_default` | True label (0 or 1) |
| `predicted_default` | Model prediction (0 or 1) |
| `default_probability` | Probability of default (0-1) |

---

## 💼 Skills Demonstrated

- **SQL**: Complex queries with CTEs, multi-table joins, aggregations
- **Feature Engineering**: Domain-specific credit risk indicators
- **Machine Learning**: Model comparison, handling imbalanced data
- **Python**: pandas, scikit-learn, XGBoost, LightGBM
- **Data Pipeline**: End-to-end from raw data to predictions

## 🛠️ Troubleshooting

### XGBoost Error: `libomp.dylib not found`
```bash
brew install libomp
brew link --force libomp
```

### `externally-managed-environment` Error
Use a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate
```

### `no such table: training_data`
Re-run `python populate_tables.py` in the `sql/` directory - it creates the view automatically.

---

## 📚 Citation

Dataset: Yeh, I. (2009). Default of Credit Card Clients [Dataset]. UCI Machine Learning Repository. https://doi.org/10.24432/C55S3H

## 📝 License

MIT License - Free to use for portfolio and learning purposes
