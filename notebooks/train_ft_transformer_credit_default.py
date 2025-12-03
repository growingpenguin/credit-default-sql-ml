#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
FT-Transformer for Credit Card Default Prediction
Feature Tokenizer + Transformer for tabular data
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


class CreditTabularDataset(Dataset):
    """Dataset for tabular credit data"""
    
    def __init__(self, features, labels):
        self.features = torch.FloatTensor(features)
        self.labels = torch.FloatTensor(labels)
    
    def __len__(self):
        return len(self.labels)
    
    def __getitem__(self, idx):
        return self.features[idx], self.labels[idx]


class FeatureTokenizer(nn.Module):
    """Converts numerical features to embeddings (tokens)"""
    
    def __init__(self, num_features, d_token):
        super().__init__()
        self.num_features = num_features
        self.d_token = d_token
        
        self.feature_embeddings = nn.ModuleList([
            nn.Linear(1, d_token) for _ in range(num_features)
        ])
        
        self.bias = nn.Parameter(torch.zeros(num_features, d_token))
    
    def forward(self, x):
        tokens = []
        for i in range(self.num_features):
            token = self.feature_embeddings[i](x[:, i:i+1]) + self.bias[i]
            tokens.append(token)
        
        return torch.stack(tokens, dim=1)


class TransformerEncoder(nn.Module):
    """Transformer encoder block"""
    
    def __init__(self, d_token, n_heads, d_ff, dropout=0.1):
        super().__init__()
        
        self.attention = nn.MultiheadAttention(
            embed_dim=d_token,
            num_heads=n_heads,
            dropout=dropout,
            batch_first=True
        )
        
        self.feed_forward = nn.Sequential(
            nn.Linear(d_token, d_ff),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(d_ff, d_token),
            nn.Dropout(dropout)
        )
        
        self.norm1 = nn.LayerNorm(d_token)
        self.norm2 = nn.LayerNorm(d_token)
        self.dropout = nn.Dropout(dropout)
    
    def forward(self, x):
        attn_out, _ = self.attention(x, x, x)
        x = self.norm1(x + self.dropout(attn_out))
        
        ff_out = self.feed_forward(x)
        x = self.norm2(x + ff_out)
        
        return x


class FTTransformer(nn.Module):
    """FT-Transformer for tabular data"""
    
    def __init__(self, num_features, d_token=192, n_layers=3, n_heads=8, d_ff=512, dropout=0.1):
        super().__init__()
        
        self.tokenizer = FeatureTokenizer(num_features, d_token)
        self.cls_token = nn.Parameter(torch.zeros(1, 1, d_token))
        nn.init.trunc_normal_(self.cls_token, std=0.02)
        
        self.encoders = nn.ModuleList([
            TransformerEncoder(d_token, n_heads, d_ff, dropout)
            for _ in range(n_layers)
        ])
        
        self.head = nn.Sequential(
            nn.LayerNorm(d_token),
            nn.Linear(d_token, 1),
            nn.Sigmoid()
        )
    
    def forward(self, x):
        tokens = self.tokenizer(x)
        
        batch_size = tokens.shape[0]
        cls_tokens = self.cls_token.expand(batch_size, -1, -1)
        tokens = torch.cat([cls_tokens, tokens], dim=1)
        
        for encoder in self.encoders:
            tokens = encoder(tokens)
        
        cls_output = tokens[:, 0]
        output = self.head(cls_output)
        
        return output.squeeze()


def load_and_prepare_data():
    """Load data from database and prepare features"""
    conn = sqlite3.connect('../data/credit_default.db')
    df = pd.read_sql_query("SELECT * FROM training_data;", conn)
    conn.close()
    
    customer_ids = df['customer_id'].values
    y = df['default_label'].values
    X = df.drop(columns=['customer_id', 'default_label']).values
    feature_names = df.drop(columns=['customer_id', 'default_label']).columns.tolist()
    
    return customer_ids, X, y, feature_names


def train_epoch(model, dataloader, criterion, optimizer, device):
    """Train for one epoch"""
    model.train()
    total_loss = 0
    predictions, actuals = [], []
    
    for features, labels in dataloader:
        features, labels = features.to(device), labels.to(device)
        
        optimizer.zero_grad()
        outputs = model(features)
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
        for features, labels in dataloader:
            features, labels = features.to(device), labels.to(device)
            outputs = model(features)
            loss = criterion(outputs, labels)
            
            total_loss += loss.item()
            predictions.extend(outputs.cpu().numpy())
            actuals.extend(labels.cpu().numpy())
    
    auc = roc_auc_score(actuals, predictions)
    return total_loss / len(dataloader), auc, predictions, actuals


def main():
    # Configuration
    DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    BATCH_SIZE = 256
    EPOCHS = 100
    LEARNING_RATE = 0.0001
    PATIENCE = 15
    
    print("=" * 60)
    print("DEEP LEARNING MODEL: FT-Transformer")
    print("=" * 60)
    print(f"Device: {DEVICE}")
    
    # Load data from database
    print("\nLoading data from database...")
    customer_ids, X, y, feature_names = load_and_prepare_data()
    print(f"Dataset shape: {X.shape}")
    print(f"Default rate: {y.mean():.2%}")
    print(f"Features: {len(feature_names)}")
    
    # Normalize features
    scaler = StandardScaler()
    X = scaler.fit_transform(X)
    
    # Train/Val/Test split
    indices = np.arange(len(y))
    idx_temp, idx_test = train_test_split(indices, test_size=0.2, random_state=42, stratify=y)
    y_temp = y[idx_temp]
    idx_train, idx_val = train_test_split(idx_temp, test_size=0.25, random_state=42, stratify=y_temp)
    
    X_train, X_val, X_test = X[idx_train], X[idx_val], X[idx_test]
    y_train, y_val, y_test = y[idx_train], y[idx_val], y[idx_test]
    customer_ids_test = customer_ids[idx_test]
    
    print(f"\nTrain set: {len(y_train)} samples")
    print(f"Validation set: {len(y_val)} samples")
    print(f"Test set: {len(y_test)} samples")
    print(f"Class distribution:\n{pd.Series(y).value_counts()}")
    
    # Create datasets
    train_dataset = CreditTabularDataset(X_train, y_train)
    val_dataset = CreditTabularDataset(X_val, y_val)
    test_dataset = CreditTabularDataset(X_test, y_test)
    
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE)
    test_loader = DataLoader(test_dataset, batch_size=BATCH_SIZE)
    
    # Initialize model
    model = FTTransformer(
        num_features=X.shape[1],
        d_token=192,
        n_layers=3,
        n_heads=8,
        d_ff=512,
        dropout=0.15
    ).to(DEVICE)
    
    criterion = nn.BCELoss()
    optimizer = optim.AdamW(model.parameters(), lr=LEARNING_RATE, weight_decay=1e-5)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='max', factor=0.5, patience=5)
    
    # Training loop
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
            torch.save(model.state_dict(), 'best_ft_transformer_model.pt')
            patience_counter = 0
        else:
            patience_counter += 1
        
        if (epoch + 1) % 10 == 0:
            print(f"Epoch {epoch+1}/{EPOCHS} - Train Loss: {train_loss:.4f}, Train AUC: {train_auc:.4f}, "
                  f"Val Loss: {val_loss:.4f}, Val AUC: {val_auc:.4f}")
        
        if patience_counter >= PATIENCE:
            print(f"\nEarly stopping at epoch {epoch+1}")
            break
    
    # Evaluate on test set
    model.load_state_dict(torch.load('best_ft_transformer_model.pt'))
    test_loss, test_auc, test_preds, test_actuals = evaluate(model, test_loader, criterion, DEVICE)
    test_preds_binary = (np.array(test_preds) > 0.5).astype(int)
    
    print("\n" + "="*60)
    print("FINAL RESULTS - FT-Transformer")
    print("="*60)
    print(f"\nAUC-ROC: {test_auc:.4f}")
    print(f"\nClassification Report:")
    print(classification_report(test_actuals, test_preds_binary))
    
    # Visualizations
    # 1. Training curves
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
    plt.savefig('../notebooks/ft_transformer_training_curves.png', dpi=300, bbox_inches='tight')
    plt.show()
    print("\n✅ Training curves saved")
    
    # 2. ROC Curve
    fpr, tpr, _ = roc_curve(test_actuals, test_preds)
    plt.figure(figsize=(8, 6))
    plt.plot(fpr, tpr, linewidth=2, label=f'FT-Transformer (AUC={test_auc:.3f})')
    plt.plot([0, 1], [0, 1], 'k--', label='Random Classifier')
    plt.xlabel('False Positive Rate')
    plt.ylabel('True Positive Rate')
    plt.title('ROC Curve - FT-Transformer')
    plt.legend()
    plt.grid(alpha=0.3)
    plt.tight_layout()
    plt.savefig('../notebooks/ft_transformer_roc_curve.png', dpi=300, bbox_inches='tight')
    plt.show()
    print("✅ ROC curve saved")
    
    # 3. Confusion Matrix
    cm = confusion_matrix(test_actuals, test_preds_binary)
    plt.figure(figsize=(6, 5))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', cbar=True)
    plt.xlabel('Predicted')
    plt.ylabel('Actual')
    plt.title('Confusion Matrix - FT-Transformer')
    plt.tight_layout()
    plt.savefig('../notebooks/ft_transformer_confusion_matrix.png', dpi=300, bbox_inches='tight')
    plt.show()
    print("✅ Confusion matrix saved")
    
    # Save predictions
    results = pd.DataFrame({
        'customer_id': customer_ids_test,
        'actual_default': test_actuals,
        'predicted_default': test_preds_binary,
        'default_probability': test_preds
    })
    results.to_csv('../data/ft_transformer_predictions.csv', index=False)
    print("✅ Predictions saved to data/ft_transformer_predictions.csv")


if __name__ == '__main__':
    main()
