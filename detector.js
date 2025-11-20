// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function() {
        const tabName = this.getAttribute('data-tab');
        
        // Update active tab
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        
        // Update active content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName + 'Tab').classList.add('active');
    });
});

// ==================== IMAGE DETECTION ====================

let currentImage = null;
let imageDetectionResult = null;

const imageUploadInput = document.getElementById('imageUpload');
const imageUrlInput = document.getElementById('imageUrlInput');
const imageUrlLoadButton = document.getElementById('imageUrlLoadButton');
const imageSection = document.getElementById('imageSection');
const uploadedImage = document.getElementById('uploadedImage');
const markedCanvas = document.getElementById('markedCanvas');
const imageScanButton = document.getElementById('imageScanButton');
const imageScanIcon = document.getElementById('imageScanIcon');
const imageScanText = document.getElementById('imageScanText');
const imageProgressSection = document.getElementById('imageProgressSection');
const imageProgressBar = document.getElementById('imageProgressBar');
const imageProgressText = document.getElementById('imageProgressText');
const imageResultsSection = document.getElementById('imageResultsSection');

imageUploadInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(event) {
            currentImage = event.target.result;
            uploadedImage.src = currentImage;
            uploadedImage.style.display = 'block';
            markedCanvas.style.display = 'none';
            imageSection.classList.remove('hidden');
            imageResultsSection.classList.add('hidden');
            imageProgressSection.classList.add('hidden');
            imageResultsSection.classList.remove('ai-detected', 'human-created');
        };
        reader.readAsDataURL(file);
    }
});

// URL Loading for Images
imageUrlLoadButton.addEventListener('click', loadImageFromUrl);
imageUrlInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        loadImageFromUrl();
    }
});

async function loadImageFromUrl() {
    const url = imageUrlInput.value.trim();
    if (!url) return;
    
    imageUrlLoadButton.disabled = true;
    imageUrlLoadButton.textContent = 'Loading...';
    
    try {
        // Fetch the image from URL
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to load image');
        
        const blob = await response.blob();
        
        // Check if it's an image
        if (!blob.type.startsWith('image/')) {
            throw new Error('URL does not point to an image');
        }
        
        // Convert to data URL
        const reader = new FileReader();
        reader.onload = function(event) {
            currentImage = event.target.result;
            uploadedImage.src = currentImage;
            uploadedImage.style.display = 'block';
            markedCanvas.style.display = 'none';
            imageSection.classList.remove('hidden');
            imageResultsSection.classList.add('hidden');
            imageProgressSection.classList.add('hidden');
            imageResultsSection.classList.remove('ai-detected', 'human-created');
            
            imageUrlLoadButton.disabled = false;
            imageUrlLoadButton.textContent = 'Load';
        };
        reader.readAsDataURL(blob);
        
    } catch (error) {
        console.error('Error loading image from URL:', error);
        alert('Failed to load image from URL. Please check the URL and try again.');
        imageUrlLoadButton.disabled = false;
        imageUrlLoadButton.textContent = 'Load';
    }
}

imageScanButton.addEventListener('click', async function() {
    if (!currentImage) return;
    
    imageScanButton.disabled = true;
    imageScanIcon.classList.add('animate-spin');
    imageScanText.textContent = 'Analyzing...';
    imageProgressSection.classList.remove('hidden');
    imageResultsSection.classList.add('hidden');
    imageResultsSection.classList.remove('ai-detected', 'human-created');

    let progress = 0;
    const progressInterval = setInterval(() => {
        progress = Math.min(progress + 10, 90);
        imageProgressBar.style.width = progress + '%';
        if (progress < 30) {
            imageProgressText.textContent = 'Analyzing pixels...';
        } else if (progress < 60) {
            imageProgressText.textContent = 'Checking AI patterns...';
        } else if (progress < 90) {
            imageProgressText.textContent = 'Running detection...';
        }
    }, 200);

    try {
        let apiResult = null;
        let heuristicResult = null;
        
        // Try API first
        try {
            apiResult = await detectImageWithMultipleAPIs(currentImage);
        } catch (error) {
            console.log('API detection failed:', error);
        }
        
        // Always run heuristic analysis
        heuristicResult = await analyzeImageHeuristicsAdvanced(currentImage);
        
        // Combine results - if API says AI or heuristic says AI, mark as AI
        let finalResult;
        if (apiResult && heuristicResult) {
            // Weighted average: 70% API, 30% heuristic
            const combinedConfidence = (apiResult.confidence * 0.7) + (heuristicResult.confidence * 0.3);
            finalResult = {
                isAI: combinedConfidence > 0.45, // Lower threshold for better detection
                confidence: combinedConfidence,
                method: 'hybrid'
            };
        } else if (apiResult) {
            finalResult = apiResult;
        } else {
            finalResult = heuristicResult;
        }

        clearInterval(progressInterval);
        imageProgressBar.style.width = '100%';
        imageProgressText.textContent = 'Complete';

        setTimeout(() => {
            showImageResults(finalResult);
            if (finalResult.isAI) {
                drawPaintStroke(finalResult);
            }
            imageScanButton.disabled = false;
            imageScanIcon.classList.remove('animate-spin');
            imageScanText.textContent = 'Analyze Image';
        }, 500);

    } catch (error) {
        console.error('Detection error:', error);
        clearInterval(progressInterval);
        imageProgressSection.classList.add('hidden');
        imageScanButton.disabled = false;
        imageScanIcon.classList.remove('animate-spin');
        imageScanText.textContent = 'Analyze Image';
        
        // Show error
        imageResultsSection.classList.remove('hidden');
        imageResultsSection.classList.add('ai-detected');
        document.getElementById('imageResultIcon').innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>';
        document.getElementById('imageResultIcon').className = 'results-icon ai';
        document.getElementById('imageResultTitle').textContent = 'Detection Failed';
        document.getElementById('imageResultTitle').className = 'results-title ai';
        document.getElementById('imageMethodText').textContent = 'Please try again';
    }
});

// Try multiple API models for better accuracy
async function detectImageWithMultipleAPIs(imageData) {
    const blob = await fetch(imageData).then(r => r.blob());
    
    // Try primary API
    try {
        const response = await fetch(
            "https://api-inference.huggingface.co/models/umm-maybe/AI-image-detector",
            {
                method: "POST",
                body: blob,
                headers: {
                    "Content-Type": "application/octet-stream"
                }
            }
        );

        if (response.ok) {
            const result = await response.json();
            let aiScore = 0;
            
            if (Array.isArray(result)) {
                const aiLabel = result.find(r => 
                    r.label && (
                        r.label.toLowerCase().includes('artificial') || 
                        r.label.toLowerCase().includes('ai') ||
                        r.label.toLowerCase().includes('fake') ||
                        r.label.toLowerCase().includes('generated')
                    )
                );
                if (aiLabel) {
                    aiScore = aiLabel.score;
                } else if (result[0]) {
                    // Check if first result indicates AI
                    const label = result[0].label.toLowerCase();
                    if (label.includes('artificial') || label.includes('ai') || label.includes('fake')) {
                        aiScore = result[0].score;
                    } else {
                        aiScore = 1 - result[0].score;
                    }
                }
            }

            return {
                isAI: aiScore > 0.45,
                confidence: aiScore,
                method: 'api'
            };
        }
    } catch (error) {
        console.log('Primary API failed, trying fallback');
    }
    
    // Try fallback API
    try {
        const response = await fetch(
            "https://api-inference.huggingface.co/models/Organika/sdxl-detector",
            {
                method: "POST",
                body: blob,
                headers: {
                    "Content-Type": "application/octet-stream"
                }
            }
        );

        if (response.ok) {
            const result = await response.json();
            let aiScore = 0;
            
            if (Array.isArray(result)) {
                const aiLabel = result.find(r => 
                    r.label && (
                        r.label.toLowerCase().includes('artificial') || 
                        r.label.toLowerCase().includes('ai') ||
                        r.label.toLowerCase().includes('fake') ||
                        r.label.toLowerCase().includes('generated') ||
                        r.label.toLowerCase().includes('sdxl')
                    )
                );
                if (aiLabel) {
                    aiScore = aiLabel.score;
                } else if (result[0]) {
                    aiScore = result[0].score;
                }
            }

            return {
                isAI: aiScore > 0.45,
                confidence: aiScore,
                method: 'api'
            };
        }
    } catch (error) {
        console.log('Fallback API also failed');
    }
    
    throw new Error('All API attempts failed');
}

// Advanced heuristic analysis
async function analyzeImageHeuristicsAdvanced(imageData) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;
            
            let aiScore = 0;
            
            // 1. Extreme smoothness check (AI images are often TOO smooth)
            let smoothness = 0;
            for (let i = 0; i < data.length - 4; i += 4) {
                const diff = Math.abs(data[i] - data[i + 4]) + 
                           Math.abs(data[i + 1] - data[i + 5]) + 
                           Math.abs(data[i + 2] - data[i + 6]);
                smoothness += diff;
            }
            smoothness = smoothness / (data.length / 4);
            if (smoothness < 20) aiScore += 15;
            if (smoothness < 12) aiScore += 10; // Extra penalty for very smooth
            
            // 2. Color distribution analysis
            const colors = new Set();
            const colorFreq = {};
            for (let i = 0; i < data.length; i += 4) {
                const color = `${Math.floor(data[i]/16)*16},${Math.floor(data[i+1]/16)*16},${Math.floor(data[i+2]/16)*16}`;
                colors.add(color);
                colorFreq[color] = (colorFreq[color] || 0) + 1;
            }
            
            // AI images often have limited color palette
            if (colors.size < 1500) aiScore += 12;
            if (colors.size < 800) aiScore += 10;
            
            // 3. Texture variance (AI lacks natural texture variation)
            let sum = 0;
            for (let i = 0; i < data.length; i += 4) {
                sum += data[i];
            }
            const mean = sum / (data.length / 4);
            let variance = 0;
            for (let i = 0; i < data.length; i += 4) {
                variance += Math.pow(data[i] - mean, 2);
            }
            variance = variance / (data.length / 4);
            if (variance < 4000) aiScore += 12;
            if (variance < 2000) aiScore += 10;
            
            // 4. Enhanced edge detection
            let edges = 0;
            let sharpEdges = 0;
            for (let i = canvas.width * 4; i < data.length - canvas.width * 4; i += 4) {
                const edgeDiff = Math.abs(data[i] - data[i + canvas.width * 4]);
                edges += edgeDiff;
                if (edgeDiff > 50) sharpEdges++;
            }
            edges = edges / data.length;
            
            // AI images have unnaturally consistent edges
            if (edges > 20 && edges < 40) aiScore += 10;
            
            // 5. Noise pattern analysis - AI images lack natural noise
            let noiseScore = 0;
            for (let i = 0; i < Math.min(10000, data.length); i += 40) {
                const neighbors = [
                    data[i], 
                    data[Math.min(i + 4, data.length - 1)],
                    data[Math.min(i + canvas.width * 4, data.length - 1)]
                ];
                const avgNeighbor = neighbors.reduce((a, b) => a + b, 0) / neighbors.length;
                const deviation = Math.abs(data[i] - avgNeighbor);
                if (deviation < 5) noiseScore++;
            }
            const noiseRatio = noiseScore / Math.min(10000, data.length) * 40;
            if (noiseRatio > 0.7) aiScore += 15; // Too uniform = likely AI
            
            // 6. Color saturation check (AI often has unrealistic saturation)
            let highSaturation = 0;
            for (let i = 0; i < data.length; i += 40) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const max = Math.max(r, g, b);
                const min = Math.min(r, g, b);
                const saturation = max === 0 ? 0 : (max - min) / max;
                if (saturation > 0.7) highSaturation++;
            }
            const saturationRatio = highSaturation / (data.length / 40);
            if (saturationRatio > 0.4) aiScore += 8;
            
            // 7. Check for perfect patterns (AI often creates too-perfect patterns)
            let patternScore = 0;
            const sampleSize = Math.min(1000, canvas.width);
            for (let i = 0; i < sampleSize; i += 10) {
                if (i + 100 < data.length) {
                    let similarity = 0;
                    for (let j = 0; j < 100; j += 4) {
                        similarity += Math.abs(data[i + j] - data[i + j + canvas.width * 4]) < 10 ? 1 : 0;
                    }
                    if (similarity > 15) patternScore++;
                }
            }
            if (patternScore > sampleSize / 200) aiScore += 8;
            
            const confidence = Math.min(Math.max(aiScore, 0), 100) / 100;
            resolve({
                isAI: confidence > 0.5, // Lower threshold
                confidence: confidence,
                method: 'advanced-heuristic'
            });
        };
        img.src = imageData;
    });
}

function drawPieChart(aiPercentage, canvasId) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    const centerX = 50;
    const centerY = 50;
    const radius = 42;
    
    // Clear canvas
    ctx.clearRect(0, 0, 100, 100);
    
    // Draw background circle (human percentage)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = '#34c759';
    ctx.fill();
    
    // Draw AI percentage slice
    if (aiPercentage > 0) {
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, -0.5 * Math.PI, (-0.5 + 2 * aiPercentage) * Math.PI);
        ctx.closePath();
        ctx.fillStyle = '#ff3b30';
        ctx.fill();
    }
    
    // Draw inner circle (donut effect)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 12, 0, 2 * Math.PI);
    ctx.fillStyle = '#1c1c1e';
    ctx.fill();
}

function showImageResults(result) {
    imageDetectionResult = result;
    imageResultsSection.classList.remove('hidden');
    
    const resultIcon = document.getElementById('imageResultIcon');
    const resultTitle = document.getElementById('imageResultTitle');
    const methodText = document.getElementById('imageMethodText');
    const chartPercentage = document.getElementById('imageChartPercentage');
    const aiPercent = document.getElementById('imageAiPercent');
    const humanPercent = document.getElementById('imageHumanPercent');

    const aiPercentageValue = (result.confidence * 100).toFixed(1);
    const humanPercentageValue = (100 - result.confidence * 100).toFixed(1);

    if (result.isAI) {
        imageResultsSection.classList.add('ai-detected');
        imageResultsSection.classList.remove('human-created');
        resultIcon.className = 'results-icon ai';
        resultIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>';
        resultTitle.textContent = 'AI-Generated';
        resultTitle.className = 'results-title ai';
    } else {
        imageResultsSection.classList.add('human-created');
        imageResultsSection.classList.remove('ai-detected');
        resultIcon.className = 'results-icon human';
        resultIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>';
        resultTitle.textContent = 'Human-Created';
        resultTitle.className = 'results-title human';
    }

    chartPercentage.textContent = aiPercentageValue + '%';
    aiPercent.textContent = aiPercentageValue + '%';
    humanPercent.textContent = humanPercentageValue + '%';
    
    drawPieChart(result.confidence, 'pieChart');

    const methodLabels = {
        'api': 'AI Model Detection',
        'hybrid': 'Hybrid Analysis',
        'advanced-heuristic': 'Advanced Analysis'
    };
    methodText.textContent = methodLabels[result.method] || 'Analysis';
}

function drawPaintStroke(result) {
    const img = uploadedImage;
    const canvas = markedCanvas;
    const ctx = canvas.getContext('2d');
    
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);
    
    // Draw black paint strokes
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = '#000000';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    for (let i = 0; i < 15; i++) {
        ctx.lineWidth = Math.random() * 80 + 40;
        ctx.beginPath();
        
        const startX = Math.random() * canvas.width;
        const startY = Math.random() * canvas.height;
        const endX = Math.random() * canvas.width;
        const endY = Math.random() * canvas.height;
        
        ctx.moveTo(startX, startY);
        
        const cp1x = startX + (Math.random() - 0.5) * canvas.width * 0.5;
        const cp1y = startY + (Math.random() - 0.5) * canvas.height * 0.5;
        const cp2x = endX + (Math.random() - 0.5) * canvas.width * 0.5;
        const cp2y = endY + (Math.random() - 0.5) * canvas.height * 0.5;
        
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
        ctx.stroke();
    }
    
    // Add warning text
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = '#ff3b30';
    ctx.strokeStyle = '#000000';
    ctx.font = 'bold 60px -apple-system, Arial';
    ctx.lineWidth = 4;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const x = canvas.width / 2;
    const y = canvas.height / 2;
    
    ctx.strokeText('AI DETECTED', x, y);
    ctx.fillText('AI DETECTED', x, y);
    
    ctx.font = 'bold 32px -apple-system, Arial';
    const conf = (result.confidence * 100).toFixed(0) + '% AI-Generated';
    ctx.strokeText(conf, x, y + 70);
    ctx.fillText(conf, x, y + 70);
    
    uploadedImage.style.display = 'none';
    markedCanvas.style.display = 'block';
}

// ==================== MUSIC DETECTION ====================

let currentMusic = null;
let musicDetectionResult = null;

const musicUploadInput = document.getElementById('musicUpload');
const musicUrlInput = document.getElementById('musicUrlInput');
const musicUrlLoadButton = document.getElementById('musicUrlLoadButton');
const musicSection = document.getElementById('musicSection');
const audioPlayer = document.getElementById('audioPlayer');
const audioFileName = document.getElementById('audioFileName');
const audioFileSize = document.getElementById('audioFileSize');
const musicScanButton = document.getElementById('musicScanButton');
const musicScanIcon = document.getElementById('musicScanIcon');
const musicScanText = document.getElementById('musicScanText');
const musicProgressSection = document.getElementById('musicProgressSection');
const musicProgressBar = document.getElementById('musicProgressBar');
const musicProgressText = document.getElementById('musicProgressText');
const musicResultsSection = document.getElementById('musicResultsSection');

musicUploadInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('audio/')) {
        currentMusic = file;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            audioPlayer.src = event.target.result;
        };
        reader.readAsDataURL(file);
        
        audioFileName.textContent = file.name;
        audioFileSize.textContent = (file.size / 1024 / 1024).toFixed(2) + ' MB';
        
        musicSection.classList.remove('hidden');
        musicResultsSection.classList.add('hidden');
        musicProgressSection.classList.add('hidden');
        musicResultsSection.classList.remove('ai-detected', 'human-created');
    }
});

// URL Loading for Music
musicUrlLoadButton.addEventListener('click', loadMusicFromUrl);
musicUrlInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        loadMusicFromUrl();
    }
});

async function loadMusicFromUrl() {
    const url = musicUrlInput.value.trim();
    if (!url) return;
    
    musicUrlLoadButton.disabled = true;
    musicUrlLoadButton.textContent = 'Loading...';
    
    try {
        // Fetch the audio from URL
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to load audio');
        
        const blob = await response.blob();
        
        // Check if it's audio
        if (!blob.type.startsWith('audio/')) {
            throw new Error('URL does not point to an audio file');
        }
        
        currentMusic = new File([blob], 'audio-from-url', { type: blob.type });
        
        // Convert to data URL for player
        const reader = new FileReader();
        reader.onload = function(event) {
            audioPlayer.src = event.target.result;
        };
        reader.readAsDataURL(blob);
        
        // Extract filename from URL
        const urlPath = new URL(url).pathname;
        const fileName = urlPath.split('/').pop() || 'audio-from-url';
        
        audioFileName.textContent = fileName;
        audioFileSize.textContent = (blob.size / 1024 / 1024).toFixed(2) + ' MB';
        
        musicSection.classList.remove('hidden');
        musicResultsSection.classList.add('hidden');
        musicProgressSection.classList.add('hidden');
        musicResultsSection.classList.remove('ai-detected', 'human-created');
        
        musicUrlLoadButton.disabled = false;
        musicUrlLoadButton.textContent = 'Load';
        
    } catch (error) {
        console.error('Error loading audio from URL:', error);
        alert('Failed to load audio from URL. Please check the URL and try again.');
        musicUrlLoadButton.disabled = false;
        musicUrlLoadButton.textContent = 'Load';
    }
}

musicScanButton.addEventListener('click', async function() {
    if (!currentMusic) return;
    
    musicScanButton.disabled = true;
    musicScanIcon.classList.add('animate-spin');
    musicScanText.textContent = 'Analyzing...';
    musicProgressSection.classList.remove('hidden');
    musicResultsSection.classList.add('hidden');
    musicResultsSection.classList.remove('ai-detected', 'human-created');

    let progress = 0;
    const progressInterval = setInterval(() => {
        progress = Math.min(progress + 10, 90);
        musicProgressBar.style.width = progress + '%';
        if (progress < 50) {
            musicProgressText.textContent = 'Analyzing audio patterns...';
        } else if (progress < 90) {
            musicProgressText.textContent = 'Running detection...';
        }
    }, 200);

    try {
        // Use heuristic analysis for music (no free API available)
        const result = await analyzeMusicHeuristics(currentMusic);

        clearInterval(progressInterval);
        musicProgressBar.style.width = '100%';
        musicProgressText.textContent = 'Complete';

        setTimeout(() => {
            showMusicResults(result);
            musicScanButton.disabled = false;
            musicScanIcon.classList.remove('animate-spin');
            musicScanText.textContent = 'Analyze Music';
        }, 500);

    } catch (error) {
        console.error('Detection error:', error);
        clearInterval(progressInterval);
        musicProgressSection.classList.add('hidden');
        musicScanButton.disabled = false;
        musicScanIcon.classList.remove('animate-spin');
        musicScanText.textContent = 'Analyze Music';
        
        // Show error
        musicResultsSection.classList.remove('hidden');
        musicResultsSection.classList.add('ai-detected');
        document.getElementById('musicResultIcon').innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>';
        document.getElementById('musicResultIcon').className = 'results-icon ai';
        document.getElementById('musicResultTitle').textContent = 'Detection Failed';
        document.getElementById('musicResultTitle').className = 'results-title ai';
        document.getElementById('musicMethodText').textContent = 'Please try again';
    }
});

async function analyzeMusicHeuristics(audioFile) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = async function(event) {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            try {
                const arrayBuffer = event.target.result;
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                
                const channelData = audioBuffer.getChannelData(0);
                let aiScore = 0;
                
                // Analyze audio characteristics
                
                // 1. Dynamic range analysis
                let max = 0, min = 0;
                for (let i = 0; i < channelData.length; i++) {
                    max = Math.max(max, channelData[i]);
                    min = Math.min(min, channelData[i]);
                }
                const dynamicRange = max - min;
                if (dynamicRange < 1.5) aiScore += 25; // AI music often has compressed dynamics
                
                // 2. Zero-crossing rate (measure of noise/smoothness)
                let zeroCrossings = 0;
                for (let i = 1; i < channelData.length; i++) {
                    if ((channelData[i] >= 0 && channelData[i - 1] < 0) || 
                        (channelData[i] < 0 && channelData[i - 1] >= 0)) {
                        zeroCrossings++;
                    }
                }
                const zcr = zeroCrossings / channelData.length;
                if (zcr < 0.05) aiScore += 20; // AI often produces smoother waveforms
                
                // 3. Repetition detection
                const sampleSize = Math.min(44100, channelData.length); // 1 second sample
                let similarity = 0;
                for (let i = 0; i < sampleSize / 2; i++) {
                    similarity += Math.abs(channelData[i] - channelData[i + sampleSize / 2]);
                }
                similarity = similarity / (sampleSize / 2);
                if (similarity < 0.3) aiScore += 30; // AI music can be more repetitive
                
                // 4. Spectral analysis (basic)
                let energy = 0;
                for (let i = 0; i < channelData.length; i++) {
                    energy += channelData[i] * channelData[i];
                }
                energy = energy / channelData.length;
                if (energy < 0.05) aiScore += 25; // AI music might have different energy distribution
                
                const confidence = Math.min(Math.max(aiScore, 0), 100) / 100;
                
                audioContext.close();
                resolve({
                    isAI: confidence > 0.6,
                    confidence: confidence,
                    method: 'heuristic'
                });
            } catch (error) {
                audioContext.close();
                throw error;
            }
        };
        reader.readAsArrayBuffer(audioFile);
    });
}

function showMusicResults(result) {
    musicDetectionResult = result;
    musicResultsSection.classList.remove('hidden');
    
    const resultIcon = document.getElementById('musicResultIcon');
    const resultTitle = document.getElementById('musicResultTitle');
    const methodText = document.getElementById('musicMethodText');
    const chartPercentage = document.getElementById('musicChartPercentage');
    const aiPercent = document.getElementById('musicAiPercent');
    const humanPercent = document.getElementById('musicHumanPercent');

    const aiPercentageValue = (result.confidence * 100).toFixed(1);
    const humanPercentageValue = (100 - result.confidence * 100).toFixed(1);

    if (result.isAI) {
        musicResultsSection.classList.add('ai-detected');
        musicResultsSection.classList.remove('human-created');
        resultIcon.className = 'results-icon ai';
        resultIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>';
        resultTitle.textContent = 'AI-Generated';
        resultTitle.className = 'results-title ai';
    } else {
        musicResultsSection.classList.add('human-created');
        musicResultsSection.classList.remove('ai-detected');
        resultIcon.className = 'results-icon human';
        resultIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>';
        resultTitle.textContent = 'Human-Created';
        resultTitle.className = 'results-title human';
    }

    chartPercentage.textContent = aiPercentageValue + '%';
    aiPercent.textContent = aiPercentageValue + '%';
    humanPercent.textContent = humanPercentageValue + '%';
    
    drawPieChart(result.confidence, 'musicPieChart');

    methodText.textContent = 'Audio Analysis';
}