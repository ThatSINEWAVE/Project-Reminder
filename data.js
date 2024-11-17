// Mock database structure
const localData = {
    documents: [],
    notifications: []
};

// Document types mapping
const documentTypes = {
    'id': 'Carte de identitate',
    'driver': 'Permis de conducere',
    'other': 'Alt document'
};

// Locations mapping
const locations = {
    'population': 'Evidența Populației',
    'drpciv': 'DRPCIV',
    'unknown': 'Locație nesetată'
};

// Helper functions for data management
const DataManager = {
    addDocument(document) {
        localData.documents.push({
            ...document,
            id: Date.now()
        });
        this.saveToLocalStorage();
        return true;
    },

    removeDocument(id) {
        localData.documents = localData.documents.filter(doc => doc.id !== id);
        this.saveToLocalStorage();
        return true;
    },

    getDocuments() {
        return localData.documents;
    },

    getDocumentsByDate(date) {
        return localData.documents.filter(doc => {
            const expiry = new Date(doc.expiryDate);
            return expiry.toDateString() === date.toDateString();
        });
    },

    addNotification(message, type = 'success') {
        const notification = {
            id: Date.now(),
            message,
            type,
            timestamp: new Date()
        };
        localData.notifications.unshift(notification);
        this.saveToLocalStorage();
        return notification;
    },

    saveToLocalStorage() {
        localStorage.setItem('reminderData', JSON.stringify(localData));
    },

    loadFromLocalStorage() {
        const saved = localStorage.getItem('reminderData');
        if (saved) {
            const parsed = JSON.parse(saved);
            localData.documents = parsed.documents || [];
            localData.notifications = parsed.notifications || [];
        }
    }
};

// Initialize data from localStorage
DataManager.loadFromLocalStorage();