import os
import numpy as np
import tensorflow as tf
from PIL import Image
from tqdm import tqdm
from sklearn.model_selection import train_test_split
import kagglehub

IMG_SIZE = 128
EPOCHS = 10
BATCH_SIZE = 32

CLASSES = [
    "Neutrophil",
    "Lymphocyte",
    "Monocyte",
    "Eosinophil",
    "Basophil"
]

print("Downloading dataset...")
dataset_path = kagglehub.dataset_download(
    "masoudnickparvar/white-blood-cells-dataset"
)

TRAIN_DIR = os.path.join(dataset_path, "Train")

def load_images(directory):
    images, labels = [], []
    for idx, cls in enumerate(CLASSES):
        class_path = os.path.join(directory, cls)
        for img_name in tqdm(os.listdir(class_path)):
            img_path = os.path.join(class_path, img_name)
            img = Image.open(img_path).convert("RGB")
            img = img.resize((IMG_SIZE, IMG_SIZE))
            images.append(np.array(img) / 255.0)
            labels.append(idx)
    return np.array(images), tf.keras.utils.to_categorical(labels, len(CLASSES))

X, y = load_images(TRAIN_DIR)

X_train, X_val, y_train, y_val = train_test_split(
    X, y, test_size=0.2, random_state=42
)

model = tf.keras.models.Sequential([
    tf.keras.layers.Conv2D(32, (3,3), activation='relu',
                           input_shape=(IMG_SIZE, IMG_SIZE, 3)),
    tf.keras.layers.MaxPooling2D(2,2),
    tf.keras.layers.Conv2D(64, (3,3), activation='relu'),
    tf.keras.layers.MaxPooling2D(2,2),
    tf.keras.layers.Conv2D(128, (3,3), activation='relu'),
    tf.keras.layers.MaxPooling2D(2,2),
    tf.keras.layers.Flatten(),
    tf.keras.layers.Dense(256, activation='relu'),
    tf.keras.layers.Dense(len(CLASSES), activation='softmax')
])

model.compile(
    optimizer='adam',
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

model.fit(X_train, y_train, validation_data=(X_val, y_val),
          epochs=EPOCHS, batch_size=BATCH_SIZE)

model.save("wbc_classification_model.keras")
print("Model saved")
