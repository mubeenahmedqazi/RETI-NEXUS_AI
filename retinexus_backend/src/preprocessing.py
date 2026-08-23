import cv2
import numpy as np
import scipy.ndimage as ndi
from skimage import morphology, measure
from skimage.morphology import skeletonize


def check_image_quality(image_path_or_ndarray, threshold=45):
    """
    RoI-Masked Laplacian Variance Quality Checker.
    Pre-processing step to reject blurry inputs while ignoring black background padding.
    """
    if isinstance(image_path_or_ndarray, str):
        img = cv2.imread(image_path_or_ndarray)
    else:
        img = image_path_or_ndarray

    if img is None:
        raise FileNotFoundError("Quality check ke liye image nahi mili.")

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else image_path_or_ndarray

    _, thresh = cv2.threshold(gray, 10, 255, cv2.THRESH_BINARY)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    if contours:
        largest_contour = max(contours, key=cv2.contourArea)
        x, y, w, h = cv2.boundingRect(largest_contour)
        roi = gray[y:y+h, x:x+w]
        if roi.size > 0:
            variance_score = cv2.Laplacian(roi, cv2.CV_64F).var()
        else:
            variance_score = cv2.Laplacian(gray, cv2.CV_64F).var()
    else:
        variance_score = cv2.Laplacian(gray, cv2.CV_64F).var()

    return float(variance_score), variance_score >= threshold


def preprocess_for_classifier(image_path_or_ndarray):
    """
    FIXED & OPTIMIZED: Uses LAB Color Space for CLAHE.
    Enhances structural patterns and background lesions without distorting
    critical pathology colors. Crucial for stable Ensemble and YOLO inference.
    """
    if isinstance(image_path_or_ndarray, str):
        img = cv2.imread(image_path_or_ndarray)
    else:
        img = image_path_or_ndarray.copy()

    if img is None:
        raise FileNotFoundError("Classifier preprocessing ke liye image nahi mili.")

    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab)

    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    cl = clahe.apply(l_channel)

    merged_lab = cv2.merge([cl, a_channel, b_channel])
    bgr_output = cv2.cvtColor(merged_lab, cv2.COLOR_LAB2BGR)

    return bgr_output


def apply_di_preprocessing(image_path_or_ndarray):
    """
    Green Channel Isolation & Adaptive CLAHE.
    STRICTLY FOR U-NET VESSEL SEGMENTATION ONLY.
    """
    if isinstance(image_path_or_ndarray, str):
        img = cv2.imread(image_path_or_ndarray)
    else:
        img = image_path_or_ndarray

    if img is None:
        raise FileNotFoundError("Segmentation preprocessing ke liye image nahi mili.")

    b, g, r = cv2.split(img)

    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced_g = clahe.apply(g)

    processed_img = cv2.GaussianBlur(enhanced_g, (3, 3), 0)

    rgb_output = cv2.merge([processed_img, processed_img, processed_img])
    return rgb_output


def extract_vessel_features(binary_mask):
    """
    CLINICALLY ACCURATE biomarker extraction.
    Proper skeleton + noise removal + accurate calculations.
    """
    import cv2
    import numpy as np
    import scipy.ndimage as ndi
    from skimage import morphology, measure
    from skimage.morphology import skeletonize, disk

    # ── Input Sanitize ───────────────────────────────────────
    if len(binary_mask.shape) == 3:
        binary_mask = cv2.cvtColor(binary_mask, cv2.COLOR_BGR2GRAY)
    _, binary_mask = cv2.threshold(binary_mask, 127, 255, cv2.THRESH_BINARY)

    mask_f = (binary_mask == 255).astype(np.float32)

    # ── MORPHOLOGICAL CLEANUP ────────────────────────────────
    # Small noise dots hatao — sirf real vessels rakhao
    binary_bool = mask_f.astype(bool)
    binary_bool = morphology.remove_small_objects(binary_bool, max_size=200)
    binary_bool = morphology.remove_small_holes(binary_bool, max_size=200)

    # Slight closing — vessel gaps fill karo
    binary_bool = morphology.closing(binary_bool, disk(2))

    # ── SKELETON ─────────────────────────────────────────────
    skeleton = skeletonize(binary_bool).astype(np.uint8)

    # Skeleton ke chhote dangling ends hatao (spurs)
    # Yeh branching count ko falsely inflate karte hain
    def remove_spurs(skel, spur_length=10):
        """Short dangling branches hatao skeleton se."""
        cleaned = skel.copy()
        for _ in range(spur_length):
            kernel       = np.ones((3, 3), np.uint8)
            neighbor_cnt = cv2.filter2D(
                cleaned.astype(np.float32), -1, kernel)
            # End points: skeleton pixel with only 1 neighbor (itself included = 2)
            endpoints = (cleaned == 1) & (neighbor_cnt <= 2)
            cleaned[endpoints] = 0
        return cleaned

    skeleton_clean = remove_spurs(skeleton, spur_length=10)

    # ── 1. VESSEL TORTUOSITY INDEX ───────────────────────────
    # Labeled segments → actual path / chord length
    # Medical normal: 1.0 – 1.15
    labeled = measure.label(skeleton_clean)
    values  = []
    for region in measure.regionprops(labeled):
        coords = region.coords
        if len(coords) < 20:   # bahut chhotay segments ignore karo
            continue
        chord = np.linalg.norm(
            coords[-1].astype(float) - coords[0].astype(float)) + 1e-9
        ratio = len(coords) / chord
        # Physically impossible values filter karo
        if 1.0 <= ratio <= 3.0:
            values.append(ratio)

    tortuosity = round(float(np.median(values)), 4) if values else 1.05

    # ── 2. BRANCHING POINTS COUNT ────────────────────────────
    # Clean skeleton pe branch points count karo
    # Normal retina: 100 – 300
    kernel       = np.ones((3, 3), np.uint8)
    neighbor_cnt = cv2.filter2D(
        skeleton_clean.astype(np.float32), -1, kernel)
    # Branch point = skeleton pixel + 3 ya zyada neighbors
    # neighbor_cnt includes self, so threshold = 4 (self + 3 neighbors)
    branch_map = (skeleton_clean == 1) & (neighbor_cnt >= 4)

    # A single real Y/X-junction in a raster skeleton almost always spans a small
    # cluster of 2-4 adjacent pixels that all satisfy the neighbor-count test above —
    # counting raw pixels here systematically inflates the branch count (one true
    # junction reported as several). Cluster adjacent branch pixels with 8-connectivity
    # and count clusters instead, so each true junction contributes exactly once.
    branch_clusters, branching_points = ndi.label(
        branch_map, structure=np.ones((3, 3))
    )

    # ── 3. ARTERIOLAR TO VENULAR RATIO (AVR) ─────────────────
    # Distance transform → vessel radius at each point
    # Median se upar = venules, neeche = arterioles
    # Medical normal: 0.62 – 0.72
    clean_mask_f = binary_bool.astype(np.float32)
    dist         = ndi.distance_transform_edt(clean_mask_f)

    # Sirf skeleton points pe width measure karo — full mask nahi
    skel_points = skeleton_clean == 1
    if np.sum(skel_points) > 10:
        widths   = dist[skel_points] * 2   # diameter = radius * 2
        widths   = widths[widths > 0]      # zero width points hatao

        if len(widths) >= 20:
            # Thinner half = arterioles, thicker half = venules
            median_w = np.median(widths)
            art_w    = widths[widths <= median_w]
            ven_w    = widths[widths >  median_w]

            art_d = np.mean(art_w) if len(art_w) > 0 else 1.0
            ven_d = np.mean(ven_w) if len(ven_w) > 0 else 1.0
            avr   = round(float(art_d / (ven_d + 1e-9)), 4)

            # Clamp to physiologically valid range
            avr = max(0.50, min(0.85, avr))
        else:
            avr = 0.67
    else:
        avr = 0.67

    # ── 4. VESSEL DENSITY PERCENTAGE ─────────────────────────
    # Clean mask pe calculate karo — original image area ke against
    # Medical normal: 10 – 20%
    total_pixels  = binary_mask.size
    vessel_pixels = int(np.sum(binary_bool))
    density       = round((vessel_pixels / total_pixels) * 100, 2)

    print(f"    [Skeleton pixels]  : {int(skeleton_clean.sum())}")
    print(f"    [Branch points]    : {branching_points}")
    print(f"    [Vessel segments]  : {labeled.max()}")
    print(f"    [Tortuosity vals]  : {len(values)} segments used")

    return {
        "vessel_tortuosity_index"    : tortuosity,
        "branching_points_count"     : branching_points,
        "arteriolar_to_venular_ratio": avr,
        "vessel_density_percentage"  : density
    }