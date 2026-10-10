/**
 * js/charts.js
 * Manages the initialization, rendering, dynamic updating, and theme switching 
 * of all 10 interactive charts.
 */

const ChartManager = {
    // Store Chart.js instances to allow destruction on update
    chartInstances: {},
    echartInstance: null,

    /**
     * Dynamically determines text and grid colors based on the current theme mode
     */
    getThemeColors() {
        const isLightMode = document.body.getAttribute('data-theme') === 'light';
        return {
            red: '#E50914',
            redHover: '#B81D24',
            darkRed: '#831010',
            lightRed: '#FF4D4D',
            grey: '#666666',
            lightGrey: '#E5E5E5',
            textPrimary: isLightMode ? '#141414' : '#FFFFFF',
            textSecondary: isLightMode ? '#4A4A4A' : '#AAAAAA',
            gridColor: isLightMode ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.08)',
            echartBg: isLightMode ? '#FFFFFF' : '#141414'
        };
    },

    /**
     * Renders or updates all 10 dashboard charts using filtered dataset records
     * @param {Array<Object>} dataset 
     */
    renderCharts(dataset) {
        if (!dataset || dataset.length === 0) return;
        this.lastDataset = dataset; // Store dataset reference for theme updates

        this.renderChart1_TypeDistribution(dataset);
        this.renderChart2_TopGenres(dataset);
        this.renderChart3_TopCountries(dataset);
        this.renderChart4_ReleaseTrends(dataset);
        this.renderChart5_RatingsDistribution(dataset);
        this.renderChart6_MovieDurations(dataset);
        this.renderChart7_TopDirectors(dataset);
        this.renderChart8_TopActors(dataset);
        this.renderChart9_MonthlyAdded(dataset);
        this.renderChart10_EChartsStacked(dataset);
    },

    /**
     * Helper to safely destroy existing chart instances before re-rendering
     */
    destroyChart(key) {
        if (this.chartInstances[key]) {
            this.chartInstances[key].destroy();
            delete this.chartInstances[key];
        }
    },

    /* ==========================================================================
       1. Movies vs. TV Shows Distribution (Doughnut Chart)
       ========================================================================== */
    renderChart1_TypeDistribution(dataset) {
        this.destroyChart('chart1');
        const colors = this.getThemeColors();

        const counts = { 'Movie': 0, 'TV Show': 0 };
        dataset.forEach(item => {
            if (counts[item.type] !== undefined) counts[item.type]++;
        });

        const canvas = document.getElementById('chart1');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        this.chartInstances['chart1'] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(counts),
                datasets: [{
                    data: Object.values(counts),
                    backgroundColor: [colors.red, '#555555'],
                    borderColor: colors.textPrimary === '#141414' ? '#FFFFFF' : '#141414',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: colors.textPrimary } },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((ctx.raw / total) * 100).toFixed(1) : 0;
                                return ` ${ctx.label}: ${ctx.raw.toLocaleString()} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    },

    /* ==========================================================================
       2. Top 10 Popular Genres (Vertical Bar)
       ========================================================================== */
    renderChart2_TopGenres(dataset) {
        this.destroyChart('chart2');
        const colors = this.getThemeColors();

        const genreCounts = {};
        dataset.forEach(item => {
            if (item.listed_in) {
                item.listed_in.split(',').forEach(g => {
                    const genre = g.trim();
                    genreCounts[genre] = (genreCounts[genre] || 0) + 1;
                });
            }
        });

        const sorted = Object.entries(genreCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        const canvas = document.getElementById('chart2');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        this.chartInstances['chart2'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sorted.map(i => i[0]),
                datasets: [{
                    label: 'Titles Count',
                    data: sorted.map(i => i[1]),
                    backgroundColor: colors.red,
                    borderRadius: 4
                }]
            },
            options: this.getStandardBarOptions()
        });
    },

    /* ==========================================================================
       3. Top 10 Content Producing Countries (Horizontal Bar)
       ========================================================================== */
    renderChart3_TopCountries(dataset) {
        this.destroyChart('chart3');
        const colors = this.getThemeColors();

        const countryCounts = {};
        dataset.forEach(item => {
            if (item.country && item.country !== 'Unknown') {
                item.country.split(',').forEach(c => {
                    const country = c.trim();
                    countryCounts[country] = (countryCounts[country] || 0) + 1;
                });
            }
        });

        const sorted = Object.entries(countryCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        const canvas = document.getElementById('chart3');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        this.chartInstances['chart3'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sorted.map(i => i[0]),
                datasets: [{
                    label: 'Total Production',
                    data: sorted.map(i => i[1]),
                    backgroundColor: colors.redHover,
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks: { color: colors.textSecondary }, grid: { color: colors.gridColor } },
                    y: { ticks: { color: colors.textPrimary }, grid: { display: false } }
                }
            }
        });
    },

    /* ==========================================================================
       4. Content Release Trend by Year (Smooth Line Chart)
       ========================================================================== */
    renderChart4_ReleaseTrends(dataset) {
        this.destroyChart('chart4');
        const colors = this.getThemeColors();

        const yearCounts = {};
        dataset.forEach(item => {
            if (item.release_year) {
                yearCounts[item.release_year] = (yearCounts[item.release_year] || 0) + 1;
            }
        });

        const sortedYears = Object.keys(yearCounts).sort((a, b) => a - b);
        const dataValues = sortedYears.map(year => yearCounts[year]);

        const canvas = document.getElementById('chart4');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        this.chartInstances['chart4'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: sortedYears,
                datasets: [{
                    label: 'Releases Per Year',
                    data: dataValues,
                    borderColor: colors.red,
                    backgroundColor: 'rgba(229, 9, 20, 0.15)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks: { color: colors.textSecondary }, grid: { color: colors.gridColor } },
                    y: { ticks: { color: colors.textSecondary }, grid: { color: colors.gridColor } }
                }
            }
        });
    },

    /* ==========================================================================
       5. Content Ratings Breakdown (Bar Chart)
       ========================================================================== */
    renderChart5_RatingsDistribution(dataset) {
        this.destroyChart('chart5');
        const colors = this.getThemeColors();

        const ratingCounts = {};
        dataset.forEach(item => {
            if (item.rating && item.rating !== 'Not Available') {
                ratingCounts[item.rating] = (ratingCounts[item.rating] || 0) + 1;
            }
        });

        const sorted = Object.entries(ratingCounts).sort((a, b) => b[1] - a[1]);

        const canvas = document.getElementById('chart5');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        this.chartInstances['chart5'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sorted.map(i => i[0]),
                datasets: [{
                    label: 'Titles Count',
                    data: sorted.map(i => i[1]),
                    backgroundColor: colors.darkRed,
                    borderRadius: 4
                }]
            },
            options: this.getStandardBarOptions()
        });
    },

    /* ==========================================================================
       6. Movie Duration Distribution (Area Chart)
       ========================================================================== */
    renderChart6_MovieDurations(dataset) {
        this.destroyChart('chart6');
        const colors = this.getThemeColors();

        const durationBuckets = { '<60m': 0, '60-90m': 0, '90-120m': 0, '120-150m': 0, '150m+': 0 };

        dataset.filter(i => i.type === 'Movie').forEach(item => {
            const minutes = parseInt(item.duration);
            if (!isNaN(minutes)) {
                if (minutes < 60) durationBuckets['<60m']++;
                else if (minutes <= 90) durationBuckets['60-90m']++;
                else if (minutes <= 120) durationBuckets['90-120m']++;
                else if (minutes <= 150) durationBuckets['120-150m']++;
                else durationBuckets['150m+']++;
            }
        });

        const canvas = document.getElementById('chart6');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        this.chartInstances['chart6'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Object.keys(durationBuckets),
                datasets: [{
                    label: 'Number of Movies',
                    data: Object.values(durationBuckets),
                    borderColor: colors.lightRed,
                    backgroundColor: 'rgba(255, 77, 77, 0.2)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks: { color: colors.textSecondary }, grid: { color: colors.gridColor } },
                    y: { ticks: { color: colors.textSecondary }, grid: { color: colors.gridColor } }
                }
            }
        });
    },

    /* ==========================================================================
       7. Top Directors (Horizontal Bar)
       ========================================================================== */
    renderChart7_TopDirectors(dataset) {
        this.destroyChart('chart7');
        const colors = this.getThemeColors();

        const directorCounts = {};
        dataset.forEach(item => {
            if (item.director && item.director !== 'Not Available') {
                item.director.split(',').forEach(d => {
                    const dir = d.trim();
                    directorCounts[dir] = (directorCounts[dir] || 0) + 1;
                });
            }
        });

        const sorted = Object.entries(directorCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

        const canvas = document.getElementById('chart7');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        this.chartInstances['chart7'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sorted.map(i => i[0]),
                datasets: [{
                    label: 'Titles Directed',
                    data: sorted.map(i => i[1]),
                    backgroundColor: colors.red,
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks: { color: colors.textSecondary }, grid: { color: colors.gridColor } },
                    y: { ticks: { color: colors.textPrimary }, grid: { display: false } }
                }
            }
        });
    },

    /* ==========================================================================
       8. Top Actors (Bar Chart)
       ========================================================================== */
    renderChart8_TopActors(dataset) {
        this.destroyChart('chart8');
        const colors = this.getThemeColors();

        const actorCounts = {};
        dataset.forEach(item => {
            if (item.cast && item.cast !== 'Not Available') {
                item.cast.split(',').forEach(a => {
                    const actor = a.trim();
                    actorCounts[actor] = (actorCounts[actor] || 0) + 1;
                });
            }
        });

        const sorted = Object.entries(actorCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

        const canvas = document.getElementById('chart8');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        this.chartInstances['chart8'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sorted.map(i => i[0]),
                datasets: [{
                    label: 'Appearances',
                    data: sorted.map(i => i[1]),
                    backgroundColor: '#666666',
                    borderRadius: 4
                }]
            },
            options: this.getStandardBarOptions()
        });
    },

    /* ==========================================================================
       9. Monthly Content Added to Netflix (ROBUST DATA PARSER)
       ========================================================================== */
    renderChart9_MonthlyAdded(dataset) {
        this.destroyChart('chart9');
        const colors = this.getThemeColors();

        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const monthCounts = new Array(12).fill(0);

        dataset.forEach(item => {
            // Check for various possible field names in raw CSV/JSON dataset
            const rawDate = item.date_added || item.dateAdded || item['Date Added'] || item.date;
            if (!rawDate || rawDate === 'Not Available') return;

            const strDate = String(rawDate).trim();

            // Case A: Full or short month name in string (e.g., "September 25, 2021" or "25-Sep-2021")
            let matched = false;
            for (let i = 0; i < 12; i++) {
                const fullMonth = monthNames[i].toLowerCase();
                const shortMonth = fullMonth.substring(0, 3);
                const strLower = strDate.toLowerCase();

                if (strLower.includes(fullMonth) || strLower.includes(shortMonth)) {
                    monthCounts[i]++;
                    matched = true;
                    break;
                }
            }

            // Case B: ISO/Numeric date strings (e.g., "2021-09-25" or "09/25/2021")
            if (!matched) {
                const parsedDate = new Date(strDate);
                if (!isNaN(parsedDate.getTime())) {
                    const monthIndex = parsedDate.getMonth(); // 0 to 11
                    monthCounts[monthIndex]++;
                }
            }
        });

        const canvas = document.getElementById('chart9');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        this.chartInstances['chart9'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: monthNames,
                datasets: [{
                    label: 'Titles Added',
                    data: monthCounts,
                    backgroundColor: colors.red,
                    borderRadius: 4
                }]
            },
            options: this.getStandardBarOptions()
        });
    },

    /* ==========================================================================
       10. Apache ECharts Stacked Content Breakdown
       ========================================================================== */
    renderChart10_EChartsStacked(dataset) {
        const dom = document.getElementById('chart10');
        if (!dom) return;

        const colors = this.getThemeColors();

        if (this.echartInstance) {
            this.echartInstance.dispose();
        }
        
        const isLightMode = document.body.getAttribute('data-theme') === 'light';
        this.echartInstance = echarts.init(dom, isLightMode ? null : 'dark');

        const countryMap = {};
        dataset.forEach(item => {
            if (item.country && item.country !== 'Unknown') {
                const primaryCountry = item.country.split(',')[0].trim();
                if (!countryMap[primaryCountry]) countryMap[primaryCountry] = { Movie: 0, 'TV Show': 0 };
                if (item.type === 'Movie') countryMap[primaryCountry].Movie++;
                else if (item.type === 'TV Show') countryMap[primaryCountry]['TV Show']++;
            }
        });

        const sortedCountries = Object.keys(countryMap)
            .sort((a, b) => (countryMap[b].Movie + countryMap[b]['TV Show']) - (countryMap[a].Movie + countryMap[a]['TV Show']))
            .slice(0, 8);

        const movieData = sortedCountries.map(c => countryMap[c].Movie);
        const tvData = sortedCountries.map(c => countryMap[c]['TV Show']);

        const option = {
            backgroundColor: 'transparent',
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
            legend: { data: ['Movie', 'TV Show'], textStyle: { color: colors.textPrimary } },
            grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
            xAxis: { type: 'value', axisLabel: { color: colors.textSecondary }, splitLine: { lineStyle: { color: colors.gridColor } } },
            yAxis: { type: 'category', data: sortedCountries, axisLabel: { color: colors.textPrimary } },
            series: [
                { name: 'Movie', type: 'bar', stack: 'total', color: '#E50914', data: movieData },
                { name: 'TV Show', type: 'bar', stack: 'total', color: '#555555', data: tvData }
            ]
        };

        this.echartInstance.setOption(option);
    },

    /**
     * Shared helper for standard vertical bar chart styling
     */
    getStandardBarOptions() {
        const colors = this.getThemeColors();
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: colors.textSecondary, maxRotation: 45 }, grid: { display: false } },
                y: { ticks: { color: colors.textSecondary }, grid: { color: colors.gridColor } }
            }
        };
    },

    /**
     * Re-renders all charts when theme switches between light and dark
     */
    updateTheme() {
        if (this.lastDataset) {
            this.renderCharts(this.lastDataset);
        }
    }
};

/**
 * Global Export Functions for Chart PNG Downloading
 */
window.exportChart = function(chartId) {
    const chart = ChartManager.chartInstances[chartId];
    if (chart) {
        const a = document.createElement('a');
        a.href = chart.toBase64Image();
        a.download = `${chartId}_visualization.png`;
        a.click();
    }
};

window.exportEChart = function(chartId) {
    if (ChartManager.echartInstance) {
        const colors = ChartManager.getThemeColors();
        const a = document.createElement('a');
        a.href = ChartManager.echartInstance.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: colors.echartBg });
        a.download = `${chartId}_stacked_visualization.png`;
        a.click();
    }
};

// Export to global scope
window.ChartManager = ChartManager;