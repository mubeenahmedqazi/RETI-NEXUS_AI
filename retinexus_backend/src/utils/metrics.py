import torch

def calculate_dice_score(pred, target, smooth=1e-6):
    """Calculates the Dice Coefficient for Segmentation accuracy evaluation"""
    pred = torch.sigmoid(pred)
    pred = (pred > 0.5).float()
    
    intersection = (pred * target).sum()
    total = pred.sum() + target.sum()
    
    dice = (2.0 * intersection + smooth) / (total + smooth)
    return dice.item()

def calculate_accuracy(preds, labels):
    """Calculates classification accuracy percentage"""
    top_pred = preds.argmax(1, keepdim=True)
    correct = top_pred.eq(labels.view_as(top_pred)).sum()
    acc = correct.float() / labels.shape[0]
    return acc.item() * 100