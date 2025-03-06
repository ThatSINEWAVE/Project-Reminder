// Document Reminder System

// Simulated database
let documents = JSON.parse(localStorage.getItem('documents') || '[]');

// Additional metadata to be stored with documents
if (!documents.some(doc => doc.hasOwnProperty('id'))) {
    documents = documents.map((doc, index) => ({
        ...doc,
        id: `doc-${Date.now()}-${index}`,
        dateAdded: doc.dateAdded || new Date().toISOString(),
        reminderDays: doc.reminderDays || 30
    }));
    localStorage.setItem('documents', JSON.stringify(documents));
}

// Calendar functionality
let currentDate = new Date();
let selectedDate = null;
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();

// Document type mapping
const documentTypes = {
    'id': 'Carte de identitate',
    'driving': 'Permis de conducere',
    'passport': 'Pașaport',
    'residence': 'Carte de rezidență',
    'other': 'Altele'
};

// Location mapping
const locations = {
    'population': 'Centru de evidență a populației',
    'drpciv': 'DRPCIV',
    'unknown': 'Necunoscut'
};

// Update documents list with improved styling and interactions
function updateDocumentsList() {
    const documentsList = document.getElementById('allDocumentsList');
    const sortSelect = document.getElementById('sortDocuments');
    const sortBy = sortSelect ? sortSelect.value : 'expiryDate';

    // Create a copy of documents array for sorting
    let sortedDocuments = [...documents];

    // Sort documents based on selected criteria
    switch (sortBy) {
        case 'expiryDate':
            sortedDocuments.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
            break;
        case 'documentType':
            sortedDocuments.sort((a, b) => {
                const typeA = documentTypes[a.documentType] || a.documentType;
                const typeB = documentTypes[b.documentType] || b.documentType;
                return typeA.localeCompare(typeB);
            });
            break;
        case 'dateAdded':
            sortedDocuments.sort((a, b) => new Date(a.dateAdded) - new Date(b.dateAdded));
            break;
    }

    if (sortedDocuments.length === 0) {
        documentsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-alt"></i>
                <p>Nu ai adăugat încă niciun document</p>
                <button id="emptyStateAddBtn" class="btn-primary" style="margin-top: 16px;">
                    <i class="fas fa-plus"></i> Adaugă-ți primul document
                </button>
            </div>
        `;

        const emptyStateAddBtn = document.getElementById('emptyStateAddBtn');
        if (emptyStateAddBtn) {
            emptyStateAddBtn.addEventListener('click', openModal);
        }

        return;
    }

    let html = '';
    sortedDocuments.forEach((doc) => {
        const expiryDate = new Date(doc.expiryDate);
        const daysUntil = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));

        let statusClass = '';
        if (daysUntil <= 30) statusClass = 'urgent';
        else if (daysUntil <= 90) statusClass = 'warning';
        else statusClass = 'safe';

        const documentType = documentTypes[doc.documentType] || doc.documentType;
        const locationText = doc.needLocation === 'yes' ?
            `<i class="fas fa-map-marker-alt"></i> ${locations[doc.location] || doc.location}` :
            '<i class="fas fa-home"></i> Nicio locație necesară';

        html += `
            <div class="document-item ${statusClass}" data-id="${doc.id}">
                <div class="document-header">
                    <span class="document-title">${documentType}</span>
                    <div class="expiry-date">
                        <span><i class="far fa-calendar-alt"></i> ${expiryDate.toLocaleDateString()}</span>
                        <span class="days-until ${statusClass}">
                            ${daysUntil <= 0 ? 'Expirat!' : `${daysUntil} zile ramase`}
                        </span>
                    </div>
                </div>
                <div class="document-details">
                    ${locationText}
                </div>
                <div class="document-actions">
                    <button class="delete-btn" data-id="${doc.id}">
                        <i class="fas fa-trash-alt"></i> Sterge
                    </button>
                </div>
            </div>
        `;
    });

    documentsList.innerHTML = html;

    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            deleteDocument(id);
        });
    });

    // Add event listeners to document items for details view
    document.querySelectorAll('.document-item').forEach(item => {
        item.addEventListener('click', () => {
            const id = item.getAttribute('data-id');
            const doc = documents.find(d => d.id === id);
            if (doc) {
                const expiryDate = new Date(doc.expiryDate);
                selectDateInCalendar(expiryDate);
            }
        });
    });
}

function deleteDocument(id) {
    if (confirm('Ești sigur că vrei să ștergi acest document?')) {
        const index = documents.findIndex(doc => doc.id === id);
        if (index !== -1) {
            documents.splice(index, 1);
            localStorage.setItem('documents', JSON.stringify(documents));
            updateDocumentsList();
            updateCalendar();

            // If we're viewing reminders for a date, refresh the view
            if (selectedDate) {
                showReminders(selectedDate);
            }
        }
    }
}

function updateCalendar() {
    const monthNames = ["Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
        "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"
    ];

    document.getElementById('currentMonth').textContent = `${monthNames[currentMonth]} ${currentYear}`;

    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.

    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = '';

    // Add day headers
    const days = ['Dum', 'Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm'];
    days.forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.classList.add('calendar-day', 'header');
        dayElement.textContent = day;
        calendarGrid.appendChild(dayElement);
    });

    // Add empty cells for days before the first of the month
    for (let i = 0; i < startingDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.classList.add('calendar-day', 'empty');
        calendarGrid.appendChild(emptyDay);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.classList.add('calendar-day');
        dayElement.textContent = day;

        // Check if this day is today
        const currentDateCheck = new Date();
        if (day === currentDateCheck.getDate() &&
            currentMonth === currentDateCheck.getMonth() &&
            currentYear === currentDateCheck.getFullYear()) {
            dayElement.classList.add('today');
        }

        // Check if there are any documents expiring on this day
        const currentCalendarDate = new Date(currentYear, currentMonth, day);
        const hasReminder = documents.some(doc => {
            const expiry = new Date(doc.expiryDate);
            return expiry.toDateString() === currentCalendarDate.toDateString();
        });

        if (hasReminder) {
            dayElement.classList.add('has-reminder');
        }

        // If this date is selected, add a class
        if (selectedDate &&
            day === selectedDate.getDate() &&
            currentMonth === selectedDate.getMonth() &&
            currentYear === selectedDate.getFullYear()) {
            dayElement.classList.add('selected');
        }

        dayElement.addEventListener('click', () => {
            // Remove selected class from all days
            document.querySelectorAll('.calendar-day.selected').forEach(el => {
                el.classList.remove('selected');
            });

            // Add selected class to this day
            dayElement.classList.add('selected');

            // Update selected date and show reminders
            selectedDate = new Date(currentYear, currentMonth, day);
            showReminders(selectedDate);
        });

        calendarGrid.appendChild(dayElement);
    }
}

function showReminders(date) {
    const reminderList = document.getElementById('reminderList');
    const reminders = documents.filter(doc => {
        const expiry = new Date(doc.expiryDate);
        return expiry.toDateString() === date.toDateString();
    });

    if (reminders.length === 0) {
        reminderList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-check-circle"></i>
                <p>Niciun document care expiră pe ${date.toLocaleDateString()}</p>
            </div>
        `;
        return;
    }

    let html = `<h3>Expirations for ${date.toLocaleDateString()}</h3>`;

    reminders.forEach(doc => {
        const documentType = documentTypes[doc.documentType] || doc.documentType;
        const locationInfo = doc.needLocation === 'Da' ?
            `<p><i class="fas fa-map-marker-alt"></i> ${locations[doc.location] || doc.location}</p>` :
            '<p><i class="fas fa-home"></i> Nicio locație necesară</p>';

        html += `
            <div class="reminder-item">
                <p><i class="fas fa-calendar-check"></i> Expiră pe ${new Date(doc.expiryDate).toLocaleDateString()}</p>
                ${locationInfo}
                <p><i class="fas fa-bell"></i> Memento setat cu ${doc.reminderDays} zile înainte</p>
            </div>
        `;
    });

    reminderList.innerHTML = html;
}

// Function to select a date in the calendar and show its reminders
function selectDateInCalendar(date) {
    // If the date is not in the current month and year, update the calendar
    if (date.getMonth() !== currentMonth || date.getFullYear() !== currentYear) {
        currentMonth = date.getMonth();
        currentYear = date.getFullYear();
        updateCalendar();
    }

    // Find the day element for this date
    const dayElements = document.querySelectorAll('.calendar-day:not(.header):not(.empty)');
    dayElements.forEach(el => {
        el.classList.remove('selected');

        // Check if this is the date we want to select
        const elementDay = parseInt(el.textContent);
        if (elementDay === date.getDate()) {
            el.classList.add('selected');
        }
    });

    // Update selected date and show reminders
    selectedDate = new Date(date);
    showReminders(selectedDate);

    // Scroll to the calendar if needed
    document.querySelector('.calendar-container').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

// Modal functions
function openModal() {
    const modal = document.getElementById('documentModal');
    modal.style.display = 'flex';

    // Set default expiry date to 1 year from now
    const defaultExpiry = new Date();
    defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 1);

    // Format date as YYYY-MM-DD for the input
    const formattedDate = defaultExpiry.toISOString().split('T')[0];
    document.getElementById('expiryDate').value = formattedDate;
}

function closeModal() {
    const modal = document.getElementById('documentModal');
    modal.style.display = 'none';

    // Reset the form
    document.getElementById('documentForm').reset();
    document.getElementById('locationField').classList.add('hidden');
}

// Form Submission
function handleFormSubmit(e) {
    e.preventDefault();

    const documentType = document.getElementById('documentType').value;
    const expiryDate = document.getElementById('expiryDate').value;
    const needLocation = document.getElementById('needLocation').checked ? 'Da' : 'Nu';
    const location = document.getElementById('location').value;
    const reminderDays = document.getElementById('reminderDays').value;

    // Validate form
    if (!documentType || !expiryDate) {
        alert('Te rog să completezi toate câmpurile obligatorii.');
        return;
    }

    // Create new document
    const newDocument = {
        id: `doc-${Date.now()}`,
        documentType,
        expiryDate,
        needLocation,
        location: needLocation === 'Da' ? location : null,
        reminderDays,
        dateAdded: new Date().toISOString()
    };

    // Add to documents array
    documents.push(newDocument);

    // Save to localStorage
    localStorage.setItem('documents', JSON.stringify(documents));

    // Update UI
    updateDocumentsList();
    updateCalendar();

    // If the expiry date is in the current month, show it
    const expiry = new Date(expiryDate);
    if (expiry.getMonth() === currentMonth && expiry.getFullYear() === currentYear) {
        selectDateInCalendar(expiry);
    }

    // Close the modal
    closeModal();

    // Show success message
    showNotification('Document adăugat cu succes!', 'success');
}

// Notification system
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
            <p>${message}</p>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;

    // Append to body
    document.body.appendChild(notification);

    // Add event listener for close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.classList.add('notification-hiding');
        setTimeout(() => {
            notification.remove();
        }, 300);
    });

    // Auto-hide after 3 seconds
    setTimeout(() => {
        notification.classList.add('notification-hiding');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);

    // Add animation class
    setTimeout(() => {
        notification.classList.add('notification-visible');
    }, 10);
}

// Add required CSS for notifications
function addNotificationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            bottom: -100px;
            right: 20px;
            background-color: var(--white);
            border-radius: var(--rounded-md);
            box-shadow: var(--shadow-lg);
            padding: 16px;
            min-width: 280px;
            max-width: 400px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: all 0.3s ease;
            z-index: 1000;
            opacity: 0;
        }

        .notification-visible {
            bottom: 20px;
            opacity: 1;
        }

        .notification-hiding {
            opacity: 0;
            bottom: -100px;
        }

        .notification.success {
            border-left: 4px solid var(--success);
        }

        .notification.info {
            border-left: 4px solid var(--primary);
        }

        .notification.warning {
            border-left: 4px solid var(--warning);
        }

        .notification.error {
            border-left: 4px solid var(--danger);
        }

        .notification-content {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .notification-content i {
            font-size: 20px;
        }

        .notification.success i {
            color: var(--success);
        }

        .notification.info i {
            color: var(--primary);
        }

        .notification.warning i {
            color: var(--warning);
        }

        .notification.error i {
            color: var(--danger);
        }

        .notification-close {
            background: transparent;
            border: none;
            color: var(--gray-500);
            cursor: pointer;
            padding: 4px;
        }

        .notification-close:hover {
            color: var(--gray-700);
        }
    `;
    document.head.appendChild(style);
}

// Navigate between months in the calendar
function navigateMonth(direction) {
    if (direction === 'prev') {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
    } else {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
    }

    updateCalendar();

    // Clear selected date when changing months
    selectedDate = null;

    // Reset reminder list
    document.getElementById('reminderList').innerHTML = `
        <div class="empty-state">
            <i class="fas fa-calendar-check"></i>
            <p>Selectează o dată pentru a vedea expirările</p>
        </div>
    `;
}

// Initialize the application
function initApp() {
    // Add event listeners
    document.getElementById('addDocumentBtn').addEventListener('click', openModal);
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('cancelForm').addEventListener('click', closeModal);
    document.getElementById('documentForm').addEventListener('submit', handleFormSubmit);
    document.getElementById('prevMonth').addEventListener('click', () => navigateMonth('prev'));
    document.getElementById('nextMonth').addEventListener('click', () => navigateMonth('next'));
    document.getElementById('sortDocuments').addEventListener('change', updateDocumentsList);

    // Toggle location field based on checkbox
    const needLocationCheckbox = document.getElementById('needLocation');
    const locationField = document.getElementById('locationField');
    const toggleStatus = document.getElementById('toggleStatus');

    needLocationCheckbox.addEventListener('change', () => {
        if (needLocationCheckbox.checked) {
            locationField.classList.remove('hidden');
            toggleStatus.textContent = 'Da';
        } else {
            locationField.classList.add('hidden');
            toggleStatus.textContent = 'Nu';
        }
    });

    // Add notification styles
    addNotificationStyles();

    // Initial UI updates
    updateDocumentsList();
    updateCalendar();

    // Check for expired documents and upcoming expirations
    checkExpirations();
}

// Check for expired documents and upcoming expirations on app load
function checkExpirations() {
    const today = new Date();
    const upcomingExpirations = [];

    documents.forEach(doc => {
        const expiryDate = new Date(doc.expiryDate);
        const daysUntil = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

        // If document is expired or expires soon based on reminderDays
        if (daysUntil <= parseInt(doc.reminderDays)) {
            upcomingExpirations.push({
                document: doc,
                daysUntil: daysUntil
            });
        }
    });

    // Sort by urgency (expired first, then by days until expiry)
    upcomingExpirations.sort((a, b) => a.daysUntil - b.daysUntil);

    // Show notification if there are upcoming expirations
    if (upcomingExpirations.length > 0) {
        const expiredCount = upcomingExpirations.filter(exp => exp.daysUntil <= 0).length;
        const upcomingCount = upcomingExpirations.length - expiredCount;

        let message = '';
        if (expiredCount > 0 && upcomingCount > 0) {
            message = `Ai ${expiredCount} document${expiredCount > 1 ? 'e' : ''} expirate și ${upcomingCount} document${upcomingCount > 1 ? 'e' : ''} care expiră curând.`;
        } else if (expiredCount > 0) {
            message = `Ai ${expiredCount} document${expiredCount > 1 ? 'e' : ''} expirate.`;
        } else {
            message = `Ai ${upcomingCount} document${upcomingCount > 1 ? 'e' : ''} care expiră curând.`;
        }


        // Show notification after a short delay to ensure app is loaded
        setTimeout(() => {
            showNotification(message, expiredCount > 0 ? 'error' : 'warning');
        }, 1000);
    }
}

// Helper function to format dates for display
function formatDate(dateString) {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Handle clicks outside of the modal to close it
window.addEventListener('click', (e) => {
    const modal = document.getElementById('documentModal');
    if (e.target === modal) {
        closeModal();
    }
});

// Add escape key handler for modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);