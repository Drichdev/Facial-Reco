const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('fileInput');
const preview = document.getElementById('preview');
const scoreElement = document.getElementById('score');
const matchElement = document.getElementById('match');
const startCameraBtn = document.getElementById('startCamera');
const clearImageBtn = document.getElementById('clearImage');

let uploadedDescriptor = null;
let isModelLoaded = false;
let detectionInterval = null;
const THRESHOLD = 0.6;

async function loadModels() {
    try {
        console.log('Chargement des modèles depuis CDN...');
        
        const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
        
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        
        isModelLoaded = true;
        console.log('Modèles chargés avec succès');
    } catch (error) {
        console.error('Erreur lors du chargement des modèles:', error);
        alert('Erreur lors du chargement des modèles. Vérifiez votre connexion internet.');
    }
}

async function startVideo() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: "user"
            } 
        });
        video.srcObject = stream;
        
        startCameraBtn.style.display = 'none';
        document.querySelector('.camera-pending').style.display = 'none';
        video.style.display = 'block';
        canvas.style.display = 'block';
        
        video.onloadedmetadata = () => {
            faceapi.matchDimensions(canvas, { width: video.videoWidth, height: video.videoHeight });
        };
    } catch (error) {
        console.error('Erreur lors de l\'accès à la caméra:', error);
        alert('Vous devez autoriser l\'accès à la caméra pour utiliser cette application.');
    }
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight() {
    dropArea.classList.add('highlight');
}

function unhighlight() {
    dropArea.classList.remove('highlight');
}

async function handleFiles(files) {
    const file = files[0];
    if (!file || !file.type.match('image.*')) {
        alert('Veuillez sélectionner une image valide.');
        return;
    }

    const reader = new FileReader();
    reader.onload = async function(event) {
        preview.src = event.target.result;
        preview.style.display = 'block';
        clearImageBtn.style.display = 'block';
        
        try {
            const img = await faceapi.fetchImage(event.target.result);
            const detections = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptor();
            
            if (detections) {
                uploadedDescriptor = detections.descriptor;
                startDetection();
            } else {
                alert('Aucun visage détecté dans l\'image. Veuillez essayer avec une autre image.');
                resetImage();
            }
        } catch (error) {
            console.error('Erreur lors du traitement de l\'image:', error);
            alert('Une erreur est survenue lors du traitement de l\'image.');
            resetImage();
        }
    };
    reader.readAsDataURL(file);
}

function resetImage() {
    preview.src = '';
    preview.style.display = 'none';
    clearImageBtn.style.display = 'none';
    uploadedDescriptor = null;
    
    scoreElement.textContent = '0';
    matchElement.textContent = 'En attente...';
    matchElement.className = 'match';
    
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    if (detectionInterval) {
        clearInterval(detectionInterval);
        detectionInterval = null;
    }
}

function startDetection() {
    if (detectionInterval) {
        clearInterval(detectionInterval);
    }
    
    detectionInterval = setInterval(async () => {
        if (!uploadedDescriptor || !isModelLoaded || !video.srcObject) return;
        
        try {
            const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptor();
            
            const displaySize = { width: video.videoWidth, height: video.videoHeight };
            faceapi.matchDimensions(canvas, displaySize);
            
            const context = canvas.getContext('2d');
            context.clearRect(0, 0, canvas.width, canvas.height);
            
            if (detections) {
                const resizedDetections = faceapi.resizeResults(detections, displaySize);
                const box = resizedDetections.detection.box;
                
                // Dessiner le cadre ROUGE
                context.strokeStyle = '#e74c3c';
                context.lineWidth = 4;
                context.strokeRect(box.x, box.y, box.width, box.height);
                
                // Calcule de la similarité
                const distance = faceapi.euclideanDistance(uploadedDescriptor, detections.descriptor);
                const similarityScore = 1 - distance;
                
                scoreElement.textContent = similarityScore.toFixed(2);
                
                if (similarityScore > THRESHOLD) {
                    matchElement.textContent = 'SUCCESS';
                    matchElement.className = 'match success';
                } else {
                    matchElement.textContent = 'FAILURE';
                    matchElement.className = 'match failure';
                }
            } else {
                scoreElement.textContent = '0';
                matchElement.textContent = 'Aucun visage détecté';
                matchElement.className = 'match';
            }
        } catch (error) {
            console.error('Erreur lors de la détection:', error);
        }
    }, 500);
}

function setupEventListeners() {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    dropArea.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        handleFiles(files);
    }, false);
    
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
        e.target.value = ''; // Permet de re-sélectionner le même fichier
    }, false);
    
    startCameraBtn.addEventListener('click', startVideo);
    
    clearImageBtn.addEventListener('click', resetImage);
}

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadModels();
});