/**
 * statistics.js
 * Calculates key performance indicators (KPIs) and manages animated counter transitions.
 */

// Global object to manage statistics logic
const StatisticsManager = {
    
    /**
     * Animates a numerical counter from 0 to target value
     * @param {string} elementId - DOM ID of the element displaying the counter
     * @param {number} targetValue - Final numerical value to reach
     * @param {number} duration - Animation duration in milliseconds
     */
    animateCounter(elementId, targetValue, duration = 2000) {
        const element = document.getElementById(elementId);
        if (!element) return;

        let startTime = null;
        const startValue = 0;

        // Quadratic easing function for smooth slowing near target
        const easeOutQuad = (t) => t * (2 - t);

        const updateCounter = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            const easedProgress = easeOutQuad(progress);

            const currentValue = Math.floor(startValue + (targetValue - startValue) * easedProgress);
            element.textContent = currentValue.toLocaleString();

            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = targetValue.toLocaleString();
            }
        };

        requestAnimationFrame(updateCounter);
    },

    /**
     * Recalculates metrics dynamically based on filtered dataset records
     * @param {Array<Object>} dataset - Array of cleaned Netflix dataset objects
     */
    updateKPIs(dataset) {
        if (!dataset || dataset.length === 0) return;

        const totalTitles = dataset.length;
        let movieCount = 0;
        let tvShowCount = 0;
        const countriesSet = new Set();
        const directorsSet = new Set();
        const genresSet = new Set();

        dataset.forEach(item => {
            // Content Type Counts
            if (item.type === 'Movie') {
                movieCount++;
            } else if (item.type === 'TV Show') {
                tvShowCount++;
            }

            // Unique Countries Calculation
            if (item.country && item.country !== 'Unknown') {
                item.country.split(',').forEach(c => countriesSet.add(c.trim()));
            }

            // Unique Directors Calculation
            if (item.director && item.director !== 'Not Available') {
                item.director.split(',').forEach(d => directorsSet.add(d.trim()));
            }

            // Unique Genres Calculation
            if (item.listed_in) {
                item.listed_in.split(',').forEach(g => genresSet.add(g.trim()));
            }
        });

        // Trigger Animated Counters
        this.animateCounter('kpi-total-titles', totalTitles);
        this.animateCounter('kpi-movies', movieCount);
        this.animateCounter('kpi-tvshows', tvShowCount);
        this.animateCounter('kpi-countries', countriesSet.size);
        this.animateCounter('kpi-directors', directorsSet.size);
        this.animateCounter('kpi-genres', genresSet.size);
    }
};

// Export module for global use across dashboard scripts
window.StatisticsManager = StatisticsManager;