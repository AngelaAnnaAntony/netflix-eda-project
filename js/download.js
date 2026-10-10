/**
 * js/download.js
 * Handles CSV dataset exports and PDF dashboard report generation.
 */

const ExportManager = {

    /**
     * Converts current filtered dataset array into CSV format and triggers download
     */
    exportFilteredCSV() {
        const dataset = window.DashboardApp ? window.DashboardApp.currentDataset : [];
        if (!dataset || dataset.length === 0) {
            alert('No data available to export.');
            return;
        }

        // Define target columns for clean output
        const headers = ['show_id', 'type', 'title', 'director', 'cast', 'country', 'date_added', 'release_year', 'rating', 'duration', 'listed_in', 'description'];

        // Build CSV String
        let csvContent = headers.join(',') + '\n';

        dataset.forEach(row => {
            const rowValues = headers.map(header => {
                let value = row[header] !== undefined && row[header] !== null ? String(row[header]) : '';
                // Escape double quotes and enclose in quotes if contains commas or line breaks
                value = value.replace(/"/g, '""');
                if (value.includes(',') || value.includes('\n') || value.includes('"')) {
                    value = `"${value}"`;
                }
                return value;
            });
            csvContent += rowValues.join(',') + '\n';
        });

        // Trigger Download Link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `netflix_filtered_data_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    /**
     * Generates a printable report view for saving as PDF
     */
    exportPDFReport() {
        window.print();
    },

    /**
     * Binds export function listeners to target UI buttons
     */
    init() {
        const exportCsvBtn = document.getElementById('export-csv-btn');
        const exportPdfBtn = document.getElementById('export-pdf-btn');

        if (exportCsvBtn) {
            exportCsvBtn.addEventListener('click', () => this.exportFilteredCSV());
        }

        if (exportPdfBtn) {
            exportPdfBtn.addEventListener('click', () => this.exportPDFReport());
        }
    }
};

// Auto-initialize when file loads
document.addEventListener('DOMContentLoaded', () => {
    ExportManager.init();
});

// Export to global scope
window.ExportManager = ExportManager;