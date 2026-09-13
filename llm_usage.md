# LLM Usage & AI Attribution Report

## Tools Used
* **Google AI Studio / Gemini:** Initial project scaffolding, code generation, and interactive guidance for GitHub repository setup.
* **Claude:** Code review, evaluation script architecture, and Markdown formatting for submission requirements.

---

## Usage Breakdown

### 1. Project Scaffolding & Web Application
* **Accepted:** Initial application boilerplate generated via Google AI Studio repository templates (`google-gemini/aistudio-repository-template`).
* **Modified:** Extended default Vite/TypeScript components to support biometric employee security verification features.

### 2. Model Evaluation & Documentation
* **Accepted:** 
  * Structure for `evaluate.py` to calculate accuracy and render confusion matrices using standard Python libraries (`scikit-learn`, `seaborn`).
  * Quantitative metric table structure (FAR, FRR, EER) for repository evaluation compliance.
* **Modified:** Customized metrics to reflect real-world false rejection and acceptance thresholds tailored for contactless security access control.

---

## Validation & Verification Methodology

1. **Code Execution:** Verified that `evaluate.py` runs cleanly without syntax or missing library errors.
2. **Metric Integrity:** Validated that security metrics (FAR, FRR, and EER) adhere to standard biometric evaluation practices.
3. **Repository Audit:** Checked repository structure against submission guidelines to ensure complete coverage of evaluation metrics, demo links, and commit history.
