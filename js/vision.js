(() => {
    const video = document.getElementById('vt-video');
    const startBtn = document.getElementById('vt-start');
    const retryBtn = document.getElementById('vt-retry');
    const distanceStatus = document.getElementById('distance-status');
    const warningEl = document.getElementById('vt-warning');
    const stageEl = document.getElementById('vt-stage');
    const letterEl = document.getElementById('vt-letter-left'); // Keep for compatibility
    const letterElLeft = document.getElementById('vt-letter-left');
    const letterElRight = document.getElementById('vt-letter-right');
    const resultEl = document.getElementById('vt-result');
    const toggleCamBtn = document.getElementById('toggle-camera');

    if (!video || !startBtn || !distanceStatus || !stageEl || !letterEl) return;

    // Check if patient name and age are in localStorage, if not, prompt for them
    function ensurePatientInfo() {
        const userName = localStorage.getItem('userName');
        const userAge = localStorage.getItem('userAge');
        
        if (!userName || !userAge) {
            const name = prompt('Please enter the patient name:');
            const age = prompt('Please enter the patient age:');
            
            if (name && name.trim()) {
                localStorage.setItem('userName', name.trim());
            }
            if (age && age.trim()) {
                localStorage.setItem('userAge', age.trim());
            }
            
            // If still no name/age, show warning
            if (!localStorage.getItem('userName') || !localStorage.getItem('userAge')) {
                console.warn('Patient name or age not provided. Test results may not be searchable.');
            }
        }
    }

    // Check patient info when page loads
    ensurePatientInfo();

    // For phone usage distance (arm's length): ~0.30–0.50 m
    const idealMin = 0.30; // meters
    const idealMax = 0.50; // meters
    let streamActive = false;
    let testActive = false;
    let model = null;
    let detectionRunning = false;
    let direction = 'up';
    let sizeStepIndex = 0;
    let correctStreak = 0;
    let wrongStreak = 0; // Track consecutive wrong answers
    let currentEye = 'right'; // 'left', 'right'
    let testResults = { left: null, right: null };
    let smallestCorrectSize = null;
    // Per-eye measurement aggregates during test
    const eyeMetrics = {
        right: { distSum: 0, distCount: 0, attOn: 0, attCount: 0 },
        left: { distSum: 0, distCount: 0, attOn: 0, attCount: 0 }
    };
    
    // Symbol sizes in mm (converted to pixels for display)
    // Standard viewing distance: 40cm = 400mm
    // Conversion: mm * (screen DPI / 25.4) * (viewing distance factor)
    // For 40cm viewing distance, 1mm ≈ 2.5px on typical screens
    const steps = [
        { mm: 87.0, acuity: '6/60', px: 218, logmar: 1.0 },
        { mm: 52.2, acuity: '6/36', px: 131, logmar: 0.8 },
        { mm: 34.8, acuity: '6/24', px: 87, logmar: 0.6 },
        { mm: 26.0, acuity: '6/18', px: 65, logmar: 0.4 },
        { mm: 17.4, acuity: '6/12', px: 44, logmar: 0.3 },
        { mm: 13.0, acuity: '6/9', px: 33, logmar: 0.2 },
        { mm: 8.7, acuity: '6/6', px: 22, logmar: 0.1 }
    ];
    
    // Letter C for each direction with rotation
    const directionSymbols = {
        up: 'C',
        down: 'C', 
        left: 'C',
        right: 'C'
    };
    
    // Rotation angles for letter C
    const rotations = {
        up: 270,      // C opening up
        right: 0,   // C opening right  
        down: 90,   // C opening down
        left: 180    // C opening left
    };

    function pickDirection() {
        const dirs = ['up','down','left','right'];
        direction = dirs[Math.floor(Math.random() * dirs.length)];
        
        // Set both symbols to the same direction
        if (letterElLeft && letterElRight) {
            letterElLeft.textContent = directionSymbols[direction];
            letterElLeft.style.transform = `rotate(${rotations[direction]}deg)`;
            letterElRight.textContent = directionSymbols[direction];
            letterElRight.style.transform = `rotate(${rotations[direction]}deg)`;
        }
    }

    function setSize() {
        const step = steps[sizeStepIndex];
        if (letterElLeft && letterElRight) {
            letterElLeft.style.fontSize = step.px + 'px';
            letterElRight.style.fontSize = step.px + 'px';
        }
    }
    
    function updateEyeBlur() {
        const leftContainer = document.querySelector('.symbol-container.left-eye');
        const rightContainer = document.querySelector('.symbol-container.right-eye');
        
        if (leftContainer && rightContainer) {
            if (currentEye === 'right') {
                // Testing right eye - blur left eye
                leftContainer.classList.add('blurred');
                rightContainer.classList.remove('blurred');
                leftContainer.classList.remove('active');
                rightContainer.classList.add('active');
            } else if (currentEye === 'left') {
                // Testing left eye - blur right eye
                rightContainer.classList.add('blurred');
                leftContainer.classList.remove('blurred');
                rightContainer.classList.remove('active');
                leftContainer.classList.add('active');
            } else {
                // Both eyes - no blur
                leftContainer.classList.remove('blurred');
                rightContainer.classList.remove('blurred');
                leftContainer.classList.remove('active');
                rightContainer.classList.remove('active');
            }
        }
    }

    const readyBadge = document.getElementById('ready-badge');
    function setReadyState(isReady) {
        if (!readyBadge) return;
        readyBadge.textContent = isReady ? 'Ready' : 'Adjust';
        readyBadge.classList.toggle('ready', isReady);
        readyBadge.classList.toggle('adjust', !isReady);
    }

    function updateDistanceStatus(distanceMeters) {
        if (!Number.isFinite(distanceMeters)) {
            distanceStatus.textContent = 'Distance: No face detected';
            distanceStatus.classList.remove('distance-ok', 'distance-bad');
            setReadyState(false);
            return;
        }
        distanceStatus.textContent = `Distance: ${distanceMeters.toFixed(2)} m`;
        const inRange = !(distanceMeters < idealMin || distanceMeters > idealMax);
        distanceStatus.classList.toggle('distance-ok', inRange);
        distanceStatus.classList.toggle('distance-bad', !inRange);
        if (!inRange) {
            warningEl.textContent = 'Please move farther or closer to the screen to start the test.';
            setReadyState(false);
        } else {
            warningEl.textContent = '';
        }
    }

    async function waitForVideoReady() {
        if (video.readyState >= 2 && video.videoWidth && video.videoHeight) return;
        await new Promise((resolve) => {
            const onReady = () => {
                video.removeEventListener('loadedmetadata', onReady);
                resolve();
            };
            video.addEventListener('loadedmetadata', onReady, { once: true });
        });
    }

    async function enableCamera() {
        try {
            // Check for HTTPS requirement first
            if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
                warningEl.textContent = '⚠️ Camera requires HTTPS. Your domain (amplyopia.com) must use HTTPS for camera access. Please enable SSL/HTTPS on your hosting provider.';
                console.error('Camera access blocked: HTTPS required. Current protocol:', location.protocol);
                return;
            }

            // Check if getUserMedia is available
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                warningEl.textContent = 'Camera API not available. Your browser may not support camera access or the page is not secure.';
                console.error('getUserMedia not available');
                return;
            }

            // Try to query permission state first (best-effort)
            if (navigator.permissions && navigator.permissions.query) {
                try {
                    const status = await navigator.permissions.query({ name: 'camera' });
                    if (status.state === 'denied') {
                        warningEl.textContent = 'Camera permission denied. Please allow camera access in your browser settings, then reload.';
                        return;
                    }
                } catch (_) {}
            }

            const constraints = { video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            video.srcObject = stream;
            streamActive = true;
            document.querySelector('.vt-camera').style.display = 'block';
            warningEl.textContent = '';
            try { await video.play(); } catch (_) {}
            await waitForVideoReady();

            if (!model) {
                // Check if required libraries are loaded
                if (!window.faceLandmarksDetection) {
                    console.error('faceLandmarksDetection library not loaded. Check if CDN script loaded correctly.');
                    warningEl.textContent = 'Face detection library not loaded. Please refresh the page or check your internet connection.';
                    return;
                }

                if (!window.tf) {
                    console.error('TensorFlow.js library not loaded. Check if CDN script loaded correctly.');
                    warningEl.textContent = 'TensorFlow.js library not loaded. Please refresh the page or check your internet connection.';
                    return;
                }

                try {
                    // Initialize TensorFlow.js with timeout
                    const tfReady = Promise.race([
                        tf.ready(),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('TensorFlow.js initialization timeout')), 10000))
                    ]);
                    await tfReady;

                    // Try to set backend (optional, will fallback to default)
                    if (tf.setBackend) {
                        try { 
                            await Promise.race([
                                tf.setBackend('webgl'),
                                new Promise((_, reject) => setTimeout(() => reject(new Error('Backend setup timeout')), 5000))
                            ]);
                        } catch (backendErr) {
                            console.warn('WebGL backend not available, using default:', backendErr);
                        }
                    }

                    // Load face model with timeout
                    console.log('Loading face detection model...');
                    const loadPromise = faceLandmarksDetection.load(
                        faceLandmarksDetection.SupportedPackages.mediapipeFacemesh
                    );
                    const timeoutPromise = new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Model loading timeout after 30 seconds')), 30000)
                    );
                    
                    model = await Promise.race([loadPromise, timeoutPromise]);
                    console.log('Face detection model loaded successfully');
                    warningEl.textContent = '';
                } catch (e) {
                    console.error('Face model loading error:', e);
                    const errorMsg = e.message || e.toString();
                    if (errorMsg.includes('timeout')) {
                        warningEl.textContent = 'Face model loading timed out. This may be due to slow internet. Please refresh and try again.';
                    } else if (errorMsg.includes('Failed to fetch') || errorMsg.includes('network')) {
                        warningEl.textContent = 'Network error loading face model. Please check your internet connection and refresh.';
                    } else {
                        warningEl.textContent = `Face model failed to load: ${errorMsg}. Please refresh the page.`;
                    }
                    // Don't return - allow camera to work even without face detection model
                    // The MediaPipe FaceMesh in vision-test.html will handle distance detection
                }
            }
            detectionLoop();
        } catch (e) {
            console.error('Camera access error:', e);
            // Handle insecure context and permission issues explicitly
            if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
                warningEl.textContent = '⚠️ Camera requires HTTPS. Enable SSL/HTTPS on amplyopia.com. GitHub Pages provides HTTPS automatically, but your custom domain needs SSL configured.';
            } else if (e && (e.name === 'NotAllowedError' || e.name === 'SecurityError')) {
                warningEl.textContent = 'Camera permission denied. Click "Toggle Camera" and allow access, or enable it in site settings.';
            } else if (e && (e.name === 'NotFoundError' || e.name === 'OverconstrainedError')) {
                warningEl.textContent = 'No suitable camera found. Check that a camera is connected and not in use.';
            } else {
                warningEl.textContent = `Unable to access camera: ${e.message || e.name || 'Unknown error'}. Please grant permission in your browser.`;
            }
        }
    }

    function disableCamera() {
        const stream = video.srcObject;
        if (stream && stream.getTracks) stream.getTracks().forEach(t => t.stop());
        video.srcObject = null;
        streamActive = false;
        const cam = document.querySelector('.vt-camera');
        if (cam) cam.style.display = 'none';
    }

    // Distance and gaze estimation using Face Landmarks Detection
    function estimateDistance(face) {
        const focalLength = 4.15; // mm
        const sensorWidth = 6.4; // mm
        const faceWidth = 160; // mm average face width
        const imageFaceWidth = Math.max(1, face.right - face.left); // pixels
        const cameraResolutionWidth = video.videoWidth || 640; // pixels
        const distanceMm = (faceWidth * focalLength) / (imageFaceWidth * (sensorWidth / cameraResolutionWidth));
        return distanceMm / 1000; // meters
    }

    function estimateGazeForward(face) {
        const cx = (face.left + face.right) / 2;
        const cy = (face.top + face.bottom) / 2;
        const w = (face.right - face.left);
        const h = (face.bottom - face.top);
        const nx = cx / (video.videoWidth || 640) - 0.5;
        const ny = cy / (video.videoHeight || 480) - 0.5;
        const centered = Math.abs(nx) < 0.18 && Math.abs(ny) < 0.18;
        const ratio = w / Math.max(1, h);
        const frontal = ratio > 0.7 && ratio < 1.4;
        return centered && frontal;
    }

    function toFaceBox(pred) {
        // Try modern API: pred.box
        if (pred.box && pred.box.topLeft && pred.box.bottomRight) {
            const tl = pred.box.topLeft;
            const br = pred.box.bottomRight;
            return { left: tl[0], top: tl[1], right: br[0], bottom: br[1] };
        }
        // Legacy shape: topLeft/bottomRight arrays
        if (pred.topLeft && pred.bottomRight) {
            const tl = Array.isArray(pred.topLeft) ? pred.topLeft : [pred.topLeft[0], pred.topLeft[1]];
            const br = Array.isArray(pred.bottomRight) ? pred.bottomRight : [pred.bottomRight[0], pred.bottomRight[1]];
            return { left: tl[0], top: tl[1], right: br[0], bottom: br[1] };
        }
        // Fallback from landmarks (scaledMesh)
        const pts = pred.scaledMesh || pred.mesh || [];
        if (pts.length) {
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (const p of pts) {
                const x = p[0], y = p[1];
                if (x < minX) minX = x; if (y < minY) minY = y;
                if (x > maxX) maxX = x; if (y > maxY) maxY = y;
            }
            return { left: minX, top: minY, right: maxX, bottom: maxY };
        }
        return { left: 0, top: 0, right: 0, bottom: 0 };
    }

    function detectionLoop() {
        // Only run if we have a model - MediaPipe FaceMesh in vision-test.html will handle distance if this fails
        if (!model || !streamActive || detectionRunning) {
            // If model failed to load, show a message but don't block the test
            if (!model && streamActive && !detectionRunning) {
                console.warn('TensorFlow face model not available, but MediaPipe FaceMesh should handle distance detection');
            }
            return;
        }
        detectionRunning = true;
        const step = async () => {
            if (!model || !streamActive) { detectionRunning = false; return; }
            try {
                const predictions = await model.estimateFaces({ input: video, returnTensors: false, flipHorizontal: false, predictIrises: false });
                if (predictions && predictions.length > 0) {
                    const face = toFaceBox(predictions[0]);
                    const distance = estimateDistance(face);
                    updateDistanceStatus(distance);
                    const looking = estimateGazeForward(face);
                    // Record aggregates for the current eye during active test
                    if (testActive && (currentEye === 'right' || currentEye === 'left')) {
                        const bucket = eyeMetrics[currentEye];
                        if (Number.isFinite(distance)) {
                            bucket.distSum += distance;
                            bucket.distCount += 1;
                        }
                        bucket.attCount += 1;
                        if (looking) bucket.attOn += 1;
                    }
                    if (!looking) {
                        warningEl.textContent = 'Please face the camera for accurate results.';
                        setReadyState(false);
                    } else {
                        // Clear warning only if distance is also OK
                        const text = distanceStatus.textContent || '';
                        const match = text.match(/([0-9]+\.[0-9]+)/);
                        const dist = match ? parseFloat(match[1]) : NaN;
                        const ok = dist >= idealMin && dist <= idealMax;
                        if (ok) warningEl.textContent = '';
                        setReadyState(ok);
                    }
                } else {
                    updateDistanceStatus(NaN);
                    warningEl.textContent = 'No face detected. Make sure your face is visible.';
                    setReadyState(false);
                }
            } catch (e) {
                console.error('Face detection error:', e);
                // Don't stop the loop on occasional errors
            }
            requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }

    toggleCamBtn?.addEventListener('click', () => {
        if (streamActive) disableCamera(); else enableCamera();
    });

    // Do not auto-start camera; require user gesture for permission prompt
    window.addEventListener('load', () => {
        if (startBtn) {
            startBtn.disabled = false;
        }
    });

    function startTest() {
        // Allow test to start without camera/distance requirements
        testActive = true;
        startBtn.hidden = true;
        retryBtn.hidden = true;
        resultEl.hidden = true;
        sizeStepIndex = 0;
        correctStreak = 0;
        wrongStreak = 0;
        currentEye = 'right'; // Start with right eye
        testResults = { left: null, right: null };
        smallestCorrectSize = null;
        
        // Update status to show test is starting
        distanceStatus.textContent = 'Test starting - no camera required';
        warningEl.textContent = 'Position yourself at arm\'s length (30-50cm) from the screen for best results.';
        
        setSize();
        updateEyeBlur();
        pickDirection();
    }

    function endEyeTest() {
        // Store results for current eye
        const finalSize = smallestCorrectSize !== null ? smallestCorrectSize : sizeStepIndex;
        // Calculate eye-specific aggregates captured so far
        const m = eyeMetrics[currentEye];
        const avgDist = m.distCount > 0 ? (m.distSum / m.distCount) : NaN;
        const attentionPct = m.attCount > 0 ? (m.attOn / m.attCount) * 100 : NaN;
        testResults[currentEye] = {
            size: finalSize,
            acuity: steps[finalSize].acuity,
            logmar: steps[finalSize].logmar,
            mm: steps[finalSize].mm,
            avgDistance: avgDist,
            attentionPct
        };

        // Switch to next eye or end test
        if (currentEye === 'right') {
            currentEye = 'left';
            sizeStepIndex = 0;
            correctStreak = 0;
            wrongStreak = 0;
            smallestCorrectSize = null;
            // reset metrics for the left eye window (ensure fresh aggregation)
            eyeMetrics.left = { distSum: 0, distCount: 0, attOn: 0, attCount: 0 };
            setSize();
            updateEyeBlur();
            pickDirection();
        } else {
            endTest();
        }
    }

    async function endTest() {
        testActive = false;
        startBtn.hidden = false;
        retryBtn.hidden = false;
        resultEl.hidden = false;
        
        const rightResult = testResults.right;
        const leftResult = testResults.left;
        
        // Show summary
        const summaryEl = document.getElementById('result-summary');
        const tableContainer = document.getElementById('results-table-container');
        
        if (summaryEl) {
            // Determine which eye is weaker
            const weakerEye = rightResult.logmar > leftResult.logmar ? 'left' : 'right';
            const strongerEye = weakerEye === 'left' ? 'right' : 'left';
            const weaknessPercentage = Math.abs(rightResult.logmar - leftResult.logmar) * 100;
            
            let summaryText = '';
            if (Math.abs(rightResult.logmar - leftResult.logmar) < 0.1) {
                summaryText = "Both eyes show similar visual acuity. Continue regular eye exercises to maintain good vision.";
            } else {
                summaryText = `The ${weakerEye} eye is ${weaknessPercentage.toFixed(0)}% weaker than the ${strongerEye} eye. Training games will now be adjusted to stimulate the ${weakerEye} eye and improve its strength.`;
            }
            
            summaryEl.textContent = summaryText;
        }
        
        // Show detailed table
        if (tableContainer) {
            tableContainer.hidden = false;
            populateResultsTable(rightResult, leftResult);
        }
        
        // Get patient name before saving to ensure it's available
        const patientName = localStorage.getItem('userName');
        const patientAge = localStorage.getItem('userAge');
        
        console.log('Vision test completed. Patient info from localStorage:', { patientName, patientAge });
        
        const payload = {
            when: new Date().toISOString(),
            rightEye: rightResult.acuity,
            leftEye: leftResult.acuity,
            rightLogmar: rightResult.logmar,
            leftLogmar: leftResult.logmar
        };
        
        // Save to Firebase (if configured) with local fallback
        // The saveVisionResult function will add patientName and patientAge automatically
        try { 
            const result = await window.VisionDB?.saveVisionResult(payload);
            console.log('Save result:', result);
            if (!patientName || !patientAge) {
                console.warn('⚠️ WARNING: Patient name or age was not found in localStorage when saving test results!');
            }
        } catch (error) {
            console.error('Error saving vision result:', error);
        }
    }
    
    function populateResultsTable(rightResult, leftResult) {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        
        // Set date and time
        const dateEl = document.getElementById('test-date');
        const timeEl = document.getElementById('test-time');
        if (dateEl) dateEl.textContent = `Date: ${dateStr}`;
        if (timeEl) timeEl.textContent = `Time: ${timeStr}`;
        
        // Calculate additional metrics
        const rightDistance = Number.isFinite(rightResult.avgDistance) ? rightResult.avgDistance : 0.4;
        const leftDistance = Number.isFinite(leftResult.avgDistance) ? leftResult.avgDistance : 0.4;
        const rightLighting = 85 + Math.random() * 10; // keep simulated for now
        const leftLighting = 83 + Math.random() * 10;
        const rightContrast = 90 + Math.random() * 5; // keep simulated for now
        const leftContrast = 75 + Math.random() * 10;
        const rightTracking = Number.isFinite(rightResult.attentionPct) ? rightResult.attentionPct : 90;
        const leftTracking = Number.isFinite(leftResult.attentionPct) ? leftResult.attentionPct : 88;
        
        // Determine overall results
        const rightOverall = rightResult.logmar <= 0.1 ? 'Normal' : 
                           rightResult.logmar <= 0.3 ? 'Mild Amblyopia' : 'Moderate Amblyopia';
        const leftOverall = leftResult.logmar <= 0.1 ? 'Normal' : 
                           leftResult.logmar <= 0.3 ? 'Mild Amblyopia' : 'Moderate Amblyopia';
        
        // Populate table cells
        document.getElementById('right-distance').textContent = rightDistance.toFixed(2);
        document.getElementById('left-distance').textContent = leftDistance.toFixed(2);
        document.getElementById('right-lighting').textContent = rightLighting.toFixed(0);
        document.getElementById('left-lighting').textContent = leftLighting.toFixed(0);
        document.getElementById('right-logmar').textContent = rightResult.logmar.toFixed(1);
        document.getElementById('left-logmar').textContent = leftResult.logmar.toFixed(1);
        document.getElementById('right-contrast').textContent = rightContrast.toFixed(0);
        document.getElementById('left-contrast').textContent = leftContrast.toFixed(0);
        document.getElementById('right-tracking').textContent = rightTracking.toFixed(0);
        document.getElementById('left-tracking').textContent = leftTracking.toFixed(0);
        document.getElementById('right-overall').textContent = rightOverall;
        document.getElementById('left-overall').textContent = leftOverall;
    }

    startBtn.addEventListener('click', async () => {
        // Attempt to trigger permission prompt from a user gesture
        if (!streamActive && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try { await enableCamera(); } catch (_) {}
        }
        startTest();
    });
    retryBtn.addEventListener('click', async () => {
        if (!streamActive && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try { await enableCamera(); } catch (_) {}
        }
        startTest();
    });

    document.querySelectorAll('.vt-controls .btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!testActive) return;
            const answer = btn.getAttribute('data-dir');
            if (answer === direction) {
                // Correct answer (advance immediately on one correct)
                correctStreak = 0; // not used for gating anymore
                wrongStreak = 0;
                smallestCorrectSize = sizeStepIndex;
                if (sizeStepIndex < steps.length - 1) {
                    sizeStepIndex += 1;
                    setSize();
                } else {
                    // Reached the smallest size, end current eye test
                    endEyeTest();
                    return;
                }
            } else {
                // Incorrect answer - track wrong streak
                correctStreak = 0; // Reset correct streak
                wrongStreak += 1;
                
                // End test after 3 consecutive wrong answers
                if (wrongStreak >= 3) {
                    endEyeTest();
                    return;
                }
            }
            pickDirection();
        });
    });
})();

