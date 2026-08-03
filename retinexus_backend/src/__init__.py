# src/__init__.py

__version__ = "1.0.0"
__author__ = "RetiNexus Team"

# Core preprocessing function ko direct src level par expose karna
from .preprocessing import apply_di_preprocessing

__all__ = [
    "apply_di_preprocessing"
]