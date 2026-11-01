let currentDietaryFilter = 'all';
let currentSubDietaryFilter = 'all';
let adminStockFilter = 'all';
let currentOrderFilter = 'all';
let isRushHour = false;
let isAdminLoggedIn = false;
let flashDiscountActive = false;

let menuMap = new Map();
let categoriesMap = new Map();

function syncMaps() {
    menuMap.clear();
    menuItems.forEach(item => menuMap.set(item.id, item));
    categoriesMap.clear();
    categories.forEach(cat => categoriesMap.set(cat.id, cat));
}

function showToast(msg) {
    const toast = document.getElementById('toastNotification');
    document.getElementById('toastMessage').innerText = msg;
    toast.classList.remove('translate-y-24', 'opacity-0');
    setTimeout(() => {
        toast.classList.add('translate-y-24', 'opacity-0');
    }, 3000);
}

const defaultDietaryFilters = [
    { 
        id: "lactose", 
        fr: "🥛 Sans Lactose", 
        subOptions: [
            {name: "Lait d'amande", price: 0.50, enabled: true}, 
            {name: "Lait de soja", price: 0.50, enabled: true}, 
            {name: "Lait d'avoine", price: 0.60, enabled: true}
        ] 
    },
    { 
        id: "veggie", 
        fr: "🌱 Végétarien", 
        subOptions: [
            {name: "Fromage végan", price: 1.00, enabled: true}, 
            {name: "Sans viande", price: 0.00, enabled: true}
        ] 
    },
    { id: "halal", fr: "🥩 Halal", subOptions: [] }
];

let dietaryFilters = [];
try {
    const savedDiets = localStorage.getItem('club_cafe_diets_v5');
    dietaryFilters = savedDiets ? JSON.parse(savedDiets) : defaultDietaryFilters;
} catch(e) { dietaryFilters = defaultDietaryFilters; }

let matrixColumns = [];
try {
    const savedCols = localStorage.getItem('club_cafe_matrix_cols_v1');
    matrixColumns = savedCols ? JSON.parse(savedCols) : ["1", "2", "3", "4", "5"];
} catch(e) { matrixColumns = ["1", "2", "3", "4", "5"]; }

let matrixRows = [];
try {
    const savedRows = localStorage.getItem('club_cafe_matrix_rows_v1');
    matrixRows = savedRows ? JSON.parse(savedRows) : [
        { name: "Gluten", dots: [true, false, true, false, false] },
        { name: "Lait", dots: [false, true, false, true, true] },
        { name: "Poisson", dots: [false, false, true, false, true] },
        { name: "Arachides", dots: [true, true, true, false, false] },
        { name: "Œufs", dots: [false, true, false, true, false] },
        { name: "Soja", dots: [false, false, true, false, true] },
        { name: "Fruits à coque", dots: [true, false, true, true, false] },
        { name: "Sésame", dots: [false, true, false, false, true] }
    ];
} catch(e) {
    matrixRows = [
        { name: "Gluten", dots: [true, false, true, false, false] },
        { name: "Lait", dots: [false, true, false, true, true] },
        { name: "Poisson", dots: [false, false, true, false, true] },
        { name: "Arachides", dots: [true, true, true, false, false] },
        { name: "Œufs", dots: [false, true, false, true, false] },
        { name: "Soja", dots: [false, false, true, false, true] },
        { name: "Fruits à coque", dots: [true, false, true, true, false] },
        { name: "Sésame", dots: [false, true, false, false, true] }
    ];
}

const defaultCategories = [
    { id: "sandwiches", fr: "Sandwiches", img: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=500&q=80", allowedAddons: [{name: "Extra Fromage", price: 1.00, enabled: true}, {name: "Sauce Spéciale", price: 0.50, enabled: true}] },
    { id: "plats", fr: "Plats Chauds & Salades", img: "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=500&q=80", allowedAddons: [{name: "Extra Fromage", price: 1.00, enabled: true}] },
    { id: "boissons_chaudes", fr: "Boissons Chaudes", img: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=500&q=80", allowedAddons: [] },
    { id: "boissons_glacees", fr: "Boissons Glacées", img: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=500&q=80", allowedAddons: [] },
    { id: "patisseries", fr: "Pâtisseries Premium", img: "https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=500&q=80", allowedAddons: [] },
    { id: "gaufres", fr: "Nos Gaufres", img: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=500&q=80", allowedAddons: [] }
];

let categories = [];
try {
    const savedCat = localStorage.getItem('club_cafe_categories_v14');
    categories = savedCat ? JSON.parse(savedCat) : defaultCategories;
} catch(e) { categories = defaultCategories; }

const defaultFormules = [
    { id: 1, title: "Offre Club", desc: "1 Sandwich au choix + 1 Pâtisserie Deluxe + 1 Boisson 33cl.", price: 8.90, badge: "OFFRE TOP", stock: 15, infinite: false, img: "https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=600&q=80" },
    { id: 2, title: "Menu Étudiant", desc: "Panini ou Panino + Canette 33cl.", price: 5.50, badge: "STUDENT", stock: 999, infinite: true, img: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=600&q=80" }
];

let formules = [];
try {
    const savedFormules = localStorage.getItem('club_cafe_formules_v3');
    formules = savedFormules ? JSON.parse(savedFormules) : defaultFormules;
} catch(e) { formules = defaultFormules; }

const defaultItems = [
    { id: 1, name: "Thon", price: 5.20, cat: "sandwiches", stock: 10, img: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=500&q=80" },
    { id: 2, name: "Poulet", price: 5.50, cat: "sandwiches", stock: 8, img: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=500&q=80" },
    { id: 7, name: "Café Latte", price: 3.50, cat: "boissons_chaudes", stock: 999, infinite: true, hasTemp: true, hasSize: true, img: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=500&q=80" }
];

let menuItems = [];
try {
    const saved = localStorage.getItem('club_cafe_menu_v39');
    menuItems = saved ? JSON.parse(saved) : defaultItems;
} catch(e) { menuItems = defaultItems; }

let ordersHistory = [];
try {
    const savedOrd = localStorage.getItem('club_cafe_orders_v28');
    ordersHistory = savedOrd ? JSON.parse(savedOrd) : [];
} catch(e) { ordersHistory = []; }

let favorites = [];
try {
    const savedFav = localStorage.getItem('club_cafe_favs_v2');
    favorites = savedFav ? JSON.parse(savedFav) : [];
} catch(e) { favorites = []; }

let cart = [];
try {
    const savedCart = localStorage.getItem('club_cafe_cart_v2');
    cart = savedCart ? JSON.parse(savedCart) : [];
} catch(e) { cart = []; }

let currentAdminPassword = localStorage.getItem('club_cafe_admin_pass') || '123456';
let currentCustomizingItem = null;

function saveToStorage() {
    try {
        localStorage.setItem('club_cafe_categories_v14', JSON.stringify(categories));
        localStorage.setItem('club_cafe_diets_v5', JSON.stringify(dietaryFilters));
        localStorage.setItem('club_cafe_menu_v39', JSON.stringify(menuItems));
        localStorage.setItem('club_cafe_formules_v3', JSON.stringify(formules));
        localStorage.setItem('club_cafe_matrix_cols_v1', JSON.stringify(matrixColumns));
        localStorage.setItem('club_cafe_matrix_rows_v1', JSON.stringify(matrixRows));
        localStorage.setItem('club_cafe_orders_v28', JSON.stringify(ordersHistory));
        localStorage.setItem('club_cafe_favs_v2', JSON.stringify(favorites));
        localStorage.setItem('club_cafe_cart_v2', JSON.stringify(cart));
        localStorage.setItem('club_cafe_admin_pass', currentAdminPassword);
        syncMaps();
    } catch(e) {}
}
syncMaps();

// Storage Listeners
window.addEventListener('storage', function(e) {
    if (e.key === 'club_cafe_flash_promo' && typeof checkFlashPromoStatus === 'function') {
        checkFlashPromoStatus();
    }
    if (e.key === 'club_cafe_orders_v28') {
        try {
            ordersHistory = JSON.parse(e.newValue || '[]');
            if(typeof updateClientTrackerBanner === 'function') updateClientTrackerBanner();
            if (isAdminLoggedIn && typeof updateAdminDashboard === 'function') updateAdminDashboard();
        } catch(err) {}
    }
});
