const fileInput = document.getElementById('fileInput');
const processBtn = document.getElementById('processBtn');
const downloadBtn = document.getElementById('downloadBtn');
const originalCanvas = document.getElementById('originalCanvas');
const resultCanvas = document.getElementById('resultCanvas');
const originalPlaceholder = document.getElementById('originalPlaceholder');
const resultPlaceholder = document.getElementById('resultPlaceholder');
const themeToggle = document.getElementById('themeToggle');
const saveBtn = document.getElementById('saveBtn');
const loadBtn = document.getElementById('loadBtn');
const resetBtn = document.getElementById('resetBtn');

// Effect Modules & Pipeline
const effectPipeline = document.getElementById('effectPipeline');
const scrambleHue = document.getElementById('scrambleHue');
const scrambleSaturation = document.getElementById('scrambleSaturation');
const scrambleMode = document.getElementById('scrambleMode');
const brightnessModeSelect = document.getElementById('brightnessMode');

const channelSwapSelect = document.getElementById('channelSwap');

const pixelSortCheckbox = document.getElementById('pixelSort');
const sortControls = document.getElementById('sortControls');
const sortDirection = document.getElementById('sortDirection');
const sortCriteria = document.getElementById('sortCriteria');
const sortThreshold = document.getElementById('sortThreshold');
const sortReverse = document.getElementById('sortReverse');

const enableCA = document.getElementById('enableCA');
const caControls = document.getElementById('caControls');
const caIntensity = document.getElementById('caIntensity');

const enableDither = document.getElementById('enableDither');
const ditherControls = document.getElementById('ditherControls');
const ditherDepth = document.getElementById('ditherDepth');
const ditherScale = document.getElementById('ditherScale');

const enableVoronoi = document.getElementById('enableVoronoi');
const voronoiControls = document.getElementById('voronoiControls');
const voronoiCells = document.getElementById('voronoiCells');

// Layout controls
const sidebar = document.getElementById('sidebar');
const resizer = document.getElementById('resizer');

let originalImage = null;

// --- Drag and Drop Reordering ---
let draggedItem = null;

function initDragging() {
    const draggables = document.querySelectorAll('.draggable');
    draggables.forEach(draggable => {
        const handle = draggable.querySelector('.drag-handle');

        draggable.setAttribute('draggable', 'false');

        handle.addEventListener('mousedown', () => {
            draggable.setAttribute('draggable', 'true');
        });

        draggable.addEventListener('mouseup', () => {
            draggable.setAttribute('draggable', 'false');
        });

        draggable.addEventListener('dragstart', (e) => {
            draggedItem = draggable;
            draggable.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        draggable.addEventListener('dragend', () => {
            draggedItem = null;
            draggable.classList.remove('dragging');
            draggable.setAttribute('draggable', 'false');
            triggerProcess(true); // Process immediately after reorder
        });

        draggable.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = getDragAfterElement(effectPipeline, e.clientY);
            if (afterElement == null) {
                effectPipeline.appendChild(draggedItem);
            } else {
                effectPipeline.insertBefore(draggedItem, afterElement);
            }
        });
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.draggable:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// --- Theme Management ---
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.getElementById('themeIcon').textContent = theme === 'dark' ? '☀️' : '🌙';
    document.getElementById('themeText').textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
    localStorage.setItem('scrambler-theme', theme);
}

const savedTheme = localStorage.getItem('scrambler-theme') || 'light';
setTheme(savedTheme);

themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
});

// --- Settings Management ---
function getSettings() {
    const order = [...effectPipeline.children].map(child => child.dataset.effect);
    return {
        order,
        scrambleHue: scrambleHue.checked,
        scrambleSaturation: scrambleSaturation.checked,
        scrambleMode: scrambleMode.value,
        brightnessMode: brightnessModeSelect.value,
        channelSwap: channelSwapSelect.value,
        pixelSort: pixelSortCheckbox.checked,
        sortDirection: sortDirection.value,
        sortCriteria: sortCriteria.value,
        sortThreshold: parseInt(sortThreshold.value),
        sortReverse: sortReverse.checked,
        enableCA: enableCA.checked,
        caIntensity: parseInt(caIntensity.value),
        enableDither: enableDither.checked,
        ditherDepth: parseInt(ditherDepth.value),
        ditherScale: parseInt(ditherScale.value),
        enableVoronoi: enableVoronoi.checked,
        voronoiCells: parseInt(voronoiCells.value)
    };
}

function applySettings(settings) {
    if (!settings) return;

    // Restore order
    if (settings.order) {
        settings.order.forEach(effectId => {
            const el = effectPipeline.querySelector(`[data-effect="${effectId}"]`);
            if (el) effectPipeline.appendChild(el);
        });
    }

    scrambleHue.checked = settings.scrambleHue;
    scrambleSaturation.checked = settings.scrambleSaturation;
    scrambleMode.value = settings.scrambleMode || 'consistent';
    brightnessModeSelect.value = settings.brightnessMode || 'luminance';

    channelSwapSelect.value = settings.channelSwap;
    pixelSortCheckbox.checked = settings.pixelSort;

    if (settings.sortDirection) sortDirection.value = settings.sortDirection;
    if (settings.sortCriteria) sortCriteria.value = settings.sortCriteria;
    if (settings.sortThreshold !== undefined) sortThreshold.value = settings.sortThreshold;
    if (settings.sortReverse !== undefined) sortReverse.checked = settings.sortReverse;

    enableCA.checked = !!settings.enableCA;
    if (settings.caIntensity) caIntensity.value = settings.caIntensity;

    enableDither.checked = !!settings.enableDither;
    if (settings.ditherDepth) ditherDepth.value = settings.ditherDepth;
    if (settings.ditherScale !== undefined) ditherScale.value = settings.ditherScale;

    enableVoronoi.checked = !!settings.enableVoronoi;
    if (settings.voronoiCells) voronoiCells.value = settings.voronoiCells;

    toggleSortControls();
    toggleEffectControls();
}

function toggleSortControls() {
    sortControls.style.display = pixelSortCheckbox.checked ? 'block' : 'none';
}

function toggleEffectControls() {
    caControls.style.display = enableCA.checked ? 'block' : 'none';
    ditherControls.style.display = enableDither.checked ? 'block' : 'none';
    voronoiControls.style.display = enableVoronoi.checked ? 'block' : 'none';
}

[pixelSortCheckbox, enableCA, enableDither, enableVoronoi].forEach(ctrl => {
    ctrl.addEventListener('change', () => {
        toggleSortControls();
        toggleEffectControls();
        triggerProcess(true);
    });
});

saveBtn.addEventListener('click', () => {
    localStorage.setItem('scrambler-config-v2', JSON.stringify(getSettings()));
    alert('Settings saved!');
});

loadBtn.addEventListener('click', () => {
    const saved = localStorage.getItem('scrambler-config-v2');
    if (saved) {
        applySettings(JSON.parse(saved));
        triggerProcess(true);
        alert('Settings loaded!');
    } else {
        alert('No saved settings found.');
    }
});

resetBtn.addEventListener('click', () => {
    if (confirm('Reset all settings and clear image?')) {
        fileInput.value = '';
        originalImage = null;
        originalCanvas.style.display = 'none';
        resultCanvas.style.display = 'none';
        originalPlaceholder.style.display = 'block';
        resultPlaceholder.style.display = 'block';
        processBtn.disabled = true;
        downloadBtn.disabled = true;

        // Reset defaults
        scrambleHue.checked = true;
        scrambleSaturation.checked = true;
        scrambleMode.value = 'consistent';
        brightnessModeSelect.value = 'luminance';
        channelSwapSelect.value = 'none';
        pixelSortCheckbox.checked = false;
        sortDirection.value = 'horizontal';
        sortCriteria.value = 'brightness';
        sortThreshold.value = 100;
        sortReverse.checked = false;
        enableCA.checked = false;
        caIntensity.value = 10;
        enableDither.checked = false;
        ditherDepth.value = 4;
        ditherScale.value = 1;
        enableVoronoi.checked = false;
        voronoiCells.value = 500;

        toggleSortControls();
        toggleEffectControls();
    }
});

// --- Resizable Sidebar ---
let isResizing = false;

resizer.addEventListener('mousedown', (e) => {
    isResizing = true;
    document.body.style.cursor = 'col-resize';
    resizer.classList.add('resizing');
    e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    const newWidth = Math.max(280, Math.min(600, e.clientX));
    document.documentElement.style.setProperty('--sidebar-width', `${newWidth}px`);
});

document.addEventListener('mouseup', () => {
    if (isResizing) {
        isResizing = false;
        document.body.style.cursor = 'default';
        resizer.classList.remove('resizing');
    }
});

// --- Image Processing Pipeline ---
let debounceTimer;
function triggerProcess(isImmediate = false) {
    if (!originalImage || processBtn.disabled) return;

    clearTimeout(debounceTimer);
    if (isImmediate) {
        processImage();
    } else {
        debounceTimer = setTimeout(processImage, 250);
    }
}

// Attach listeners to all controls
const autoControls = [
    scrambleHue, scrambleSaturation, scrambleMode, brightnessModeSelect,
    channelSwapSelect, sortDirection, sortCriteria, sortReverse,
    caIntensity, ditherDepth, ditherScale, voronoiCells
];

autoControls.forEach(ctrl => {
    const eventType = (ctrl.tagName === 'INPUT' && ctrl.type === 'range') ? 'input' : 'change';
    ctrl.addEventListener(eventType, () => triggerProcess(eventType === 'change'));
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                originalImage = img;
                displayOriginal(img);
                processBtn.disabled = false;
                downloadBtn.disabled = true;
                processImage();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

function displayOriginal(img) {
    originalCanvas.width = img.width;
    originalCanvas.height = img.height;
    const ctx = originalCanvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    originalCanvas.style.display = 'block';
    originalPlaceholder.style.display = 'none';
}

// --- Image Processing Algorithms ---

function rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const delta = max - min;
    let h = 0, s = max === 0 ? 0 : delta / max, v = max;
    if (delta !== 0) {
        if (max === r) h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
        else if (max === g) h = ((b - r) / delta + 2) / 6;
        else h = ((r - g) / delta + 4) / 6;
    }
    return [h, s, v];
}

function hsvToRgb(h, s, v) {
    let r, g, b;
    const i = Math.floor(h * 6), f = h * 6 - i, p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function calculateLuminance(r, g, b) {
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function adjustToLuminance(r, g, b, targetLuminance) {
    const currentLuminance = calculateLuminance(r, g, b);
    if (currentLuminance === 0) return [r, g, b];
    const ratio = targetLuminance / currentLuminance;
    r = Math.min(255, Math.max(0, r * ratio));
    g = Math.min(255, Math.max(0, g * ratio));
    b = Math.min(255, Math.max(0, b * ratio));
    for (let i = 0; i < 5; i++) {
        const diff = targetLuminance - calculateLuminance(r, g, b);
        if (Math.abs(diff) < 0.5) break;
        const adj = diff / 255;
        r = Math.min(255, Math.max(0, r + adj * 0.2126 * 255));
        g = Math.min(255, Math.max(0, g + adj * 0.7152 * 255));
        b = Math.min(255, Math.max(0, b + adj * 0.0722 * 255));
    }
    return [Math.round(r), Math.round(g), Math.round(b)];
}

function processImage() {
    if (!originalImage) return;
    const settings = getSettings();
    const width = originalCanvas.width;
    const height = originalCanvas.height;
    const ctx = originalCanvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Execute effects in the order of the DOM nodes
    settings.order.forEach(effectId => {
        switch (effectId) {
            case 'scramble':
                applyScramble(data, settings);
                break;
            case 'channelSwap':
                if (settings.channelSwap !== 'none') applyChannelSwap(data, settings.channelSwap);
                break;
            case 'pixelSort':
                if (settings.pixelSort) applyPixelSort(data, width, height, settings);
                break;
            case 'ca':
                if (settings.enableCA) applyChromaticAberration(data, width, height, settings.caIntensity);
                break;
            case 'dither':
                if (settings.enableDither) applyDithering(data, width, height, settings.ditherDepth, settings.ditherScale);
                break;
            case 'voronoi':
                if (settings.enableVoronoi) applyVoronoi(data, width, height, settings.voronoiCells);
                break;
        }
    });

    resultCanvas.width = width;
    resultCanvas.height = height;
    const resultCtx = resultCanvas.getContext('2d');
    resultCtx.putImageData(imageData, 0, 0);
    resultCanvas.style.display = 'block';
    resultPlaceholder.style.display = 'none';
    downloadBtn.disabled = false;
}

function applyScramble(data, settings) {
    const colorMap = new Map();
    for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] === 0) continue;
        let r = data[i], g = data[i + 1], b = data[i + 2];

        let nR, nG, nB;
        if (settings.scrambleMode === 'consistent') {
            const key = `${r},${g},${b}`;
            if (colorMap.has(key)) [nR, nG, nB] = colorMap.get(key);
            else {
                [nR, nG, nB] = scramblePixel(r, g, b, settings);
                colorMap.set(key, [nR, nG, nB]);
            }
        } else {
            [nR, nG, nB] = scramblePixel(r, g, b, settings);
        }
        data[i] = nR; data[i + 1] = nG; data[i + 2] = nB;
    }
}

function scramblePixel(r, g, b, settings) {
    const targetLuminance = calculateLuminance(r, g, b);
    let [h, s, v] = rgbToHsv(r, g, b);
    if (settings.scrambleHue) h = Math.random();
    if (settings.scrambleSaturation) s = Math.random();
    let [nR, nG, nB] = hsvToRgb(h, s, v);
    if (settings.brightnessMode === 'luminance') {
        [nR, nG, nB] = adjustToLuminance(nR, nG, nB, targetLuminance);
    }
    return [nR, nG, nB];
}

function applyChannelSwap(data, mode) {
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        let nR = r, nG = g, nB = b;
        switch (mode) {
            case 'rbg': nG = b; nB = g; break;
            case 'grb': nR = g; nG = r; break;
            case 'gbr': nR = g; nG = b; nB = r; break;
            case 'brg': nR = b; nG = r; nB = g; break;
            case 'bgr': nR = b; nB = r; break;
        }
        data[i] = nR; data[i + 1] = nG; data[i + 2] = nB;
    }
}

function applyChromaticAberration(data, width, height, intensity) {
    const originalData = new Uint8ClampedArray(data);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            if (x - intensity >= 0) {
                const rIdx = (y * width + (x - intensity)) * 4;
                data[idx] = originalData[rIdx];
            }
            if (x + intensity < width) {
                const bIdx = (y * width + (x + intensity)) * 4;
                data[idx + 2] = originalData[bIdx + 2];
            }
        }
    }
}

function applyDithering(data, width, height, levels, scale) {
    const factor = levels - 1;

    if (scale <= 1) {
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const oldR = data[idx], oldG = data[idx + 1], oldB = data[idx + 2];
                const newR = Math.round(factor * oldR / 255) * (255 / factor);
                const newG = Math.round(factor * oldG / 255) * (255 / factor);
                const newB = Math.round(factor * oldB / 255) * (255 / factor);
                data[idx] = newR; data[idx + 1] = newG; data[idx + 2] = newB;
                const errR = oldR - newR, errG = oldG - newG, errB = oldB - newB;
                distributeError(data, x + 1, y, width, height, errR, errG, errB, 7 / 16);
                distributeError(data, x - 1, y + 1, width, height, errR, errG, errB, 3 / 16);
                distributeError(data, x, y + 1, width, height, errR, errG, errB, 5 / 16);
                distributeError(data, x + 1, y + 1, width, height, errR, errG, errB, 1 / 16);
            }
        }
        return;
    }

    const lw = Math.ceil(width / scale);
    const lh = Math.ceil(height / scale);
    const lowResData = new Uint8ClampedArray(lw * lh * 4);

    // Downscale: Sample original data (Nearest Neighbor)
    for (let y = 0; y < lh; y++) {
        for (let x = 0; x < lw; x++) {
            const ox = Math.min(width - 1, Math.floor(x * scale));
            const oy = Math.min(height - 1, Math.floor(y * scale));
            const oIdx = (oy * width + ox) * 4;
            const lIdx = (y * lw + x) * 4;
            lowResData[lIdx] = data[oIdx];
            lowResData[lIdx + 1] = data[oIdx + 1];
            lowResData[lIdx + 2] = data[oIdx + 2];
            lowResData[lIdx + 3] = data[oIdx + 3];
        }
    }

    // Dither the low-res buffer
    for (let y = 0; y < lh; y++) {
        for (let x = 0; x < lw; x++) {
            const idx = (y * lw + x) * 4;
            const oldR = lowResData[idx], oldG = lowResData[idx + 1], oldB = lowResData[idx + 2];
            const newR = Math.round(factor * oldR / 255) * (255 / factor);
            const newG = Math.round(factor * oldG / 255) * (255 / factor);
            const newB = Math.round(factor * oldB / 255) * (255 / factor);
            lowResData[idx] = newR; lowResData[idx + 1] = newG; lowResData[idx + 2] = newB;
            const errR = oldR - newR, errG = oldG - newG, errB = oldB - newB;
            distributeError(lowResData, x + 1, y, lw, lh, errR, errG, errB, 7 / 16);
            distributeError(lowResData, x - 1, y + 1, lw, lh, errR, errG, errB, 3 / 16);
            distributeError(lowResData, x, y + 1, lw, lh, errR, errG, errB, 5 / 16);
            distributeError(lowResData, x + 1, y + 1, lw, lh, errR, errG, errB, 1 / 16);
        }
    }

    // Upscale: Fill blocks back to high-res data
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const lx = Math.floor(x / scale);
            const ly = Math.floor(y / scale);
            const lIdx = (ly * lw + lx) * 4;
            const oIdx = (y * width + x) * 4;
            data[oIdx] = lowResData[lIdx];
            data[oIdx + 1] = lowResData[lIdx + 1];
            data[oIdx + 2] = lowResData[lIdx + 2];
            data[oIdx + 3] = lowResData[lIdx + 3];
        }
    }
}

function distributeError(data, x, y, width, height, errR, errG, errB, weight) {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const idx = (y * width + x) * 4;
    data[idx] = Math.min(255, Math.max(0, data[idx] + errR * weight));
    data[idx + 1] = Math.min(255, Math.max(0, data[idx + 1] + errG * weight));
    data[idx + 2] = Math.min(255, Math.max(0, data[idx + 2] + errB * weight));
}

function applyVoronoi(data, width, height, cellCount) {
    const seeds = [];
    for (let i = 0; i < cellCount; i++) {
        const x = Math.floor(Math.random() * width);
        const y = Math.floor(Math.random() * height);
        seeds.push({ x, y, r: 0, g: 0, b: 0, count: 0 });
    }

    const pixelToSeed = new Int32Array(width * height);
    for (let i = 0; i < (width * height); i++) {
        const x = i % width;
        const y = Math.floor(i / width);
        let minDist = Infinity;
        let nearestSeed = 0;
        for (let s = 0; s < seeds.length; s++) {
            const dx = x - seeds[s].x;
            const dy = y - seeds[s].y;
            const dist = dx * dx + dy * dy;
            if (dist < minDist) {
                minDist = dist;
                nearestSeed = s;
            }
        }
        pixelToSeed[i] = nearestSeed;
        const idx = i * 4;
        seeds[nearestSeed].r += data[idx];
        seeds[nearestSeed].g += data[idx + 1];
        seeds[nearestSeed].b += data[idx + 2];
        seeds[nearestSeed].count++;
    }

    seeds.forEach(s => {
        if (s.count > 0) {
            s.r /= s.count; s.g /= s.count; s.b /= s.count;
        }
    });

    for (let i = 0; i < (width * height); i++) {
        const seed = seeds[pixelToSeed[i]];
        const idx = i * 4;
        data[idx] = seed.r;
        data[idx + 1] = seed.g;
        data[idx + 2] = seed.b;
    }
}

function applyPixelSort(data, width, height, settings) {
    const isHorizontal = settings.sortDirection === 'horizontal';
    const outerLimit = isHorizontal ? height : width;
    const innerLimit = isHorizontal ? width : height;

    for (let o = 0; o < outerLimit; o++) {
        let inner = 0;
        while (inner < innerLimit) {
            while (inner < innerLimit && !isAboveThreshold(o, inner, isHorizontal, data, width, settings)) {
                inner++;
            }
            let start = inner;
            while (inner < innerLimit && isAboveThreshold(o, inner, isHorizontal, data, width, settings)) {
                inner++;
            }
            if (start < inner) {
                sortSegment(o, start, inner, isHorizontal, data, width, settings);
            }
        }
    }
}

function isAboveThreshold(outer, inner, isHorizontal, data, width, settings) {
    const x = isHorizontal ? inner : outer;
    const y = isHorizontal ? outer : inner;
    const idx = (y * width + x) * 4;
    const r = data[idx], g = data[idx + 1], b = data[idx + 2];

    switch (settings.sortCriteria) {
        case 'brightness': return calculateLuminance(r, g, b) > settings.sortThreshold;
        case 'hue': return rgbToHsv(r, g, b)[0] * 255 > settings.sortThreshold;
        case 'saturation': return rgbToHsv(r, g, b)[1] * 255 > settings.sortThreshold;
        default: return true;
    }
}

function sortSegment(outer, start, end, isHorizontal, data, width, settings) {
    const segment = [];
    for (let i = start; i < end; i++) {
        const x = isHorizontal ? i : outer;
        const y = isHorizontal ? outer : i;
        const idx = (y * width + x) * 4;
        const r = data[idx], g = data[idx + 1], b = data[idx + 2], a = data[idx + 3];
        const hsv = rgbToHsv(r, g, b);
        let val;
        if (settings.sortCriteria === 'brightness') val = calculateLuminance(r, g, b);
        else if (settings.sortCriteria === 'hue') val = hsv[0];
        else val = hsv[1];
        segment.push({ r, g, b, a, val });
    }

    segment.sort((a, b) => settings.sortReverse ? b.val - a.val : a.val - b.val);

    for (let i = start; i < end; i++) {
        const x = isHorizontal ? i : outer;
        const y = isHorizontal ? outer : i;
        const idx = (y * width + x) * 4;
        const p = segment[i - start];
        data[idx] = p.r;
        data[idx + 1] = p.g;
        data[idx + 2] = p.b;
        data[idx + 3] = p.a;
    }
}

processBtn.addEventListener('click', () => processImage());

downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'scrambled-image.png';
    link.href = resultCanvas.toDataURL();
    link.click();
});

// Initialize dragging on load
initDragging();
