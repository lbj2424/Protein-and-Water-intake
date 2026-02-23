// Grab our views from the DOM
const mainView = document.getElementById('main-view');
const waterView = document.getElementById('water-view');
const proteinView = document.getElementById('protein-view');

// Grab our navigation buttons
const btnGoWater = document.getElementById('btn-go-water');
const btnGoProtein = document.getElementById('btn-go-protein');

// Function to hide all views
function hideAllViews() {
    mainView.classList.remove('active');
    waterView.classList.remove('active');
    proteinView.classList.remove('active');
    
    mainView.classList.add('hidden');
    waterView.classList.add('hidden');
    proteinView.classList.add('hidden');
}

// Event Listeners for main menu buttons
btnGoWater.addEventListener('click', () => {
    hideAllViews();
    waterView.classList.remove('hidden');
    waterView.classList.add('active');
});

btnGoProtein.addEventListener('click', () => {
    hideAllViews();
    proteinView.classList.remove('hidden');
    proteinView.classList.add('active');
});

// Function attached to the 'Back' buttons in the HTML
function goHome() {
    hideAllViews();
    mainView.classList.remove('hidden');
    mainView.classList.add('active');
}
// --- WATER TRACKER LOGIC ---
const WATER_GOAL = 85;
let currentWater = 0;

// DOM Elements
const waterFill = document.getElementById('water-fill');
const waterSpeech = document.getElementById('water-speech');
const glassMouth = document.getElementById('glass-mouth');
const glassEyes = document.getElementById('glass-eyes');
const glassArm = document.getElementById('glass-arm');

const textPercentage = document.getElementById('water-percentage');
const textCurrent = document.getElementById('water-current');
const textRemaining = document.getElementById('water-remaining');

const waterInput = document.getElementById('water-input');
const btnAddWater = document.getElementById('btn-add-water');
const logList = document.getElementById('water-log-list');

// Initialize the glass state on load
updateWaterUI();

// Event Listener for the Drink Button
btnAddWater.addEventListener('click', () => {
    const ozToAdd = parseInt(waterInput.value);
    
    if (isNaN(ozToAdd) || ozToAdd <= 0) return; // Prevent empty or negative inputs

    // Update total
    currentWater += ozToAdd;
    
    // Add to daily log
    addLogEntry(ozToAdd);
    
    // Clear input box and update visuals
    waterInput.value = '';
    updateWaterUI();
});

function updateWaterUI() {
    // Math
    let percentage = Math.round((currentWater / WATER_GOAL) * 100);
    let remaining = WATER_GOAL - currentWater;
    if (remaining < 0) remaining = 0; // Don't show negative remaining
    
    // Update Texts
    textPercentage.innerText = `${percentage}%`;
    textCurrent.innerText = currentWater;
    textRemaining.innerText = remaining;

    // Cap the visual fill at 100% so it doesn't overflow the glass
    let visualFill = percentage > 100 ? 100 : percentage;
    waterFill.style.height = `${visualFill}%`;

    // --- Personality Logic ---
    // Reset classes
    glassMouth.className = 'mouth';
    glassEyes.className = 'eyes';
    glassArm.classList.remove('waving');

    if (percentage === 0) {
        glassMouth.classList.add('sad');
        waterSpeech.innerText = "I'm so dry... please log some water!";
    } else if (percentage > 0 && percentage < 25) {
        glassMouth.classList.add('sad');
        waterSpeech.innerText = "A drop in the bucket! Keep it coming.";
    } else if (percentage >= 25 && percentage < 75) {
        glassMouth.classList.add('happy');
        waterSpeech.innerText = "Feeling refreshed! We are making great progress.";
    } else if (percentage >= 75 && percentage < 100) {
        glassMouth.classList.add('happy');
        glassEyes.classList.add('happy-eyes');
        waterSpeech.innerText = "Almost there! I can feel the hydration!";
    } else if (percentage >= 100) {
        glassMouth.classList.add('ecstatic');
        glassEyes.classList.add('happy-eyes');
        glassArm.classList.add('waving');
        waterSpeech.innerText = "Goal reached! We are fully hydrated! 🎉";
    }
}

function addLogEntry(amount) {
    const now = new Date();
    // Format time (e.g., 2:30 PM)
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const li = document.createElement('li');
    li.className = 'log-item';
    li.innerHTML = `<span>💧 ${amount} oz</span> <span class="text-muted">${timeString}</span>`;
    
    // Add to the top of the list
    logList.prepend(li);
}
