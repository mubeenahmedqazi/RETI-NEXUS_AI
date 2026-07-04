import cv2
import numpy as np
import torch


class RetiGradCAM:

    def __init__(self, model, target_layer):
        self.model = model
        self.target_layer = target_layer
        self.gradients = None
        self.features = None
        self.hook_layers()

    def hook_layers(self):
        # 1. Forward hook: Feature maps ko save karne ke liye
        def forward_hook(module, input, output):
            self.features = output

        # 2. Backward hook: Gradients ko save karne ke liye
        def backward_hook(module, grad_input, grad_output):
            self.gradients = grad_output[0]

        # Hooks ko target layer par register karna
        self.target_layer.register_forward_hook(forward_hook)
        self.target_layer.register_backward_hook(backward_hook)

    def generate_heatmap(self, input_tensor, target_class_head_idx):
        # Forward pass
        output = self.model(input_tensor)

        # Target risk head (e.g., Kidney Head) ka score nikalna
        # target_class_head_idx batayega ke kis head ka heatmap chahiye
        score = output[target_class_head_idx]

        # Backward pass (Gradients calculate karna)
        self.model.zero_grad()
        score.backward()

        # Grad-CAM ka mathematical formula
        gradients = self.gradients.cpu().data.numpy()[0]
        features = self.features.cpu().data.numpy()[0]

        weights = np.mean(gradients, axis=(1, 2))  # Global Average Pooling
        cam = np.zeros(features.shape[1:], dtype=np.float32)

        for i, w in enumerate(weights):
            cam += w * features[i]

        cam = np.maximum(cam, 0)  # ReLU operation
        cam = cv2.resize(cam, (input_tensor.shape[2], input_tensor.shape[3]))
        cam = cam - np.min(cam)
        cam = cam / np.max(cam)  # Normalize

        return cam