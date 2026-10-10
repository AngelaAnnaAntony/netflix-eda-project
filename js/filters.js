/**
 * filters.js
 * Manages global multi-attribute filtering across the Netflix EDA Dashboard.
 */

const FilterManager = {
    // Reference to original complete dataset
    originalDataset: [],
    
    // Active filter parameters
    activeFilters: {
        type: 'All',
        country: 'All',
        genre: 'All',
        rating: 'All',
        year: 'All'
    },

    /**
     * Initializes filter dropdowns with unique sorted values from dataset
     * @param {Array<Object>} dataset - Complete cleaned Netflix dataset
     */
    initFilters(dataset) {
        this.originalDataset = dataset;
        this.populateDropdowns(dataset);
        this.attachEventListeners();
    },

    /**
     * Extracts unique values from dataset and populates HTML select dropdowns
     * @param {Array<Object>} dataset 
     */
    populateDropdowns(dataset) {
        const countriesSet = new Set();
        const genresSet = new Set();
        const ratingsSet = new Set();
        const yearsSet = new Set();

        dataset.forEach(item => {
            // Collect Countries
            if (item.country && item.country !== 'Unknown') {
                item.country.split(',').forEach(c => countriesSet.add(c.trim()));
            }
            // Collect Genres
            if (item.listed_in) {
                item.listed_in.split(',').forEach(g => genresSet.add(g.trim()));
            }
            // Collect Ratings
            if (item.rating && item.rating !== 'Not Available') {
                ratingsSet.add(item.rating.trim());
            }
            // Collect Release Years
            if (item.release_year) {
                yearsSet.add(item.release_year.toString());
            }
        });

        // Helper to populate select elements
        const populateSelect = (elementId, items) => {
            const select = document.getElementById(elementId);
            if (!select) return;

            // Keep default "All" option
            select.innerHTML = `<option value="All">All ${elementId.replace('filter-', '').toUpperCase()}s</option>`;
            
            Array.from(items).sort().forEach(value => {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = value;
                select.appendChild(option);
            });
        };

        // Populate individual filter controls
        populateSelect('filter-country', countriesSet);
        populateSelect('filter-genre', genresSet);
        populateSelect('filter-rating', ratingsSet);
        populateSelect('filter-year', Array.from(yearsSet).sort((a, b) => b - a)); // Descending years
    },

    /**
     * Attaches change event listeners to UI dropdowns and reset button
     */
    attachEventListeners() {
        const filterIds = ['filter-type', 'filter-country', 'filter-genre', 'filter-rating', 'filter-year'];

        filterIds.forEach(id => {
            const select = document.getElementById(id);
            if (select) {
                select.addEventListener('change', (e) => {
                    const filterKey = id.replace('filter-', '');
                    this.activeFilters[filterKey] = e.target.value;
                    this.applyFilters();
                });
            }
        });

        // Reset Filters Button Logic
        const resetBtn = document.getElementById('reset-filters-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetFilters();
            });
        }
    },

    /**
     * Filters original dataset according to current active filters
     */
    applyFilters() {
        let filteredData = this.originalDataset.filter(item => {
            // Type Filter
            if (this.activeFilters.type !== 'All' && item.type !== this.activeFilters.type) {
                return false;
            }
            // Country Filter
            if (this.activeFilters.country !== 'All' && (!item.country || !item.country.includes(this.activeFilters.country))) {
                return false;
            }
            // Genre Filter
            if (this.activeFilters.genre !== 'All' && (!item.listed_in || !item.listed_in.includes(this.activeFilters.genre))) {
                return false;
            }
            // Rating Filter
            if (this.activeFilters.rating !== 'All' && item.rating !== this.activeFilters.rating) {
                return false;
            }
            // Release Year Filter
            if (this.activeFilters.year !== 'All' && item.release_year.toString() !== this.activeFilters.year) {
                return false;
            }

            return true;
        });

        // Dispatch Custom Event with Filtered Dataset
        const filterEvent = new CustomEvent('datasetFiltered', { detail: filteredData });
        window.dispatchEvent(filterEvent);
    },

    /**
     * Resets all filter dropdowns to "All"
     */
    resetFilters() {
        this.activeFilters = {
            type: 'All',
            country: 'All',
            genre: 'All',
            rating: 'All',
            year: 'All'
        };

        const filterIds = ['filter-type', 'filter-country', 'filter-genre', 'filter-rating', 'filter-year'];
        filterIds.forEach(id => {
            const select = document.getElementById(id);
            if (select) select.value = 'All';
        });

        this.applyFilters();
    }
};

// Export to global scope
window.FilterManager = FilterManager;