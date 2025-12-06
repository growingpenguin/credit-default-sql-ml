#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
LSTM Model for Credit Card Default Prediction
Treats 6-month payment history as sequences + static features
"""

import pandas as pd
import numpy as np
import sqlite3
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    roc_auc_score, 
    classification_report, 
    confusion_matrix,
    roc_curve
)
import matplotlib.pyplot as plt
import seaborn as sns
import warnings
warnings.filterwarnings('ignore')

# Set random seeds
torch.manual_seed(42)
np.random.seed(42)


class CreditDataset(Dataset):
    """Dataset for credit default with temporal sequences"""
    
    def __init__(self, static_features, temporal_features, labels):
        self.static_features = torch.FloatTensor(static_features)
        self.temporal_features = torch.FloatTensor(temporal_features)
        self.labels = torch.FloatTensor(labels)
    
    def __len__(self):
        return len(self.labels)
    
    def __getitem__(self, idx):
        return self.static_features[idx], self.temporal_features[idx], self.labels[idx]


class LSTMCreditModel(nn.Module):
    """LSTM model with static and temporal features"""
    
    def __init__(self, static_dim, temporal_dim, hidden_dim=128, num_layers=2, dropout=0.3):
        super(LSTMCreditModel, self).__init__()
        
        # LSTM for temporal features
        self.lstm = nn.LSTM(
            input_size=temporal_dim,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0,
            bidirectional=True
        )
        
        # Static feature processor
        self.static_fc = nn.Sequential(
            nn.Linear(static_dim, 64),
            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.Dropout(dropout)
        )
        
        # Combined feature processor
        combined_dim = hidden_dim * 2 + 64  # bidirectional + static
        self.classifier = nn.Sequential(
            nn.Linear(combined_dim, 128),
            nn.BatchNorm1d(128),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(128, 64),
            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(64, 1),
            nn.Sigmoid()
        )
    
    def forward(self, static_features, temporal_features):
        # Process temporal features through LSTM
        lstm_out, (hidden, _) = self.lstm(temporal_features)
        # Concatenate last hidden states from both directions
        lstm_features = torch.cat([hidden[-2], hidden[-1]], dim=1)
        
        # Process static features
        static_out = self.static_fc(static_features)
        
        # Combine and classify
        combined = torch.cat([lstm_features, static_out], dim=1)
        output = self.classifier(combined)
        
        return output.squeeze()


def load_data_from_db():
    """Load data from SQLite database with proper schema"""
    conn = sqlite3.connect('../data/credit_default.db')
    
    # Load static features from customers and credit_accounts
    static_query = """
    SELECT 
        c.customer_id,
        c.age, c.sex, c.education, c.marriage,
        ca.credit_limit,
        l.defaulted as default_label
    FROM customers c
    JOIN credit_accounts ca ON c.customer_id = ca.customer_id
    JOIN labels l ON c.customer_id = l.customer_id
    """
    static_df = pd.read_sql_query(static_query, conn)
    
    # Load payment status (temporal) - pivot from rows to columns
    pay_status_query = """
    SELECT account_id, status_month, repayment_status
    FROM payment_status
    ORDER BY account_id, status_month
    """
    pay_status_df = pd.read_sql_query(pay_status_query, conn)
    pay_status_pivot = pay_status_df.pivot(
        index='account_id', 
        columns='status_month', 
        values='repayment_status'
    ).reset_index()
    pay_status_pivot.columns = ['account_id'] + [f'pay_status_{i}' for i in range(6)]
    
    # Load bill amounts (temporal)
    bills_query = """
    SELECT account_id, statement_month, bill_amount
    FROM statements
    ORDER BY account_id, statement_month
    """
    bills_df = pd.read_sql_query(bills_query, conn)
    bills_pivot = bills_df.pivot(
        index='account_id', 
        columns='statement_month', 
        values='bill_amount'
    ).reset_index()
    bills_pivot.columns = ['account_id'] + [f'bill_amt_{i}' for i in range(1, 7)]
    
    # Load payment amounts (temporal)
    payments_query = """
    SELECT account_id, payment_month, payment_amount
    FROM payments
    ORDER BY account_id, payment_month
    """
    payments_df = pd.read_sql_query(payments_query, conn)
    payments_pivot = payments_df.pivot(
        index='account_id', 
        columns='payment_month', 
        values='payment_amount'
    ).reset_index()
    payments_pivot.columns = ['account_id'] + [f'pay_amt_{i}' for i in range(1, 7)]
    
    conn.close()
    
    # Merge all data (account_id = customer_id in this dataset)
    df = static_df.merge(pay_status_pivot, left_on='customer_id', right_on='account_id')
    df = df.merge(bills_pivot, on='account_id')
    df = df.merge(payments_pivot, on='account_id')
    
    return df


def prepare_features(df):
    """Prepare static and temporal features"""
    
    # Store customer IDs
    customer_ids = df['customer_id'].values
    
    # Static features
    static_cols = ['age', 'sex', 'education', 'marriage', 'credit_limit']
    static_features = df[static_cols].values
    
    # Temporal features: 6 timesteps, 3 features per timestep
    # [repayment_status, bill_amount, payment_amount]
    pay_status_cols = [f'pay_status_{i}' for i in range(6)]
    bill_cols = [f'bill_amt_{i}' for i in range(1, 7)]
    pay_amt_cols = [f'pay_amt_{i}' for i in range(1, 7)]
    
    # Reshape to (samples, timesteps=6, features=3)
    temporal_features = np.zeros((len(df), 6, 3))
    for t in range(6):
        temporal_features[:, t, 0] = df[pay_status_cols[t]].values
        temporal_features[:, t, 1] = df[bill_cols[t]].values
        temporal_features[:, t, 2] = df[pay_amt_cols[t]].values
    
    labels = df['default_label'].values
    
    return customer_ids, static_features, temporal_features, labels


def train_epoch(model, dataloader, criterion, optimizer, device):
    """Train for one epoch"""
    model.train()
    total_loss = 0
    predictions, actuals = [], []
    
    for static, temporal, labels in dataloader:
        static, temporal, labels = static.to(device), temporal.to(device), labels.to(device)
        
        optimizer.zero_grad()
        outputs = model(static, temporal)
        loss = criterion(outputs, labels)
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        optimizer.step()
        
        total_loss += loss.item()
        predictions.extend(outputs.detach().cpu().numpy())
        actuals.extend(labels.cpu().numpy())
    
    auc = roc_auc_score(actuals, predictions)
    return total_loss / len(dataloader), auc


def evaluate(model, dataloader, criterion, device):
    """Evaluate model"""
    model.eval()
    total_loss = 0
    predictions, actuals = [], []
    
    with torch.no_grad():
        for static, temporal, labels in dataloader:
            static, temporal, labels = static.to(device), temporal.to(device), labels.to(device)
            outputs = model(static, temporal)
            loss = criterion(outputs, labels)
            
            total_loss += loss.item()
            predictions.extend(outputs.cpu().numpy())
            actuals.extend(labels.cpu().numpy())
    
    auc = roc_auc_score(actuals, predictions)
    return total_loss / len(dataloader), auc, predictions, actuals


def main():
    # Configuration
    DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'mps' if torch.backends.mps.is_available() else 'cpu')
    BATCH_SIZE = 256
    EPOCHS = 100
    LEARNING_RATE = 0.001
    PATIENCE = 15
    
    print("=" * 60)
    print("DEEP LEARNING MODEL: LSTM with Temporal Features")
    print("=" * 60)
    print(f"Device: {DEVICE}")
    
    # Load data from database
    print("\nLoading data from database...")
    df = load_data_from_db()
    print(f"Dataset shape: {df.shape}")
    print(f"Default rate: {df['default_label'].mean():.2%}")
    
    # Prepare features
    print("\nPreparing features...")
    customer_ids, static_features, temporal_features, labels = prepare_features(df)
    
    print(f"Static features shape: {static_features.shape}")
    print(f"Temporal features shape: {temporal_features.shape}")
    print(f"Class distribution:\n{pd.Series(labels).value_counts()}")
    
    # Normalize features
    static_scaler = StandardScaler()
    static_features = static_scaler.fit_transform(static_features)
    
    # Normalize temporal features (reshape, scale, reshape back)
    temporal_shape = temporal_features.shape
    temporal_flat = temporal_features.reshape(-1, temporal_shape[-1])
    temporal_scaler = StandardScaler()
    temporal_flat = temporal_scaler.fit_transform(temporal_flat)
    temporal_features = temporal_flat.reshape(temporal_shape)
    
    # Train/Val/Test split (60/20/20) with stratification
    indices = np.arange(len(labels))
    idx_temp, idx_test = train_test_split(indices, test_size=0.2, random_state=42, stratify=labels)
    y_temp = labels[idx_temp]
    idx_train, idx_val = train_test_split(idx_temp, test_size=0.25, random_state=42, stratify=y_temp)
    
    # Split data
    X_static_train, X_static_val, X_static_test = static_features[idx_train], static_features[idx_val], static_features[idx_test]
    X_temp_train, X_temp_val, X_temp_test = temporal_features[idx_train], temporal_features[idx_val], temporal_features[idx_test]
    y_train, y_val, y_test = labels[idx_train], labels[idx_val], labels[idx_test]
    customer_ids_test = customer_ids[idx_test]
    
    print(f"\nTrain set: {len(y_train)} samples")
    print(f"Validation set: {len(y_val)} samples")
    print(f"Test set: {len(y_test)} samples")
    
    # Create datasets and dataloaders
    train_dataset = CreditDataset(X_static_train, X_temp_train, y_train)
    val_dataset = CreditDataset(X_static_val, X_temp_val, y_val)
    test_dataset = CreditDataset(X_static_test, X_temp_test, y_test)
    
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE)
    test_loader = DataLoader(test_dataset, batch_size=BATCH_SIZE)
    
    # Initialize model
    model = LSTMCreditModel(
        static_dim=static_features.shape[1],
        temporal_dim=temporal_features.shape[2],
        hidden_dim=128,
        num_layers=2,
        dropout=0.3
    ).to(DEVICE)
    
    print(f"\nModel parameters: {sum(p.numel() for p in model.parameters()):,}")
    
    # Use BCELoss (model has sigmoid output)
    criterion = nn.BCELoss()
    
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE, weight_decay=1e-5)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='max', factor=0.5, patience=5)
    
    # Training loop with early stopping
    best_val_auc = 0
    patience_counter = 0
    train_losses, val_losses = [], []
    train_aucs, val_aucs = [], []
    
    print("\nTraining...")
    for epoch in range(EPOCHS):
        train_loss, train_auc = train_epoch(model, train_loader, criterion, optimizer, DEVICE)
        val_loss, val_auc, _, _ = evaluate(model, val_loader, criterion, DEVICE)
        
        train_losses.append(train_loss)
        val_losses.append(val_loss)
        train_aucs.append(train_auc)
        val_aucs.append(val_auc)
        
        scheduler.step(val_auc)
        
        if val_auc > best_val_auc:
            best_val_auc = val_auc
            torch.save(model.state_dict(), 'best_lstm_model.pt')
            patience_counter = 0
        else:
            patience_counter += 1
        
        if (epoch + 1) % 10 == 0:
            print(f"Epoch {epoch+1}/{EPOCHS} - Train Loss: {train_loss:.4f}, Train AUC: {train_auc:.4f}, "
                  f"Val Loss: {val_loss:.4f}, Val AUC: {val_auc:.4f}")
        
        if patience_counter >= PATIENCE:
            print(f"\nEarly stopping at epoch {epoch+1}")
            break
    
    # Load best model and evaluate on test set
    model.load_state_dict(torch.load('best_lstm_model.pt'))
    test_loss, test_auc, test_preds, test_actuals = evaluate(model, test_loader, criterion, DEVICE)
    
    # Convert predictions to binary
    test_preds_binary = (np.array(test_preds) > 0.5).astype(int)
    
    print("\n" + "="*60)
    print("FINAL RESULTS - LSTM")
    print("="*60)
    print(f"\nAUC-ROC: {test_auc:.4f}")
    print(f"\nClassification Report:")
    print(classification_report(test_actuals, test_preds_binary))
    
    # Visualization 1: Training Curves
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))
    
    ax1.plot(train_losses, label='Train', linewidth=2)
    ax1.plot(val_losses, label='Validation', linewidth=2)
    ax1.set_xlabel('Epoch')
    ax1.set_ylabel('Loss')
    ax1.set_title('Training and Validation Loss')
    ax1.legend()
    ax1.grid(alpha=0.3)
    
    ax2.plot(train_aucs, label='Train', linewidth=2)
    ax2.plot(val_aucs, label='Validation', linewidth=2)
    ax2.set_xlabel('Epoch')
    ax2.set_ylabel('AUC-ROC')
    ax2.set_title('Training and Validation AUC')
    ax2.legend()
    ax2.grid(alpha=0.3)
    
    plt.tight_layout()
    plt.savefig('lstm_training_curves.png', dpi=300, bbox_inches='tight')
    plt.show()
    print("\n✅ Training curves saved")
    
    # Visualization 2: ROC Curve
    fpr, tpr, _ = roc_curve(test_actuals, test_preds)
    
    plt.figure(figsize=(8, 6))
    plt.plot(fpr, tpr, linewidth=2, label=f'LSTM (AUC={test_auc:.3f})')
    plt.plot([0, 1], [0, 1], 'k--', label='Random Classifier')
    plt.xlabel('False Positive Rate')
    plt.ylabel('True Positive Rate')
    plt.title('ROC Curve - LSTM Model')
    plt.legend()
    plt.grid(alpha=0.3)
    plt.tight_layout()
    plt.savefig('lstm_roc_curve.png', dpi=300, bbox_inches='tight')
    plt.show()
    print("✅ ROC curve saved")
    
    # Visualization 3: Confusion Matrix
    cm = confusion_matrix(test_actuals, test_preds_binary)
    
    plt.figure(figsize=(6, 5))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', cbar=True)
    plt.xlabel('Predicted')
    plt.ylabel('Actual')
    plt.title('Confusion Matrix - LSTM')
    plt.tight_layout()
    plt.savefig('lstm_confusion_matrix.png', dpi=300, bbox_inches='tight')
    plt.show()
    print("✅ Confusion matrix saved")
    
    # Save predictions
    results = pd.DataFrame({
        'customer_id': customer_ids_test,
        'actual_default': test_actuals,
        'predicted_default': test_preds_binary,
        'default_probability': test_preds
    })
    
    results.to_csv('../data/lstm_predictions.csv', index=False)
    print("✅ Predictions saved to data/lstm_predictions.csv")


if __name__ == '__main__':
    main()

