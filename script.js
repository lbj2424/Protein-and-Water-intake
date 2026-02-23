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

// --- PROTEIN TRACKER LOGIC & LOCAL STORAGE ---
const PROTEIN_GOAL = 165; // Change your daily goal here
let currentProtein = 0;
let proteinLogs = [];
let favoriteMeals = [];

// DOM Elements
const proteinFillPath = document.getElementById('protein-fill-path');
const textProteinPercentage = document.getElementById('protein-percentage');
const textProteinCurrent = document.getElementById('protein-current');
const textProteinRemaining = document.getElementById('protein-remaining');

const mealSearch = document.getElementById('meal-search');
const searchResults = document.getElementById('search-results');
const mealNameInput = document.getElementById('meal-name');
const proteinInput = document.getElementById('protein-input');
const saveFavoriteCheckbox = document.getElementById('save-favorite');
const btnAddProtein = document.getElementById('btn-add-protein');
const proteinLogList = document.getElementById('protein-log-list');

function initProteinTracker() {
    // Load daily stats
    currentProtein = parseInt(localStorage.getItem('vitality_protein_total')) || 0;
    proteinLogs = JSON.parse(localStorage.getItem('vitality_protein_logs')) || [];
    
    // Load favorites database
    favoriteMeals = JSON.parse(localStorage.getItem('vitality_favorite_meals')) || [];

    renderProteinLogs();
    updateProteinUI();
}

function saveProteinData() {
    localStorage.setItem('vitality_protein_total', currentProtein);
    localStorage.setItem('vitality_protein_logs', JSON.stringify(proteinLogs));
    localStorage.setItem('vitality_favorite_meals', JSON.stringify(favoriteMeals));
}

// Initialize
initProteinTracker();

// --- Log Protein Event ---
btnAddProtein.addEventListener('click', () => {
    const mealName = mealNameInput.value.trim() || "Snack";
    const proteinGrams = parseInt(proteinInput.value);
    
    if (isNaN(proteinGrams) || proteinGrams <= 0) return;

    // 1. Update total
    currentProtein += proteinGrams;
    
    // 2. Handle Favorites
    if (saveFavoriteCheckbox.checked) {
        // Check if it already exists so we don't make duplicates
        const exists = favoriteMeals.find(meal => meal.name.toLowerCase() === mealName.toLowerCase());
        if (!exists) {
            favoriteMeals.push({ name: mealName, grams: proteinGrams });
        }
    }

    // 3. Create Log
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    proteinLogs.unshift({ meal: mealName, amount: proteinGrams, time: timeString });
    
    // 4. Save & Clean up
    saveProteinData();
    renderProteinLogs();
    updateProteinUI();
    
    mealNameInput.value = '';
    proteinInput.value = '';
    mealSearch.value = '';
    saveFavoriteCheckbox.checked = false;
});

// --- Search / Auto-Populate Logic ---
mealSearch.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    searchResults.innerHTML = '';
    
    if (query.length === 0) {
        searchResults.classList.add('hidden');
        return;
    }

    const filtered = favoriteMeals.filter(meal => meal.name.toLowerCase().includes(query));
    
    if (filtered.length > 0) {
        searchResults.classList.remove('hidden');
        filtered.forEach(meal => {
            const li = document.createElement('li');
            li.className = 'search-item';
            li.innerHTML = `<span>${meal.name}</span> <span class="highlight" style="color:var(--neon-purple);">${meal.grams}g</span>`;
            
            // Auto-populate when clicked
            li.addEventListener('click', () => {
                mealNameInput.value = meal.name;
                proteinInput.value = meal.grams;
                searchResults.classList.add('hidden');
                mealSearch.value = ''; // clear search bar
            });
            searchResults.appendChild(li);
        });
    } else {
        searchResults.classList.add('hidden');
    }
});

// Hide search results if clicking outside
document.addEventListener('click', (e) => {
    if (!mealSearch.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.classList.add('hidden');
    }
});

// --- UI Updates ---
function updateProteinUI() {
    let percentage = Math.round((currentProtein / PROTEIN_GOAL) * 100);
    let remaining = PROTEIN_GOAL - currentProtein;
    if (remaining < 0) remaining = 0; 
    
    textProteinPercentage.innerText = `${percentage}%`;
    textProteinCurrent.innerText = currentProtein;
    textProteinRemaining.innerText = remaining;

    // SVG Math: 126 is fully empty, 0 is fully full.
    let visualPercentage = percentage > 100 ? 100 : percentage;
    let dashOffset = 126 - ((visualPercentage / 100) * 126);
    proteinFillPath.style.strokeDashoffset = dashOffset;
}

function renderProteinLogs() {
    proteinLogList.innerHTML = ''; 
    proteinLogs.forEach(log => {
        const li = document.createElement('li');
        li.className = 'log-item';
        li.innerHTML = `<span>🥩 ${log.meal} - <strong style="color:var(--neon-purple);">${log.amount}g</strong></span> <span class="text-muted">${log.time}</span>`;
        proteinLogList.appendChild(li);
    });
}
// ==========================================
// --- CHART.JS AND HISTORY LOGIC ---
// ==========================================

// 1. History Variables
let waterHistory = JSON.parse(localStorage.getItem('vitality_water_history')) || {};
let proteinHistory = JSON.parse(localStorage.getItem('vitality_protein_history')) || {};

// Modify the existing save functions to also save to history
const originalSaveWater = saveWaterData;
saveWaterData = function() {
    originalSaveWater(); // Do the old stuff
    const todayStr = new Date().toDateString();
    waterHistory[todayStr] = currentWater; // Record today's total
    localStorage.setItem('vitality_water_history', JSON.stringify(waterHistory));
    if (waterChartInstance) updateChart(waterChartInstance, waterHistory, waterViewMode);
};

const originalSaveProtein = saveProteinData;
saveProteinData = function() {
    originalSaveProtein(); // Do the old stuff
    const todayStr = new Date().toDateString();
    proteinHistory[todayStr] = currentProtein; // Record today's total
    localStorage.setItem('vitality_protein_history', JSON.stringify(proteinHistory));
    if (proteinChartInstance) updateChart(proteinChartInstance, proteinHistory, proteinViewMode);
};

// 2. Chart Configurations
Chart.defaults.color = '#94a3b8'; // Match our text-muted
Chart.defaults.font.family = "'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

let waterChartInstance = null;
let proteinChartInstance = null;

let waterViewMode = 7; // Default to 7 days
let proteinViewMode = 7;

// Function to get the last N days as formatted strings
function getLastNDays(n) {
    const dates = [];
    const labels = [];
    for (let i = n - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(d.toDateString());
        // Shorten label for the X-axis (e.g., "Feb 22")
        labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
    return { dates, labels };
}

// Function to build/update a chart
function initChart(canvasId, color, glowColor, historyData, days) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    const timeData = getLastNDays(days);
    
    // Map dates to our history object. If no data for a day, use 0.
    const dataPoints = timeData.dates.map(date => historyData[date] || 0);

    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: timeData.labels,
            datasets: [{
                label: 'Intake',
                data: dataPoints,
                borderColor: color,
                backgroundColor: glowColor,
                borderWidth: 2,
                pointBackgroundColor: color,
                pointRadius: 3,
                fill: true,
                tension: 0.3 // Adds the futuristic curve
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }, // Hide legend
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
                x: { grid: { display: false } }
            }
        }
    });
}

function updateChart(chart, historyData, days) {
    const timeData = getLastNDays(days);
    const dataPoints = timeData.dates.map(date => historyData[date] || 0);
    chart.data.labels = timeData.labels;
    chart.data.datasets[0].data = dataPoints;
    chart.update();
}

// 3. Initialize Charts on Load
// Use a small timeout to ensure DOM is fully ready
setTimeout(() => {
    waterChartInstance = initChart('waterChart', '#0ea5e9', 'rgba(14, 165, 233, 0.1)', waterHistory, waterViewMode);
    proteinChartInstance = initChart('proteinChart', '#d946ef', 'rgba(217, 70, 239, 0.1)', proteinHistory, proteinViewMode);
}, 100);

// 4. Toggle Listeners
document.getElementById('water-week-btn').addEventListener('click', (e) => {
    waterViewMode = 7;
    e.target.classList.add('active');
    document.getElementById('water-month-btn').classList.remove('active');
    updateChart(waterChartInstance, waterHistory, waterViewMode);
});

document.getElementById('water-month-btn').addEventListener('click', (e) => {
    waterViewMode = 30;
    e.target.classList.add('active');
    document.getElementById('water-week-btn').classList.remove('active');
    updateChart(waterChartInstance, waterHistory, waterViewMode);
});

document.getElementById('protein-week-btn').addEventListener('click', (e) => {
    proteinViewMode = 7;
    e.target.classList.add('active');
    document.getElementById('protein-month-btn').classList.remove('active');
    updateChart(proteinChartInstance, proteinHistory, proteinViewMode);
});

document.getElementById('protein-month-btn').addEventListener('click', (e) => {
    proteinViewMode = 30;
    e.target.classList.add('active');
    document.getElementById('protein-week-btn').classList.remove('active');
    updateChart(proteinChartInstance, proteinHistory, proteinViewMode);
});

// Immediately trigger a save to populate today's data in the new history format
saveWaterData();
saveProteinData();
