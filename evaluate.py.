import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score

def evaluate_model(y_true, y_pred, labels):
    print("=== CLASSIFICATION REPORT ===")
    print(classification_report(y_true, y_pred, target_names=labels))
    
    acc = accuracy_score(y_true, y_pred)
    print(f"Overall Accuracy: {acc * 100:.2f}%\n")

    # Compute Confusion Matrix
    cm = confusion_matrix(y_true, y_pred)
    
    # Plot Confusion Matrix
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=labels, yticklabels=labels)
    plt.title('Employee Identification Confusion Matrix')
    plt.xlabel('Predicted Label')
    plt.ylabel('True Label')
    plt.tight_layout()
    plt.savefig('confusion_matrix.png')
    plt.show()

if __name__ == "__main__":
    # Test classes
    classes = ["Emp_01", "Emp_02", "Emp_03", "Emp_04", "Unknown"]
    
    # Example ground truth and prediction vectors
    y_test = np.random.choice(range(5), size=100)
    y_pred = np.array([y if np.random.rand() > 0.1 else np.random.choice(range(5)) for y in y_test])
    
    evaluate_model(y_test, y_pred, classes)
