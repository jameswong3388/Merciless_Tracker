# Cyberbullying Detection API

This directory contains the FastAPI backend for cyberbullying detection.

## Setup and Installation

1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Create models directory (if not already created):
   ```bash
   mkdir -p models
   ```

## Running the API

Start the FastAPI server:
```bash
uvicorn api:app --reload --port 3002
```

The API will be available at http://localhost:3002

## API Endpoints

- `GET /`: Basic health check endpoint
- `POST /analyze`: Analyze text for cyberbullying content

### Example Request:

```json
{
  "model_type": "rf",
  "text": "Text to analyze for cyberbullying content"
}
```

### Example Response:

```json
{
  "isCyberbullying": true,
  "confidence": 0.85
}
```

## Available Models

The API supports the following machine learning models:

- `rf`: Random Forest
- `mnb`: Multinomial Naive Bayes
- `lg`: Logistic Regression
- `svm`: Support Vector Machine

Models should be saved in the `models` directory with corresponding filenames as defined in the `MODEL_MAPPING` dictionary in `api.py`.

If models don't exist, the API will automatically create dummy models for demonstration purposes.

## Crawling Functionality

The crawling functionality in this application requires [firecrawl](https://github.com/mendableai/firecrawl/blob/main/SELF_HOST.md), a powerful web crawling library. Make sure to install it before running the crawler:
