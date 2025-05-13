# Real-Time Facial Recognition Project

## Description
This project compares an uploaded image with a live webcam feed in real-time to determine if the faces match. The application uses AI-powered facial recognition to calculate a similarity score and displays a detection box around the face.

Website link: [Facial Recognition with file](https://drichdev.github.io//)


## 🛠 Features
- **Image upload** via drag & drop or file selection
- **Camera activation** with permission request
- **Real-time face detection** with red bounding box
- **Similarity calculation** between faces
- **Results display** (score + match/mismatch)
- **Manual removal** of uploaded image

## AI Components
The project uses the following models from `face-api.js`.

1. **Tiny Face Detector**:
   - Lightweight neural network for face detection
   - Optimized for real-time performance

2. **Face Landmark 68**:
   - Detects 68 facial landmarks
   - Enables precise facial feature analysis

3. **Face Recognition Net**:
   - Extracts facial descriptors (embeddings)
   - Converts faces to 128-dimensional vectors
   - Compares faces using Euclidean distance

## How It Works

### Core Workflow:
1. **Load models** from CDN
2. **Upload reference image**:
   - Extract facial descriptor
3. **Activate camera**:
   - Capture video stream
4. **Real-time detection**:
   - Detect face in video stream
   - Extract descriptor
   - Calculate similarity with reference image
5. **Display results**:
   - Similarity score (0-1)
   - "SUCCESS" or "FAILURE" indicator
   - Red bounding box around detected face
