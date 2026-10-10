/**
 * js/script.js
 * Application Bootstrapper & Visual Animation Handler
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Visual Libraries (AOS & GSAP Animations)
    initVisualAnimations();

    // 2. Initialize Particles.js Background
    initParticleBackground();

    // 3. Fetch and Parse cleaned Netflix Dataset via PapaParse
    loadNetflixDataset();
});

/**
 * Parses local CSV dataset and initializes the main dashboard application
 */
function loadNetflixDataset() {
    const csvFilePath = 'data/netflix_cleaned.csv';

    Papa.parse(csvFilePath, {
        download: true,
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: function (results) {
            console.log(`[Netflix Dashboard] Data loaded successfully: ${results.data.length} records.`);
            
            // Pass parsed dataset to the main DashboardApp controller
            if (window.DashboardApp && typeof window.DashboardApp.init === 'function') {
                window.DashboardApp.init(results.data);
            } else {
                console.error('[Netflix Dashboard] DashboardApp controller is not defined.');
            }
        },
        error: function (error) {
            console.error('[Netflix Dashboard] Error parsing CSV file:', error);
            showDataLoadError();
        }
    });
}

/**
 * Sets up Scroll (AOS) and Header (GSAP) Entrance Animations
 */
function initVisualAnimations() {
    // Animate On Scroll (AOS) Initialization
    if (typeof aos !== 'undefined' || typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            easing: 'ease-in-out',
            once: true,
            mirror: false
        });
    }

    // GSAP Header Fade-In Animation
    if (typeof gsap !== 'undefined') {
        gsap.from('.navbar', { duration: 1, y: -50, opacity: 0, ease: 'power2.out' });
        gsap.from('.hero-section', { duration: 1.2, opacity: 0, delay: 0.3, ease: 'power2.out' });
    }
}

/**
 * Initializes Particles.js background canvas
 */
function initParticleBackground() {
    if (typeof particlesJS !== 'undefined' && document.getElementById('particles-js')) {
        particlesJS('particles-js', {
            particles: {
                number: { value: 40, density: { enable: true, value_area: 800 } },
                color: { value: '#E50914' }, // Netflix Red Particles
                shape: { type: 'circle' },
                opacity: { value: 0.3, random: true },
                size: { value: 3, random: true },
                line_linked: {
                    enable: true,
                    distance: 150,
                    color: '#E50914',
                    opacity: 0.15,
                    width: 1
                },
                move: {
                    enable: true,
                    speed: 1.5,
                    direction: 'none',
                    random: false,
                    straight: false,
                    out_mode: 'out',
                    bounce: false
                }
            },
            interactivity: {
                detect_on: 'canvas',
                events: {
                    onhover: { enable: true, mode: 'grab' },
                    onclick: { enable: true, mode: 'push' }
                },
                modes: {
                    grab: { distance: 140, line_linked: { opacity: 0.4 } },
                    push: { particles_nb: 3 }
                }
            },
            retina_detect: true
        });
    }
}

/**
 * Displays a fallback message if the CSV dataset fails to load
 */
function showDataLoadError() {
    const errorBanner = document.createElement('div');
    errorBanner.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #E50914;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        font-weight: bold;
        z-index: 9999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    `;
    errorBanner.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Failed to load <code>netflix_cleaned.csv</code>. Please verify file path and HTTP server setup.';
    document.body.appendChild(errorBanner);
}