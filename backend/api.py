import os
import joblib
import logging
import math
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directory where models are stored
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(MODEL_DIR, exist_ok=True)

# Dictionary mapping model codes to filenames
MODEL_MAPPING = {
    "rf": "random_forest_model.pkl",
    "mnb": "naive_bayes_model.pkl",
    "lg": "logistic_regression_model.pkl",
    "svm": "svm_model.pkl"
}

# Vectorizer for text preprocessing (if needed in future enhancements)
vectorizer = None

class AnalysisRequest(BaseModel):
    model_type: str
    text: str

class AnalysisResponse(BaseModel):
    isCyberbullying: bool
    cyberbullying_type: float
    confidence: float = None

@app.get("/")
def read_root():
    return {"message": "Cyberbullying Detection API"}

def load_model(model_type: str):
    """Load the specified model from disk"""
    if model_type not in MODEL_MAPPING:
        raise HTTPException(status_code=400, detail=f"Model type '{model_type}' not supported")

    model_path = os.path.join(MODEL_DIR, MODEL_MAPPING[model_type])

    try:
        if not os.path.exists(model_path):
            # For demo purposes, create a dummy model if it doesn't exist
            logger.warning(f"Model {model_path} not found, creating dummy model")
            # You could place dummy model creation logic here if desired

        model = joblib.load(model_path)
        logger.info(f"Successfully loaded model: {model_type}")
        return model

    except Exception as e:
        logger.error(f"Error loading model {model_type}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error loading model: {str(e)}")

@app.post("/analyze", response_model=AnalysisResponse)
def analyze_text(request: AnalysisRequest):
    """Analyze text for cyberbullying content and return a confidence score if available"""
    try:
        # Load the specified model
        model = load_model(request.model_type)

        # Obtain the prediction (assuming model.predict returns an array)
        prediction = model.predict([request.text])
        pred = prediction[0]

        # Compute confidence score if possible
        confidence = None
        if hasattr(model, "predict_proba"):
            prediction_probs = model.predict_proba([request.text])
            confidence = float(max(prediction_probs[0]))
        elif hasattr(model, "decision_function"):
            # Optionally, you can compute a confidence from decision_function
            decision = model.decision_function([request.text])
            # Apply a logistic transformation to map to [0,1]
            confidence = 1 / (1 + math.exp(-max(decision[0])))

        return {
            "isCyberbullying": pred != 3,  # Assuming class 3 means non-cyberbullying
            "cyberbullying_type": float(pred),
            "confidence": confidence,
        }

    except Exception as e:
        logger.error(f"Error analyzing text: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing text: {str(e)}")

# Load vectorizer or prepare any startup routines
@app.on_event("startup")
def startup_event():
    for model_type in MODEL_MAPPING:
        model_path = os.path.join(MODEL_DIR, MODEL_MAPPING[model_type])
        if not os.path.exists(model_path):
            logger.warning(f"Model {model_path} not found. Will create dummy model when requested.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3399)
