// Simulated database
let documents = JSON.parse(localStorage.getItem('documents') || '[]');

// Calendar functionality
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();

function updateDocumentsList() {
    const documentsList = document.getElementById('allDocumentsList');
    const sortSelect = document.querySelector('.sort-controls select');
    const sortBy = sortSelect ? sortSelect.value : 'expiryDate';

    // Create a copy of documents array for sorting
    let sortedDocuments = [...documents];

    // Sort documents based on selected criteria
    switch(sortBy) {
        case 'expiryDate':
            sortedDocuments.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
            break;
        case 'documentType':
            sortedDocuments.sort((a, b) => a.documentType.localeCompare(b.documentType));
            break;
        case 'dateAdded':
            // Assuming documents are added in order
            break;
    }

    let html = '';
    sortedDocuments.forEach((doc, index) => {
        const expiryDate = new Date(doc.expiryDate);
        const daysUntil = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));

        let statusClass = '';
        if (daysUntil <= 30) statusClass = 'urgent';
        else if (daysUntil <= 90) statusClass = 'warning';
        else statusClass = 'safe';

        html += `
            <div class="document-item">
                <div class="document-header">
                    <span class="document-title">${doc.documentType}</span>
                    <span class="expiry-date">
                        Expires: ${expiryDate.toLocaleDateString()}
                        <span class="days-until ${statusClass}">${daysUntil} days left</span>
                    </span>
                </div>
                <div class="document-details">
                    ${doc.needLocation === 'yes' ? `Location: ${doc.location}` : 'No location needed'}
                </div>
                <button class="delete-btn" onclick="deleteDocument(${index})">Delete</button>
            </div>
        `;
    });

    documentsList.innerHTML = html || '<p>No documents added yet</p>';
}

function deleteDocument(index) {
    if (confirm('Are you sure you want to delete this document?')) {
        documents.splice(index, 1);
        localStorage.setItem('documents', JSON.stringify(documents));
        updateDocumentsList();
        updateCalendar();
    }
}

function updateCalendar() {
    const monthNames = ["January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December"];

    document.getElementById('currentMonth').textContent = `${monthNames[currentMonth]} ${currentYear}`;

    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = '';

    // Add day headers
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.classList.add('calendar-day', 'header');
        dayElement.textContent = day;
        calendarGrid.appendChild(dayElement);
    });

    // Add empty cells for days before the first of the month
    for (let i = 0; i < startingDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.classList.add('calendar-day');
        calendarGrid.appendChild(emptyDay);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.classList.add('calendar-day');
        dayElement.textContent = day;

        // Check if there are any documents expiring on this day
        const currentDate = new Date(currentYear, currentMonth, day);
        const hasReminder = documents.some(doc => {
            const expiry = new Date(doc.expiryDate);
            return expiry.toDateString() === currentDate.toDateString();
        });

        if (hasReminder) {
            dayElement.classList.add('has-reminder');
            dayElement.addEventListener('click', () => showReminders(currentDate));
        }

        calendarGrid.appendChild(dayElement);
    }
}

function showReminders(date) {
    const reminderList = document.getElementById('reminderList');
    const reminders = documents.filter(doc => {
        const expiry = new Date(doc.expiryDate);
        return expiry.toDateString() === date.toDateString();
    });

    let html = '<h3>Expirations for ' + date.toDateString() + '</h3>';
    reminders.forEach(doc => {
        html += `
            <div class="reminder-item">
                <p><strong>${doc.documentType}</strong></p>
                <p>Expires: ${new Date(doc.expiryDate).toLocaleDateString()}</p>
                ${doc.needLocation === 'yes' ? `<p>Location: ${doc.location}</p>` : ''}
            </div>
        `;
    });

    reminderList.innerHTML = html;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize documents list
    updateDocumentsList();

    // Sort control listener
    const sortSelect = document.querySelector('.sort-controls select');
    if (sortSelect) {
        sortSelect.addEventListener('change', updateDocumentsList);
    }

    document.getElementById('prevMonth').addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        updateCalendar();
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        updateCalendar();
    });

    document.getElementById('needLocation').addEventListener('change', (e) => {
        const locationField = document.getElementById('locationField');
        if (e.target.value === 'yes') {
            locationField.classList.remove('hidden');
        } else {
            locationField.classList.add('hidden');
        }
    });

    document.getElementById('documentType').addEventListener('change', (e) => {
        const location = document.getElementById('location');
        if (e.target.value === 'id') {
            location.value = 'population';
        } else if (e.target.value === 'driving') {
            location.value = 'drpciv';
        }
    });

    document.getElementById('documentForm').addEventListener('submit', (e) => {
        e.preventDefault();

        const newDocument = {
            documentType: document.getElementById('documentType').value,
            expiryDate: document.getElementById('expiryDate').value,
            needLocation: document.getElementById('needLocation').value,
            location: document.getElementById('needLocation').value === 'yes' ?
                     document.getElementById('location').value : null
        };

        documents.push(newDocument);
        localStorage.setItem('documents', JSON.stringify(documents));

        updateCalendar();
        updateDocumentsList();
        e.target.reset();

        // Show success message
        alert('Document added successfully!');
    });

    // Initialize calendar
    updateCalendar();
});