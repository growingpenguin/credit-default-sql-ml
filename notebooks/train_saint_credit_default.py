#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
================================================================================
SAINT (Self-Attention and Intersample Attention Transformer)
for Credit Card Default Prediction
================================================================================

WHAT IS SAINT?
--------------
SAINT is a state-of-the-art deep learning architecture designed specifically 
for tabular data. Unlike traditional transformers that only use self-attention
over features, SAINT introduces a novel "intersample attention" mechanism
that allows the model to learn relationships BETWEEN different samples
(rows in the dataset), not just between features (columns).

KEY INNOVATIONS:
1. Self-Attention (Column Attention): 
   - Learns relationships between different features
   - Example: Discovers that "credit_utilization" and "payment_delay" are related

2. Intersample Attention (Row Attention):
   - Learns relationships between different customers/samples
   - Example: "This customer's profile is similar to these other customers who defaulted"

WHY SAINT FOR CREDIT DEFAULT?
-----------------------------
- Credit risk patterns often depend on comparing customer profiles
- Similar customers tend to have similar default behaviors
- SAINT can learn these similarity patterns automatically

ARCHITECTURE OVERVIEW:
----------------------
Input (15 features) 
    ↓
Feature Embedding (each feature → d_model dimensions)
    ↓
[CLS] Token Added (for final classification)
    ↓
╔════════════════════════════════════╗
║  SAINT Block (repeated N times)    ║
║  ┌──────────────────────────────┐  ║
║  │  Self-Attention (over cols)  │  ║
║  └──────────────────────────────┘  ║
║              ↓                     ║
║  ┌──────────────────────────────┐  ║
║  │  Intersample Attention       │  ║
║  │  (over rows - during train)  │  ║
║  └──────────────────────────────┘  ║
╚════════════════════════════════════╝
    ↓
[CLS] Token Output → Classification Head → Default Probability

PAPER REFERENCE:
----------------
Somepalli et al., "SAINT: Improved Neural Networks for Tabular Data 
via Row Attention and Contrastive Pre-Training" (2021)
https://arxiv.org/abs/2106.01342

================================================================================
"""

# =============================================================================
# IMPORTS
# =============================================================================

# Data manipulation libraries
import pandas as pd          # DataFrame operations, CSV handling
import numpy as np           # Numerical operations, array handling

# Database connection
import sqlite3               # Connect to SQLite database containing credit data

# PyTorch - Deep Learning Framework
import torch                 # Core PyTorch tensor operations
import torch.nn as nn        # Neural network layers (Linear, LayerNorm, etc.)
import torch.optim as optim  # Optimizers (AdamW, SGD, etc.)
from torch.utils.data import Dataset, DataLoader  # Data loading utilities

# Scikit-learn - ML utilities
from sklearn.model_selection import train_test_split  # Split data into train/val/test
from sklearn.preprocessing import StandardScaler      # Normalize features to mean=0, std=1
from sklearn.metrics import (
    roc_auc_score,           # Area Under ROC Curve - primary metric for imbalanced classification
    classification_report,   # Precision, Recall, F1-score breakdown
    confusion_matrix,        # True/False Positive/Negative counts
    roc_curve                # Data points for plotting ROC curve
)

# Visualization libraries
import matplotlib.pyplot as plt  # Creating plots and charts
import seaborn as sns            # Enhanced statistical visualizations

# Suppress warnings for cleaner output
import warnings
warnings.filterwarnings('ignore')

# =============================================================================
# REPRODUCIBILITY SETTINGS
# =============================================================================
# Setting random seeds ensures that the results are reproducible
# Same seed = same random numbers = same model initialization & data splits

torch.manual_seed(42)    # PyTorch random seed (for weight initialization)
np.random.seed(42)       # NumPy random seed (for data splitting)


# =============================================================================
# DATASET CLASS
# =============================================================================

class CreditTabularDataset(Dataset):
    """
    PyTorch Dataset wrapper for credit default tabular data.
    
    This class converts our numpy arrays into PyTorch tensors and provides
    the interface that DataLoader needs (__len__ and __getitem__).
    
    Why use a Dataset class?
    ------------------------
    1. Enables batching - process multiple samples at once for efficiency
    2. Enables shuffling - randomize order each epoch for better training
    3. Enables parallel data loading - load data in background while GPU trains
    
    Attributes:
        features: Tensor of shape (num_samples, num_features) 
                  Contains the 15 credit risk features per customer
        labels:   Tensor of shape (num_samples,)
                  Contains 0 (no default) or 1 (default) per customer
    """
    
    def __init__(self, features, labels):
        """
        Initialize the dataset with features and labels.
        
        Args:
            features: numpy array of shape (n_samples, n_features)
            labels: numpy array of shape (n_samples,)
        """
        # Convert numpy arrays to PyTorch FloatTensors
        # FloatTensor is needed because neural networks use floating point math
        self.features = torch.FloatTensor(features)
        self.labels = torch.FloatTensor(labels)
    
    def __len__(self):
        """Return the total number of samples in the dataset."""
        return len(self.labels)
    
    def __getitem__(self, idx):
        """
        Get a single sample by index.
        
        This is called by DataLoader to fetch individual samples,
        which are then batched together.
        
        Args:
            idx: Integer index of the sample to retrieve
            
        Returns:
            tuple: (features_tensor, label_tensor) for one customer
        """
        return self.features[idx], self.labels[idx]


# =============================================================================
# FEATURE EMBEDDING LAYER
# =============================================================================

class FeatureEmbedding(nn.Module):
    """
    Embed each numerical feature into a higher-dimensional space.
    
    WHY FEATURE EMBEDDING?
    ----------------------
    In tabular data, each feature (column) has different semantic meaning:
    - age is measured in years (18-100)
    - credit_limit is in dollars (1000-100000)
    - utilization is a percentage (0-100)
    
    By embedding each feature separately with its own learned transformation,
    the model can:
    1. Learn feature-specific representations
    2. Put all features on equal footing regardless of original scale
    3. Expand the representation to capture non-linear patterns
    
    ARCHITECTURE:
    -------------
    For each feature i:
        value (1 dim) → Linear(1, d_model) → LayerNorm → embedding (d_model dims)
    
    Example: If d_model=128 and we have 15 features:
        Input:  (batch_size, 15)      - 15 scalar features
        Output: (batch_size, 15, 128) - 15 embeddings of 128 dimensions each
    """
    
    def __init__(self, num_features, d_model):
        """
        Initialize feature embeddings.
        
        Args:
            num_features: Number of input features (15 for credit data)
            d_model: Embedding dimension (e.g., 128)
        """
        super().__init__()
        
        # Create a separate embedding network for each feature
        # ModuleList is like a Python list but registers modules for PyTorch
        self.embeddings = nn.ModuleList([
            nn.Sequential(
                # Linear layer: project 1D scalar to d_model dimensions
                # This learns a unique transformation for each feature
                nn.Linear(1, d_model),
                
                # LayerNorm: normalize the embedding
                # Helps with training stability and gradient flow
                nn.LayerNorm(d_model)
            ) for _ in range(num_features)  # One embedding network per feature
        ])
    
    def forward(self, x):
        """
        Embed all features.
        
        Args:
            x: Input tensor of shape (batch_size, num_features)
               Example: (256, 15) for a batch of 256 customers with 15 features
               
        Returns:
            Tensor of shape (batch_size, num_features, d_model)
            Example: (256, 15, 128) - each feature is now a 128-dim vector
        """
        embedded = []
        
        # Process each feature with its dedicated embedding layer
        for i, embed in enumerate(self.embeddings):
            # Extract single feature: (batch, 1)
            # x[:, i:i+1] keeps the dimension, unlike x[:, i] which would squeeze it
            feat = x[:, i:i+1]
            
            # Apply embedding: (batch, 1) → (batch, d_model)
            embedded.append(embed(feat))
        
        # Stack all embeddings: list of (batch, d_model) → (batch, num_features, d_model)
        return torch.stack(embedded, dim=1)


# =============================================================================
# SELF-ATTENTION BLOCK (Column Attention)
# =============================================================================

class SelfAttentionBlock(nn.Module):
    """
    Standard Transformer self-attention block for attention over features.
    
    WHAT IS SELF-ATTENTION?
    -----------------------
    Self-attention allows each feature to "attend to" (look at) all other features
    and decide which ones are most relevant for its own representation.
    
    For credit default prediction:
    - "payment_delay" might attend strongly to "credit_utilization"
    - "age" might attend to "account_age" 
    - The model learns these relationships automatically
    
    ATTENTION MECHANISM:
    -------------------
    For each feature (query), compute attention scores with all features (keys),
    then take weighted sum of all feature values:
    
        Attention(Q, K, V) = softmax(QK^T / √d_k) × V
        
    Where:
        Q = Query (what am I looking for?)
        K = Key (what do I contain?)  
        V = Value (what information do I provide?)
    
    MULTI-HEAD ATTENTION:
    --------------------
    Instead of one attention mechanism, use multiple "heads" in parallel.
    Each head can learn different types of relationships:
    - Head 1: Payment behavior patterns
    - Head 2: Demographic correlations
    - Head 3: Credit history patterns
    
    ARCHITECTURE:
    -------------
        Input → Multi-Head Attention → Add & Norm → Feed-Forward → Add & Norm → Output
        
        (The "Add" is a residual connection that helps with gradient flow)
    """
    
    def __init__(self, d_model, n_heads, d_ff, dropout=0.1):
        """
        Initialize the self-attention block.
        
        Args:
            d_model: Embedding dimension (e.g., 128)
            n_heads: Number of attention heads (e.g., 4)
                     Must divide d_model evenly: 128 / 4 = 32 dims per head
            d_ff: Feed-forward network hidden dimension (e.g., 256)
                  Typically 2-4x d_model
            dropout: Dropout probability for regularization (e.g., 0.1 = 10%)
        """
        super().__init__()
        
        # Multi-head self-attention layer
        # batch_first=True means input shape is (batch, seq, features)
        # instead of (seq, batch, features)
        self.attention = nn.MultiheadAttention(
            embed_dim=d_model,      # Input/output embedding dimension
            num_heads=n_heads,       # Number of parallel attention heads
            dropout=dropout,         # Dropout on attention weights
            batch_first=True         # Expect (batch, seq, dim) format
        )
        
        # Position-wise Feed-Forward Network (FFN)
        # This is applied independently to each position (feature)
        # Allows the model to learn non-linear transformations
        self.feed_forward = nn.Sequential(
            # Expand dimension: d_model → d_ff (e.g., 128 → 256)
            nn.Linear(d_model, d_ff),
            
            # GELU activation (smoother than ReLU, used in modern transformers)
            # GELU(x) ≈ x * Φ(x) where Φ is the Gaussian CDF
            nn.GELU(),
            
            # Dropout for regularization
            nn.Dropout(dropout),
            
            # Project back: d_ff → d_model (e.g., 256 → 128)
            nn.Linear(d_ff, d_model),
            
            # Another dropout
            nn.Dropout(dropout)
        )
        
        # Layer Normalization layers
        # Normalizes across the feature dimension (different from BatchNorm)
        # Stabilizes training and allows for faster convergence
        self.norm1 = nn.LayerNorm(d_model)  # After attention
        self.norm2 = nn.LayerNorm(d_model)  # After feed-forward
        
        # Dropout for the residual connection
        self.dropout = nn.Dropout(dropout)
    
    def forward(self, x):
        """
        Apply self-attention and feed-forward layers.
        
        Args:
            x: Input tensor of shape (batch, num_features, d_model)
               Example: (256, 15, 128)
               
        Returns:
            Output tensor of same shape (batch, num_features, d_model)
        """
        # =====================================================================
        # STEP 1: Self-Attention with Residual Connection
        # =====================================================================
        # Each feature attends to all features (including itself)
        # Query, Key, Value are all the same input (hence "self"-attention)
        attn_out, _ = self.attention(x, x, x)  # Returns (output, attention_weights)
        
        # Residual connection: add input to output
        # This helps gradient flow and allows the layer to learn identity if needed
        # Then normalize
        x = self.norm1(x + self.dropout(attn_out))
        
        # =====================================================================
        # STEP 2: Feed-Forward Network with Residual Connection
        # =====================================================================
        # Apply FFN independently to each position
        ff_out = self.feed_forward(x)
        
        # Another residual connection + normalization
        x = self.norm2(x + ff_out)
        
        return x


# =============================================================================
# INTERSAMPLE ATTENTION BLOCK (Row Attention) - SAINT's KEY INNOVATION
# =============================================================================

class IntersampleAttentionBlock(nn.Module):
    """
    Attention across samples (rows) - the key innovation of SAINT.
    
    WHAT IS INTERSAMPLE ATTENTION?
    ------------------------------
    While self-attention lets features attend to other features,
    intersample attention lets SAMPLES attend to OTHER SAMPLES.
    
    For credit default prediction:
    - "This customer's profile is similar to these 10 other customers"
    - "8 of those similar customers defaulted, so this one might too"
    
    WHY IS THIS POWERFUL?
    ---------------------
    1. Captures similarity patterns between customers
    2. Implicitly learns customer "archetypes" or clusters
    3. Uses information from the entire batch to make predictions
    
    HOW IT WORKS:
    -------------
    Instead of attention over sequence dimension (features),
    we transpose and do attention over batch dimension (samples).
    
    For each feature position:
        - Query: This customer's feature value
        - Keys/Values: Same feature value from ALL other customers in batch
        - Output: Weighted combination based on similarity
    
    LIMITATION:
    -----------
    Only used during training because:
    1. Requires multiple samples in a batch
    2. At inference, we often predict one sample at a time
    """
    
    def __init__(self, d_model, n_heads, d_ff, dropout=0.1):
        """
        Initialize the intersample attention block.
        
        Args:
            d_model: Embedding dimension
            n_heads: Number of attention heads
            d_ff: Feed-forward hidden dimension
            dropout: Dropout probability
        """
        super().__init__()
        
        # Same architecture as self-attention, but applied differently
        self.attention = nn.MultiheadAttention(
            embed_dim=d_model,
            num_heads=n_heads,
            dropout=dropout,
            batch_first=True
        )
        
        self.feed_forward = nn.Sequential(
            nn.Linear(d_model, d_ff),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(d_ff, d_model),
            nn.Dropout(dropout)
        )
        
        self.norm1 = nn.LayerNorm(d_model)
        self.norm2 = nn.LayerNorm(d_model)
        self.dropout = nn.Dropout(dropout)
    
    def forward(self, x):
        """
        Apply attention across samples for each feature.
        
        Args:
            x: Input tensor of shape (batch, num_features, d_model)
               Example: (256, 15, 128) - 256 customers, 15 features, 128 dims
               
        Returns:
            Output tensor of same shape
            
        PROCESS:
        --------
        1. Transpose: (batch, features, d_model) → (features, batch, d_model)
        2. For each feature: apply attention across the batch dimension
        3. Transpose back
        """
        batch_size, num_features, d_model = x.shape
        
        # Transpose: swap batch and feature dimensions
        # (batch, features, d_model) → (features, batch, d_model)
        x_t = x.transpose(0, 1)
        
        attended = []
        
        # Apply attention across samples for each feature independently
        for i in range(num_features):
            # Get this feature across all samples: (batch, d_model)
            # Reshape to (batch, 1, d_model) for attention
            feat_across_samples = x_t[i:i+1].transpose(0, 1)
            
            # Keys and values come from all samples for this feature
            # Shape: (batch, batch, d_model)
            all_samples = x_t[i].unsqueeze(0).expand(batch_size, -1, -1)
            
            # Apply attention: each sample attends to all other samples
            attn_out, _ = self.attention(feat_across_samples, all_samples, all_samples)
            
            # Squeeze back: (batch, 1, d_model) → (batch, d_model)
            attended.append(attn_out.squeeze(1))
        
        # Stack back: (batch, num_features, d_model)
        x_attended = torch.stack(attended, dim=1)
        
        # Residual connection and normalization
        x = self.norm1(x + self.dropout(x_attended))
        
        # Feed-forward network
        ff_out = self.feed_forward(x)
        x = self.norm2(x + ff_out)
        
        return x


# =============================================================================
# SAINT BLOCK - Combined Self-Attention + Intersample Attention
# =============================================================================

class SAINTBlock(nn.Module):
    """
    Combined SAINT block: Self-Attention followed by Intersample Attention.
    
    This is the core building block of SAINT, combining both attention types:
    
    FLOW:
    -----
        Input
          ↓
    [Self-Attention over Features]  ← "What features are related?"
          ↓
    [Intersample Attention]         ← "What customers are similar?"
          ↓
        Output
    
    The intersample attention is optional and typically disabled during
    inference since we may only have one sample to predict.
    """
    
    def __init__(self, d_model, n_heads, d_ff, dropout=0.1, use_intersample=True):
        """
        Initialize the SAINT block.
        
        Args:
            d_model: Embedding dimension
            n_heads: Number of attention heads
            d_ff: Feed-forward hidden dimension  
            dropout: Dropout probability
            use_intersample: Whether to include intersample attention
                            Usually True for most layers, False for the last one
        """
        super().__init__()
        
        # Self-attention over features (always used)
        self.self_attention = SelfAttentionBlock(d_model, n_heads, d_ff, dropout)
        
        self.use_intersample = use_intersample
        
        if use_intersample:
            # Simplified intersample: use self-attention on transposed input
            # This is computationally more efficient than the full intersample attention
            self.intersample_attention = SelfAttentionBlock(d_model, n_heads, d_ff, dropout)
    
    def forward(self, x):
        """
        Apply SAINT block transformations.
        
        Args:
            x: Input tensor (batch, num_features, d_model)
            
        Returns:
            Transformed tensor of same shape
        """
        # Step 1: Self-attention over features
        # Each feature learns to attend to relevant other features
        x = self.self_attention(x)
        
        # Step 2: Intersample attention (only during training with batches)
        if self.use_intersample and self.training:
            # Transpose to apply attention across batch dimension
            # (batch, features, d_model) → (features, batch, d_model)
            x_t = x.transpose(0, 1)
            
            # Now "sequence" dimension is batch, so self-attention = intersample attention
            x_t = self.intersample_attention(x_t)
            
            # Transpose back
            x = x_t.transpose(0, 1)
        
        return x


# =============================================================================
# SAINT MODEL - Complete Architecture
# =============================================================================

class SAINT(nn.Module):
    """
    SAINT: Self-Attention and Intersample Attention Transformer
    
    COMPLETE ARCHITECTURE:
    ----------------------
    
    Input: (batch, 15)  [15 credit risk features per customer]
           ↓
    ┌─────────────────────────────────────┐
    │  Feature Embedding                  │
    │  (15 features → 15 x 128 dim)       │
    └─────────────────────────────────────┘
           ↓
    ┌─────────────────────────────────────┐
    │  Add [CLS] Token                    │
    │  (15 → 16 tokens)                   │
    └─────────────────────────────────────┘
           ↓
    ╔═════════════════════════════════════╗
    ║  SAINT Block 1                      ║
    ║  • Self-Attention (features)        ║
    ║  • Intersample Attention (samples)  ║
    ╠═════════════════════════════════════╣
    ║  SAINT Block 2                      ║
    ║  • Self-Attention                   ║
    ║  • Intersample Attention            ║
    ╠═════════════════════════════════════╣
    ║  SAINT Block 3 (last)               ║
    ║  • Self-Attention only              ║
    ║  (No intersample - more stable)     ║
    ╚═════════════════════════════════════╝
           ↓
    ┌─────────────────────────────────────┐
    │  Extract [CLS] Token                │
    │  (aggregated representation)        │
    └─────────────────────────────────────┘
           ↓
    ┌─────────────────────────────────────┐
    │  Classification Head                │
    │  128 → 64 → 1 → Sigmoid             │
    └─────────────────────────────────────┘
           ↓
    Output: Default Probability (0 to 1)
    
    
    WHY [CLS] TOKEN?
    ----------------
    The [CLS] (classification) token is a learnable embedding that:
    1. Attends to all features and learns to aggregate information
    2. Provides a fixed-size representation for classification
    3. Is a common pattern from BERT and other transformers
    
    At the output, [CLS] has "seen" all features through attention
    and encodes the customer's overall credit risk profile.
    """
    
    def __init__(self, num_features, d_model=128, n_layers=3, n_heads=4, d_ff=256, dropout=0.1):
        """
        Initialize the SAINT model.
        
        Args:
            num_features: Number of input features (15 for credit data)
            d_model: Model embedding dimension (default: 128)
                    - Larger = more capacity but slower training
                    - Typical values: 64, 128, 256
            n_layers: Number of SAINT blocks (default: 3)
                     - More layers = deeper model, more complex patterns
                     - Typical values: 2-6
            n_heads: Number of attention heads (default: 4)
                    - Must divide d_model evenly
                    - More heads = more relationship types learned
            d_ff: Feed-forward hidden dimension (default: 256)
                 - Typically 2-4x d_model
            dropout: Dropout rate (default: 0.1)
                    - Higher = more regularization, prevents overfitting
        """
        super().__init__()
        
        # =====================================================================
        # LAYER 1: Feature Embedding
        # =====================================================================
        # Project each scalar feature to d_model dimensions
        self.embedding = FeatureEmbedding(num_features, d_model)
        
        # =====================================================================
        # LEARNABLE [CLS] TOKEN
        # =====================================================================
        # Shape: (1, 1, d_model) - will be expanded to batch size
        # Initialized with truncated normal distribution for stability
        self.cls_token = nn.Parameter(torch.zeros(1, 1, d_model))
        nn.init.trunc_normal_(self.cls_token, std=0.02)  # Small random values
        
        # =====================================================================
        # SAINT BLOCKS
        # =====================================================================
        # Stack multiple SAINT blocks
        # use_intersample=False for last layer (more stable at output)
        self.blocks = nn.ModuleList([
            SAINTBlock(
                d_model=d_model, 
                n_heads=n_heads, 
                d_ff=d_ff, 
                dropout=dropout, 
                use_intersample=(i < n_layers - 1)  # True except for last layer
            )
            for i in range(n_layers)
        ])
        
        # =====================================================================
        # CLASSIFICATION HEAD
        # =====================================================================
        # Takes [CLS] token output and predicts default probability
        self.head = nn.Sequential(
            # Normalize the [CLS] representation
            nn.LayerNorm(d_model),
            
            # First dense layer: compress representation
            nn.Linear(d_model, d_model // 2),  # 128 → 64
            
            # Activation function
            nn.GELU(),
            
            # Dropout for regularization
            nn.Dropout(dropout),
            
            # Final output layer: single probability
            nn.Linear(d_model // 2, 1),  # 64 → 1
            
            # Sigmoid to convert logit to probability [0, 1]
            nn.Sigmoid()
        )
    
    def forward(self, x):
        """
        Forward pass through SAINT.
        
        Args:
            x: Input tensor of shape (batch_size, num_features)
               Example: (256, 15) - 256 customers with 15 features each
               
        Returns:
            Tensor of shape (batch_size,) containing default probabilities
            Example: tensor([0.12, 0.87, 0.34, ...]) for 256 customers
        """
        # Step 1: Embed features
        # (batch, 15) → (batch, 15, 128)
        x = self.embedding(x)
        
        # Step 2: Add [CLS] token at the beginning
        batch_size = x.shape[0]
        # Expand cls_token for entire batch: (1, 1, 128) → (batch, 1, 128)
        cls_tokens = self.cls_token.expand(batch_size, -1, -1)
        # Concatenate: [CLS] + features → (batch, 16, 128)
        x = torch.cat([cls_tokens, x], dim=1)
        
        # Step 3: Apply SAINT blocks
        for block in self.blocks:
            x = block(x)
        
        # Step 4: Extract [CLS] token (first position) for classification
        # (batch, 16, 128) → (batch, 128)
        cls_output = x[:, 0]
        
        # Step 5: Classification head
        # (batch, 128) → (batch, 1) → (batch,)
        output = self.head(cls_output)
        
        return output.squeeze()  # Remove last dimension: (batch, 1) → (batch,)


# =============================================================================
# DATA LOADING FUNCTION
# =============================================================================

def load_and_prepare_data():
    """
    Load credit default data from SQLite database.
    
    The database contains a pre-computed training_data view that joins:
    - customers: Demographics (age, sex, education, marriage)
    - credit_accounts: Credit limits
    - payment_status: Monthly repayment delays
    - statements: Monthly bill amounts  
    - payments: Monthly payment amounts
    - labels: Default target (0 or 1)
    
    FEATURES LOADED (15 total):
    ---------------------------
    Demographics:
        - age: Customer age in years
        - sex: Gender (1=male, 2=female)
        - education: Education level (1-4)
        - marriage: Marital status (1-3)
    
    Credit Profile:
        - num_accounts: Number of credit accounts
        - total_credit_limit: Total credit limit across accounts
    
    Payment Behavior (computed from 6 months of history):
        - avg_repay_status: Average repayment status (-1 to 8)
        - max_delay_ever: Maximum payment delay in months
        - total_late_payments: Count of late payments
        - total_serious_delays: Count of 2+ month delays
    
    Financial Patterns:
        - avg_bill: Average monthly bill amount
        - avg_payment: Average monthly payment amount
        - avg_pay_ratio: Payment-to-bill ratio
        - avg_utilization: Average credit utilization ratio
        - max_utilization: Maximum utilization ratio
    
    Returns:
        tuple: (customer_ids, X, y, feature_names)
            - customer_ids: Array of customer IDs for tracking
            - X: Feature matrix (n_samples, n_features)
            - y: Target array (n_samples,) with 0/1 values
            - feature_names: List of feature column names
    """
    # Connect to SQLite database
    conn = sqlite3.connect('../data/credit_default.db')
    
    # Execute query to load the training_data view
    # This view is created by sql/feature_engineering.sql
    df = pd.read_sql_query("SELECT * FROM training_data;", conn)
    
    # Close database connection
    conn.close()
    
    # Extract components
    customer_ids = df['customer_id'].values  # For tracking predictions
    y = df['default_label'].values           # Target: 0=no default, 1=default
    
    # Features: everything except customer_id and target
    X = df.drop(columns=['customer_id', 'default_label']).values
    feature_names = df.drop(columns=['customer_id', 'default_label']).columns.tolist()
    
    return customer_ids, X, y, feature_names


# =============================================================================
# TRAINING FUNCTION
# =============================================================================

def train_epoch(model, dataloader, criterion, optimizer, device):
    """
    Train the model for one epoch.
    
    ONE EPOCH = one complete pass through all training data
    
    For each batch:
    1. Forward pass: compute predictions
    2. Compute loss: compare predictions to actual labels
    3. Backward pass: compute gradients
    4. Update weights: apply gradients to improve model
    
    Args:
        model: SAINT model instance
        dataloader: PyTorch DataLoader with training data
        criterion: Loss function (Binary Cross-Entropy)
        optimizer: Optimizer (AdamW)
        device: Device to run on (cuda/mps/cpu)
        
    Returns:
        tuple: (average_loss, auc_score)
    """
    # Set model to training mode
    # This enables dropout and intersample attention
    model.train()
    
    total_loss = 0
    predictions, actuals = [], []
    
    # Iterate through batches
    for features, labels in dataloader:
        # Move data to device (GPU/MPS/CPU)
        features, labels = features.to(device), labels.to(device)
        
        # Zero the gradients from previous iteration
        # Required because PyTorch accumulates gradients
        optimizer.zero_grad()
        
        # Forward pass: compute predictions
        outputs = model(features)  # Shape: (batch_size,)
        
        # Compute loss: Binary Cross-Entropy
        # BCE = -[y*log(p) + (1-y)*log(1-p)]
        # Measures how well predicted probabilities match actual labels
        loss = criterion(outputs, labels)
        
        # Backward pass: compute gradients
        # This computes d(loss)/d(weight) for all weights
        loss.backward()
        
        # Gradient clipping: prevent exploding gradients
        # If gradient magnitude > 1.0, scale it down
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        
        # Update weights: w = w - lr * gradient
        optimizer.step()
        
        # Track metrics
        total_loss += loss.item()
        predictions.extend(outputs.detach().cpu().numpy())
        actuals.extend(labels.cpu().numpy())
    
    # Compute AUC-ROC for the epoch
    # AUC = Area Under ROC Curve (0.5 = random, 1.0 = perfect)
    auc = roc_auc_score(actuals, predictions)
    
    return total_loss / len(dataloader), auc


# =============================================================================
# EVALUATION FUNCTION
# =============================================================================

def evaluate(model, dataloader, criterion, device):
    """
    Evaluate the model on validation/test data.
    
    Similar to training but:
    - No gradient computation (torch.no_grad)
    - No weight updates
    - Model in eval mode (dropout disabled)
    
    Args:
        model: SAINT model instance
        dataloader: PyTorch DataLoader with validation/test data
        criterion: Loss function
        device: Device to run on
        
    Returns:
        tuple: (average_loss, auc_score, predictions, actuals)
    """
    # Set model to evaluation mode
    # This disables dropout and intersample attention
    model.eval()
    
    total_loss = 0
    predictions, actuals = [], []
    
    # Disable gradient computation for efficiency
    with torch.no_grad():
        for features, labels in dataloader:
            features, labels = features.to(device), labels.to(device)
            
            # Forward pass only (no backward)
            outputs = model(features)
            loss = criterion(outputs, labels)
            
            total_loss += loss.item()
            predictions.extend(outputs.cpu().numpy())
            actuals.extend(labels.cpu().numpy())
    
    auc = roc_auc_score(actuals, predictions)
    return total_loss / len(dataloader), auc, predictions, actuals


# =============================================================================
# MAIN TRAINING PIPELINE
# =============================================================================

def main():
    """
    Complete training pipeline for SAINT credit default model.
    
    PIPELINE STEPS:
    ---------------
    1. Configuration: Set hyperparameters
    2. Data Loading: Load from SQLite database
    3. Preprocessing: Normalize features  
    4. Data Splitting: Train/Validation/Test
    5. Model Creation: Initialize SAINT
    6. Training Loop: Train with early stopping
    7. Evaluation: Test set performance
    8. Visualization: Training curves, ROC, confusion matrix
    9. Save Results: Model weights and predictions
    """
    
    # =========================================================================
    # STEP 1: CONFIGURATION
    # =========================================================================
    
    # Device selection: Use GPU if available, else MPS (Apple Silicon), else CPU
    # GPU is ~10-50x faster than CPU for deep learning
    DEVICE = torch.device(
        'cuda' if torch.cuda.is_available() else 
        'mps' if torch.backends.mps.is_available() else 
        'cpu'
    )
    
    # Batch size: Number of samples processed together
    # Larger = faster training, more memory; Smaller = more noise, less memory
    BATCH_SIZE = 256
    
    # Maximum epochs: Upper limit on training iterations
    # Training typically stops earlier due to early stopping
    EPOCHS = 100
    
    # Learning rate: Step size for gradient descent
    # Too high = unstable; Too low = slow convergence
    LEARNING_RATE = 0.0001
    
    # Early stopping patience: Stop if no improvement for N epochs
    # Prevents overfitting by stopping before model memorizes training data
    PATIENCE = 15
    
    # Print header
    print("=" * 60)
    print("DEEP LEARNING MODEL: SAINT")
    print("(Self-Attention and Intersample Attention Transformer)")
    print("=" * 60)
    print(f"Device: {DEVICE}")
    
    # =========================================================================
    # STEP 2: DATA LOADING
    # =========================================================================
    
    print("\nLoading data from database...")
    customer_ids, X, y, feature_names = load_and_prepare_data()
    
    print(f"Dataset shape: {X.shape}")              # (30000, 15)
    print(f"Default rate: {y.mean():.2%}")          # ~22%
    print(f"Features: {len(feature_names)}")        # 15
    
    # =========================================================================
    # STEP 3: FEATURE NORMALIZATION
    # =========================================================================
    
    # StandardScaler: Transform features to mean=0, std=1
    # This is CRITICAL for neural networks because:
    # 1. Features on different scales (age: 20-80, credit_limit: 1000-100000) 
    #    would cause some features to dominate
    # 2. Gradient descent works better with normalized inputs
    # 3. Weight initialization assumes normalized inputs
    scaler = StandardScaler()
    X = scaler.fit_transform(X)
    
    # =========================================================================
    # STEP 4: TRAIN/VALIDATION/TEST SPLIT
    # =========================================================================
    
    # Split strategy: 60% train, 20% validation, 20% test
    # - Train: Model learns from this
    # - Validation: Tune hyperparameters, early stopping decisions
    # - Test: Final evaluation (only used once!)
    
    # stratify=y ensures each split has same default rate (~22%)
    # This is important for imbalanced datasets
    
    indices = np.arange(len(y))
    
    # First split: 80% temp, 20% test
    idx_temp, idx_test = train_test_split(
        indices, 
        test_size=0.2,       # 20% for test
        random_state=42,     # Reproducibility
        stratify=y           # Preserve class ratio
    )
    
    # Second split: 75% train, 25% validation (of the 80%)
    # 0.75 * 0.8 = 0.6 (60% train), 0.25 * 0.8 = 0.2 (20% validation)
    y_temp = y[idx_temp]
    idx_train, idx_val = train_test_split(
        idx_temp, 
        test_size=0.25, 
        random_state=42, 
        stratify=y_temp
    )
    
    # Create split arrays
    X_train, X_val, X_test = X[idx_train], X[idx_val], X[idx_test]
    y_train, y_val, y_test = y[idx_train], y[idx_val], y[idx_test]
    customer_ids_test = customer_ids[idx_test]  # For saving predictions
    
    print(f"\nTrain set: {len(y_train)} samples")      # ~18,000
    print(f"Validation set: {len(y_val)} samples")    # ~6,000
    print(f"Test set: {len(y_test)} samples")         # ~6,000
    
    # =========================================================================
    # STEP 5: CREATE PYTORCH DATASETS AND DATALOADERS
    # =========================================================================
    
    # Datasets: Wrap numpy arrays for PyTorch
    train_dataset = CreditTabularDataset(X_train, y_train)
    val_dataset = CreditTabularDataset(X_val, y_val)
    test_dataset = CreditTabularDataset(X_test, y_test)
    
    # DataLoaders: Handle batching, shuffling, parallel loading
    train_loader = DataLoader(
        train_dataset, 
        batch_size=BATCH_SIZE, 
        shuffle=True           # Shuffle each epoch for better training
    )
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE)
    test_loader = DataLoader(test_dataset, batch_size=BATCH_SIZE)
    
    # =========================================================================
    # STEP 6: INITIALIZE MODEL
    # =========================================================================
    
    model = SAINT(
        num_features=X.shape[1],  # 15 features
        d_model=128,              # Embedding dimension
        n_layers=3,               # Number of SAINT blocks
        n_heads=4,                # Attention heads (128 / 4 = 32 dims per head)
        d_ff=256,                 # Feed-forward hidden size
        dropout=0.15              # 15% dropout for regularization
    ).to(DEVICE)  # Move model to GPU/MPS/CPU
    
    # Print model size
    total_params = sum(p.numel() for p in model.parameters())
    print(f"\nModel parameters: {total_params:,}")  # ~100-200K
    
    # =========================================================================
    # STEP 7: SETUP LOSS, OPTIMIZER, SCHEDULER
    # =========================================================================
    
    # Loss function: Binary Cross-Entropy
    # Measures difference between predicted and actual probabilities
    criterion = nn.BCELoss()
    
    # Optimizer: AdamW (Adam with proper weight decay)
    # Combines momentum and adaptive learning rates
    # weight_decay adds L2 regularization to prevent overfitting
    optimizer = optim.AdamW(
        model.parameters(), 
        lr=LEARNING_RATE, 
        weight_decay=1e-4  # L2 regularization strength
    )
    
    # Learning rate scheduler: Reduce LR when validation AUC plateaus
    # If no improvement for 5 epochs, multiply LR by 0.5
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(
        optimizer, 
        mode='max',        # Maximize AUC
        factor=0.5,        # New LR = old LR * 0.5
        patience=5         # Wait 5 epochs before reducing
    )
    
    # =========================================================================
    # STEP 8: TRAINING LOOP
    # =========================================================================
    
    best_val_auc = 0
    patience_counter = 0
    train_losses, val_losses = [], []
    train_aucs, val_aucs = [], []
    
    print("\nTraining...")
    
    for epoch in range(EPOCHS):
        # Train one epoch
        train_loss, train_auc = train_epoch(
            model, train_loader, criterion, optimizer, DEVICE
        )
        
        # Evaluate on validation set
        val_loss, val_auc, _, _ = evaluate(
            model, val_loader, criterion, DEVICE
        )
        
        # Track metrics
        train_losses.append(train_loss)
        val_losses.append(val_loss)
        train_aucs.append(train_auc)
        val_aucs.append(val_auc)
        
        # Update learning rate scheduler
        scheduler.step(val_auc)
        
        # Save best model
        if val_auc > best_val_auc:
            best_val_auc = val_auc
            torch.save(model.state_dict(), 'best_saint_model.pt')
            patience_counter = 0
        else:
            patience_counter += 1
        
        # Print progress every 10 epochs
        if (epoch + 1) % 10 == 0:
            print(f"Epoch {epoch+1}/{EPOCHS} - "
                  f"Train Loss: {train_loss:.4f}, Train AUC: {train_auc:.4f}, "
                  f"Val Loss: {val_loss:.4f}, Val AUC: {val_auc:.4f}")
        
        # Early stopping check
        if patience_counter >= PATIENCE:
            print(f"\nEarly stopping at epoch {epoch+1}")
            break
    
    # =========================================================================
    # STEP 9: FINAL EVALUATION ON TEST SET
    # =========================================================================
    
    # Load best model
    model.load_state_dict(torch.load('best_saint_model.pt'))
    
    # Evaluate on test set
    test_loss, test_auc, test_preds, test_actuals = evaluate(
        model, test_loader, criterion, DEVICE
    )
    
    # Convert probabilities to binary predictions (threshold = 0.5)
    test_preds_binary = (np.array(test_preds) > 0.5).astype(int)
    
    # Print final results
    print("\n" + "="*60)
    print("FINAL RESULTS - SAINT")
    print("="*60)
    print(f"\nAUC-ROC: {test_auc:.4f}")
    print(f"\nClassification Report:")
    print(classification_report(test_actuals, test_preds_binary))
    
    # =========================================================================
    # STEP 10: VISUALIZATIONS
    # =========================================================================
    
    # ----- Training Curves -----
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))
    
    # Loss curve
    ax1.plot(train_losses, label='Train', linewidth=2)
    ax1.plot(val_losses, label='Validation', linewidth=2)
    ax1.set_xlabel('Epoch')
    ax1.set_ylabel('Loss')
    ax1.set_title('Training and Validation Loss')
    ax1.legend()
    ax1.grid(alpha=0.3)
    
    # AUC curve
    ax2.plot(train_aucs, label='Train', linewidth=2)
    ax2.plot(val_aucs, label='Validation', linewidth=2)
    ax2.set_xlabel('Epoch')
    ax2.set_ylabel('AUC-ROC')
    ax2.set_title('Training and Validation AUC')
    ax2.legend()
    ax2.grid(alpha=0.3)
    
    plt.tight_layout()
    plt.savefig('saint_training_curves.png', dpi=300, bbox_inches='tight')
    plt.show()
    print("\n✅ Training curves saved")
    
    # ----- ROC Curve -----
    fpr, tpr, _ = roc_curve(test_actuals, test_preds)
    plt.figure(figsize=(8, 6))
    plt.plot(fpr, tpr, linewidth=2, label=f'SAINT (AUC={test_auc:.3f})')
    plt.plot([0, 1], [0, 1], 'k--', label='Random Classifier')
    plt.xlabel('False Positive Rate')
    plt.ylabel('True Positive Rate')
    plt.title('ROC Curve - SAINT')
    plt.legend()
    plt.grid(alpha=0.3)
    plt.tight_layout()
    plt.savefig('saint_roc_curve.png', dpi=300, bbox_inches='tight')
    plt.show()
    print("✅ ROC curve saved")
    
    # ----- Confusion Matrix -----
    cm = confusion_matrix(test_actuals, test_preds_binary)
    plt.figure(figsize=(6, 5))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', cbar=True)
    plt.xlabel('Predicted')
    plt.ylabel('Actual')
    plt.title('Confusion Matrix - SAINT')
    plt.tight_layout()
    plt.savefig('saint_confusion_matrix.png', dpi=300, bbox_inches='tight')
    plt.show()
    print("✅ Confusion matrix saved")
    
    # =========================================================================
    # STEP 11: SAVE PREDICTIONS
    # =========================================================================
    
    results = pd.DataFrame({
        'customer_id': customer_ids_test,
        'actual_default': test_actuals,
        'predicted_default': test_preds_binary,
        'default_probability': test_preds
    })
    results.to_csv('../data/saint_predictions.csv', index=False)
    print("✅ Predictions saved to data/saint_predictions.csv")


# =============================================================================
# ENTRY POINT
# =============================================================================

if __name__ == '__main__':
    main()
