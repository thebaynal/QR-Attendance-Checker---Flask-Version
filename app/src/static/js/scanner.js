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
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
    document.head.appendChild(script);
}

function startQRScanner() {
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

            const scanInterval = setInterval(() => {
                if (video.readyState === video.HAVE_ENOUGH_DATA) {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height, {
                        inversionAttempts: 'dontInvert',
                    });

                    if (code) {
                        const now = Date.now();
                        // Prevent scanning the same code multiple times within 3 seconds
                        if (code.data !== lastScannedCode || (now - lastScanTime > 3000)) {
                            lastScannedCode = code.data;
                            lastScanTime = now;
                            document.getElementById('qr-input').value = code.data;
                            submitQRCode();
                        }
                    }
                }
            }, 500);
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

    // Check if already scanned in this session
    if (markedAttendees.has(qrData)) {
        const resultDiv = document.getElementById('result-message');
        resultDiv.className = 'result-message warning already-scanned';
        resultDiv.innerHTML = `
            <div class="already-scanned-content">
                <div class="already-scanned-icon">⚠️</div>
                <div class="already-scanned-text">
                    <strong>Already Scanned!</strong>
                    <p>This QR code has already been marked present.</p>
                </div>
            </div>
        `;
        resultDiv.style.display = 'block';
        
        // Animate the feedback
        resultDiv.style.animation = 'none';
        setTimeout(() => {
            resultDiv.style.animation = 'pulse-warning 0.5s ease-in-out';
        }, 10);

        // Clear input
        document.getElementById('qr-input').value = '';
        document.getElementById('qr-input').focus();

        // Keep visible for 3 seconds
        setTimeout(() => {
            resultDiv.style.display = 'none';
        }, 3000);
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
            resultDiv.className = 'result-message success scanned-success';
            resultDiv.innerHTML = `
                <div class="scan-success-content">
                    <div class="scan-success-icon">✓</div>
                    <div class="scan-success-text">
                        <strong>${response.user_name}</strong>
                        <p>Successfully marked present</p>
                        <p class="scan-time">${new Date().toLocaleTimeString()}</p>
                    </div>
                </div>
            `;
            resultDiv.style.display = 'block';
            markedAttendees.add(qrData);

            // Add to table with animation
            const tbody = document.getElementById('attendance-body');
            const row = tbody.insertRow(-1);
            row.className = 'new-scan-row';
            row.innerHTML = `
                <td>${response.user_id}</td>
                <td>${response.user_name}</td>
                <td>${new Date().toLocaleTimeString()}</td>
            `;
            row.style.animation = 'slideInRow 0.4s ease-out';

            // Clear input and focus for next scan
            document.getElementById('qr-input').value = '';
            document.getElementById('qr-input').focus();

            // Update count
            updateAttendanceCount();

            // Hide message after 3 seconds
            setTimeout(() => {
                resultDiv.style.display = 'none';
            }, 3000);
        } else {
            resultDiv.className = 'result-message error';
            resultDiv.textContent = response.message;
            resultDiv.style.display = 'block';
            
            // Keep visible for 2.5 seconds
            setTimeout(() => {
                resultDiv.style.display = 'none';
            }, 2500);
        }
    })
    .catch(error => {
        const resultDiv = document.getElementById('result-message');
        resultDiv.className = 'result-message error';
        resultDiv.textContent = 'Error marking attendance: ' + error.message;
        resultDiv.style.display = 'block';
        
        setTimeout(() => {
            resultDiv.style.display = 'none';
        }, 2500);
    });
}

function updateAttendanceCount() {
    const countElement = document.getElementById('attendance-count');
    if (countElement) {
        const rows = document.getElementById('attendance-body').rows.length;
        countElement.textContent = rows;
    }
}
