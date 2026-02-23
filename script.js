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
// --- WATER TRACKER LOGIC & LOCAL STORAGE ---
const WATER_GOAL = 85;
let currentWater = 0;
let waterLogs = []; // Array to hold our daily logs

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

// --- Initialization & Local Storage ---
function initWaterTracker() {
    const today = new Date().toDateString(); // e.g., "Sun Feb 22 2026"
    const savedDate = localStorage.getItem('vitality_date');

    // Midnight Reset Logic: Check if the saved date matches today
    if (savedDate !== today) {
        // It's a new day! Reset today's stats.
        currentWater = 0;
        waterLogs = [];
        localStorage.setItem('vitality_date', today);
        saveWaterData(); 
    } else {
        // It's the same day! Load the saved data.
        currentWater = parseInt(localStorage.getItem('vitality_water_total')) || 0;
        waterLogs = JSON.parse(localStorage.getItem('vitality_water_logs')) || [];
    }

    renderWaterLogs();
    updateWaterUI();
}

function saveWaterData() {
    localStorage.setItem('vitality_water_total', currentWater);
    localStorage.setItem('vitality_water_logs', JSON.stringify(waterLogs));
}

// Initialize on page load
initWaterTracker();

// --- Event Listeners ---
btnAddWater.addEventListener('click', () => {
    const ozToAdd = parseInt(waterInput.value);
    
    if (isNaN(ozToAdd) || ozToAdd <= 0) return; 

    // 1. Update total
    currentWater += ozToAdd;
    
    // 2. Create Log Entry
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Add new log to the beginning of the array
    waterLogs.unshift({ amount: ozToAdd, time: timeString });
    
    // 3. Save to device
    saveWaterData();
    
    // 4. Update visuals
    renderWaterLogs();
    waterInput.value = '';
    updateWaterUI();
});

// --- UI Updates ---
function updateWaterUI() {
    let percentage = Math.round((currentWater / WATER_GOAL) * 100);
    let remaining = WATER_GOAL - currentWater;
    if (remaining < 0) remaining = 0; 
    
    textPercentage.innerText = `${percentage}%`;
    textCurrent.innerText = currentWater;
    textRemaining.innerText = remaining;

    let visualFill = percentage > 100 ? 100 : percentage;
    waterFill.style.height = `${visualFill}%`;

    // Personality Logic
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

function renderWaterLogs() {
    logList.innerHTML = ''; // Clear the list
    // Rebuild the list from the saved array
    waterLogs.forEach(log => {
        const li = document.createElement('li');
        li.className = 'log-item';
        li.innerHTML = `<span>💧 ${log.amount} oz</span> <span class="text-muted">${log.time}</span>`;
        logList.appendChild(li);
    });
}
