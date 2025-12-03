#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Temporal Fusion Transformer (TFT) for Credit Card Default Prediction
Handles both static features and temporal sequences with interpretable attention
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

torch.manual_seed(42)
np.random.seed(42)


class CreditTemporalDataset(Dataset):
    """Dataset with static and temporal features"""
    
    def __init__(self, static_features, temporal_features, labels):
        self.static = torch.FloatTensor(static_features)
        self.temporal = torch.FloatTensor(temporal_features)
        self.labels = torch.FloatTensor(labels)
    
    def __len__(self):
        return len(self.labels)
    
    def __getitem__(self, idx):
        return self.static[idx], self.temporal[idx], self.labels[idx]


class GatedLinearUnit(nn.Module):
    """GLU activation for feature selection"""
    
    def __init__(self, input_dim, output_dim):
        super().__init__()
        self.fc1 = nn.Linear(input_dim, output_dim)
        self.fc2 = nn.Linear(input_dim, output_dim)
        self.sigmoid = nn.Sigmoid()
    
    def forward(self, x):
        return self.fc1(x) * self.sigmoid(self.fc2(x))


class GatedResidualNetwork(nn.Module):
    """GRN: Core building block of TFT"""
    
    def __init__(self, input_dim, hidden_dim, output_dim, dropout=0.1, context_dim=None):
        super().__init__()
        
        self.input_dim = input_dim
        self.output_dim = output_dim
        
        # Primary path
        self.fc1 = nn.Linear(input_dim, hidden_dim)
        self.elu = nn.ELU()
        self.fc2 = nn.Linear(hidden_dim, output_dim)
        self.dropout = nn.Dropout(dropout)
        
        # Context (optional)
        self.context_dim = context_dim
        if context_dim is not None:
            self.context_fc = nn.Linear(context_dim, hidden_dim, bias=False)
        
        # GLU for gating
        self.glu = GatedLinearUnit(output_dim, output_dim)
        
        # Layer norm
        self.layer_norm = nn.LayerNorm(output_dim)
        
        # Skip connection projection if dimensions differ
        if input_dim != output_dim:
            self.skip_proj = nn.Linear(input_dim, output_dim)
        else:
            self.skip_proj = None
    
    def forward(self, x, context=None):
        # Primary transformation
        hidden = self.fc1(x)
        
        # Add context if provided
        if context is not None and self.context_dim is not None:
            hidden = hidden + self.context_fc(context)
        
        hidden = self.elu(hidden)
        hidden = self.fc2(hidden)
        hidden = self.dropout(hidden)
        
        # GLU gating
        gated = self.glu(hidden)
        
        # Skip connection
        if self.skip_proj is not None:
            skip = self.skip_proj(x)
        else:
            skip = x
        
        # Residual + LayerNorm
        return self.layer_norm(skip + gated)


class VariableSelectionNetwork(nn.Module):
    """VSN: Selects relevant features"""
    
    def __init__(self, input_dim, num_features, hidden_dim, dropout=0.1, context_dim=None):
        super().__init__()
        
        self.num_features = num_features
        self.hidden_dim = hidden_dim
        
        # GRN for each feature
        self.feature_grns = nn.ModuleList([
            GatedResidualNetwork(input_dim, hidden_dim, hidden_dim, dropout, context_dim)
            for _ in range(num_features)
        ])
        
        # Softmax weights for feature selection
        self.softmax_fc = nn.Linear(num_features * hidden_dim, num_features)
        self.softmax = nn.Softmax(dim=-1)
    
    def forward(self, x, context=None):
        # x: (batch, num_features, input_dim)
        batch_size = x.shape[0]
        
        # Process each feature through its GRN
        processed = []
        for i in range(self.num_features):
            feat = x[:, i, :]  # (batch, input_dim)
            processed.append(self.feature_grns[i](feat, context))
        
        processed = torch.stack(processed, dim=1)  # (batch, num_features, hidden_dim)
        
        # Calculate feature weights
        flat = processed.reshape(batch_size, -1)  # (batch, num_features * hidden_dim)
        weights = self.softmax(self.softmax_fc(flat))  # (batch, num_features)
        
        # Weighted sum
        weights = weights.unsqueeze(-1)  # (batch, num_features, 1)
        selected = (processed * weights).sum(dim=1)  # (batch, hidden_dim)
        
        return selected, weights.squeeze(-1)


class TemporalFusionTransformer(nn.Module):
    """Simplified TFT for credit default prediction"""
    
    def __init__(self, static_dim, temporal_dim, num_timesteps=6, hidden_dim=64, n_heads=4, dropout=0.1):
        super().__init__()
        
        self.hidden_dim = hidden_dim
        self.num_timesteps = num_timesteps
        
        # Static variable selection
        self.static_vsn = VariableSelectionNetwork(
            input_dim=1, 
            num_features=static_dim,
            hidden_dim=hidden_dim,
            dropout=dropout
        )
        
        # Static context encoders
        self.static_context_grn = GatedResidualNetwork(hidden_dim, hidden_dim, hidden_dim, dropout)
        
        # Temporal embedding
        self.temporal_embed = nn.Linear(temporal_dim, hidden_dim)
        
        # LSTM encoder for temporal processing
        self.lstm_encoder = nn.LSTM(
            input_size=hidden_dim,
            hidden_size=hidden_dim,
            num_layers=1,
            batch_first=True,
            dropout=0
        )
        
        # Self-attention for temporal patterns
        self.temporal_attention = nn.MultiheadAttention(
            embed_dim=hidden_dim,
            num_heads=n_heads,
            dropout=dropout,
            batch_first=True
        )
        self.attention_norm = nn.LayerNorm(hidden_dim)
        
        # Gated skip connection
        self.temporal_glu = GatedLinearUnit(hidden_dim, hidden_dim)
        self.temporal_norm = nn.LayerNorm(hidden_dim)
        
        # Final GRN for combining static and temporal
        self.combine_grn = GatedResidualNetwork(
            hidden_dim * 2, hidden_dim, hidden_dim, dropout
        )
        
        # Classification head
        self.classifier = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim // 2, 1),
            nn.Sigmoid()
        )
    
    def forward(self, static_features, temporal_features):
        batch_size = static_features.shape[0]
        
        # Process static features
        static_expanded = static_features.unsqueeze(-1)  # (batch, static_dim, 1)
        static_encoded, static_weights = self.static_vsn(static_expanded)
        static_context = self.static_context_grn(static_encoded)
        
        # Process temporal features
        temporal_embedded = self.temporal_embed(temporal_features)  # (batch, timesteps, hidden)
        
        # LSTM encoding
        lstm_out, (hidden, cell) = self.lstm_encoder(temporal_embedded)
        
        # Self-attention on temporal sequence
        attn_out, attn_weights = self.temporal_attention(lstm_out, lstm_out, lstm_out)
        temporal_attended = self.attention_norm(lstm_out + attn_out)
        
        # Gated skip connection
        temporal_gated = self.temporal_glu(temporal_attended)
        temporal_out = self.temporal_norm(temporal_embedded + temporal_gated)
        
        # Take last timestep
        temporal_final = temporal_out[:, -1, :]  # (batch, hidden)
        
        # Combine static and temporal
        combined = torch.cat([static_context, temporal_final], dim=-1)
        fused = self.combine_grn(combined)
        
        # Classify
        output = self.classifier(fused)
        
        return output.squeeze(), static_weights, attn_weights


def load_data_from_db():
    """Load data from SQLite database with proper schema"""
    conn = sqlite3.connect('../data/credit_default.db')
    
    # Load static features
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
    
    # Load and pivot payment status
    pay_status_df = pd.read_sql_query(
        "SELECT account_id, status_month, repayment_status FROM payment_status ORDER BY account_id, status_month",
        conn
    )
    pay_pivot = pay_status_df.pivot(index='account_id', columns='status_month', values='repayment_status').reset_index()
    pay_pivot.columns = ['account_id'] + [f'pay_status_{i}' for i in range(6)]
    
    # Load and pivot bills
    bills_df = pd.read_sql_query(
        "SELECT account_id, statement_month, bill_amount FROM statements ORDER BY account_id, statement_month",
        conn
    )
    bills_pivot = bills_df.pivot(index='account_id', columns='statement_month', values='bill_amount').reset_index()
    bills_pivot.columns = ['account_id'] + [f'bill_amt_{i}' for i in range(1, 7)]
    
    # Load and pivot payments
    payments_df = pd.read_sql_query(
        "SELECT account_id, payment_month, payment_amount FROM payments ORDER BY account_id, payment_month",
        conn
    )
    payments_pivot = payments_df.pivot(index='account_id', columns='payment_month', values='payment_amount').reset_index()
    payments_pivot.columns = ['account_id'] + [f'pay_amt_{i}' for i in range(1, 7)]
    
    conn.close()
    
    # Merge all
    df = static_df.merge(pay_pivot, left_on='customer_id', right_on='account_id')
    df = df.merge(bills_pivot, on='account_id')
    df = df.merge(payments_pivot, on='account_id')
    
    return df


def prepare_features(df):
    """Prepare static and temporal features for TFT"""
    
    customer_ids = df['customer_id'].values
    
    # Static features
    static_cols = ['age', 'sex', 'education', 'marriage', 'credit_limit']
    static_features = df[static_cols].values
    
    # Temporal features: (samples, timesteps=6, features=3)
    pay_cols = [f'pay_status_{i}' for i in range(6)]
    bill_cols = [f'bill_amt_{i}' for i in range(1, 7)]
    pay_amt_cols = [f'pay_amt_{i}' for i in range(1, 7)]
    
    temporal_features = np.zeros((len(df), 6, 3))
    for t in range(6):
        temporal_features[:, t, 0] = df[pay_cols[t]].values
        temporal_features[:, t, 1] = df[bill_cols[t]].values
        temporal_features[:, t, 2] = df[pay_amt_cols[t]].values
    
    labels = df['default_label'].values
    
    return customer_ids, static_features, temporal_features, labels, static_cols


def train_epoch(model, dataloader, criterion, optimizer, device):
    """Train for one epoch"""
    model.train()
    total_loss = 0
    predictions, actuals = [], []
    
    for static, temporal, labels in dataloader:
        static, temporal, labels = static.to(device), temporal.to(device), labels.to(device)
        
        optimizer.zero_grad()
        outputs, _, _ = model(static, temporal)
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
    all_static_weights, all_attn_weights = [], []
    
    with torch.no_grad():
        for static, temporal, labels in dataloader:
            static, temporal, labels = static.to(device), temporal.to(device), labels.to(device)
            outputs, static_weights, attn_weights = model(static, temporal)
            loss = criterion(outputs, labels)
            
            total_loss += loss.item()
            predictions.extend(outputs.cpu().numpy())
            actuals.extend(labels.cpu().numpy())
            all_static_weights.append(static_weights.cpu().numpy())
            all_attn_weights.append(attn_weights.cpu().numpy())
    
    auc = roc_auc_score(actuals, predictions)
    static_weights_avg = np.concatenate(all_static_weights, axis=0).mean(axis=0)
    
    return total_loss / len(dataloader), auc, predictions, actuals, static_weights_avg


def main():
    # Configuration
    DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'mps' if torch.backends.mps.is_available() else 'cpu')
    BATCH_SIZE = 256
    EPOCHS = 100
    LEARNING_RATE = 0.001
    PATIENCE = 15
    
    print("=" * 60)
    print("DEEP LEARNING MODEL: Temporal Fusion Transformer (TFT)")
    print("=" * 60)
    print(f"Device: {DEVICE}")
    
    # Load data
    print("\nLoading data from database...")
    df = load_data_from_db()
    print(f"Dataset shape: {df.shape}")
    print(f"Default rate: {df['default_label'].mean():.2%}")
    
    # Prepare features
    print("\nPreparing features...")
    customer_ids, static_features, temporal_features, labels, static_cols = prepare_features(df)
    
    print(f"Static features shape: {static_features.shape}")
    print(f"Temporal features shape: {temporal_features.shape}")
    
    # Normalize
    static_scaler = StandardScaler()
    static_features = static_scaler.fit_transform(static_features)
    
    temporal_shape = temporal_features.shape
    temporal_flat = temporal_features.reshape(-1, temporal_shape[-1])
    temporal_scaler = StandardScaler()
    temporal_flat = temporal_scaler.fit_transform(temporal_flat)
    temporal_features = temporal_flat.reshape(temporal_shape)
    
    # Split data
    indices = np.arange(len(labels))
    idx_temp, idx_test = train_test_split(indices, test_size=0.2, random_state=42, stratify=labels)
    y_temp = labels[idx_temp]
    idx_train, idx_val = train_test_split(idx_temp, test_size=0.25, random_state=42, stratify=y_temp)
    
    X_static_train, X_static_val, X_static_test = static_features[idx_train], static_features[idx_val], static_features[idx_test]
    X_temp_train, X_temp_val, X_temp_test = temporal_features[idx_train], temporal_features[idx_val], temporal_features[idx_test]
    y_train, y_val, y_test = labels[idx_train], labels[idx_val], labels[idx_test]
    customer_ids_test = customer_ids[idx_test]
    
    print(f"\nTrain set: {len(y_train)} samples")
    print(f"Validation set: {len(y_val)} samples")
    print(f"Test set: {len(y_test)} samples")
    
    # Create dataloaders
    train_dataset = CreditTemporalDataset(X_static_train, X_temp_train, y_train)
    val_dataset = CreditTemporalDataset(X_static_val, X_temp_val, y_val)
    test_dataset = CreditTemporalDataset(X_static_test, X_temp_test, y_test)
    
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE)
    test_loader = DataLoader(test_dataset, batch_size=BATCH_SIZE)
    
    # Initialize model
    model = TemporalFusionTransformer(
        static_dim=static_features.shape[1],
        temporal_dim=temporal_features.shape[2],
        num_timesteps=6,
        hidden_dim=64,
        n_heads=4,
        dropout=0.2
    ).to(DEVICE)
    
    print(f"\nModel parameters: {sum(p.numel() for p in model.parameters()):,}")
    
    criterion = nn.BCELoss()
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE, weight_decay=1e-5)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='max', factor=0.5, patience=5)
    
    # Training loop
    best_val_auc = 0
    patience_counter = 0
    train_losses, val_losses = [], []
    train_aucs, val_aucs = [], []
    
    print("\nTraining...")
    for epoch in range(EPOCHS):
        train_loss, train_auc = train_epoch(model, train_loader, criterion, optimizer, DEVICE)
        val_loss, val_auc, _, _, _ = evaluate(model, val_loader, criterion, DEVICE)
        
        train_losses.append(train_loss)
        val_losses.append(val_loss)
        train_aucs.append(train_auc)
        val_aucs.append(val_auc)
        
        scheduler.step(val_auc)
        
        if val_auc > best_val_auc:
            best_val_auc = val_auc
            torch.save(model.state_dict(), 'best_tft_model.pt')
            patience_counter = 0
        else:
            patience_counter += 1
        
        if (epoch + 1) % 10 == 0:
            print(f"Epoch {epoch+1}/{EPOCHS} - Train Loss: {train_loss:.4f}, Train AUC: {train_auc:.4f}, "
                  f"Val Loss: {val_loss:.4f}, Val AUC: {val_auc:.4f}")
        
        if patience_counter >= PATIENCE:
            print(f"\nEarly stopping at epoch {epoch+1}")
            break
    
    # Evaluate
    model.load_state_dict(torch.load('best_tft_model.pt', weights_only=True))
    test_loss, test_auc, test_preds, test_actuals, static_weights = evaluate(model, test_loader, criterion, DEVICE)
    test_preds_binary = (np.array(test_preds) > 0.5).astype(int)
    
    print("\n" + "="*60)
    print("FINAL RESULTS - Temporal Fusion Transformer")
    print("="*60)
    print(f"\nAUC-ROC: {test_auc:.4f}")
    print(f"\nClassification Report:")
    print(classification_report(test_actuals, test_preds_binary))
    
    # Feature importance from static weights
    print(f"\nStatic Feature Importance (from Variable Selection Network):")
    importance_df = pd.DataFrame({
        'feature': static_cols,
        'importance': static_weights
    }).sort_values('importance', ascending=False)
    print(importance_df.to_string(index=False))
    
    # Visualizations
    fig, axes = plt.subplots(2, 2, figsize=(14, 10))
    
    # Training curves
    axes[0, 0].plot(train_losses, label='Train', linewidth=2)
    axes[0, 0].plot(val_losses, label='Validation', linewidth=2)
    axes[0, 0].set_xlabel('Epoch')
    axes[0, 0].set_ylabel('Loss')
    axes[0, 0].set_title('Training and Validation Loss')
    axes[0, 0].legend()
    axes[0, 0].grid(alpha=0.3)
    
    axes[0, 1].plot(train_aucs, label='Train', linewidth=2)
    axes[0, 1].plot(val_aucs, label='Validation', linewidth=2)
    axes[0, 1].set_xlabel('Epoch')
    axes[0, 1].set_ylabel('AUC-ROC')
    axes[0, 1].set_title('Training and Validation AUC')
    axes[0, 1].legend()
    axes[0, 1].grid(alpha=0.3)
    
    # ROC Curve
    fpr, tpr, _ = roc_curve(test_actuals, test_preds)
    axes[1, 0].plot(fpr, tpr, linewidth=2, label=f'TFT (AUC={test_auc:.3f})')
    axes[1, 0].plot([0, 1], [0, 1], 'k--', label='Random')
    axes[1, 0].set_xlabel('False Positive Rate')
    axes[1, 0].set_ylabel('True Positive Rate')
    axes[1, 0].set_title('ROC Curve - TFT')
    axes[1, 0].legend()
    axes[1, 0].grid(alpha=0.3)
    
    # Feature importance
    axes[1, 1].barh(importance_df['feature'], importance_df['importance'])
    axes[1, 1].set_xlabel('Importance')
    axes[1, 1].set_title('Static Feature Importance (VSN Weights)')
    
    plt.tight_layout()
    plt.savefig('tft_results.png', dpi=300, bbox_inches='tight')
    plt.show()
    print("\n✅ Results saved to tft_results.png")
    
    # Confusion Matrix
    cm = confusion_matrix(test_actuals, test_preds_binary)
    plt.figure(figsize=(6, 5))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', cbar=True)
    plt.xlabel('Predicted')
    plt.ylabel('Actual')
    plt.title('Confusion Matrix - TFT')
    plt.tight_layout()
    plt.savefig('tft_confusion_matrix.png', dpi=300, bbox_inches='tight')
    plt.show()
    print("✅ Confusion matrix saved")
    
    # Save predictions
    results = pd.DataFrame({
        'customer_id': customer_ids_test,
        'actual_default': test_actuals,
        'predicted_default': test_preds_binary,
        'default_probability': test_preds
    })
    results.to_csv('../data/tft_predictions.csv', index=False)
    print("✅ Predictions saved to data/tft_predictions.csv")


if __name__ == '__main__':
    main()

