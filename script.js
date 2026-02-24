// ==========================================
// --- FIREBASE CLOUD SETUP ---
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyD8bcn0jx_qBku1vM-bPpMlzChdzDlOCas",
    authDomain: "protein-and-water.firebaseapp.com",
    projectId: "protein-and-water",
    storageBucket: "protein-and-water.firebasestorage.app",
    messagingSenderId: "597236632194",
    appId: "1:597236632194:web:fc551c6bff28bf9f8c829b",
    measurementId: "G-GZ8C4SHG4M"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const docRef = doc(db, "vitality", "my_data");

// ==========================================
// --- TIMEZONE & MIGRATION UTILITY ---
// ==========================================
// Forces the date string to evaluate in Mountain Time regardless of device timezone
function getMTDateString(dateObj = new Date()) {
    return dateObj.toLocaleDateString('en-US', { timeZone: 'America/Denver' });
}

// Translates old date formats (Mon Feb 23 2026) to new formats (2/23/2026)
function migrateHistoryDates(historyObj) {
    let updatedHistory = {};
    for (let oldDate in historyObj) {
        // If the date string has letters (like 'Mon' or 'Feb'), it's the old format
        if (/[a-zA-Z]/.test(oldDate)) {
            let convertedDate = new Date(oldDate).toLocaleDateString('en-US', { timeZone: 'America/Denver' });
            // Only overwrite if it doesn't already exist to prevent issues
            if (!updatedHistory[convertedDate]) {
                updatedHistory[convertedDate] = historyObj[oldDate];
            }
        } else {
            updatedHistory[oldDate] = historyObj[oldDate];
        }
    }
    return updatedHistory;
}

// ==========================================
// --- NAVIGATION LOGIC ---
// ==========================================
const mainView = document.getElementById('main-view');
const waterView = document.getElementById('water-view');
const proteinView = document.getElementById('protein-view');

function hideAllViews() {
    mainView.classList.remove('active');
    waterView.classList.remove('active');
    proteinView.classList.remove('active');
    mainView.classList.add('hidden');
    waterView.classList.add('hidden');
    proteinView.classList.add('hidden');
}

document.getElementById('btn-go-water').addEventListener('click', () => {
    hideAllViews();
    waterView.classList.remove('hidden');
    waterView.classList.add('active');
});

document.getElementById('btn-go-protein').addEventListener('click', () => {
    hideAllViews();
    proteinView.classList.remove('hidden');
    proteinView.classList.add('active');
});

window.goHome = function() {
    hideAllViews();
    mainView.classList.remove('hidden');
    mainView.classList.add('active');
};

// ==========================================
// --- GLOBAL VARIABLES & CLOUD SYNC ---
// ==========================================
const WATER_GOAL = 124;
const PROTEIN_GOAL = 165; 

let currentWater = 0;
let waterLogs = []; 
let waterHistory = {};

let currentProtein = 0;
let proteinLogs = [];
let favoriteMeals = [];
let proteinHistory = {};

async function loadDataAndInit() {
    try {
        const docSnap = await getDoc(docRef);
        let dbData;

        if (docSnap.exists()) {
            dbData = docSnap.data();
        } else {
            dbData = {
                waterDate: localStorage.getItem('vitality_date') || "",
                waterTotal: parseFloat(localStorage.getItem('vitality_water_total')) || 0,
                waterLogs: JSON.parse(localStorage.getItem('vitality_water_logs')) || [],
                waterHistory: JSON.parse(localStorage.getItem('vitality_water_history')) || {},
                
                proteinDate: localStorage.getItem('vitality_protein_date') || "",
                proteinTotal: parseFloat(localStorage.getItem('vitality_protein_total')) || 0,
                proteinLogs: JSON.parse(localStorage.getItem('vitality_protein_logs')) || [],
                proteinHistory: JSON.parse(localStorage.getItem('vitality_protein_history')) || {},
                favoriteMeals: JSON.parse(localStorage.getItem('vitality_favorite_meals')) || []
            };
        }

        // Midnight Resets using Mountain Time
        const todayMT = getMTDateString();
        if (dbData.waterDate !== todayMT) {
            dbData.waterTotal = 0;
            dbData.waterLogs = [];
            dbData.waterDate = todayMT;
        }
        if (dbData.proteinDate !== todayMT) {
            dbData.proteinTotal = 0;
            dbData.proteinLogs = [];
            dbData.proteinDate = todayMT;
        }

        currentWater = dbData.waterTotal;
        waterLogs = dbData.waterLogs || [];
        
        // Pass the history through our new translator function
        waterHistory = migrateHistoryDates(dbData.waterHistory || {});

        currentProtein = dbData.proteinTotal;
        proteinLogs = dbData.proteinLogs || [];
        
        // Pass the history through our new translator function
        proteinHistory = migrateHistoryDates(dbData.proteinHistory || {});
        favoriteMeals = dbData.favoriteMeals || [];

        renderWaterLogs();
        updateWaterUI();
        renderProteinLogs();
        updateProteinUI();

        initAllCharts();
        saveToFirebase();

    } catch (error) {
        console.error("Error connecting to Firebase:", error);
    }
}

async function saveToFirebase() {
    const dbData = {
        waterDate: getMTDateString(),
        waterTotal: currentWater,
        waterLogs: waterLogs,
        waterHistory: waterHistory,
        
        proteinDate: getMTDateString(),
        proteinTotal: currentProtein,
        proteinLogs: proteinLogs,
        proteinHistory: proteinHistory,
        favoriteMeals: favoriteMeals
    };
    try {
        await setDoc(docRef, dbData);
    } catch(e) {
        console.error("Error saving to Firebase:", e);
    }
}

loadDataAndInit();

// ==========================================
// --- WATER TRACKER LOGIC ---
// ==========================================
const waterFill = document.getElementById('water-fill');
const waterSpeech = document.getElementById('water-speech');
const glassMouth = document.getElementById('glass-mouth');
const glassEyes = document.getElementById('glass-eyes');
const glassArm = document.getElementById('glass-arm');
const textPercentage = document.getElementById('water-percentage');
const textCurrent = document.getElementById('water-current');
const textRemaining = document.getElementById('water-remaining');
const waterInput = document.getElementById('water-input');
const logList = document.getElementById('water-log-list');

document.getElementById('btn-add-water').addEventListener('click', () => {
    const ozToAdd = parseFloat(waterInput.value);
    if (isNaN(ozToAdd) || ozToAdd <= 0) return; 

    currentWater += ozToAdd;
    currentWater = Math.round(currentWater * 10) / 10; 
    
    const now = new Date();
    // Keep local time for the display stamp
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    waterLogs.unshift({ amount: ozToAdd, time: timeString });
    
    const todayStr = getMTDateString();
    waterHistory[todayStr] = currentWater;

    saveToFirebase();
    renderWaterLogs();
    waterInput.value = '';
    updateWaterUI();
    if (waterChartInstance) updateChart(waterChartInstance, waterHistory, waterViewMode);
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
    waterLogs.forEach((log, index) => {
        const li = document.createElement('li');
        li.className = 'log-item';
        li.innerHTML = `<span>💧 ${log.amount} oz</span> <span class="text-muted">${log.time}</span>`;
        
        // Edit or Delete Logic
        li.addEventListener('click', () => {
            let newAmount = prompt(`Update amount for this entry (oz).\nEnter 0 to delete it completely:`, log.amount);
            if (newAmount === null) return; // User clicked Cancel
            
            newAmount = parseFloat(newAmount);
            if (isNaN(newAmount) || newAmount < 0) return;

            let diff = newAmount - log.amount;
            currentWater += diff;
            currentWater = Math.round(currentWater * 10) / 10;
            if (currentWater < 0) currentWater = 0; // Sanity check

            if (newAmount === 0) {
                waterLogs.splice(index, 1); // Remove from array
            } else {
                waterLogs[index].amount = newAmount; // Update array
            }

            const todayStr = getMTDateString();
            waterHistory[todayStr] = currentWater;

            saveToFirebase();
            renderWaterLogs();
            updateWaterUI();
            if (waterChartInstance) updateChart(waterChartInstance, waterHistory, waterViewMode);
        });

        logList.appendChild(li);
    });
}

// ==========================================
// --- PROTEIN TRACKER LOGIC ---
// ==========================================
const proteinFillPath = document.getElementById('protein-fill-path');
const textProteinPercentage = document.getElementById('protein-percentage');
const textProteinCurrent = document.getElementById('protein-current');
const textProteinRemaining = document.getElementById('protein-remaining');
const mealSearch = document.getElementById('meal-search');
const searchResults = document.getElementById('search-results');
const mealNameInput = document.getElementById('meal-name');
const proteinInput = document.getElementById('protein-input');
const saveFavoriteCheckbox = document.getElementById('save-favorite');
const proteinLogList = document.getElementById('protein-log-list');

document.getElementById('btn-add-protein').addEventListener('click', () => {
    const mealName = mealNameInput.value.trim() || "Snack";
    const proteinGrams = parseFloat(proteinInput.value);
    
    if (isNaN(proteinGrams) || proteinGrams <= 0) return;

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
    
    const todayStr = getMTDateString();
    proteinHistory[todayStr] = currentProtein;

    saveToFirebase();
    renderProteinLogs();
    updateProteinUI();
    if (proteinChartInstance) updateChart(proteinChartInstance, proteinHistory, proteinViewMode);
    
    mealNameInput.value = '';
    proteinInput.value = '';
    mealSearch.value = '';
    saveFavoriteCheckbox.checked = false;
});

// Search Logic
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
    proteinLogs.forEach((log, index) => {
        const li = document.createElement('li');
        li.className = 'log-item';
        li.innerHTML = `<span>🥩 ${log.meal} - <strong style="color:var(--neon-purple);">${log.amount}g</strong></span> <span class="text-muted">${log.time}</span>`;
        
        // Edit or Delete Logic
        li.addEventListener('click', () => {
            let newAmount = prompt(`Update grams for ${log.meal}.\nEnter 0 to delete it completely:`, log.amount);
            if (newAmount === null) return; // User clicked Cancel
            
            newAmount = parseFloat(newAmount);
            if (isNaN(newAmount) || newAmount < 0) return;

            let diff = newAmount - log.amount;
            currentProtein += diff;
            currentProtein = Math.round(currentProtein * 10) / 10;
            if (currentProtein < 0) currentProtein = 0; // Sanity check

            if (newAmount === 0) {
                proteinLogs.splice(index, 1); // Remove from array
            } else {
                proteinLogs[index].amount = newAmount; // Update array
            }

            const todayStr = getMTDateString();
            proteinHistory[todayStr] = currentProtein;

            saveToFirebase();
            renderProteinLogs();
            updateProteinUI();
            if (proteinChartInstance) updateChart(proteinChartInstance, proteinHistory, proteinViewMode);
        });

        proteinLogList.appendChild(li);
    });
}

// ==========================================
// --- CHART.JS LOGIC ---
// ==========================================
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
        // Force Mountain Time for historical lookup
        dates.push(getMTDateString(d));
        labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Denver' }));
    }
    return { dates, labels };
}

function createChart(canvasId, color, glowColor, historyData, days) {
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

function initAllCharts() {
    if (!waterChartInstance) {
        waterChartInstance = createChart('waterChart', '#0ea5e9', 'rgba(14, 165, 233, 0.1)', waterHistory, waterViewMode);
    } else {
        updateChart(waterChartInstance, waterHistory, waterViewMode);
    }
    
    if (!proteinChartInstance) {
        proteinChartInstance = createChart('proteinChart', '#d946ef', 'rgba(217, 70, 239, 0.1)', proteinHistory, proteinViewMode);
    } else {
        updateChart(proteinChartInstance, proteinHistory, proteinViewMode);
    }
}

// Chart Toggle Listeners
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
