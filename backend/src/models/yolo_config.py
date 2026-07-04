import os

def get_yolo_detector(weights_path='yolov8n.pt'):
    """
    Loads YOLOv8 object detection model for lesion spotting.
    """
    try:
        from ultralytics import YOLO
    except ImportError:
        os.system('pip install ultralytics -q')
        from ultralytics import YOLO

    model = YOLO(weights_path)
    return model