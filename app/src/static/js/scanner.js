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
                clearAttendanceTable();
            } else {
                startQRScanner();
                loadMarkedAttendees();
            }
        });
    }

    if (timeSlotSelect) {
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
});

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
                    
                    // Make sure jsQR is loaded
                    if (typeof jsQR === 'undefined') {
                        console.warn('jsQR library not loaded yet');
                        return;
                    }
                    
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
            showError('Camera access denied. Enter QR code manually.');
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
    const compositeKey = qrData + '-' + selectedTimeSlot;
    if (markedAttendees.has(qrData) || markedAttendees.has(compositeKey)) {
        const indicator = document.getElementById('last-scanned-indicator');
        indicator.className = 'last-scanned-indicator warning';
        indicator.textContent = `⚠️ Already marked for ${selectedTimeSlot}`;
        indicator.style.display = 'block';

        // Clear input
        document.getElementById('qr-input').value = '';
        document.getElementById('qr-input').focus();

        // Keep visible for 3 seconds
        setTimeout(() => {
            indicator.style.display = 'none';
        }, 3000);
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
        const indicator = document.getElementById('last-scanned-indicator');

        if (response.success) {
            indicator.className = 'last-scanned-indicator';
            indicator.textContent = `✓ ${response.user_name} marked for ${selectedTimeSlot}`;
            indicator.style.display = 'block';
            
            // Track both by QR code and by composite key
            markedAttendees.add(qrData);
            markedAttendees.add(response.user_id + '-' + selectedTimeSlot);

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

            // Hide indicator after 4 seconds
            setTimeout(() => {
                indicator.style.display = 'none';
            }, 4000);
        } else {
            indicator.className = 'last-scanned-indicator warning';
            indicator.textContent = `⚠️ ${response.message}`;
            indicator.style.display = 'block';
            
            // Keep visible for 3 seconds
            setTimeout(() => {
                indicator.style.display = 'none';
            }, 3000);
        }
    })
    .catch(error => {
        const indicator = document.getElementById('last-scanned-indicator');
        indicator.className = 'last-scanned-indicator warning';
        indicator.textContent = `⚠️ Error: ${error.message}`;
        indicator.style.display = 'block';
        
        setTimeout(() => {
            indicator.style.display = 'none';
        }, 3000);
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
    const indicator = document.getElementById('last-scanned-indicator');
    indicator.className = 'last-scanned-indicator warning';
    indicator.textContent = `⚠️ ${message}`;
    indicator.style.display = 'block';
    
    setTimeout(() => {
        indicator.style.display = 'none';
    }, 3000);
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
                    const timeString = timeObj.toLocaleTimeString();
                    
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
