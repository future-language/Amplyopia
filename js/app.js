document.addEventListener('DOMContentLoaded', () => {
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

    // Initialize wizard
    let currentStep = 1;
    const totalSteps = 3;

    // Update progress indicator
    function updateProgress(step) {
        document.querySelectorAll('.progress-step').forEach((el, index) => {
            if (index + 1 <= step) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });
    }

    // Show step function
    function showStep(step) {
        // Hide all steps
        document.querySelectorAll('.wizard-step').forEach(el => {
            el.classList.remove('active');
        });
        
        // Show current step
        const stepEl = document.getElementById(`step-${step}`);
        if (stepEl) {
            stepEl.classList.add('active');
            updateProgress(step);
        }
    }

    // Make functions global
    window.nextStep = function() {
        if (currentStep < totalSteps) {
            currentStep++;
            showStep(currentStep);
        }
    };

    window.prevStep = function() {
        if (currentStep > 1) {
            currentStep--;
            showStep(currentStep);
        }
    };

    // Handle form submission
    const userForm = document.getElementById('user-form');
    if (userForm) {
        userForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('user-name').value;
            const age = document.getElementById('user-age').value;
            
            // Store user data (you can use localStorage or send to server)
            localStorage.setItem('userName', name);
            localStorage.setItem('userAge', age);
            
            // Move to next step
            window.nextStep();
        });
    }

    // Mobile menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const siteNav = document.getElementById('site-nav');
    
    if (menuToggle && siteNav) {
        menuToggle.addEventListener('click', () => {
            const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
            menuToggle.setAttribute('aria-expanded', !isExpanded);
            siteNav.classList.toggle('active');
        });
    }

    // Option card handlers
    const routes = {
        'opt-lazy-eye': () => { window.location.href = 'lazytest/index.html'; },
        'opt-vision-test': () => { window.location.href = 'vision-test.html'; },
        'opt-guidelines': () => { window.location.href = 'guidelines.html'; },
        'opt-report': () => { window.location.href = 'report.html'; }
    };
    
    Object.keys(routes).forEach((id) => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('click', routes[id]);
        }
    });

    // Back button on secondary pages
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            if (window.history.length > 1) {
                window.history.back();
            } else {
                window.location.href = 'index.html';
            }
        });
    }

    // Initialize first step
    showStep(1);
});
