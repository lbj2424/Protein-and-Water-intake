// ==========================================
// --- FIREBASE CLOUD SETUP ---
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Your exact Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyD8bcn0jx_qBku1vM-bPpMlzChdzDlOCas",
    authDomain: "protein-and-water.firebaseapp.com",
    projectId: "protein-and-water",
    storageBucket: "protein-and-water.firebasestorage.app",
    messagingSenderId: "597236632194",
    appId: "1:597236632194:web:fc551c6bff28bf9f8c829b",
    measurementId: "G-GZ8C4SHG4M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// We will save all your stats into one document called "my_data"
const docRef = doc(db, "vitality", "my_data");

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

// Attach to window so HTML buttons can still find it inside this module
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

// Load data from Firebase when the app starts
async function loadDataAndInit() {
    try {
        const docSnap = await getDoc(docRef);
        let dbData;

        if (docSnap.exists()) {
            dbData = docSnap.data();
        } else {
            // First time on Firebase? Migrate local storage so you don't lose data!
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

        // Midnight Resets
        const today = new Date().toDateString();
        if (dbData.waterDate !== today) {
            dbData.waterTotal = 0;
            dbData.waterLogs = [];
            dbData.waterDate = today;
        }
        if (dbData.proteinDate !== today) {
            dbData.proteinTotal = 0;
            dbData.proteinLogs = [];
            dbData.proteinDate = today;
        }

        // Apply loaded data to our app
        currentWater = dbData.waterTotal;
        waterLogs = dbData.waterLogs || [];
        waterHistory = dbData.waterHistory || {};

        currentProtein = dbData.proteinTotal;
        proteinLogs = dbData.proteinLogs || [];
        proteinHistory = dbData.proteinHistory || {};
        favoriteMeals = dbData.favoriteMeals || [];

        // Update UI
        renderWaterLogs();
        updateWaterUI();
        renderProteinLogs();
        updateProteinUI();

        // Init Charts & Save to lock in the daily history
        initAllCharts();
        saveToFirebase();

    } catch (error) {
        console.error("Error connecting to Firebase:", error);
    }
}

async function saveToFirebase() {
    const dbData = {
        waterDate: new Date().toDateString(),
        waterTotal: currentWater,
        waterLogs: waterLogs,
        waterHistory: waterHistory,
        
        proteinDate: new Date().toDateString(),
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

// Start the app!
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
    currentWater = Math.round(currentWater * 10) / 10; // Prevent float bugs
    
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    waterLogs.unshift({ amount: ozToAdd, time: timeString });
    
    const todayStr = new Date().toDateString();
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
    
    const todayStr = new Date().toDateString();
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
    proteinLogs.forEach(log => {
        const li = document.createElement('li');
        li.className = 'log-item';
        li.innerHTML = `<span>🥩 ${log.meal} - <strong style="color:var(--neon-purple);">${log.amount}g</strong></span> <span class="text-muted">${log.time}</span>`;
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
        dates.push(d.toDateString());
        labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
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
    // Only init if they don't exist yet
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
