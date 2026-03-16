/* QR Scanner JavaScript */

let selectedEvent = null;
let selectedTimeSlot = 'morning';
const markedAttendees = new Set();
let lastScannedCode = null;
let lastScanTime = 0;

// QR Scanner Setup
document.addEventListener('DOMContentLoaded', function() {
    const eventSelect = document.getElementById('event-select');
    const timeSlotSelect = document.getElementById('time-slot');
    const submitBtn = document.getElementById('submit-btn');
    const qrInput = document.getElementById('qr-input');
    const cameraSelect = document.getElementById('camera-select');

    // Initialize scanner controls even before an event is selected.
    setupNativeScanButton();
    setupCameraSelector(cameraSelect);
    setScannerStatus('Select an event to start scanning.');

    if (eventSelect) {
        eventSelect.addEventListener('change', function() {
            selectedEvent = this.value;
            if (!selectedEvent) {
                stopScanner();
                document.getElementById('qr-reader').innerHTML = '';
                clearAttendanceTable();
                setScannerStatus('Select an event to start scanning.');
            } else {
                startQRScanner();
                loadMarkedAttendees();
            }
        });

        // Auto-start when an event is already selected (e.g., page restore/navigation).
        selectedEvent = eventSelect.value || null;
    }

    if (timeSlotSelect) {
        selectedTimeSlot = timeSlotSelect.value || 'morning';
        timeSlotSelect.addEventListener('change', function() {
            selectedTimeSlot = this.value;
            if (selectedEvent) {
                loadMarkedAttendees();
            }
        });
    }

    if (submitBtn) {
        submitBtn.addEventListener('click', submitQRCode);
    }

    if (qrInput) {
        qrInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                submitQRCode();
            }
        });
    }

    if (selectedEvent) {
        startQRScanner();
        loadMarkedAttendees();
    }

    // Restart stream when returning to the tab/page if scanner was active.
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'visible' && selectedEvent && !currentStream) {
            startQRScanner();
        }
    });

    // Always release camera resources when leaving the page.
    window.addEventListener('beforeunload', stopScanner);
});

let currentStream = null;
let currentFacingMode = 'environment'; // Default to back camera
let scanInterval = null;
let indicatorTimeoutId = null;
let embeddedScannerBoundsHandlerAttached = false;
let selectedCameraId = '';
let availableCameras = [];

function setScannerStatus(message) {
    const statusText = document.getElementById('scanner-status');
    if (statusText) {
        statusText.textContent = message;
    }
}

function hideScanIndicator() {
    const indicator = document.getElementById('last-scanned-indicator');
    if (indicator) {
        indicator.style.display = 'none';
    }
    if (indicatorTimeoutId) {
        clearTimeout(indicatorTimeoutId);
        indicatorTimeoutId = null;
    }
}

function setScanIndicator(type, message, timeoutMs = 2400) {
    const indicator = document.getElementById('last-scanned-indicator');
    if (!indicator) {
        return;
    }

    const icon = document.createElement('i');
    icon.setAttribute('aria-hidden', 'true');
    icon.className = type === 'success' ? 'fa-regular fa-circle-check' : 'fa-solid fa-triangle-exclamation';

    const text = document.createElement('span');
    text.textContent = message;

    indicator.className = type === 'success'
        ? 'last-scanned-indicator'
        : 'last-scanned-indicator warning';
    indicator.innerHTML = '';
    indicator.appendChild(icon);
    indicator.appendChild(text);
    indicator.style.display = 'flex';

    if (indicatorTimeoutId) {
        clearTimeout(indicatorTimeoutId);
    }
    indicatorTimeoutId = setTimeout(hideScanIndicator, timeoutMs);
}

function hasBrowserCameraSupport() {
    return !!(
        (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function')
        || navigator.getUserMedia
        || navigator.webkitGetUserMedia
        || navigator.mozGetUserMedia
    );
}

function hasMediaDevicesApi() {
    return !!(navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function');
}

function getCameraSelectElement() {
    return document.getElementById('camera-select');
}

function getCameraSelectLabelElement() {
    return document.querySelector('.camera-select-label');
}

function isDesktopScannerPage() {
    return !!getCameraSelectElement();
}

function supportsDeviceEnumeration() {
    return !!(navigator.mediaDevices && typeof navigator.mediaDevices.enumerateDevices === 'function');
}

function requestBrowserCamera(constraints) {
    if (hasMediaDevicesApi()) {
        return navigator.mediaDevices.getUserMedia(constraints);
    }

    const legacyGetUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    if (!legacyGetUserMedia) {
        return Promise.reject(new Error('Camera API unsupported'));
    }

    return new Promise((resolve, reject) => {
        legacyGetUserMedia.call(navigator, constraints, resolve, reject);
    });
}

async function refreshCameraDevices() {
    if (!supportsDeviceEnumeration()) {
        availableCameras = [];
        renderCameraOptions();
        return;
    }

    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        availableCameras = devices.filter((device) => device.kind === 'videoinput');
        renderCameraOptions();
    } catch (error) {
        console.warn('Failed to enumerate cameras:', error);
        availableCameras = [];
        renderCameraOptions();
    }
}

function renderCameraOptions() {
    const selectEl = getCameraSelectElement();
    const labelEl = getCameraSelectLabelElement();
    if (!selectEl) {
        return;
    }

    const shouldShowPicker = isDesktopScannerPage() && availableCameras.length > 0;
    selectEl.style.display = shouldShowPicker ? 'inline-block' : 'none';
    if (labelEl) {
        labelEl.style.display = shouldShowPicker ? 'inline-block' : 'none';
    }

    selectEl.innerHTML = '';
    if (!shouldShowPicker) {
        return;
    }

    availableCameras.forEach((camera, index) => {
        const option = document.createElement('option');
        option.value = camera.deviceId;
        option.textContent = camera.label || `Camera ${index + 1}`;
        selectEl.appendChild(option);
    });

    if (!selectedCameraId && availableCameras.length) {
        selectedCameraId = availableCameras[0].deviceId;
    }
    selectEl.value = selectedCameraId;
}

function setupCameraSelector(cameraSelect) {
    if (!cameraSelect) {
        return;
    }

    cameraSelect.addEventListener('change', function() {
        selectedCameraId = this.value;
        if (selectedEvent) {
            setScannerStatus('Switching camera...');
            startQRScanner();
        }
    });

    renderCameraOptions();
}

function hasAndroidNativeScannerBridge() {
    return !!(window.MaScanAndroid && typeof window.MaScanAndroid.startNativeQrScan === 'function');
}

function hasAndroidEmbeddedScannerBridge() {
    return !!(
        window.MaScanAndroid
        && typeof window.MaScanAndroid.canUseEmbeddedQrScan === 'function'
        && typeof window.MaScanAndroid.startEmbeddedQrScan === 'function'
        && typeof window.MaScanAndroid.updateEmbeddedQrScanBounds === 'function'
        && typeof window.MaScanAndroid.stopEmbeddedQrScan === 'function'
    );
}

function isAndroidWebViewContext() {
    const ua = navigator.userAgent || '';
    return /Android/i.test(ua) && (/\bwv\b/i.test(ua) || /Version\/\d+\.\d+/i.test(ua));
}

function getNativeScanButton() {
    return document.getElementById('native-scan-btn');
}

function usesAndroidEmbeddedScanner() {
    return isAndroidWebViewContext() && hasAndroidEmbeddedScannerBridge();
}

function getReaderBoundsPayload() {
    const reader = document.getElementById('qr-reader');
    if (!reader) {
        return null;
    }

    const rect = reader.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    return {
        left: Math.round((rect.left + window.scrollX) * dpr),
        top: Math.round((rect.top + window.scrollY) * dpr),
        width: Math.round(rect.width * dpr),
        height: Math.round(rect.height * dpr)
    };
}

function syncEmbeddedScannerBounds() {
    if (!usesAndroidEmbeddedScanner()) {
        return;
    }

    const bounds = getReaderBoundsPayload();
    if (!bounds) {
        return;
    }

    window.MaScanAndroid.updateEmbeddedQrScanBounds(
        bounds.left,
        bounds.top,
        bounds.width,
        bounds.height
    );
}

function attachEmbeddedScannerBoundsHandlers() {
    if (embeddedScannerBoundsHandlerAttached) {
        return;
    }

    const syncSoon = () => window.requestAnimationFrame(syncEmbeddedScannerBounds);
    window.addEventListener('resize', syncSoon, { passive: true });
    embeddedScannerBoundsHandlerAttached = true;
}

function startAndroidEmbeddedScanner() {
    const readerContainer = document.getElementById('qr-reader');
    if (!readerContainer || !usesAndroidEmbeddedScanner()) {
        return false;
    }

    const bounds = getReaderBoundsPayload();
    if (!bounds) {
        return false;
    }

    readerContainer.innerHTML = '';
    setScannerStatus('Opening embedded camera...');
    attachEmbeddedScannerBoundsHandlers();
    window.MaScanAndroid.startEmbeddedQrScan(bounds.left, bounds.top, bounds.width, bounds.height);
    window.requestAnimationFrame(syncEmbeddedScannerBounds);
    return true;
}

function setupNativeScanButton() {
    const nativeBtn = getNativeScanButton();
    if (!nativeBtn) {
        return;
    }

    nativeBtn.style.display = usesAndroidEmbeddedScanner() ? 'none' : (hasAndroidNativeScannerBridge() ? 'inline-block' : 'none');

    if (!nativeBtn.onclick) {
        nativeBtn.onclick = function() {
            requestAndroidNativeScan('manual');
        };
    }
}

function requestAndroidNativeScan(source) {
    if (!hasAndroidNativeScannerBridge()) {
        return false;
    }

    try {
        window.MaScanAndroid.startNativeQrScan();
        setScannerStatus('Opening native scanner...');
        if (source === 'fallback') {
            setScanIndicator('warning', 'Web camera limited in this WebView. Switched to native scanner.');
        }
        return true;
    } catch (error) {
        console.error('Failed to invoke native scanner bridge:', error);
        return false;
    }
}

function getConstraintAttempts() {
    if (selectedCameraId) {
        return [
            {
                label: 'selected camera',
                constraints: {
                    video: {
                        deviceId: { exact: selectedCameraId },
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                }
            },
            {
                label: 'selected camera (fallback)',
                constraints: {
                    video: {
                        deviceId: selectedCameraId,
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                }
            },
            {
                label: 'any available camera',
                constraints: {
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                }
            }
        ];
    }

    const preferred = currentFacingMode;
    const fallback = preferred === 'environment' ? 'user' : 'environment';

    return [
        {
            label: `${preferred} camera`,
            constraints: {
                video: {
                    facingMode: { exact: preferred },
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            }
        },
        {
            label: `${preferred} camera (preferred)`,
            constraints: {
                video: {
                    facingMode: preferred,
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            }
        },
        {
            label: `${fallback} camera fallback`,
            constraints: {
                video: {
                    facingMode: fallback,
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            }
        },
        {
            label: 'any available camera',
            constraints: {
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            }
        }
    ];
}

async function acquireCameraStream() {
    const attempts = getConstraintAttempts();
    let lastError = null;

    for (const attempt of attempts) {
        try {
            setScannerStatus(`Opening ${attempt.label}...`);
            return await requestBrowserCamera(attempt.constraints);
        } catch (err) {
            lastError = err;
        }
    }

    throw lastError || new Error('Unable to access any camera');
}

function startQRScanner() {
    setupNativeScanButton();

    if (isDesktopScannerPage() && hasBrowserCameraSupport()) {
        refreshCameraDevices();
    }

    if (usesAndroidEmbeddedScanner()) {
        stopScanner();
        const started = startAndroidEmbeddedScanner();
        if (started) {
            setScannerStatus('Scanning with embedded device camera');
            const switchBtn = document.getElementById('switch-camera-btn');
            if (switchBtn) {
                switchBtn.style.display = 'none';
            }
            return;
        }
    }

    // Keep embedded scanner as the primary path.
    // On Android WebView + HTTP we still attempt getUserMedia first,
    // and only fall back to native scanner if camera access fails.
    if (isAndroidWebViewContext() && !window.isSecureContext) {
        setScannerStatus('Trying embedded camera in WebView...');
    }

    if (!hasBrowserCameraSupport()) {
        const insecureHint = !window.isSecureContext
            ? 'Camera is blocked on non-secure pages. Open via localhost or HTTPS.'
            : 'Your browser did not expose getUserMedia.';
        setScannerStatus('Camera API unavailable in this browser');
        showError(`${insecureHint} If you use Brave, allow camera permission for this site.`);
        return;
    }

    if (!window.isSecureContext) {
        setScannerStatus('HTTP context detected. Trying camera access...');
    }

    // Show switch button only on layouts without explicit camera picker.
    const switchBtn = document.getElementById('switch-camera-btn');
    if (switchBtn) {
        switchBtn.style.display = isDesktopScannerPage() ? 'none' : 'inline-block';
        if (!switchBtn.onclick) {
            switchBtn.onclick = toggleCamera;
        }
    }

    // Stop existing stream and interval
    stopScanner();

    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const readerContainer = document.getElementById('qr-reader');

    video.style.width = '100%';
    video.style.maxWidth = '500px';
    video.style.display = 'block';
    video.autoplay = true;
    video.setAttribute('playsinline', true); // Required for iOS

    readerContainer.innerHTML = '';
    readerContainer.appendChild(video);
    setScannerStatus(`Preparing ${currentFacingMode === 'user' ? 'front' : 'back'} camera...`);

    acquireCameraStream()
        .then(stream => {
            currentStream = stream;
            video.srcObject = stream;
            video.play().catch(() => {
                // Ignore autoplay errors; stream can still render when user interacts.
            });

            const activeTrack = stream.getVideoTracks()[0];
            const trackLabel = activeTrack && activeTrack.label ? activeTrack.label : 'camera';
            setScannerStatus(`Scanning with ${trackLabel}`);

            if (activeTrack && activeTrack.getSettings && activeTrack.getSettings().deviceId) {
                selectedCameraId = activeTrack.getSettings().deviceId;
            }

            refreshCameraDevices();

            scanInterval = setInterval(() => {
                if (video.readyState === video.HAVE_ENOUGH_DATA) {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    
                    if (typeof jsQR === 'undefined') {
                        console.warn('jsQR library not loaded yet');
                        return;
                    }
                    
                    const code = jsQR(imageData.data, imageData.width, imageData.height, {
                        inversionAttempts: 'dontInvert',
                    });

                    if (code) {
                        const now = Date.now();
                        if (code.data !== lastScannedCode || (now - lastScanTime > 3000)) {
                            lastScannedCode = code.data;
                            lastScanTime = now;
                            setScannerStatus('QR detected, submitting...');
                            document.getElementById('qr-input').value = code.data;
                            submitQRCode();
                        }
                    }
                }
            }, 500);
        })
        .catch(err => {
            console.error('Camera access denied:', err);
            const errorName = err && err.name ? err.name : 'UnknownError';
            const reason = err && err.message ? err.message : 'unknown error';
            setScannerStatus('Camera unavailable');
            const braveHint = !window.isSecureContext
                ? 'Use localhost/HTTPS and allow camera permissions in Brave.'
                : 'Check camera permission in Brave Site Settings.';
            showError(`Camera unavailable (${errorName}: ${reason}). ${braveHint}`);
            if (switchBtn) switchBtn.style.display = 'none';
        });
}

function stopScanner() {
    if (scanInterval) {
        clearInterval(scanInterval);
        scanInterval = null;
    }
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }

    if (usesAndroidEmbeddedScanner()) {
        window.MaScanAndroid.stopEmbeddedQrScan();
    }
}

function toggleCamera() {
    currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
    setScannerStatus(`Switching to ${currentFacingMode === 'user' ? 'front' : 'back'} camera...`);
    stopScanner();
    setTimeout(() => startQRScanner(), 400);
}

function submitQRCode() {
    if (!selectedEvent) {
        showError('Please select an event first');
        return;
    }

    const qrData = document.getElementById('qr-input').value.trim();
    if (!qrData) {
        showError('Please enter or scan a QR code');
        return;
    }

    // Check if already scanned in this session
    const compositeKey = qrData + '-' + selectedTimeSlot;
    if (markedAttendees.has(qrData) || markedAttendees.has(compositeKey)) {
        setScanIndicator('warning', `Already marked for ${selectedTimeSlot}`);

        // Clear input
        document.getElementById('qr-input').value = '';
        document.getElementById('qr-input').focus();

        return;
    }

    markAttendance(qrData);
}

function markAttendance(qrData) {
    if (typeof apiCall === 'undefined') {
        showError('API function not available');
        return;
    }
    
    apiCall('/scan/mark', 'POST', {
        event_id: selectedEvent,
        qr_data: qrData,
        time_slot: selectedTimeSlot
    })
    .then(response => {
        if (response.success) {
            setScanIndicator('success', `${response.user_name} marked for ${selectedTimeSlot}`);
            playAudioBeep();
            
            // Track both by QR code and by composite key
            markedAttendees.add(qrData);
            markedAttendees.add(response.user_id + '-' + selectedTimeSlot);

            // Add to table with animation
            const tbody = document.getElementById('attendance-body');
            const row = tbody.insertRow(-1);
            row.className = 'new-scan-row';
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const year = now.getFullYear();
            const formattedTime = `${hours}:${minutes}:${seconds} - ${day}/${month}/${year}`;
            
            row.innerHTML = `
                <td>${response.user_id}</td>
                <td>${response.user_name}</td>
                <td>${formattedTime}</td>
            `;
            row.style.animation = 'slideInRow 0.4s ease-out';

            // Clear input and focus for next scan
            document.getElementById('qr-input').value = '';
            document.getElementById('qr-input').focus();

            // Update count
            updateAttendanceCount();

        } else {
            setScanIndicator('warning', response.message);
        }
    })
    .catch(error => {
        setScanIndicator('warning', `Error: ${error.message}`);
    });
}

function updateAttendanceCount() {
    const countElement = document.getElementById('attendance-count');
    if (countElement) {
        const rows = document.getElementById('attendance-body').rows.length;
        countElement.textContent = rows;
    }
}

function showError(message) {
    setScanIndicator('warning', message);
}

function clearAttendanceTable() {
    const tbody = document.getElementById('attendance-body');
    tbody.innerHTML = '';
    markedAttendees.clear();
    updateAttendanceCount();
}

function loadMarkedAttendees() {
    if (!selectedEvent) return;
    
    fetch(`/scan/api/attendees/${selectedEvent}?time_slot=${selectedTimeSlot}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const tbody = document.getElementById('attendance-body');
                tbody.innerHTML = '';
                markedAttendees.clear();
                
                data.attendees.forEach(attendee => {
                    const row = tbody.insertRow(-1);
                    row.className = 'new-scan-row';
                    
                    const timeObj = new Date(attendee.timestamp);
                    const hours = String(timeObj.getHours()).padStart(2, '0');
                    const minutes = String(timeObj.getMinutes()).padStart(2, '0');
                    const seconds = String(timeObj.getSeconds()).padStart(2, '0');
                    const day = String(timeObj.getDate()).padStart(2, '0');
                    const month = String(timeObj.getMonth() + 1).padStart(2, '0');
                    const year = timeObj.getFullYear();
                    const timeString = `${hours}:${minutes}:${seconds} - ${day}/${month}/${year}`;
                    
                    row.innerHTML = `
                        <td>${attendee.user_id}</td>
                        <td>${attendee.user_name}</td>
                        <td>${timeString}</td>
                    `;
                    row.style.animation = 'slideInRow 0.4s ease-out';
                    
                    // Track in markedAttendees to prevent duplicate scanning
                    markedAttendees.add(attendee.user_id + '-' + selectedTimeSlot);
                });
                
                updateAttendanceCount();
            }
        })
        .catch(error => {
            console.error('Error loading attendees:', error);
        });
}

function playAudioBeep() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (!audioCtx) return;
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); // 800Hz beep frequency
        
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
    } catch(e) {
        console.log("Audio beep failed", e);
    }
}

