// Initialize all custom controls when page loads
window.addEventListener('DOMContentLoaded', () => {
    initCustomDropdowns();
    initCustomNumberInputs();
    
    // Load health.json asset, then hide loader
    loadHealthData();
});

// Load health.json and hide loader when complete
async function loadHealthData() {
    const loader = document.getElementById('loader');
    const animationContainer = document.getElementById('health-animation');

    // Show the animation container immediately to avoid a brief blank delay
    if (animationContainer) {
        animationContainer.style.display = 'block';
        animationContainer.innerHTML = '';
    }

    try {
        const response = await fetch('/static/assets/health.json');
        const healthData = await response.json();

        const animation = lottie.loadAnimation({
            container: animationContainer, // The HTML element to render in
            renderer: 'svg', // Or 'canvas' if preferred
            loop: true, // Loop the animation (adjust if needed)
            autoplay: true, // Start playing immediately
            animationData: healthData, // The loaded JSON data
        });

        // Speed up the Lottie playback for a snappier loading feel
        try {
            animation.setSpeed(2.5);
        } catch (e) {
            console.warn('Could not set animation speed:', e);
        }

        // Ensure animation container is visible when animation is ready
        animationContainer.style.display = 'block';

    } catch (error) {
        console.warn('Could not load or display health.json animation:', error);
    } finally {
        // Hide loader after health.json load attempt (success or fail)
        if (loader) {
            setTimeout(() => {
                loader.classList.add('hidden');
            }, 1000); // Small delay for smooth transition
        }
    }
}

// Snackbar helper
function showSnackbar(message, duration = 3000) {
    let sb = document.getElementById('snackbar');
    if (!sb) {
        sb = document.createElement('div');
        sb.id = 'snackbar';
        document.body.appendChild(sb);
    }
    // clear previous timer if present
    if (sb._timeout) {
        clearTimeout(sb._timeout);
        sb._timeout = null;
    }
    if (sb._outTimeout) {
        clearTimeout(sb._outTimeout);
        sb._outTimeout = null;
        sb.classList.remove('hide');
    }
    sb.textContent = message;
    sb.classList.add('show');
    sb.style.display = 'block';
    sb._timeout = setTimeout(() => {
        // start hide animation then remove element after animation completes
        sb.classList.remove('show');
        sb.classList.add('hide');
        sb._outTimeout = setTimeout(() => {
            sb.classList.remove('hide');
            sb.style.display = 'none';
            sb._timeout = null;
            sb._outTimeout = null;
        }, 240); // slightly longer than CSS animation to ensure completion
    }, duration);
}

// Custom Number Input Functionality
function initCustomNumberInputs() {
    const numberInputs = document.querySelectorAll('.custom-number-input');
    
    numberInputs.forEach(container => {
        const input = container.querySelector('.number-input');
        const minusBtn = container.querySelector('.number-btn-minus');
        const plusBtn = container.querySelector('.number-btn-plus');
        // ensure inputs have a numeric min (default 0) and keep step precision
        const minAttr = input.hasAttribute('min') ? parseFloat(input.getAttribute('min')) : 0;
        const maxAttr = input.hasAttribute('max') ? parseFloat(input.getAttribute('max')) : null;
        const stepVal = input.hasAttribute('step') ? parseFloat(input.getAttribute('step')) : 1;
        const precision = input.getAttribute('step') ? (input.getAttribute('step').split('.')[1] || '').length : 0;

        // clamp current value on load
        if (input.value !== '') {
            let v = parseFloat(input.value) || 0;
            if (v < minAttr) v = minAttr;
            if (maxAttr !== null && v > maxAttr) v = maxAttr;
            input.value = precision ? v.toFixed(precision) : String(Math.round(v));
        }

        // enforce on manual input (allow partial and empty)
        input.addEventListener('input', () => {
            let val = parseFloat(input.value);
            if (isNaN(val) || input.value === '' || input.value.endsWith('.')) return; // allow empty or partial decimals while typing
            if (maxAttr !== null && val > maxAttr) val = maxAttr;
            input.value = precision ? (val % 1 === 0 ? String(val) : val.toFixed(precision)) : String(Math.round(val));
        });

        // enforce min on blur
        input.addEventListener('blur', () => {
            let val = parseFloat(input.value);
            if (isNaN(val) || input.value === '') {
                input.value = String(minAttr);
            } else if (input.value.endsWith('.')) {
                input.value = String(val);
            } else {
                if (val < minAttr) val = minAttr;
                if (maxAttr !== null && val > maxAttr) val = maxAttr;
                input.value = precision ? (val % 1 === 0 ? String(val) : val.toFixed(precision)) : String(Math.round(val));
            }
        });
        
        // Handle minus button (do not go below min)
        minusBtn.addEventListener('click', (e) => {
            e.preventDefault();
            let value = parseFloat(input.value) || 0;
            const step = stepVal;
            let newValue = value - step;
            if (newValue < minAttr) newValue = minAttr;
            input.value = precision ? newValue.toFixed(precision) : String(Math.round(newValue));
            input.dispatchEvent(new Event('change', { bubbles: true }));
        });
        
        // Handle plus button
        plusBtn.addEventListener('click', (e) => {
            e.preventDefault();
            let value = parseFloat(input.value) || 0;
            const step = stepVal;
            let newValue = value + step;
            if (maxAttr !== null && newValue > maxAttr) newValue = maxAttr;
            input.value = precision ? newValue.toFixed(precision) : String(Math.round(newValue));
            input.dispatchEvent(new Event('change', { bubbles: true }));
        });
    });
}

// Custom Dropdown Functionality
function initCustomDropdowns() {
    const dropdowns = document.querySelectorAll('.custom-dropdown');
    
    dropdowns.forEach(dropdown => {
        const trigger = dropdown.querySelector('.dropdown-trigger');
        const menu = dropdown.querySelector('.dropdown-menu');
        const options = dropdown.querySelectorAll('.dropdown-option');
        const hiddenInput = dropdown.nextElementSibling;
        
        // Toggle dropdown on trigger click
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            // Close other open dropdowns
            document.querySelectorAll('.dropdown-menu.active').forEach(m => {
                if (m !== menu) {
                    m.classList.remove('active');
                    m.parentElement.querySelector('.dropdown-trigger').classList.remove('active');
                }
            });
            
            trigger.classList.toggle('active');
            menu.classList.toggle('active');
        });
        
        // Handle option selection
        options.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const value = option.dataset.value;
                const text = option.textContent;
                
                // Update trigger text
                trigger.querySelector('.dropdown-value').textContent = text;
                
                // Update hidden input
                hiddenInput.value = value;
                
                // Update selected state
                options.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                
                // Close menu
                trigger.classList.remove('active');
                menu.classList.remove('active');
            });
        });
    });
}

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.custom-dropdown')) {
        document.querySelectorAll('.dropdown-menu.active').forEach(menu => {
            menu.classList.remove('active');
            menu.parentElement.querySelector('.dropdown-trigger').classList.remove('active');
        });
    }
});

const form = document.getElementById("healthForm");
const resultEl = document.getElementById("result");
const overlayEl = document.getElementById("overlay");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Validate that every custom dropdown has a selected value
    const dropdowns = document.querySelectorAll('.custom-dropdown');
    for (const dd of dropdowns) {
        const hidden = dd.nextElementSibling;
        if (hidden && (!hidden.value || String(hidden.value).trim() === '')) {
            // show snackbar message instead of inline text
            showSnackbar('Please select an option for all dropdown fields.', 3500);
            return; // stop submission
        }
    }

    // Show loader overlay and disable submit button while request is in progress
    const loaderOverlay = document.getElementById('loader');
    const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
    if (loaderOverlay) {
        loaderOverlay.classList.remove('hidden');
        loaderOverlay.style.display = 'flex';
    }
    if (submitBtn) submitBtn.disabled = true;

    const formData = new FormData(form);
    const data = {};
    formData.forEach((value, key) => { 
        data[key] = isNaN(value) ? value : Number(value); 
    });

    try {
        const response = await fetch("/predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if(result.error){
            resultEl.innerHTML = `<p class="error">${result.error}</p>`;
        } else {
            resultEl.innerHTML = `
                <button class="result-close">✕</button>
                
                <h1>Result</h1>
                <p>Here is the summary of your result</p>
                <hr>

                <div class="result-text">
                    <p>Risk Prediction:</p>
                    <p><strong>${result.final_risk}</strong></p>
                </div>

                <div class="result-text">
                    <p>Confidence Level:</p>
                    <p><strong>${result.confidence}%</strong></p>
                </div>
                
                <hr>
                <p><strong>Explanation:</strong></p>
                <p>${result.explanation.join(", ")}</p>

                <div class="disclaimer">
                    <p><strong>Disclaimer:</strong> The results provided by this tool are for informational purposes only and should not be considered as medical advice. Always consult with a qualified healthcare professional for medical concerns.</p>
                </div>
            `;
        }

        // Show popup + overlay with reveal animation
        resultEl.style.display = "flex";
        // ensure class toggles so animation runs
        resultEl.classList.remove('show');
        // force reflow then add class
        void resultEl.offsetWidth;
        resultEl.classList.add('show');
        overlayEl.style.display = "block";

        // Added: Attach event listeners for closing the popup
        const closeBtn = resultEl.querySelector('.result-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                resultEl.style.display = 'none';
                overlayEl.style.display = 'none';
                resultEl.classList.remove('show'); // Optional: Remove animation class if needed
            });
        }

        // Added: Allow closing by clicking the overlay (but not when clicking inside the card)
        overlayEl.addEventListener('click', () => {
            resultEl.style.display = 'none';
            overlayEl.style.display = 'none';
            resultEl.classList.remove('show'); // Optional: Remove animation class if needed
        });

        // Added: Prevent overlay close when clicking inside the result card
        resultEl.addEventListener('click', (e) => {
            e.stopPropagation(); // Stops the click from bubbling to the overlay
        });

    } catch (err) {
        resultEl.innerHTML = `<p class="error">Error: ${err}</p>`;
        resultEl.style.display = "flex";
        overlayEl.style.display = "block";
    } finally {
        // hide loader and re-enable submit button after the request finishes
        if (loaderOverlay) {
            setTimeout(() => {
                loaderOverlay.classList.add('hidden');
                loaderOverlay.style.display = 'none';
            }, 300);
        }
        if (submitBtn) submitBtn.disabled = false;
    }
});


        