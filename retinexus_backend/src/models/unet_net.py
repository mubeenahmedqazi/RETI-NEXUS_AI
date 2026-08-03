import segmentation_models_pytorch as smp

def get_unet_segmentor():
    """
    Returns a U-Net model with a ResNet34 backbone.
    Matches the exact training configuration of vessel_unet.pth
    """
    # Encoder name ko strict 'resnet34' rakhna hai kyunki weights isi par trained hain
    model = smp.Unet(
        encoder_name="resnet34",        # <-- Fix: efficientnet se badal kar resnet34 kar diya
        encoder_weights=None,           # Local weights load karne hain isliye pretrained None hai
        in_channels=3,                  # RGB input channels
        classes=1                       # Binary segmentation mask (Vessels vs Background)
    )
    return model

if __name__ == "__main__":
    model = get_unet_segmentor()
    print("[+] Fixed ResNet34 U-Net architecture skeleton compiled.")