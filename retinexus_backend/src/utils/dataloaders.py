import os
import pandas as pd
from torch.utils.data import Dataset
from PIL import Image

class AptosDataset(Dataset):
    """Custom Dataset for APTOS 2019 (Classification)"""
    def __init__(self, csv_file, img_dir, transform=None):
        self.df = pd.read_csv(csv_file)
        self.img_dir = img_dir
        self.transform = transform

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):
        img_name = os.path.join(self.img_dir, self.df.iloc[idx, 0] + '.png')
        image = Image.open(img_name).convert('RGB')
        label = int(self.df.iloc[idx, 1])  # DR stage (0 to 4)
        
        if self.transform:
            image = self.transform(image)
            
        return image, label

class DriveDataset(Dataset):
    """Custom Dataset for DRIVE (Vessel Segmentation)"""
    def __init__(self, images_dir, masks_dir, transform=None):
        self.images_dir = images_dir
        self.masks_dir = masks_dir
        self.images = sorted(os.listdir(images_dir))
        self.masks = sorted(os.listdir(masks_dir))
        self.transform = transform

    def __len__(self):
        return len(self.images)

    def __getitem__(self, idx):
        img_path = os.path.join(self.images_dir, self.images[idx])
        mask_path = os.path.join(self.masks_dir, self.masks[idx])
        
        image = Image.open(img_path).convert('RGB')
        mask = Image.open(mask_path).convert('L')  # Grayscale mask (0 or 255)
        
        if self.transform:
            # Segmentation mein image aur mask dono par same transform lagta hai
            image, mask = self.transform(image, mask)
            
        return image, mask