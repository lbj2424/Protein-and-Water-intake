// ==========================================
// --- NAVIGATION LOGIC ---
// ==========================================

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

// ==========================================
// --- WATER TRACKER LOGIC ---
// ==========================================
const WATER_GOAL = 124;
let currentWater = 0;
let waterLogs = []; 

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

function initWaterTracker() {
    const today = new Date().toDateString(); 
    const savedDate = localStorage.getItem('vitality_date');

    if (savedDate !== today) {
        currentWater = 0;
        waterLogs = [];
        localStorage.setItem('vitality_date', today);
        saveWaterData(); 
    } else {
        // Use parseFloat to support decimals
        currentWater = parseFloat(localStorage.getItem('vitality_water_total')) || 0;
        waterLogs = JSON.parse(localStorage.getItem('vitality_water_logs')) || [];
    }

    renderWaterLogs();
    updateWaterUI();
}

let saveWaterData = function() {
    localStorage.setItem('vitality_water_total', currentWater);
    localStorage.setItem('vitality_water_logs', JSON.stringify(waterLogs));
}

// Event Listeners
btnAddWater.addEventListener('click', () => {
    const ozToAdd = parseFloat(waterInput.value);
    
    if (isNaN(ozToAdd) || ozToAdd <= 0) return; 

    // Update total and round to 1 decimal place to prevent floating point bugs
    currentWater += ozToAdd;
    currentWater = Math.round(currentWater * 10) / 10;
    
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    waterLogs.unshift({ amount: ozToAdd, time: timeString });
    
    saveWaterData();
    renderWaterLogs();
    waterInput.value = '';
    updateWaterUI();
});

function updateWaterUI() {
    let percentage = Math.round((currentWater / WATER_GOAL) * 100);
    let remaining = Math.round((WATER_GOAL - currentWater) * 10) / 10;
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
    logList.innerHTML = ''; 
    waterLogs.forEach(log => {
        const li = document.createElement('li');
        li.className = 'log-item';
        li.innerHTML = `<span>💧 ${log.amount} oz</span> <span class="text-muted">${log.time}</span>`;
        logList.appendChild(li);
    });
}

// ==========================================
// --- PROTEIN TRACKER LOGIC ---
// ==========================================
const PROTEIN_GOAL = 165; 
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
    const today = new Date().toDateString(); 
    const savedDate = localStorage.getItem('vitality_protein_date');

    if (savedDate !== today) {
        currentProtein = 0;
        proteinLogs = [];
        localStorage.setItem('vitality_protein_date', today);
        saveProteinData(); 
    } else {
        // Use parseFloat to support decimals
        currentProtein = parseFloat(localStorage.getItem('vitality_protein_total')) || 0;
        proteinLogs = JSON.parse(localStorage.getItem('vitality_protein_logs')) || [];
    }
    
    favoriteMeals = JSON.parse(localStorage.getItem('vitality_favorite_meals')) || [];

    renderProteinLogs();
    updateProteinUI();
}

let saveProteinData = function() {
    localStorage.setItem('vitality_protein_total', currentProtein);
    localStorage.setItem('vitality_protein_logs', JSON.stringify(proteinLogs));
    localStorage.setItem('vitality_favorite_meals', JSON.stringify(favoriteMeals));
}

// Log Protein Event
btnAddProtein.addEventListener('click', () => {
    const mealName = mealNameInput.value.trim() || "Snack";
    const proteinGrams = parseFloat(proteinInput.value);
    
    if (isNaN(proteinGrams) || proteinGrams <= 0) return;

    // Update total and round to 1 decimal place
    currentProtein += proteinGrams;
    currentProtein = Math.round(currentProtein * 10) / 10;
    
    if (saveFavoriteCheckbox.checked) {
        const exists = favoriteMeals.find(meal => meal.name.toLowerCase() === mealName.toLowerCase());
        if (!exists) {
            favoriteMeals.push({ name: mealName, grams: proteinGrams });
        }
    }

    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    proteinLogs.unshift({ meal: mealName, amount: proteinGrams, time: timeString });
    
    saveProteinData();
    renderProteinLogs();
    updateProteinUI();
    
    mealNameInput.value = '';
    proteinInput.value = '';
    mealSearch.value = '';
    saveFavoriteCheckbox.checked = false;
});

// Search / Auto-Populate Logic
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
            
            li.addEventListener('click', () => {
                mealNameInput.value = meal.name;
                proteinInput.value = meal.grams;
                searchResults.classList.add('hidden');
                mealSearch.value = ''; 
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

function updateProteinUI() {
    let percentage = Math.round((currentProtein / PROTEIN_GOAL) * 100);
    let remaining = Math.round((PROTEIN_GOAL - currentProtein) * 10) / 10;
    if (remaining < 0) remaining = 0; 
    
    textProteinPercentage.innerText = `${percentage}%`;
    textProteinCurrent.innerText = currentProtein;
    textProteinRemaining.innerText = remaining;

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

let waterHistory = JSON.parse(localStorage.getItem('vitality_water_history')) || {};
let proteinHistory = JSON.parse(localStorage.getItem('vitality_protein_history')) || {};

// Override save functions to record history
const originalSaveWater = saveWaterData;
saveWaterData = function() {
    originalSaveWater(); 
    const todayStr = new Date().toDateString();
    waterHistory[todayStr] = currentWater; 
    localStorage.setItem('vitality_water_history', JSON.stringify(waterHistory));
    if (waterChartInstance) updateChart(waterChartInstance, waterHistory, waterViewMode);
};

const originalSaveProtein = saveProteinData;
saveProteinData = function() {
    originalSaveProtein(); 
    const todayStr = new Date().toDateString();
    proteinHistory[todayStr] = currentProtein; 
    localStorage.setItem('vitality_protein_history', JSON.stringify(proteinHistory));
    if (proteinChartInstance) updateChart(proteinChartInstance, proteinHistory, proteinViewMode);
};

Chart.defaults.color = '#94a3b8'; 
Chart.defaults.font.family = "'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

let waterChartInstance = null;
let proteinChartInstance = null;

let waterViewMode = 7; 
let proteinViewMode = 7;

function getLastNDays(n) {
    const dates = [];
    const labels = [];
    for (let i = n - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(d.toDateString());
        labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
    return { dates, labels };
}

function initChart(canvasId, color, glowColor, historyData, days) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    const timeData = getLastNDays(days);
    
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
                tension: 0.3 
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }, 
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

// Initialize Charts and Load Data
initWaterTracker();
initProteinTracker();

setTimeout(() => {
    waterChartInstance = initChart('waterChart', '#0ea5e9', 'rgba(14, 165, 233, 0.1)', waterHistory, waterViewMode);
    proteinChartInstance = initChart('proteinChart', '#d946ef', 'rgba(217, 70, 239, 0.1)', proteinHistory, proteinViewMode);
    
    // Ensure initial state is saved to history for today
    saveWaterData();
    saveProteinData();
}, 100);

// Toggle Listeners
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
