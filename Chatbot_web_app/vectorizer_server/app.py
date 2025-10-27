# app.py -> TensorFlow Version (No PyTorch needed)
from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow_hub as hub
import tensorflow as tf

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests from your HTML file

# --- IMPORTANT ---
# This path should point to the folder containing the TensorFlow Hub model
MODEL_PATH = r"C:\Users\User\Desktop\insightface\models\universal-sentence-encoder"

print("Loading TensorFlow...")
# Eager execution is usually on by default, but this ensures it
tf.compat.v1.enable_eager_execution()

print(f"Loading Universal Sentence Encoder model from: {MODEL_PATH}")
try:
    # Load the model directly using TensorFlow Hub
    model = hub.load(MODEL_PATH)
    print("Model loaded successfully!")
except Exception as e:
    print(f"Error loading model: {e}")
    print("Please ensure TensorFlow and TensorFlow-Hub are installed and the path is correct.")
    model = None

@app.route('/vectorize', methods=['POST'])
def vectorize():
    if model is None:
        return jsonify({"error": "Model is not loaded."}), 500
        
    data = request.get_json()
    if not data or 'text' not in data:
        return jsonify({"error": "Invalid request, 'text' field is required."}), 400
    
    text = data['text']
    
    # The model expects a list of strings and returns a tensor
    vector_tensor = model([text])
    
    # Convert the tensor to a simple list for the JSON response
    vector_list = vector_tensor[0].numpy().tolist()
    
    return jsonify({"vector": vector_list})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)