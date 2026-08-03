# backend/src/risk_module/feature_extractor.py

import torch
import torch.nn as nn

class EnsembleFeatureExtractor(nn.Module):
    def __init__(self, effnet_model, resnet_model, densenet_model):
        super().__init__()
        # Puray models ko copy kar rahe hain taake pooling extraction intact rahe
        self.effnet = effnet_model
        self.resnet = resnet_model
        self.densenet = densenet_model

    def forward(self, img_tensor, biomarkers_15d):
        """
        img_tensor: Preprocessed tensor image [batch, 3, 224, 224]
        biomarkers_15d: Tensor containing 15 retinal structural features [batch, 15]
        """
        with torch.no_grad(): # Keep weights frozen
            
            # 1. EfficientNet-B4 Feature Extraction (Extract before classifier)
            # Features shape after features block: [B, 1792, 7, 7] -> Apply native pooling
            f_eff = self.effnet.features(img_tensor)
            f_eff = self.effnet.avgpool(f_eff).flatten(1) # Exact Size: 1792
            
            # 2. ResNet50 Feature Extraction (Extract right before fc layer)
            f_res = self.resnet.conv1(img_tensor)
            f_res = self.resnet.bn1(f_res)
            f_res = self.resnet.relu(f_res)
            f_res = self.resnet.maxpool(f_res)
            f_res = self.resnet.layer1(f_res)
            f_res = self.resnet.layer2(f_res)
            f_res = self.resnet.layer3(f_res)
            f_res = self.resnet.layer4(f_res)
            f_res = self.resnet.avgpool(f_res).flatten(1) # Exact Size: 2048
            
            # 3. DenseNet121 Feature Extraction (Extract right before classifier layer)
            f_dense = self.densenet.features(img_tensor)
            f_dense = nn.functional.relu(f_dense, inplace=True)
            f_dense = nn.functional.adaptive_avg_pool2d(f_dense, (1, 1)).flatten(1) # Exact Size: 1024
            
            # ─── Vision Engine Feature Fusion (Late Concatenation) ───
            vision_features = torch.cat([f_eff, f_res, f_dense], dim=1) # Exact Size: 4864
            
        # ─── Multimodal Biomarker Fusion ───
        combined_vector = torch.cat([vision_features, biomarkers_15d], dim=1) # Exact Size: 4879
        return combined_vector