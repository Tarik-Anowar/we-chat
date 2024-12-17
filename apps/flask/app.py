from flask import Flask, jsonify, request
from next_word import generate_next_word
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Sample data for the endpoint
items = [
    {'id': 1, 'name': 'Item 1'},
    {'id': 2, 'name': 'Item 2'},
    {'id': 3, 'name': 'Item 3'}
]

# Define a simple REST endpoint that returns the list of items
@app.route('/api/items', methods=['GET'])
def get_items():
    return jsonify(items)

# Define another endpoint that accepts a POST request to add a new item
@app.route('/api/next_word', methods=['POST'])
def add_item():
    data = request.get_json()
    
    prompt = data.get('prompt', '')  # Extract 'prompt' from request body
    num_words = data.get('num_words', 2)  # Extract 'num_words' from request body
    print("prompt = ", prompt)
    if not prompt:
        print("no text generated ..")
        return jsonify({"error": "Prompt is required"}), 400
    
    generated_text = generate_next_word(prompt, num_words)

    print("generated text = " + generated_text)
    return jsonify(generated_text),200


if __name__ == '__main__':
    app.run(debug=True)
