import torch.nn as nn
import timm

def get_efficientnet_b4(num_classes=5, pretrained=True):
    """
    Creates an EfficientNet-B4 architecture and customizes the final linear 
    layer to predict Diabetic Retinopathy grades (0-4).
    """
    # timm library se state-of-the-art model load karna
    model = timm.create_model('efficientnet_b4', pretrained=pretrained)
    
    # Original model ke output features ka size lena
    in_features = model.classifier.in_features
    
    # Last fully connected layer ko override karna (classes = 5)
    model.classifier = nn.Linear(in_features, num_classes)
    
    return model