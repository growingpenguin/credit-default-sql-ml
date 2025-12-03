# 💳 Credit Card Default Risk Prediction (SQL → ML → Deep Learning)

A complete **SQL-first** data science project demonstrating feature engineering, traditional ML, and **SOTA deep learning models** for credit risk assessment using the **UCI Credit Card Default dataset**.

## 🎯 Project Objective

Predict which credit card customers will default on their next payment using:
- **SQL** for feature engineering from normalized banking tables
- **Traditional ML**: Logistic Regression, Random Forest, XGBoost, LightGBM
- **Deep Learning**: FT-Transformer, LSTM, SAINT, Temporal Fusion Transformer

## 📊 Dataset

**UCI Default of Credit Card Clients Dataset** (30,000 customers)
- 6 months of payment history, bill statements, and payment amounts
- Demographics: age, sex, education, marital status
- Target: Binary default indicator (default rate ~22%)

## 🗂️ Project Structure

```
credit-default-sql-ml/
├── data/
│   ├── load_data.py                    # Downloads UCI dataset
│   ├── credit_default_raw.csv          # Raw data (generated)
│   ├── credit_default.db               # SQLite database (generated)
│   └── *_predictions.csv               # Model predictions (generated)
├── sql/
│   ├── schema.sql                      # Database schema (6 tables)
│   ├── populate_tables.py              # Populates tables from CSV
│   └── feature_engineering.sql         # SQL feature engineering queries
├── notebooks/
│   ├── train_model.ipynb               # Traditional ML notebook
│   ├── train_ft_transformer_credit_default.py   # FT-Transformer
│   ├── train_lstm_credit_default.py    # LSTM with temporal features
│   ├── train_saint_credit_default.py   # SAINT Transformer
│   └── train_tft_credit_default.py     # Temporal Fusion Transformer
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
- PyTorch (for deep learning models)

### Step 1: Clone the Repository

```bash
git clone https://github.com/growingpenguin/credit-default-sql-ml.git
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

### Step 6: Create Database & Populate Tables

```bash
cd ../sql
python populate_tables.py
```

### Step 7: Run Models

**Traditional ML (Jupyter Notebook):**
```bash
cd ../notebooks
jupyter notebook train_model.ipynb
```

**Deep Learning Models:**
```bash
cd notebooks
python train_ft_transformer_credit_default.py
python train_lstm_credit_default.py
python train_saint_credit_default.py
python train_tft_credit_default.py
```

---

## 🏃 One-Liner Setup (after cloning)

```bash
python3 -m venv venv && source venv/bin/activate && \
pip install -r requirements.txt && \
brew install libomp && brew link --force libomp && \
cd data && python load_data.py && \
cd ../sql && python populate_tables.py && \
cd ../notebooks && jupyter notebook train_model.ipynb
```

---

## 🤖 Models

### Traditional ML
- Logistic Regression (baseline)
- Random Forest
- XGBoost
- LightGBM

### Deep Learning (PyTorch)
- **FT-Transformer**: Feature Tokenizer + Transformer for tabular data
- **LSTM**: Bidirectional LSTM treating 6-month payment history as sequences
- **SAINT**: Self-Attention and Intersample Attention Transformer
- **TFT**: Temporal Fusion Transformer with Variable Selection Network

---

## 📈 Results

### Model Comparison (AUC-ROC)

| Rank | Model | AUC-ROC | Type |
|------|-------|---------|------|
| 🥇 | **Temporal Fusion Transformer** | **0.7745** | Deep Learning |
| 🥈 | **LSTM** | **0.7740** | Deep Learning |
| 🥉 | XGBoost | 0.7665 | Traditional ML |
| 4 | LightGBM | 0.7664 | Traditional ML |
| 5 | Random Forest | 0.7663 | Traditional ML |
| 6 | FT-Transformer | 0.7647 | Deep Learning |
| 7 | SAINT | 0.7632 | Deep Learning |
| 8 | Logistic Regression | 0.7494 | Traditional ML |

### Key Insights

🏆 **Temporal models (TFT & LSTM) outperform traditional ML** by leveraging the sequential nature of 6-month payment history instead of aggregating into summary statistics.

### Feature Importance (TFT Variable Selection Network)

| Feature | Importance |
|---------|------------|
| credit_limit | 64.0% |
| education | 23.7% |
| age | 5.8% |
| marriage | 4.6% |
| sex | 2.0% |

### Top Predictive Features (XGBoost)

1. `max_delay_ever` - Maximum payment delay (months)
2. `total_serious_delays` - Count of 2+ month delays
3. `avg_repay_status` - Average repayment status
4. `avg_payment` - Average monthly payment amount
5. `avg_utilization` - Average credit utilization ratio

---

## 📤 Output

After running models, predictions are saved to `data/`:

| File | Model |
|------|-------|
| `predictions.csv` | XGBoost |
| `ft_transformer_predictions.csv` | FT-Transformer |
| `lstm_predictions.csv` | LSTM |
| `saint_predictions.csv` | SAINT |
| `tft_predictions.csv` | TFT |

Each file contains:
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
- **Traditional ML**: XGBoost, LightGBM, Random Forest, model comparison
- **Deep Learning**: PyTorch, Transformers, LSTM, attention mechanisms
- **Data Pipeline**: End-to-end from raw data to predictions

---

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
Re-run `python populate_tables.py` in the `sql/` directory.

### PyTorch MPS Error (Apple Silicon)
The scripts automatically use MPS (Apple GPU) when available. If issues occur, models fall back to CPU.

---

## 📚 Citation

Dataset: Yeh, I. (2009). Default of Credit Card Clients [Dataset]. UCI Machine Learning Repository. https://doi.org/10.24432/C55S3H

## 📝 License

MIT License - Free to use for portfolio and learning purposes
