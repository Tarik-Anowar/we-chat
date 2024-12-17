from transformers import AutoTokenizer, GPT2LMHeadModel
import torch

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
tokenizer = AutoTokenizer.from_pretrained("distilgpt2")
tokenizer.pad_token = tokenizer.eos_token  # Set pad token to eos token

model = GPT2LMHeadModel.from_pretrained("distilgpt2").to(device)

def generate_next_word(prompt, num_words):
   
    current_text = prompt.rstrip()
    for _ in range(num_words):
        inputs = tokenizer(current_text, return_tensors='pt', padding=True, add_special_tokens=False).to(device)
        
        output = model.generate(
            inputs['input_ids'],
            max_length=inputs['input_ids'].shape[1] + 1, 
            pad_token_id=tokenizer.eos_token_id,
            do_sample=False 
        )
        
        text = tokenizer.decode(output[0][inputs['input_ids'].shape[1]:], skip_special_tokens=True)
        current_text+=" "+text.strip()
        
    
    return current_text
