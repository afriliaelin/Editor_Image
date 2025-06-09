const canvas = document.getElementById('canvas');
const imageLoader = document.getElementById('imageLoader');
const cropOverlay = document.getElementById('cropOverlay');
const cropImage = document.getElementById('cropImage');
const brightnessSlider = document.getElementById('brightness');
const contrastSlider = document.getElementById('contrast');
const sidebar = document.getElementById('sidebar');
const toggleSidebar = document.getElementById('toggleSidebar');
const toggleIcon = document.getElementById('toggleIcon');
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const themeToggleMobile = document.getElementById('themeToggleMobile');
const themeIconMobile = document.getElementById('themeIconMobile');
let originalImage;
let initialImage;
let cropper;
let isFiltering = false;
let rotation = 0;

// Debugging: Pastikan semua elemen ditemukan
console.log("Canvas:", canvas);
console.log("ImageLoader:", imageLoader);
console.log("Brightness Slider:", brightnessSlider);
console.log("Contrast Slider:", contrastSlider);
console.log("Crop Overlay:", cropOverlay);
console.log("Crop Image:", cropImage);
console.log("Theme Toggle:", themeToggle);
console.log("Theme Icon:", themeIcon);

// Initialize sidebar state
let isSidebarVisible = window.innerWidth >= 768 ? true : false;
if (localStorage.getItem('sidebarVisible')) {
    isSidebarVisible = JSON.parse(localStorage.getItem('sidebarVisible'));
}
updateSidebarState();

// Initialize theme from localStorage
const html = document.documentElement;
const savedTheme = localStorage.getItem('theme') || 'light';
html.setAttribute('data-theme', savedTheme);
updateThemeStyles();
updateThemeIcon(savedTheme);

// Listen for theme changes in localStorage (triggered from other pages)
window.addEventListener('storage', (event) => {
    if (event.key === 'theme') {
        const newTheme = event.newValue || 'light';
        html.setAttribute('data-theme', newTheme);
        updateThemeStyles();
        updateThemeIcon(newTheme);
    }
});

// Theme toggle for editor page
themeToggle?.addEventListener('click', toggleTheme);
themeToggleMobile?.addEventListener('click', toggleTheme);

function toggleTheme() {
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeStyles();
    updateThemeIcon(newTheme);
}

function updateThemeStyles() {
    const isDark = html.getAttribute('data-theme') === 'dark';
    if (isDark) {
        if (canvas) canvas.style.borderColor = '#4b5563';
        if (brightnessSlider) brightnessSlider.style.background = '#6b7280';
        if (contrastSlider) contrastSlider.style.background = '#6b7280';
        if (imageLoader) imageLoader.style.backgroundColor = '#4b5563';
    } else {
        if (canvas) canvas.style.borderColor = '#e5e7eb';
        if (brightnessSlider) brightnessSlider.style.background = '#e5e7eb';
        if (contrastSlider) contrastSlider.style.background = '#e5e7eb';
        if (imageLoader) imageLoader.style.backgroundColor = '#f1f5f9';
    }
}

function updateThemeIcon(theme) {
    const iconPath = theme === 'light' 
        ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>'
        : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>';
    if (themeIcon) themeIcon.innerHTML = iconPath;
    if (themeIconMobile) themeIconMobile.innerHTML = iconPath;
}

// Event listeners for editor functionality
if (imageLoader) {
    imageLoader.addEventListener('change', handleImage);
} else {
    console.error("imageLoader tidak ditemukan!");
}

if (brightnessSlider && contrastSlider) {
    brightnessSlider.addEventListener('input', updateBrightnessContrast);
    contrastSlider.addEventListener('input', updateBrightnessContrast);
} else {
    console.error("Slider brightness atau contrast tidak ditemukan!");
}

toggleSidebar?.addEventListener('click', toggleSidebarState);

function scaleImage(img, maxWidth, maxHeight) {
    let scale = 1;
    if (img.width > maxWidth || img.height > maxHeight) {
        scale = Math.min(maxWidth / img.width, maxHeight / img.height);
    }
    console.log("Scale:", scale, "Dimensions:", { width: img.width * scale, height: img.height * scale });
    return { width: img.width * scale, height: img.height * scale };
}

function applyToCanvas(img, ctx, applyFilters = false) {
    const dims = scaleImage(img, window.innerWidth * 0.7, window.innerHeight * 0.6);
    canvas.width = dims.width;
    canvas.height = dims.height;

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(rotation * Math.PI / 180);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    if (applyFilters && brightnessSlider && contrastSlider) {
        const brightness = parseInt(brightnessSlider.value) / 100;
        const contrast = parseInt(contrastSlider.value) / 100;
        ctx.filter = `brightness(${brightness}) contrast(${contrast})`;
    }

    ctx.drawImage(img, 0, 0, dims.width, dims.height);
    ctx.filter = 'none';
    ctx.restore();
    return dims;
}

function toggleSidebarState() {
    isSidebarVisible = !isSidebarVisible;
    updateSidebarState();
    localStorage.setItem('sidebarVisible', JSON.stringify(isSidebarVisible));
}

function updateSidebarState() {
    if (isSidebarVisible) {
        sidebar.classList.remove('hidden');
        toggleIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>';
    } else {
        sidebar.classList.add('hidden');
        toggleIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>';
    }
}

function handleImage(e) {
    console.log("handleImage dipanggil", e.target.files);
    if (!e.target.files || e.target.files.length === 0) {
        alert("Silakan pilih gambar");
        return;
    }
    const reader = new FileReader();
    reader.onload = function(event) {
        console.log("FileReader berhasil:", event.target.result);
        const img = new Image();
        img.onload = function() {
            console.log("Gambar berhasil dimuat:", img);
            rotation = 0;
            applyToCanvas(img, canvas.getContext('2d'));
            originalImage = new Image();
            originalImage.src = event.target.result;
            initialImage = new Image();
            initialImage.src = event.target.result;
            resetSliders();
            if (cropper) {
                cropper.destroy();
                cropper = null;
            }
            cropImage.src = '';
            showToast("Gambar berhasil dimuat!");
        };
        img.onerror = function() {
            alert("Gagal memuat gambar. Coba file lain.");
        };
        img.src = event.target.result;
    };
    reader.onerror = function() {
        alert("Gagal membaca file gambar.");
    };
    reader.readAsDataURL(e.target.files[0]);
}

function resetSliders() {
    if (brightnessSlider) brightnessSlider.value = 100;
    if (contrastSlider) contrastSlider.value = 100;
    updateBrightnessContrast();
}

function updateBrightnessContrast() {
    if (!originalImage || !canvas) {
        console.error("Gambar atau canvas tidak ditemukan untuk update brightness/contrast");
        return;
    }
    const ctx = canvas.getContext('2d');
    applyToCanvas(originalImage, ctx, true);
    showToast("Brightness/Contrast diperbarui!");
}

function applyFilter(filter) {
    if (!originalImage) {
        alert("Silakan unggah gambar terlebih dahulu");
        return;
    }
    if (isFiltering) return;
    isFiltering = true;
    const ctx = canvas.getContext('2d');
    applyToCanvas(originalImage, ctx);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let data = imgData.data;
    const width = canvas.width;
    const height = canvas.height;

    const edgeData = new Uint8ClampedArray(data);
    const smoothedData = new Uint8ClampedArray(data);

    for (let i = 0; i < data.length; i += 4) {
        const x = (i / 4) % width;
        const y = Math.floor((i / 4) / width);
        if (x > 0 && x < width - 1 && y > 0 && y < height - 1) {
            const idx = (y * width + x) * 4;
            const idxLeft = idx - 4;
            const idxRight = idx + 4;
            const idxUp = idx - width * 4;
            const idxDown = idx + width * 4;
            smoothedData[idx] = (data[idx] + data[idxLeft] + data[idxRight] + data[idxUp] + data[idxDown]) / 5;
            smoothedData[idx + 1] = (data[idx + 1] + data[idxLeft + 1] + data[idxRight + 1] + data[idxUp + 1] + data[idxDown + 1]) / 5;
            smoothedData[idx + 2] = (data[idx + 2] + data[idxLeft + 2] + data[idxRight + 2] + data[idxUp + 2] + data[idxDown + 2]) / 5;
            smoothedData[idx + 3] = data[idx + 3];
        }
    }

    const edgeMap = new Float32Array(width * height);
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const idx = (y * width + x) * 4;
            const idxNW = ((y - 1) * width + (x - 1)) * 4;
            const idxN = ((y - 1) * width + x) * 4;
            const idxNE = ((y - 1) * width + (x + 1)) * 4;
            const idxW = (y * width + (x - 1)) * 4;
            const idxE = (y * width + (x + 1)) * 4;
            const idxSW = ((y + 1) * width + (x - 1)) * 4;
            const idxS = ((y + 1) * width + x) * 4;
            const idxSE = ((y + 1) * width + (x + 1)) * 4;

            const grayNW = (smoothedData[idxNW] + smoothedData[idxNW + 1] + smoothedData[idxNW + 2]) / 3;
            const grayN = (smoothedData[idxN] + smoothedData[idxN + 1] + smoothedData[idxN + 2]) / 3;
            const grayNE = (smoothedData[idxNE] + smoothedData[idxNE + 1] + smoothedData[idxNE + 2]) / 3;
            const grayW = (smoothedData[idxW] + smoothedData[idxW + 1] + smoothedData[idxW + 2]) / 3;
            const grayE = (smoothedData[idxE] + smoothedData[idxE + 1] + smoothedData[idxE + 2]) / 3;
            const graySW = (smoothedData[idxSW] + smoothedData[idxSW + 1] + smoothedData[idxSW + 2]) / 3;
            const grayS = (smoothedData[idxS] + smoothedData[idxS + 1] + smoothedData[idxS + 2]) / 3;
            const graySE = (smoothedData[idxSE] + smoothedData[idxSE + 1] + smoothedData[idxSE + 2]) / 3;

            const gx = (grayNW * -1) + (grayNE * 1) + (grayW * -2) + (grayE * 2) + (graySW * -1) + (graySE * 1);
            const gy = (grayNW * -1) + (grayN * -2) + (grayNE * -1) + (graySW * 1) + (grayS * 2) + (graySE * 1);
            edgeMap[y * width + x] = Math.sqrt(gx * gx + gy * gy);
        }
    }

    for (let i = 0; i < data.length; i += 4) {
        const x = (i / 4) % width;
        const y = Math.floor((i / 4) / width);
        const r = smoothedData[i];
        const g = smoothedData[i + 1];
        const b = smoothedData[i + 2];

        if (filter === 'grayscale') {
            const avg = (r + g + b) / 3;
            data[i] = data[i + 1] = data[i + 2] = avg;
        } else if (filter === 'sepia') {
            data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
            data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
            data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
        } else if (filter === 'vintage') {
            data[i] = Math.min(255, r * 0.9 + 20);
            data[i + 1] = Math.min(255, g * 0.8 + 10);
            data[i + 2] = Math.min(255, b * 0.7);
        } else if (filter === 'blur') {
            if (x > 0 && x < width - 1 && y > 0 && y < height - 1) {
                const idx = (y * width + x) * 4;
                const idxLeft = idx - 4;
                const idxRight = idx + 4;
                const idxUp = idx - width * 4;
                const idxDown = idx + width * 4;
                data[i] = (data[idx] + data[idxLeft] + data[idxRight] + data[idxUp] + data[idxDown]) / 5;
                data[i + 1] = (data[idx + 1] + data[idxLeft + 1] + data[idxRight + 1] + data[idxUp + 1] + data[idxDown + 1]) / 5;
                data[i + 2] = (data[idx + 2] + data[idxLeft + 2] + data[idxRight + 2] + data[idxUp + 2] + data[idxDown + 2]) / 5;
            }
        } else if (filter === 'invert') {
            data[i] = 255 - r;
            data[i + 1] = 255 - g;
            data[i + 2] = 255 - b;
        } else if (filter === 'saturate') {
            let hsl = rgbToHsl(r, g, b);
            hsl[1] = Math.min(1, hsl[1] * 1.5);
            let rgb = hslToRgb(hsl[0], hsl[1], hsl[2]);
            data[i] = rgb[0];
            data[i + 1] = rgb[1];
            data[i + 2] = rgb[2];
        } else if (filter === 'cartoon') {
            if (x > 0 && x < width - 1 && y > 0 && y < height - 1) {
                const edge = edgeMap[y * width + x];
                if (edge > 50) {
                    data[i] = data[i + 1] = data[i + 2] = 0;
                } else {
                    data[i] = Math.round(r / 40) * 40;
                    data[i + 1] = Math.round(g / 40) * 40;
                    data[i + 2] = Math.round(b / 40) * 40;
                }
            }
        }
    }

    if (filter === 'cartoon') {
        const finalData = new Uint8ClampedArray(data);
        for (let i = 0; i < data.length; i += 4) {
            const x = (i / 4) % width;
            const y = Math.floor((i / 4) / width);
            if (x > 0 && x < width - 1 && y > 0 && y < height - 1) {
                const idx = (y * width + x) * 4;
                const idxLeft = idx - 4;
                const idxRight = idx + 4;
                const idxUp = idx - width * 4;
                const idxDown = idx + width * 4;
                data[i] = (finalData[idx] + finalData[idxLeft] + finalData[idxRight] + finalData[idxUp] + finalData[idxDown]) / 5;
                data[i + 1] = (finalData[idx + 1] + finalData[idxLeft + 1] + finalData[idxRight + 1] + finalData[idxUp + 1] + finalData[idxDown + 1]) / 5;
                data[i + 2] = (finalData[idx + 2] + finalData[idxLeft + 2] + finalData[idxRight + 2] + finalData[idxUp + 2] + finalData[idxDown + 2]) / 5;
                data[i + 3] = finalData[idx + 3];
            }
        }
    }

    ctx.putImageData(imgData, 0, 0);
    originalImage = new Image();
    originalImage.src = canvas.toDataURL();
    originalImage.onload = function() {
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
        cropOverlay.classList.add('hidden');
        cropImage.src = '';
        isFiltering = false;
        showToast(`Filter ${filter} berhasil diterapkan!`);
    };
}

function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h, s, l];
}

function hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) {
        r = g = b = l;
    } else {
        let hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        let p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function startCrop() {
    if (!originalImage) {
        alert("Silakan unggah gambar terlebih dahulu");
        return;
    }
    if (isFiltering) return;
    const dims = scaleImage(originalImage, window.innerWidth * 0.8, window.innerHeight * 0.7);
    const tempImg = new Image();
    tempImg.src = originalImage.src;
    tempImg.onload = function() {
        cropImage.src = tempImg.src;
        cropImage.style.width = `${dims.width}px`;
        cropImage.style.height = `${dims.height}px`;
        if (cropper) {
            cropper.destroy();
        }
        cropper = new Cropper(cropImage, {
            aspectRatio: 0,
            viewMode: 1,
            autoCropArea: 0.5,
            responsive: true,
        });
        cropOverlay.classList.remove('hidden');
        showToast("Silakan pilih area untuk crop!");
    };
    tempImg.onerror = function() {
        console.error("Gagal memuat gambar untuk crop:", tempImg.src);
        alert("Gagal memuat gambar untuk crop. Pastikan gambar valid.");
        cropImage.src = '';
    };
}

function confirmCrop() {
    if (!cropper) return;
    const croppedCanvas = cropper.getCroppedCanvas();
    originalImage = new Image();
    originalImage.src = croppedCanvas.toDataURL();
    originalImage.onload = function() {
        applyToCanvas(originalImage, canvas.getContext('2d'), true);
        cropper.destroy();
        cropper = null;
        cropOverlay.classList.add('hidden');
        cropImage.src = '';
        showToast("Gambar berhasil di-crop!");
    };
}

function cancelCrop() {
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    cropOverlay.classList.add('hidden');
    cropImage.src = '';
    showToast("Crop dibatalkan!");
}

function rotateImage() {
    if (!originalImage) {
        alert("Silakan unggah gambar terlebih dahulu");
        return;
    }
    rotation = (rotation + 90) % 360;
    const ctx = canvas.getContext('2d');
    applyToCanvas(originalImage, ctx, true);
    showToast("Gambar diputar 90 derajat ke kanan!");
}

function enhanceImage() {
    if (!originalImage) {
        alert("Silakan unggah gambar terlebih dahulu");
        return;
    }
    const formData = new FormData();
    const blob = dataURLtoBlob(canvas.toDataURL('image/png'));
    formData.append('image', blob, 'image.png');
    fetch('/enhance', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) throw new Error(`Enhance failed: ${response.statusText}`);
        return response.blob();
    })
    .then(blob => {
        const img = new Image();
        img.src = URL.createObjectURL(blob);
        img.onload = function() {
            applyToCanvas(img, canvas.getContext('2d'), true);
            originalImage = img;
            showToast("Gambar berhasil ditingkatkan!");
        };
        img.onerror = function() {
            alert("Gagal memuat gambar yang ditingkatkan");
        };
    })
    .catch(err => {
        alert("Gagal meningkatkan gambar: " + err.message);
    });
}

function denoiseImage() {
    if (!originalImage) {
        alert("Silakan unggah gambar terlebih dahulu");
        return;
    }
    const formData = new FormData();
    const blob = dataURLtoBlob(canvas.toDataURL('image/png'));
    formData.append('image', blob, 'image.png');
    fetch('/denoise', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) throw new Error(`Denoise failed: ${response.statusText}`);
        return response.blob();
    })
    .then(blob => {
        const img = new Image();
        img.src = URL.createObjectURL(blob);
        img.onload = function() {
            applyToCanvas(img, canvas.getContext('2d'), true);
            originalImage = img;
            showToast("Noise berhasil dihilangkan!");
        };
        img.onerror = function() {
            alert("Gagal memuat gambar yang telah di-denoise");
        };
    })
    .catch(err => {
        alert("Gagal menghilangkan noise: " + err.message);
    });
}

function restoreImage() {
    if (!originalImage) {
        alert("Silakan unggah gambar terlebih dahulu");
        return;
    }
    const formData = new FormData();
    const blob = dataURLtoBlob(canvas.toDataURL('image/png'));
    formData.append('image', blob, 'image.png');
    fetch('/restore', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) throw new Error(`Restore failed: ${response.statusText}`);
        return response.blob();
    })
    .then(blob => {
        const img = new Image();
        img.src = URL.createObjectURL(blob);
        img.onload = function() {
            applyToCanvas(img, canvas.getContext('2d'), true);
            originalImage = img;
            showToast("Foto lama berhasil direstorasi!");
        };
        img.onerror = function() {
            alert("Gagal memuat gambar yang telah direstorasi");
        };
    })
    .catch(err => {
        alert("Gagal merestorasi foto: " + err.message);
    });
}

function restoreOriginal() {
    if (!initialImage) {
        alert("Tidak ada gambar asli untuk dikembalikan");
        return;
    }
    rotation = 0;
    originalImage = new Image();
    originalImage.src = initialImage.src;
    originalImage.onload = function() {
        applyToCanvas(originalImage, canvas.getContext('2d'), true);
        resetSliders();
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
        cropOverlay.classList.add('hidden');
        cropImage.src = '';
        showToast("Gambar asli berhasil dikembalikan!");
    };
}

function clearImage() {
    if (!originalImage) {
        alert("Tidak ada gambar untuk dihapus");
        return;
    }
    originalImage = null;
    initialImage = null;
    rotation = 0;
    canvas.width = 0;
    canvas.height = 0;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    resetSliders();
    imageLoader.value = '';
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    cropOverlay.classList.add('hidden');
    cropImage.src = '';
    showToast("Gambar berhasil dihapus!");
}

function downloadImage() {
    if (!originalImage) {
        alert("Silakan unggah atau edit gambar terlebih dahulu");
        return;
    }
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'photovibe-edited.png';
    link.click();
    showToast("Gambar berhasil diunduh!");
}

function dataURLtoBlob(dataURL) {
    try {
        const arr = dataURL.split(',');
        if (arr.length < 2) throw new Error("Invalid dataURL format");
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    } catch (e) {
        console.error("Error converting dataURL to Blob:", e);
        return null;
    }
}

function showToast(message) {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.querySelector('.toast-body').textContent = message;
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 3000);
    }
}