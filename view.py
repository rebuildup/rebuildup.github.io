
from flask import Flask, render_template, request, jsonify
from janome.tokenizer import Tokenizer

app = Flask(__name__)

def get_word_positions(text, range_start, range_end):
    tokenizer = Tokenizer()
    positions = []

    # Tokenize the text and calculate positions
    index = 0
    for token in tokenizer.tokenize(text):
        # Get the surface form and length of the token
        surface = token.surface
        length = len(surface)
        start_index = text.find(surface, index)
        end_index = start_index + length - 1
        
        # Check if the range is within the token's start and end
        if start_index <= range_end and end_index >= range_start:
            positions.append((start_index, end_index))
        
        index = end_index + 1  # Update index for the next token

    return positions

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/word_positions', methods=['POST'])
def word_positions():
    data = request.json
    text = data.get('text', '')
    range_start = int(data.get('range_start', 0))
    range_end = int(data.get('range_end', len(text)))
    positions = get_word_positions(text, range_start, range_end)
    return jsonify(positions)

if __name__ == '__main__':
    app.run(debug=True)

