from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
import os

# Check if CUDA is available
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Define the local model directory
local_model_path = "models/TinyLlama-1.1B-Chat-v1.0"  # Path where the model is stored

# Load tokenizer and model from local storage
if not os.path.exists(local_model_path):
    raise FileNotFoundError(f"Model directory '{local_model_path}' does not exist. Please make sure the model is downloaded and saved locally.")

# Load the tokenizer and set pad_token
tokenizer = AutoTokenizer.from_pretrained(local_model_path)
tokenizer.pad_token = tokenizer.eos_token  # Ensure proper padding

# Load the model and move it to the appropriate device
local_model_path = "models/TinyLlama-1.1B-Chat-v1.0"
tokenizer = AutoTokenizer.from_pretrained(local_model_path)
model = AutoModelForCausalLM.from_pretrained(local_model_path).to(device)

# Function to generate the next words
def generate_next_word(prompt, num_words):
    current_text = prompt.rstrip()  # Clean up input prompt
    prompt = current_text
    inputs = tokenizer(prompt, return_tensors="pt").to(device)
    output = None
    if len(prompt) <5:
        output = model.generate(inputs['input_ids'], max_new_tokens=2)
    else:
        output = model.generate(inputs['input_ids'], max_new_tokens=num_words)
    if output==None:
        return ""
    predicted_text = tokenizer.decode(output[0], skip_special_tokens=True)

    return predicted_text

