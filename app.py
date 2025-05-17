import os
from flask import Flask, render_template, request, send_file, jsonify
from flask_cors import CORS
from PIL import Image, ImageEnhance, ImageFilter
import io
import tempfile
import logging

app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)

# Batas ukuran file upload (16MB)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

# Konfigurasi logging untuk debugging
logging.basicConfig(level=logging.DEBUG)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/editor')
def editor():
    return render_template('editor.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/upload', methods=['POST'])
def upload_image():
    if 'image' not in request.files:
        return jsonify({"error": "No image uploaded"}), 400
    file = request.files['image']
    if file.mimetype not in ['image/png', 'image/jpeg']:
        return jsonify({"error": "Invalid image format"}), 400
    try:
        img = Image.open(file)
        img_io = io.BytesIO()
        img.save(img_io, 'PNG')
        img_io.seek(0)
        logging.debug("Image uploaded successfully")
        return send_file(img_io, mimetype='image/png')
    except Exception as e:
        logging.error(f"Error uploading image: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/enhance', methods=['POST'])
def enhance():
    try:
        file = request.files['image']
        if file.mimetype not in ['image/png', 'image/jpeg']:
            return jsonify({"error": "Invalid image format"}), 400
        img = Image.open(file)
        img = ImageEnhance.Brightness(img).enhance(1.15)
        img = ImageEnhance.Contrast(img).enhance(1.2)
        img = ImageEnhance.Sharpness(img).enhance(1.3)
        img_io = io.BytesIO()
        img.save(img_io, 'PNG')
        img_io.seek(0)
        logging.debug("Image enhanced successfully")
        return send_file(img_io, mimetype='image/png')
    except Exception as e:
        logging.error(f"Error enhancing image: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/denoise', methods=['POST'])
def denoise():
    try:
        file = request.files['image']
        if file.mimetype not in ['image/png', 'image/jpeg']:
            return jsonify({"error": "Invalid image format"}), 400
        img = Image.open(file).filter(ImageFilter.GaussianBlur(radius=1))
        img_io = io.BytesIO()
        img.save(img_io, 'PNG')
        img_io.seek(0)
        logging.debug("Image denoised successfully")
        return send_file(img_io, mimetype='image/png')
    except Exception as e:
        logging.error(f"Error denoising image: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/restore', methods=['POST'])
def restore():
    try:
        file = request.files['image']
        if file.mimetype not in ['image/png', 'image/jpeg']:
            return jsonify({"error": "Invalid image format"}), 400
        img = Image.open(file)
        img = img.filter(ImageFilter.GaussianBlur(radius=0.5))
        img = ImageEnhance.Sharpness(img).enhance(1.5)
        img = ImageEnhance.Contrast(img).enhance(1.3)
        img_io = io.BytesIO()
        img.save(img_io, 'PNG')
        img_io.seek(0)
        logging.debug("Image restored successfully")
        return send_file(img_io, mimetype='image/png')
    except Exception as e:
        logging.error(f"Error restoring image: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)