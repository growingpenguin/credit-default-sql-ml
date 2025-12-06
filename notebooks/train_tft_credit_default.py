#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Temporal Fusion Transformer for Credit Card Default Prediction
Handles both static and temporal features with gating and attention
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


class CreditTFTDataset(Dataset):
    """Dataset for TFT with static and temporal features"""
    
    def __init__(self, static_features, temporal_features, labels):
        self.static_features = torch.FloatTensor(static_features)
        self.temporal_features = torch.FloatTensor(temporal_features)
        self.labels = torch.FloatTensor(labels)
    
    def __len__(self):
        return len(self.labels)
    
    def __getitem__(self, idx):
        return self.static_features[idx], self.temporal_features[idx], self.labels[idx]


class GatedResidualNetwork(nn.Module):
    """Gated Residual Network - core building block of TFT"""
    
    def __init__(self, input_dim, hidden_dim, output_dim, dropout=0.1, context_dim=None):
        super().__init__()
        
        self.input_dim = input_dim
        self.output_dim = output_dim
        self.context_dim = context_dim
        self.hidden_dim = hidden_dim
        
        self.fc1 = nn.Linear(input_dim, hidden_dim)
        self.elu = nn.ELU()
        
        if context_dim is not None:
            self.context_projection = nn.Linear(context_dim, hidden_dim, bias=False)
        
        self.fc2 = nn.Linear(hidden_dim, hidden_dim)
        self.dropout = nn.Dropout(dropout)
        
        self.gate = nn.Linear(hidden_dim, output_dim)
        self.sigmoid = nn.Sigmoid()
        
        self.fc_out = nn.Linear(hidden_dim, output_dim)
        
        if input_dim != output_dim:
            self.skip_projection = nn.Linear(input_dim, output_dim)
        else:
            self.skip_projection = None
        
        self.layer_norm = nn.LayerNorm(output_dim)
    
    def forward(self, x, context=None):
        residual = x
        
        x = self.fc1(x)
        if context is not None and self.context_dim is not None:
            x = x + self.context_projection(context)
        
        x = self.elu(x)
        x = self.fc2(x)
        x = self.dropout(x)
        
        gate = self.sigmoid(self.gate(x))
        x = self.fc_out(x)
        x = gate * x
        
        if self.skip_projection is not None:
            residual = self.skip_projection(residual)
        
        x = self.layer_norm(x + residual)
        
        return x


class TemporalFusionTransformer(nn.Module):
    """Temporal Fusion Transformer for credit default"""
    
    def __init__(self, static_dim, temporal_dim, hidden_dim=128, num_heads=4, dropout=0.1):
        super().__init__()
        
        self.static_dim = static_dim
        self.temporal_dim = temporal_dim
        self.hidden_dim = hidden_dim
        
        self.static_encoder = GatedResidualNetwork(
            input_dim=static_dim,
            hidden_dim=hidden_dim,
            output_dim=hidden_dim,
            dropout=dropout
        )
        
        self.temporal_encoder = nn.LSTM(
            input_size=temporal_dim,
            hidden_size=hidden_dim,
            num_layers=1,
            batch_first=True,
            dropout=0
        )
        
        self.temporal_variable_selection = GatedResidualNetwork(
            input_dim=hidden_dim,
            hidden_dim=hidden_dim,
            output_dim=hidden_dim,
            dropout=dropout,
            context_dim=hidden_dim
        )
        
        self.attention = nn.MultiheadAttention(
            embed_dim=hidden_dim,
            num_heads=num_heads,
            dropout=dropout,
            batch_first=True
        )
        
        self.post_attention_grn = GatedResidualNetwork(
            input_dim=hidden_dim,
            hidden_dim=hidden_dim,
            output_dim=hidden_dim,
            dropout=dropout
        )
        
        self.output_layer = nn.Sequential(
            GatedResidualNetwork(
                input_dim=hidden_dim,
                hidden_dim=hidden_dim,
                output_dim=hidden_dim // 2,
                dropout=dropout
            ),
            nn.Linear(hidden_dim // 2, 1),
            nn.Sigmoid()
        )
    
    def forward(self, static_features, temporal_features):
        batch_size = static_features.shape[0]
        
        static_context = self.static_encoder(static_features)
        temporal_encoded, _ = self.temporal_encoder(temporal_features)
        
        temporal_selected = self.temporal_variable_selection(
            temporal_encoded.reshape(-1, self.hidden_dim),
            context=static_context.unsqueeze(1).expand(-1, temporal_encoded.shape[1], -1).reshape(-1, self.hidden_dim)
        )
        temporal_selected = temporal_selected.reshape(batch_size, -1, self.hidden_dim)
        
        attn_output, _ = self.attention(temporal_selected, temporal_selected, temporal_selected)
        enriched = self.post_attention_grn(attn_output.mean(dim=1))
        
        output = self.output_layer(enriched)
        
        return output.squeeze()


def load_data_from_db():
    """Load data from SQLite database"""
    conn = sqlite3.connect('../data/credit_default.db')
    
    query = """
    SELECT c.customer_id, c.age, c.sex, c.education, c.marriage,
           ca.credit_limit,
           ps.pay_sept, ps.pay_aug, ps.pay_jul, ps.pay_jun, ps.pay_may, ps.pay_apr,
           s.bill_sept, s.bill_aug, s.bill_jul, s.bill_jun, s.bill_may, s.bill_apr,
           p.pay_sept as pay_amt_sept, p.pay_aug as pay_amt_aug, 
           p.pay_jul as pay_amt_jul, p.pay_jun as pay_amt_jun,
           p.pay_may as pay_amt_may, p.pay_apr as pay_amt_apr,
           l.default_label
    FROM customers c
    JOIN credit_accounts ca ON c.customer_id = ca.customer_id
    JOIN payment_status ps ON c.customer_id = ps.customer_id
    JOIN statements s ON c.customer_id = s.customer_id
    JOIN payments p ON c.customer_id = p.customer_id
    JOIN labels l ON c.customer_id = l.customer_id
    """
    
    df = pd.read_sql_query(query, conn)
    conn.close()
    
    return df


def prepare_features(df):
    """Prepare static and temporal features for TFT"""
    
    customer_ids = df['customer_id'].values
    
    # Static features
    static_cols = ['age', 'sex', 'education', 'marriage', 'credit_limit']
    static_features = df[static_cols].values
    
    # Temporal features (6 timesteps)
    pay_cols = ['pay_sept', 'pay_aug', 'pay_jul', 'pay_jun', 'pay_may', 'pay_apr']
    bill_cols = ['bill_sept', 'bill_aug', 'bill_jul', 'bill_jun', 'bill_may', 'bill_apr']
    payment_cols = ['pay_amt_sept', 'pay_amt_aug', 'pay_amt_jul', 'pay_amt_jun', 'pay_amt_may', 'pay_amt_apr']
    
    temporal_features = []
    for idx in range(len(df)):
        timesteps = []
        for t in range(6):
            pay_val = df[pay_cols[t]].iloc[idx]
            bill_val = df[bill_cols[t]].iloc[idx]
            payment_val = df[payment_cols[t]].iloc[idx]
            timesteps.append([pay_val, bill_val, payment_val])
        temporal_features.append(timesteps)
    
    temporal_features = np.array(temporal_features)
    labels = df['default_label'].values
    
    return customer_ids, static_features, temporal_features, labels


def train_epoch(model, dataloader, criterion, optimizer, device):
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
    DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    BATCH_SIZE = 256
    EPOCHS = 100
    LEARNING_RATE = 0.001
    PATIENCE = 15
    
    print("=" * 60)
    print("DEEP LEARNING MODEL: Temporal Fusion Transformer")
    print("=" * 60)
    print(f"Device: {DEVICE}")
    
    print("\nLoading data from database...")
    df = load_data_from_db()
    print(f"Dataset shape: {df.shape}")
    print(f"Default rate: {df['default_label'].mean():.2%}")
    
    print("\nPreparing features...")
    customer_ids, static_features, temporal_features, labels = prepare_features(df)
    print(f"Class distribution:\n{pd.Series(labels).value_counts()}")
    
    # Normalize
    static_scaler = StandardScaler()
    static_features = static_scaler.fit_transform(static_features)
    
    temporal_scaler = StandardScaler()
    temporal_features_flat = temporal_features.reshape(-1, temporal_features.shape[-1])
    temporal_features_flat = temporal_scaler.fit_transform(temporal_features_flat)
    temporal_features = temporal_features_flat.reshape(temporal_features.shape)
    
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
    
    # Create datasets
    train_dataset = CreditTFTDataset(X_static_train, X_temp_train, y_train)
    val_dataset = CreditTFTDataset(X_static_val, X_temp_val, y_val)
    test_dataset = CreditTFTDataset(X_static_test, X_temp_test, y_test)
    
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE)
    test_loader = DataLoader(test_dataset, batch_size=BATCH_SIZE)
    
    # Initialize model
    model = TemporalFusionTransformer(
        static_dim=static_features.shape[1],
        temporal_dim=temporal_features.shape[2],
        hidden_dim=128,
        num_heads=4,
        dropout=0.1
    ).to(DEVICE)
    
    criterion = nn.BCELoss()
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE, weight_decay=1e-5)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='max', factor=0.5, patience=5)
    
    # Training
    best_val_auc = 0
    patience_counter = 0
    train_losses, val_losses, train_aucs, val_aucs = [], [], [], []
    
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
    model.load_state_dict(torch.load('best_tft_model.pt'))
    test_loss, test_auc, test_preds, test_actuals = evaluate(model, test_loader, criterion, DEVICE)
    test_preds_binary = (np.array(test_preds) > 0.5).astype(int)
    
    print("\n" + "="*60)
    print("FINAL RESULTS - Temporal Fusion Transformer")
    print("="*60)
    print(f"\nAUC-ROC: {test_auc:.4f}")
    print(f"\nClassification Report:")
    print(classification_report(test_actuals, test_preds_binary))
    
    # Visualizations
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
    plt.savefig('../notebooks/tft_training_curves.png', dpi=300, bbox_inches='tight')
    plt.show()
    print("\n✅ Training curves saved")
    
    # ROC Curve
    fpr, tpr, _ = roc_curve(test_actuals, test_preds)
    plt.figure(figsize=(8, 6))
    plt.plot(fpr, tpr, linewidth=2, label=f'TFT (AUC={test_auc:.3f})')
    plt.plot([0, 1], [0, 1], 'k--', label='Random Classifier')
    plt.xlabel('False Positive Rate')
    plt.ylabel('True Positive Rate')
    plt.title('ROC Curve - Temporal Fusion Transformer')
    plt.legend()
    plt.grid(alpha=0.3)
    plt.tight_layout()
    plt.savefig('../notebooks/tft_roc_curve.png', dpi=300, bbox_inches='tight')
    plt.show()
    print("✅ ROC curve saved")
    
    # Confusion Matrix
    cm = confusion_matrix(test_actuals, test_preds_binary)
    plt.figure(figsize=(6, 5))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', cbar=True)
    plt.xlabel('Predicted')
    plt.ylabel('Actual')
    plt.title('Confusion Matrix - TFT')
    plt.tight_layout()
    plt.savefig('../notebooks/tft_confusion_matrix.png', dpi=300, bbox_inches='tight')
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
