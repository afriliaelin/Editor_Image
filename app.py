import os
from flask import Flask, render_template, request, send_file, jsonify
from flask_cors import CORS
from PIL import Image, ImageEnhance, ImageFilter
import io
import tempfile
import logging
import uuid

app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)

# Batas ukuran file upload (16MB)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

# Konfigurasi logging untuk debugging
logging.basicConfig(level=logging.DEBUG)

# Pastikan folder temp ada
TEMP_FOLDER = os.path.join(app.static_folder, 'temp')
if not os.path.exists(TEMP_FOLDER):
    os.makedirs(TEMP_FOLDER)

# Rute untuk halaman splash (halaman awal)
@app.route('/')
def logo():
    print("Rendering splash page")
    return render_template('logo.html')

# Rute untuk dashboard
@app.route('/dashboard')
def index():
    print("Rendering dashboard page")
    # Dapatkan daftar file dari folder temp
    temp_images = [f for f in os.listdir(TEMP_FOLDER) if f.endswith(('.png', '.jpg', '.jpeg'))]
    return render_template('index.html', temp_images=temp_images)

# Rute untuk editor
@app.route('/editor')
def editor():
    print("Rendering editor page")
    return render_template('editor.html')

# Rute untuk about
@app.route('/about')
def about():
    print("Rendering about page")
    return render_template('about.html')

# Fungsi untuk menyimpan gambar ke folder temp
def save_to_temp(img):
    # Buat nama file unik menggunakan UUID
    filename = f"tmp_{uuid.uuid4().hex}.png"
    filepath = os.path.join(TEMP_FOLDER, filename)
    img.save(filepath, 'PNG')
    return filename

# Rute untuk upload gambar
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

# Rute untuk enhance gambar
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

# Rute untuk denoise gambar
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

# Rute untuk restore gambar
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

# Error handlers
@app.errorhandler(404)
def page_not_found(e):
    print(f"Error 404: {str(e)}")
    return jsonify({"error": "Page not found. Check if the template exists and the route is correct."}), 404

@app.errorhandler(500)
def internal_server_error(e):
    print(f"Error 500: {str(e)}")
    return jsonify({"error": "Internal server error. Check the server logs for details."}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)