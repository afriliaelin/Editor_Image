function removeBackgroundImpl(canvas, callback) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;

    // Langkah 1: Ambil sampel warna background dari beberapa titik di tepi
    const samplePoints = [
        { x: 0, y: 0 }, { x: width - 1, y: 0 }, { x: 0, y: height - 1 }, { x: width - 1, y: height - 1 },
        { x: Math.floor(width / 4), y: 0 }, { x: Math.floor(3 * width / 4), y: 0 },
        { x: Math.floor(width / 4), y: height - 1 }, { x: Math.floor(3 * width / 4), y: height - 1 },
        { x: 0, y: Math.floor(height / 4) }, { x: width - 1, y: Math.floor(height / 4) },
        { x: 0, y: Math.floor(3 * height / 4) }, { x: width - 1, y: Math.floor(3 * height / 4) }
    ];

    let rSum = 0, gSum = 0, bSum = 0, sampleCount = 0;
    for (const point of samplePoints) {
        const idx = (point.y * width + point.x) * 4;
        if (idx < data.length) {
            rSum += data[idx];
            gSum += data[idx + 1];
            bSum += data[idx + 2];
            sampleCount++;
        }
    }

    const bgColor = {
        r: sampleCount ? Math.round(rSum / sampleCount) : 0,
        g: sampleCount ? Math.round(gSum / sampleCount) : 0,
        b: sampleCount ? Math.round(bSum / sampleCount) : 0
    };
    console.log("Warna background terdeteksi:", bgColor);

    // Langkah 2: Smoothing gambar untuk mengurangi noise
    const smoothedData = new Uint8ClampedArray(data);
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const idx = (y * width + x) * 4;
            const r = (data[idx] + data[idx - 4] + data[idx + 4] + data[idx - width * 4] + data[idx + width * 4]) / 5;
            const g = (data[idx + 1] + data[idx - 3] + data[idx + 5] + data[idx - width * 4 + 1] + data[idx + width * 4 + 1]) / 5;
            const b = (data[idx + 2] + data[idx - 2] + data[idx + 6] + data[idx - width * 4 + 2] + data[idx + width * 4 + 2]) / 5;
            smoothedData[idx] = r;
            smoothedData[idx + 1] = g;
            smoothedData[idx + 2] = b;
        }
    }

    // Langkah 3: Deteksi tepi dengan ambang batas yang disesuaikan
    const edgeData = new Uint8Array(width * height);
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const idx = (y * width + x) * 4;
            const idxLeft = ((y * width) + (x - 1)) * 4;
            const idxRight = ((y * width) + (x + 1)) * 4;
            const idxTop = (((y - 1) * width) + x) * 4;
            const idxBottom = (((y + 1) * width) + x) * 4;

            const grayCenter = (smoothedData[idx] + smoothedData[idx + 1] + smoothedData[idx + 2]) / 3;
            const grayLeft = (smoothedData[idxLeft] + smoothedData[idxLeft + 1] + smoothedData[idxLeft + 2]) / 3;
            const grayRight = (smoothedData[idxRight] + smoothedData[idxRight + 1] + smoothedData[idxRight + 2]) / 3;
            const grayTop = (smoothedData[idxTop] + smoothedData[idxTop + 1] + smoothedData[idxTop + 2]) / 3;
            const grayBottom = (smoothedData[idxBottom] + smoothedData[idxBottom + 1] + smoothedData[idxBottom + 2]) / 3;

            const gradX = grayRight - grayLeft;
            const gradY = grayBottom - grayTop;
            const gradMag = Math.sqrt(gradX * gradX + gradY * gradY);

            edgeData[y * width + x] = gradMag > 25 ? 1 : 0; // Ambang batas disesuaikan ke 25
        }
    }

    // Langkah 4: Flood fill dengan toleransi dinamis
    const visited = new Uint8Array(width * height);
    const queue = [];
    const threshold = Math.min(40, Math.max(20, (bgColor.r + bgColor.g + bgColor.b) / 30)); // Toleransi dinamis

    for (let x = 0; x < width; x++) {
        queue.push({ x, y: 0 });
        queue.push({ x, y: height - 1 });
    }
    for (let y = 0; y < height; y++) {
        queue.push({ x: 0, y });
        queue.push({ x: width - 1, y });
    }

    while (queue.length > 0) {
        const { x, y } = queue.shift();
        const idx = (y * width + x);
        if (visited[idx] || idx >= data.length) continue;
        visited[idx] = 1;

        const pixelIdx = idx * 4;
        const r = data[pixelIdx];
        const g = data[pixelIdx + 1];
        const b = data[pixelIdx + 2];

        const diffR = Math.abs(r - bgColor.r);
        const diffG = Math.abs(g - bgColor.g);
        const diffB = Math.abs(b - bgColor.b);

        if (diffR < threshold && diffG < threshold && diffB < threshold && edgeData[idx] === 0) {
            data[pixelIdx + 3] = 0;

            if (x > 0) queue.push({ x: x - 1, y });
            if (x < width - 1) queue.push({ x: x + 1, y });
            if (y > 0) queue.push({ x, y: y - 1 });
            if (y < height - 1) queue.push({ x, y: y + 1 });
        }
    }

    ctx.putImageData(imageData, 0, 0);
    if (callback) callback();
}