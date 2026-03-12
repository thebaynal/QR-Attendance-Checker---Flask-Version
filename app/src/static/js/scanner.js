/* QR Scanner JavaScript */

let selectedEvent = null;
let selectedTimeSlot = 'morning';
const markedAttendees = new Set();

// QR Scanner Setup
document.addEventListener('DOMContentLoaded', function() {
    const eventSelect = document.getElementById('event-select');
    const timeSlotSelect = document.getElementById('time-slot');
    const submitBtn = document.getElementById('submit-btn');
    const qrInput = document.getElementById('qr-input');

    if (eventSelect) {
        eventSelect.addEventListener('change', function() {
            selectedEvent = this.value;
            if (!selectedEvent) {
                document.getElementById('qr-reader').innerHTML = '';
            } else {
                startQRScanner();
            }
        });
    }

    if (timeSlotSelect) {
        timeSlotSelect.addEventListener('change', function() {
            selectedTimeSlot = this.value;
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

    // Load QR scanner library
    loadQRScannerLibrary();
});

function loadQRScannerLibrary() {
    // Load jsQR library
    if (typeof jsQR !== 'undefined') {
        console.log('jsQR library already loaded');
        return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
    script.onload = () => {
        console.log('jsQR library loaded successfully');
    };
    script.onerror = () => {
        console.error('Failed to load jsQR library');
    };
    document.head.appendChild(script);
}

function startQRScanner() {
    // Check if jsQR library is loaded
    if (typeof jsQR === 'undefined') {
        console.warn('jsQR not loaded yet, waiting...');
        setTimeout(() => startQRScanner(), 500);
        return;
    }

    const constraints = {
        video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 }
        }
    };

    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const readerContainer = document.getElementById('qr-reader');

    video.style.width = '100%';
    video.style.maxWidth = '500px';
    video.style.display = 'block';
    video.autoplay = true;

    readerContainer.innerHTML = '';
    readerContainer.appendChild(video);

    navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
            video.srcObject = stream;

            let scanAttempts = 0;
            let lastScannedCode = null;
            let lastScanTime = 0;
            const scanCooldown = 2000; // 2 second cooldown between scans
            
            const scanInterval = setInterval(() => {
                if (video.readyState === video.HAVE_ENOUGH_DATA) {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                    // Get image data with enhanced brightness/contrast
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;
                    
                    // Enhance contrast for better QR detection
                    for (let i = 0; i < data.length; i += 4) {
                        const r = data[i];
                        const g = data[i + 1];
                        const b = data[i + 2];
                        
                        // Increase contrast
                        const avg = (r + g + b) / 3;
                        const factor = 1.5;
                        data[i] = Math.min(255, avg + (r - avg) * factor);
                        data[i + 1] = Math.min(255, avg + (g - avg) * factor);
                        data[i + 2] = Math.min(255, avg + (b - avg) * factor);
                    }

                    scanAttempts++;
                    
                    // Try multiple QR detection attempts with different settings
                    let code = null;
                    try {
                        code = jsQR(imageData.data, imageData.width, imageData.height);
                    } catch (e) {
                        console.error('QR scan error:', e);
                    }

                    if (code) {
                        const currentTime = Date.now();
                        
                        // Only process if different code or cooldown passed
                        if (code.data !== lastScannedCode || (currentTime - lastScanTime) > scanCooldown) {
                            console.log('QR Code detected:', code.data);
                            lastScannedCode = code.data;
                            lastScanTime = currentTime;
                            
                            document.getElementById('qr-input').value = code.data;
                            submitQRCode();
                            // IMPORTANT: Do NOT stop the stream or clear interval
                            // Camera continues running for continuous scanning
                        }
                    } else if (scanAttempts % 20 === 0) {
                        console.log('Scanning... (' + scanAttempts + ' attempts)');
                    }
                }
            }, 100);

            // Stop scanning after 5 minutes of inactivity or user closes event select
            const maxScanTime = 5 * 60 * 1000;
            setTimeout(() => {
                clearInterval(scanInterval);
                stream.getTracks().forEach(track => track.stop());
                console.log('Scanner stopped after timeout');
            }, maxScanTime);
        })
        .catch(err => {
            console.error('Camera access denied:', err);
            document.getElementById('scanner-status').textContent = 'Camera access denied. Enter QR code manually.';
        });
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

    markAttendance(qrData);
}

function markAttendance(qrData) {
    apiCall('/scan/mark', 'POST', {
        event_id: selectedEvent,
        qr_data: qrData,
        time_slot: selectedTimeSlot
    })
    .then(response => {
        const resultDiv = document.getElementById('result-message');

        if (response.success) {
            resultDiv.className = 'result-message success';
            resultDiv.textContent = response.message;
            markedAttendees.add(qrData);

            // Add to table
            const tbody = document.getElementById('attendance-body');
            const row = tbody.insertRow(-1);
            row.innerHTML = `
                <td>${response.user_id}</td>
                <td>${response.user_name}</td>
                <td>${new Date().toLocaleTimeString()}</td>
            `;

            // Clear input and focus for next scan
            document.getElementById('qr-input').value = '';
            document.getElementById('qr-input').focus();

            // Hide message after 2 seconds
            setTimeout(() => {
                resultDiv.style.display = 'none';
            }, 2000);
        } else {
            resultDiv.className = 'result-message error';
            resultDiv.textContent = response.message;
        }
    })
    .catch(error => {
        document.getElementById('result-message').className = 'result-message error';
        document.getElementById('result-message').textContent = 'Error marking attendance: ' + error.message;
    });
}
