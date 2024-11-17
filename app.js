// DOM Elements
const documentForm = document.getElementById('documentForm');
const requiresVisit = document.getElementById('requiresVisit');
const locationGroup = document.getElementById('locationGroup');
const documentType = document.getElementById('documentType');
const activeDocuments = document.getElementById('activeDocuments');
const notificationsContainer = document.getElementById('notifications');

// Event Listeners
documentForm.addEventListener('submit', handleFormSubmit);
requiresVisit.addEventListener('change', toggleLocationField);
documentType.addEventListener('change', updateLocation);

// Form Submission Handler
function handleFormSubmit(e) {
    e.preventDefault();

    const formData = {
        type: documentType.value,
        expiryDate: document.getElementById('expiryDate').value,
        requiresVisit: requiresVisit.value,
        location: document.getElementById('location').value
    };

    if (DataManager.addDocument(formData)) {
        showNotification('Document adăugat cu succes!', 'success');
        updateUI();
        documentForm.reset();
    }
}

// UI Helper Functions
function toggleLocationField() {
    locationGroup.style.display =
        requiresVisit.value === 'yes' ? 'block' : 'none';
}

function updateLocation() {
    const location = document.getElementById('location');
    if (documentType.value === 'id') {
        location.value = 'population';
    } else if (documentType.value === 'driver') {
        location.value = 'drpciv';
    }
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notificationsContainer.prepend(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);

    DataManager.addNotification(message, type);
}

// UI Update Functions
function updateUI() {
    updateDocumentsList();
    updateCalendar();
}

function updateDocumentsList() {
    const documents = DataManager.getDocuments();
    activeDocuments.innerHTML = documents
        .map(doc => `
            <div class="card">
                <h4>${documentTypes[doc.type]}</h4>
                <p>Expiră: ${new Date(doc.expiryDate).toLocaleDateString('ro-RO')}</p>
                <p>Locație: ${locations[doc.location]}</p>
                <button class="btn btn-primary"
                        onclick="removeDocument(${doc.id})">
                    Șterge
                </button>
            </div>
        `)
        .join('');
}

function updateCalendar() {
    const calendar = document.getElementById('calendar');
    const today = new Date();
    const daysInMonth = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0
    ).getDate();

    calendar.innerHTML = '';

    for (let i = 1; i <= daysInMonth; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';
        dayDiv.textContent = i;

        const currentDate = new Date(
            today.getFullYear(),
            today.getMonth(),
            i
        );

        const hasReminder = DataManager.getDocumentsByDate(currentDate).length > 0;

        if (hasReminder) {
            dayDiv.classList.add('has-reminder');
        }

        calendar.appendChild(dayDiv);
    }
}

// Document Management Functions
function removeDocument(id) {
    if (DataManager.removeDocument(id)) {
        showNotification('Document șters cu succes!', 'success');
        updateUI();
    }
}

// Initialize UI
updateUI();