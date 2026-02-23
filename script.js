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
