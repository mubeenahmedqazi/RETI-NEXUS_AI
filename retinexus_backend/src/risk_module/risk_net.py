import torch.nn as nn

class MultiHeadRiskNet(nn.Module):
    def __init__(self, input_dim): # input_dim = vision_features + 15 biomarkers
        super().__init__()
        
        # Shared Layer
        self.shared_layer = nn.Sequential(
            nn.Linear(input_dim, 256),
            nn.ReLU(),
            nn.Dropout(0.3)
        )
        
        # 3 Parallel Heads
        self.heart_head = nn.Sequential(nn.Linear(256, 64), nn.ReLU(), nn.Linear(64, 1), nn.Sigmoid())
        self.kidney_head = nn.Sequential(nn.Linear(256, 64), nn.ReLU(), nn.Linear(64, 1), nn.Sigmoid())
        self.brain_head = nn.Sequential(nn.Linear(256, 64), nn.ReLU(), nn.Linear(64, 1), nn.Sigmoid())

    def forward(self, combined_vector):
        x = self.shared_layer(combined_vector)
        
        heart_score = self.heart_head(x) * 100   # 0 to 100% Risk
        kidney_score = self.kidney_head(x) * 100 # 0 to 100% Risk
        brain_score = self.brain_head(x) * 100   # 0 to 100% Risk
        
        return heart_score, kidney_score, brain_score