/**
 * js/dashboard.js
 * Primary entry point and controller for UI interactions, table rendering, 
 * automated insights generation, and event handling across the dashboard.
 */

const DashboardApp = {
    // Current working dataset state
    currentDataset: [],
    
    // Table Pagination & Search State
    tableState: {
        currentPage: 1,
        pageSize: 10,
        sortColumn: 'title',
        sortAscending: true,
        searchQuery: ''
    },

    /**
     * Entry point triggered when DOM content is fully loaded
     */
    init(dataset) {
        if (!dataset || !Array.isArray(dataset)) {
            console.error('Invalid dataset provided to DashboardApp');
            return;
        }

        this.currentDataset = dataset;

        // Initialize Child Managers
        if (window.StatisticsManager) window.StatisticsManager.updateKPIs(dataset);
        if (window.FilterManager) window.FilterManager.initFilters(dataset);
        if (window.ChartManager) window.ChartManager.renderCharts(dataset);

        // Render Local Dashboard Components
        this.renderInsights(dataset);
        this.renderTable();
        this.setupEventListeners();
        this.setupThemeToggle();
        this.setupScrollBehavior();
    },

    /* ==========================================================================
       1. AUTOMATED INSIGHTS GENERATOR
       ========================================================================== */
    renderInsights(dataset) {
        const insightsContainer = document.getElementById('insights-container');
        if (!insightsContainer || dataset.length === 0) return;

        // Calculate key ratios
        const total = dataset.length;
        const moviesCount = dataset.filter(i => i.type === 'Movie').length;
        const movieRatio = ((moviesCount / total) * 100).toFixed(1);

        // Find top country
        const countryCounts = {};
        dataset.forEach(i => {
            if (i.country && i.country !== 'Unknown') {
                const c = i.country.split(',')[0].trim();
                countryCounts[c] = (countryCounts[c] || 0) + 1;
            }
        });
        const topCountry = Object.entries(countryCounts).sort((a, b) => b[1] - a[1])[0] || ['Unknown', 0];

        // Find peak year
        const yearCounts = {};
        dataset.forEach(i => {
            if (i.release_year) yearCounts[i.release_year] = (yearCounts[i.release_year] || 0) + 1;
        });
        const peakYear = Object.entries(yearCounts).sort((a, b) => b[1] - a[1])[0] || ['N/A', 0];

        insightsContainer.innerHTML = `
            <div class="insight-card">
                <h4><i class="fas fa-film"></i> Dominant Content Type</h4>
                <p>Movies comprise <strong>${movieRatio}%</strong> of the active catalog, showing Netflix's heavy leaning toward feature films over multi-season TV shows.</p>
            </div>
            <div class="insight-card">
                <h4><i class="fas fa-globe-americas"></i> Primary Content Hub</h4>
                <p><strong>${topCountry[0]}</strong> leads production, contributing <strong>${topCountry[1].toLocaleString()}</strong> total titles to the current filtered selection.</p>
            </div>
            <div class="insight-card">
                <h4><i class="fas fa-calendar-alt"></i> Peak Catalog Addition</h4>
                <p>The year <strong>${peakYear[0]}</strong> recorded highest content volume addition with <strong>${peakYear[1].toLocaleString()}</strong> releases registered.</p>
            </div>
        `;
    },

    /* ==========================================================================
       2. INTERACTIVE DATA TABLE & PAGINATION
       ========================================================================== */
    renderTable() {
        const tbody = document.getElementById('table-body');
        if (!tbody) return;

        // Apply global search filter
        let filtered = this.currentDataset.filter(item => {
            if (!this.tableState.searchQuery) return true;
            const query = this.tableState.searchQuery.toLowerCase();
            return (
                (item.title && item.title.toLowerCase().includes(query)) ||
                (item.director && item.director.toLowerCase().includes(query)) ||
                (item.country && item.country.toLowerCase().includes(query)) ||
                (item.listed_in && item.listed_in.toLowerCase().includes(query))
            );
        });

        // Apply Sorting
        filtered.sort((a, b) => {
            let valA = a[this.tableState.sortColumn] || '';
            let valB = b[this.tableState.sortColumn] || '';
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return this.tableState.sortAscending ? -1 : 1;
            if (valA > valB) return this.tableState.sortAscending ? 1 : -1;
            return 0;
        });

        // Calculate Pagination Slice
        const totalItems = filtered.length;
        const totalPages = Math.ceil(totalItems / this.tableState.pageSize) || 1;
        
        if (this.tableState.currentPage > totalPages) this.tableState.currentPage = totalPages;

        const startIndex = (this.tableState.currentPage - 1) * this.tableState.pageSize;
        const pageItems = filtered.slice(startIndex, startIndex + this.tableState.pageSize);

        // Render Rows
        tbody.innerHTML = '';
        if (pageItems.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 24px;">No matching titles found.</td></tr>`;
        } else {
            pageItems.forEach(item => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${this.escapeHtml(item.title || 'Untitled')}</strong></td>
                    <td><span class="badge badge-${(item.type || '').toLowerCase().replace(/\s+/g, '')}">${item.type || 'N/A'}</span></td>
                    <td>${this.escapeHtml(item.director || 'Not Available')}</td>
                    <td>${this.escapeHtml(item.country || 'Unknown')}</td>
                    <td>${item.release_year || 'N/A'}</td>
                    <td>${this.escapeHtml(item.rating || 'N/A')}</td>
                `;
                tbody.appendChild(tr);
            });
        }

        this.updatePaginationUI(totalItems, totalPages);
    },

    updatePaginationUI(totalItems, totalPages) {
        const pageInfo = document.getElementById('table-page-info');
        if (pageInfo) {
            const start = totalItems === 0 ? 0 : (this.tableState.currentPage - 1) * this.tableState.pageSize + 1;
            const end = Math.min(this.tableState.currentPage * this.tableState.pageSize, totalItems);
            pageInfo.textContent = `Showing ${start} to ${end} of ${totalItems.toLocaleString()} entries`;
        }

        const paginationContainer = document.getElementById('table-pagination');
        if (!paginationContainer) return;

        paginationContainer.innerHTML = '';

        // Previous Button
        const prevBtn = document.createElement('button');
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevBtn.disabled = this.tableState.currentPage === 1;
        prevBtn.onclick = () => {
            if (this.tableState.currentPage > 1) {
                this.tableState.currentPage--;
                this.renderTable();
            }
        };
        paginationContainer.appendChild(prevBtn);

        // Next Button
        const nextBtn = document.createElement('button');
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextBtn.disabled = this.tableState.currentPage >= totalPages;
        nextBtn.onclick = () => {
            if (this.tableState.currentPage < totalPages) {
                this.tableState.currentPage++;
                this.renderTable();
            }
        };
        paginationContainer.appendChild(nextBtn);
    },

    /* ==========================================================================
       3. EVENT LISTENERS & FILTER LISTENERS
       ========================================================================== */
    setupEventListeners() {
        // Listen to global dataset update events from FilterManager
        window.addEventListener('datasetFiltered', (e) => {
            const filteredData = e.detail;
            this.currentDataset = filteredData;
            this.tableState.currentPage = 1;

            if (window.StatisticsManager) window.StatisticsManager.updateKPIs(filteredData);
            if (window.ChartManager) window.ChartManager.renderCharts(filteredData);
            this.renderInsights(filteredData);
            this.renderTable();
        });

        // Table Global Search Input
        const searchInput = document.getElementById('table-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.tableState.searchQuery = e.target.value;
                this.tableState.currentPage = 1;
                this.renderTable();
            });
        }

        // Page Size Select
        const pageSizeSelect = document.getElementById('table-page-size');
        if (pageSizeSelect) {
            pageSizeSelect.addEventListener('change', (e) => {
                this.tableState.pageSize = parseInt(e.target.value);
                this.tableState.currentPage = 1;
                this.renderTable();
            });
        }

        // Table Column Header Sort
        document.querySelectorAll('#data-table thead th[data-sort]').forEach(th => {
            th.addEventListener('click', () => {
                const column = th.getAttribute('data-sort');
                if (this.tableState.sortColumn === column) {
                    this.tableState.sortAscending = !this.tableState.sortAscending;
                } else {
                    this.tableState.sortColumn = column;
                    this.tableState.sortAscending = true;
                }
                this.renderTable();
            });
        });

        // Mobile Menu Drawer Toggle
        const mobileToggle = document.getElementById('mobile-toggle');
        const navMenu = document.getElementById('nav-menu');
        if (mobileToggle && navMenu) {
            mobileToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
            });
        }
    },

    /* ==========================================================================
       4. THEME & SCROLL UTILITIES
       ========================================================================== */
    setupThemeToggle() {
        const themeBtn = document.getElementById('theme-toggle-btn');
        if (!themeBtn) return;

        themeBtn.addEventListener('click', () => {
            const currentTheme = document.body.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            document.body.setAttribute('data-theme', newTheme);
            themeBtn.querySelector('i').className = newTheme === 'light' ? 'fas fa-sun' : 'fas fa-moon';
            // Re-render charts with updated theme colors
            if (window.ChartManager) {
            window.ChartManager.updateTheme();
            }
        });
    },

    setupScrollBehavior() {
        const progressBar = document.getElementById('scroll-progress');
        const backToTopBtn = document.getElementById('back-to-top-btn');

        window.addEventListener('scroll', () => {
            const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (winScroll / height) * 100;

            if (progressBar) progressBar.style.width = scrolled + '%';
            if (backToTopBtn) {
                backToTopBtn.style.display = winScroll > 400 ? 'flex' : 'none';
            }
        });

        if (backToTopBtn) {
            backToTopBtn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
    },

    escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
};

// Export to global scope
window.DashboardApp = DashboardApp;