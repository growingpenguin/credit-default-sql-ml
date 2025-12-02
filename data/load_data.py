"""
Load UCI Credit Card Default dataset and save to CSV
"""
from ucimlrepo import fetch_ucirepo
import pandas as pd
import os

def load_uci_data():
    """Fetch UCI dataset and save locally"""
    print("Fetching UCI Credit Card Default dataset...")
    
    # Fetch dataset (ID=350)
    dataset = fetch_ucirepo(id=350)
    
    # Extract features and targets
    X = dataset.data.features
    y = dataset.data.targets
    
    # Combine into single dataframe
    df = pd.concat([X, y], axis=1)
    
    # Map generic column names to expected names
    # UCI sometimes returns X1, X2, etc. instead of original names
    if 'X1' in df.columns:
        column_mapping = {
            'X1': 'LIMIT_BAL',
            'X2': 'SEX',
            'X3': 'EDUCATION',
            'X4': 'MARRIAGE',
            'X5': 'AGE',
            'X6': 'PAY_0',
            'X7': 'PAY_2',
            'X8': 'PAY_3',
            'X9': 'PAY_4',
            'X10': 'PAY_5',
            'X11': 'PAY_6',
            'X12': 'BILL_AMT1',
            'X13': 'BILL_AMT2',
            'X14': 'BILL_AMT3',
            'X15': 'BILL_AMT4',
            'X16': 'BILL_AMT5',
            'X17': 'BILL_AMT6',
            'X18': 'PAY_AMT1',
            'X19': 'PAY_AMT2',
            'X20': 'PAY_AMT3',
            'X21': 'PAY_AMT4',
            'X22': 'PAY_AMT5',
            'X23': 'PAY_AMT6',
            'Y': 'default.payment.next.month'
        }
        df.rename(columns=column_mapping, inplace=True)
    
    # Add customer_id (original dataset has ID but we'll create sequential)
    df.insert(0, 'customer_id', range(1, len(df) + 1))
    
    # Save to CSV
    os.makedirs('../data', exist_ok=True)
    df.to_csv('../data/credit_default_raw.csv', index=False)
    
    print(f"✓ Dataset saved: {df.shape[0]} rows, {df.shape[1]} columns")
    print(f"✓ Default rate: {df['default.payment.next.month'].values.mean():.2%}")
    
    return df

if __name__ == "__main__":
    df = load_uci_data()
    print("\nColumn names:")
    print(df.columns.tolist())
