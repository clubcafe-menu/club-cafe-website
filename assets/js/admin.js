// --- Helper Functions pour améliorer les performances et réduire la duplication ---
import { db, auth } from './firebase.js'; // تأكد من استيراد auth / Assurez-vous d'importer auth
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { signInWithEmailAndPassword } from "firebase/auth"; // استيراد دالة الدخول / Importer la fonction de connexion
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
const getTabElementNames = (name) => ({
    tab: document.getElementById(`adminTab${capitalize(name)}`),
    btn: document.getElementById(`tabBtn${capitalize(name)}`)
});

// Importation de la base de données et des fonctions nécessaires depuis Firebase (À PLACER EN HAUT DU FICHIER, SI CE N'EST PAS DÉJÀ FAIT)
// import { db } from './firebase.js';
// import { collection, addDoc, serverTimestamp, getDocs } from "firebase/firestore"; // Ajout de getDocs si nécessaire plus tard

function switchAdminTab(tabName) {
    const tabs = ['formules', 'categories', 'diets', 'allergens', 'clients', 'orders'];
    
    tabs.forEach(t => {
        const { tab, btn } = getTabElementNames(t);
        if (tab) tab.classList.add('hidden');
        if (btn) btn.className = "pb-3 px-4 font-bold text-xs border-b-2 border-transparent text-slate-500 hover:text-burgundy-900 transition flex items-center gap-2 flex-shrink-0";
    });

    const { tab: targetTab, btn: targetBtn } = getTabElementNames(tabName);
    if (targetTab) targetTab.classList.remove('hidden');
    if (targetBtn) targetBtn.className = "pb-3 px-4 font-bold text-xs border-b-2 border-burgundy-800 text-burgundy-900 transition flex items-center gap-2 flex-shrink-0";

    if (tabName === 'allergens') {
        renderAdminMatrixTable();
    }
    if (tabName === 'clients') {
        updateClientsTabUI();
    }
}

// دالة تشغيل صوت تنبيه التأخير
function playLateOrderSound() {
    try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(() => {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(523.25, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.4);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.4);
        });
    } catch(e) {}
}

function updateClientsTabUI() {
    const cartList = document.getElementById('adminClientsCartList');
    const favList = document.getElementById('adminClientsFavList');
    const trendingList = document.getElementById('adminTrendingFavList');
    const activeCartsStat = document.getElementById('statActiveCarts');
    
    if (!cartList || !favList || !trendingList) return;

    const totalActiveCarts = cart.length > 0 ? 1 : 0;
    if (activeCartsStat) {
        activeCartsStat.innerText = `🛒 Paniers actifs : ${totalActiveCarts}`;
    }

    if (cart.length === 0) {
        cartList.innerHTML = `<p class="text-slate-400 italic">Aucun article dans le panier pour l'instant.</p>`;
    } else {
        cartList.innerHTML = cart.map(i => `
            <div class="flex items-center justify-between bg-white p-2.5 rounded-lg border">
                <span class="font-bold"><b>${i.qty}x</b> ${i.name}</span>
                <div class="flex items-center gap-2">
                    <span class="text-burgundy-800 font-black">${(i.price * i.qty).toFixed(2)} €</span>
                    <button onclick="triggerFlashPromo()" class="px-2 py-1 bg-amber-500 text-burgundy-900 text-[10px] font-extrabold rounded shadow hover:bg-amber-400" title="Envoyer une offre Flash">⚡ Flash Promo</button>
                </div>
            </div>
        `).join('');
    }

    const favItems = menuItems.filter(i => favorites.includes(i.id));
    if (favItems.length === 0) {
        favList.innerHTML = `<p class="text-slate-400 italic">Aucun favori enregistré.</p>`;
        trendingList.innerHTML = `<p class="text-xs text-slate-400 italic">Aucun favori pour le moment.</p>`;
    } else {
        favList.innerHTML = favItems.map(i => `
            <div class="flex items-center justify-between bg-white p-2.5 rounded-lg border">
                <span class="font-bold">${i.name}</span>
                <span class="text-burgundy-800 font-black">${Number(i.price).toFixed(2)} €</span>
            </div>
        `).join('');

        const trendingItems = favItems.slice(0, 20);
        trendingList.innerHTML = trendingItems.map((i, index) => `
            <div class="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-amber-200 shadow-sm flex-shrink-0">
                <span class="w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center">${index + 1}</span>
                <img src="${i.img}" class="w-7 h-7 rounded-lg object-cover" loading="lazy">
                <div>
                    <p class="text-xs font-bold text-slate-800">${i.name}</p>
                    <p class="text-[10px] text-burgundy-800 font-black">${Number(i.price).toFixed(2)} € (Stock: ${i.infinite ? 'Infini' : i.stock})</p>
                </div>
            </div>
        `).join('');
    }
}

function setOrderFilter(status) {
    currentOrderFilter = status;
    ['all', 'En attente de paiement', 'En préparation', 'Prêt'].forEach(s => {
        const mapKey = s === 'all' ? 'All' : (s === 'En attente de paiement' ? 'Pending' : (s === 'En préparation' ? 'Prep' : 'Ready'));
        const btn = document.getElementById(`orderFilter${mapKey}`);
        if (btn) {
            if (s === status) btn.className = "px-3 py-1 rounded-lg text-xs font-bold bg-burgundy-800 text-amber-300 shadow";
            else btn.className = "px-3 py-1 rounded-lg text-xs font-bold bg-white text-slate-700 border";
        }
    });
    updateAdminDashboard();
}

function toggleRushHour() {
    isRushHour = !isRushHour;
    const btn = document.getElementById('rushHourToggleBtn');
    const banner = document.getElementById('rushBanner');
    if (isRushHour) {
        btn.className = "px-3 py-1 rounded-lg text-xs font-extrabold bg-red-600 text-white shadow transition animate-pulse";
        btn.innerText = "🔴 Café : Rush Hour";
        banner.classList.remove('hidden');
    } else {
        btn.className = "px-3 py-1 rounded-lg text-xs font-extrabold bg-emerald-600 text-white shadow transition";
        btn.innerText = "🟢 Café : Ouvert";
        banner.classList.add('hidden');
    }
}

function exportDatabaseJSON() {
    const dbData = { categories, dietaryFilters, menuItems, formules, matrixColumns, matrixRows, ordersHistory };
    const blob = new Blob([JSON.stringify(dbData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `club_cafe_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    showToast("💾 Sauvegarde exportée avec succès !");
}

function importDatabaseJSON(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (imported.menuItems) menuItems = imported.menuItems;
            if (imported.categories) categories = imported.categories;
            if (imported.formules) formules = imported.formules;
            if (imported.dietaryFilters) dietaryFilters = imported.dietaryFilters;
            if (imported.matrixColumns) matrixColumns = imported.matrixColumns;
            if (imported.matrixRows) matrixRows = imported.matrixRows;
            if (imported.ordersHistory) ordersHistory = imported.ordersHistory;
            
            saveToStorage();
            renderCategoriesGrid();
            renderQuickCategoryPills();
            renderDietaryFiltersBar();
            renderSubDietaryBar();
            renderFormulesGrid();
            updateAdminDashboard();
            showToast("⚡ Données importées avec succès !");
        } catch(err) {
            alert("❌ Fichier invalide ou corrompu !");
        }
    };
    reader.readAsText(file);
}

function handleAiScan(e, type) {
    const file = e.target.files[0];
    if (!file) return;
    showToast("✨ Analyse par l'IA en cours...");
    setTimeout(() => {
        if (type === 'product') {
            document.getElementById('hierProdName').value = "Sandwich Saumon Avocat";
            document.getElementById('hierProdPrice').value = "7.50";
            document.getElementById('hierProdStock').value = "15";
            document.getElementById('hierProdImg').value = "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=500&q=80";
        } else if (type === 'formule') {
            document.getElementById('newFormuleTitle').value = "Offre Gourmande";
            document.getElementById('newFormulePrice').value = "9.90";
            document.getElementById('newFormuleBadge').value = "PROMO";
            document.getElementById('newFormuleStock').value = "20";
            document.getElementById('newFormuleDesc').value = "Plat chaud + Dessert + Boisson.";
            document.getElementById('newFormuleImg').value = "https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=600&q=80";
        } else if (type === 'category') {
            document.getElementById('newCatId').value = "desserts";
            document.getElementById('newCatName').value = "Desserts Maison";
            document.getElementById('newCatImg').value = "https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=500&q=80";
        }
        showToast("🎉 Données remplies avec succès par l'IA !");
    }, 1200);
}

function duplicateProduct(id) {
    const item = menuMap.get(id);
    if (!item) return;
    const newItem = { ...item, id: Date.now(), name: item.name + " (Copie)" };
    menuItems.push(newItem);
    saveToStorage();
    updateAdminDashboard();
    showToast(`📋 Produit copié avec succès !`);
}

function duplicateFormule(id) {
    const f = formules.find(item => item.id == id);
    if (!f) return;
    const newF = { ...f, id: Date.now(), title: f.title + " (Copie)" };
    formules.push(newF);
    saveToStorage();
    renderFormulesGrid();
    updateAdminDashboard();
    showToast(`📋 Offre copiée avec succès !`);
}

function moveFormuleOrder(index, direction) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= formules.length) return;
    const temp = formules[index];
    formules[index] = formules[newIndex];
    formules[newIndex] = temp;
    saveToStorage();
    renderFormulesGrid();
    updateAdminDashboard();
}

function updateInlineProduct(id, field, value) {
    const item = menuMap.get(id);
    if (!item) return;
    if (field === 'name') item.name = value.trim() || "Produit";
    if (field === 'price') item.price = parseFloat(value) || 0;
    if (field === 'stock') item.stock = parseInt(value) || 0;
    saveToStorage();
    updateAdminDashboard();
    showToast("⚡ Mise à jour en direct effectuée !");
}

function updateInlineFormule(id, field, value) {
    const f = formules.find(item => item.id == id);
    if (!f) return;
    if (field === 'title') f.title = value.trim() || "Offre";
    if (field === 'price') f.price = parseFloat(value) || 0;
    if (field === 'stock') f.stock = parseInt(value) || 0;
    saveToStorage();
    renderFormulesGrid();
    showToast("⚡ Mise à jour en direct de l'offre !");
}

function toggleInfiniteFormuleStockInput(isChecked) {
    const stockInput = document.getElementById('newFormuleStock');
    if (isChecked) {
        stockInput.value = 999;
        stockInput.disabled = true;
        stockInput.classList.add('bg-slate-100', 'text-slate-400');
    } else {
        stockInput.disabled = false;
        stockInput.classList.remove('bg-slate-100', 'text-slate-400');
        if(stockInput.value == 999) stockInput.value = 10;
    }
}

window.saveFormule = async function(e) {
    e.preventDefault();
    const editId = document.getElementById('editFormuleId').value;
    let titleVal = document.getElementById('newFormuleTitle').value.trim();
    const title = titleVal === "" ? "Offre sans nom" : titleVal;
    let priceVal = document.getElementById('newFormulePrice').value;
    const price = priceVal === "" ? 0.00 : parseFloat(priceVal);
    let badgeVal = document.getElementById('newFormuleBadge').value.trim();
    const badge = badgeVal === "" ? "PROMO" : badgeVal;
    let descVal = document.getElementById('newFormuleDesc').value.trim();
    const desc = descVal === "" ? "Description non disponible" : descVal;
    let imgVal = document.getElementById('newFormuleImg').value.trim();
    const img = imgVal === "" ? "https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=600&q=80" : imgVal;
    
    const isInfinite = document.getElementById('newFormuleInfinite').checked;
    let stockVal = document.getElementById('newFormuleStock').value;
    const stock = isInfinite ? 999 : (stockVal === "" ? 10 : parseInt(stockVal));

    const formuleData = { id: Date.now(), title, price, badge, desc, img, stock, infinite: isInfinite };

    try {
        if (editId) {
            const index = formules.findIndex(f => f.id == editId);
            if (index !== -1) formules[index] = { ...formules[index], id: Number(editId), title, price, badge, desc, img, stock, infinite: isInfinite };
            showToast("Offre mise à jour !");
            resetFormuleForm();
        } else {
            // الإرسال لفايربيز
            await addDoc(collection(db, "formules"), {
                ...formuleData,
                createdAt: serverTimestamp()
            });
            formules.push(formuleData);
            showToast("Offre ajoutée à Firebase !");
            e.target.reset();
        }
        if (typeof saveToStorage === 'function') saveToStorage();
        if (typeof renderFormulesGrid === 'function') renderFormulesGrid();
        if (typeof updateAdminDashboard === 'function') updateAdminDashboard();
    } catch (error) {
        console.error("Erreur Firebase (Formules):", error);
        alert("❌ فايربيز رفض الحفظ! / Firebase a refusé la sauvegarde !");
    }
};

function editFormule(id) {
    const f = formules.find(item => item.id == id);
    if (!f) return;
    document.getElementById('editFormuleId').value = f.id;
    document.getElementById('newFormuleTitle').value = f.title;
    document.getElementById('newFormulePrice').value = f.price;
    document.getElementById('newFormuleBadge').value = f.badge;
    document.getElementById('newFormuleDesc').value = f.desc;
    document.getElementById('newFormuleImg').value = f.img;
    document.getElementById('newFormuleStock').value = f.infinite ? 999 : (f.stock !== undefined ? f.stock : 10);
    
    const infCheckbox = document.getElementById('newFormuleInfinite');
    infCheckbox.checked = !!f.infinite;
    toggleInfiniteFormuleStockInput(infCheckbox.checked);

    document.getElementById('formuleFormTitle').innerHTML = '<i class="fa-solid fa-pen-to-square text-amber-500"></i> <span>Modifier l\'Offre : ' + f.title + '</span>';
    document.getElementById('cancelFormuleEditBtn').classList.remove('hidden');
}

function resetFormuleForm() {
    document.getElementById('editFormuleId').value = "";
    document.getElementById('formuleFormTitle').innerHTML = '<i class="fa-solid fa-circle-plus text-amber-500"></i> <span>Ajouter ou modifier une Offre</span>';
    document.getElementById('cancelFormuleEditBtn').classList.add('hidden');
    const form = document.querySelector('#adminTabFormules form');
    if (form) form.reset();
    toggleInfiniteFormuleStockInput(false);
}

function deleteFormule(id) {
    if (confirm("Supprimer cette offre ?")) {
        formules = formules.filter(f => f.id !== id);
        saveToStorage();
        renderFormulesGrid();
        updateAdminDashboard();
        showToast("Offre supprimée");
    }
}

// -------------------------------------------------------------------------
// MODIFICATION : Utilisation de Firebase pour l'enregistrement des catégories
// -------------------------------------------------------------------------
// تأكد إن هذي الاستيرادات موجودة في أول سطر بملف admin.js
// Assure-toi que ces importations sont présentes à la première ligne du fichier admin.js


window.saveCategory = async function(e) {
    e.preventDefault(); 
    
    const originalId = document.getElementById('editCatOriginalId').value;
    let idVal = document.getElementById('newCatId').value.trim().toLowerCase();
    const id = idVal === "" ? "cat_" + Date.now() : idVal;
    let frVal = document.getElementById('newCatName').value.trim();
    const fr = frVal === "" ? "Nouvelle Catégorie" : frVal;
    let imgVal = document.getElementById('newCatImg').value.trim();
    const img = imgVal === "" ? "https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=500&q=80" : imgVal;

    const categoryData = { id, fr, img, allowedAddons: [] };

    try {
        if (originalId) {
            // تحديث تصنيف موجود
            // Mise à jour d'une catégorie existante
            const index = categories.findIndex(c => c.id === originalId);
            if (index !== -1) categories[index] = { ...categories[index], id, fr, img };
            showToast("Catégorie mise à jour !");
        } else {
            // 1. الإرسال لفايربيز أولاً (لو فشل، راح يوقف ويروح للخطأ تحت)
            // 1. Envoi à Firebase d'abord (s'il échoue, il s'arrêtera et ira à l'erreur ci-dessous)
            await addDoc(collection(db, "categories"), {
                ...categoryData,
                createdAt: serverTimestamp()
            });

            // 2. تحديث الشاشة فقط إذا نجح فايربيز
            // 2. Mise à jour de l'écran uniquement si Firebase réussit
            categories.push(categoryData);
            showToast("Catégorie ajoutée à Firebase !");
        }

        e.target.reset();
        resetCategoryForm();
        
        if (typeof saveToStorage === 'function') saveToStorage();
        if (typeof renderCategoriesGrid === 'function') renderCategoriesGrid();
        if (typeof updateAdminDashboard === 'function') updateAdminDashboard();

    } catch (error) {
        console.error("Erreur Firebase:", error);
        alert("❌ فايربيز رفض الحفظ! السبب إما أنك مو مسجل دخول كأدمن، أو فيه مشكلة بقواعد الحماية.");
        // ❌ Firebase a refusé la sauvegarde ! La raison est soit que vous n'êtes pas connecté en tant qu'admin, soit qu'il y a un problème avec les règles de sécurité.
    }
};
// -------------------------------------------------------------------------

function editCategory(catId) {
    const cat = categories.find(c => c.id === catId);
    if (!cat) return;
    document.getElementById('editCatOriginalId').value = cat.id;
    document.getElementById('newCatId').value = cat.id;
    document.getElementById('newCatName').value = cat.fr;
    document.getElementById('newCatImg').value = cat.img;
    document.getElementById('categoryFormTitle').innerHTML = '<i class="fa-solid fa-pen-to-square text-amber-500"></i> <span>Modifier la catégorie : ' + cat.fr + '</span>';
    document.getElementById('cancelCatEditBtn').classList.remove('hidden');
    document.getElementById('newCatName').focus();
}

function resetCategoryForm() {
    document.getElementById('editCatOriginalId').value = "";
    document.getElementById('categoryFormTitle').innerHTML = '<i class="fa-solid fa-circle-plus text-amber-500"></i> <span>Ajouter ou modifier une catégorie</span>';
    document.getElementById('cancelCatEditBtn').classList.add('hidden');
    const form = document.querySelector('#adminTabCategories form');
    if (form) form.reset();
}

function deleteCategory(catId) {
    if (confirm("Supprimer cette catégorie ? Les produits associés n'auront plus de catégorie active.")) {
        categories = categories.filter(c => c.id !== catId);
        saveToStorage();
        renderCategoriesGrid();
        updateAdminDashboard();
        showToast("Catégorie supprimée");
    }
}

function addAddonToCategory(catId) {
    const addonName = prompt("Nom du supplément (ex: Lait d'amande, Extra Fromage) :");
    if (!addonName) return;
    const addonPriceStr = prompt("Prix du supplément en € (ex: 1.00) :", "1.00");
    const addonPrice = parseFloat(addonPriceStr) || 0;

    const cat = categories.find(c => c.id === catId);
    if (cat) {
        if (!cat.allowedAddons) cat.allowedAddons = [];
        cat.allowedAddons.push({ name: addonName, price: addonPrice, enabled: true });
        saveToStorage();
        updateAdminDashboard();
        showToast("✨ Supplément ajouté avec son prix !");
    }
}

function toggleCategoryAddonStatus(catId, addonIndex) {
    const cat = categories.find(c => c.id === catId);
    if (cat && cat.allowedAddons && cat.allowedAddons[addonIndex]) {
        cat.allowedAddons[addonIndex].enabled = !cat.allowedAddons[addonIndex].enabled;
        saveToStorage();
        updateAdminDashboard();
        showToast("⚡ État du supplément mis à jour !");
    }
}

function removeAddonFromCategory(catId, addonIndex) {
    const cat = categories.find(c => c.id === catId);
    if (cat && cat.allowedAddons) {
        cat.allowedAddons.splice(addonIndex, 1);
        saveToStorage();
        updateAdminDashboard();
        showToast("Supplément supprimé");
    }
}

function toggleDietSubOptionStatus(dietId, subIndex) {
    const diet = dietaryFilters.find(d => d.id === dietId);
    if (diet && diet.subOptions && diet.subOptions[subIndex]) {
        diet.subOptions[subIndex].enabled = !diet.subOptions[subIndex].enabled;
        saveToStorage();
        updateAdminDashboard();
        showToast("⚡ État de l'option mis à jour !");
    }
}

function matrixAddColumn() {
    const nextColName = String(matrixColumns.length + 1);
    matrixColumns.push(nextColName);
    matrixRows.forEach(row => {
        if (!row.dots) row.dots = [];
        row.dots.push(false);
    });
    saveToStorage();
    renderAdminMatrixTable();
    showToast("➕ Colonne ajoutée !");
}

function matrixRemoveColumn() {
    if (matrixColumns.length <= 1) {
        alert("⚠️ Impossible de supprimer toutes les colonnes !");
        return;
    }
    matrixColumns.pop();
    matrixRows.forEach(row => {
        if (row.dots) row.dots.pop();
    });
    saveToStorage();
    renderAdminMatrixTable();
    showToast("➖ Colonne supprimée !");
}

window.matrixSaveRow = async function(e) {
    e.preventDefault();
    const input = document.getElementById('newMatrixRowName');
    const editIndex = parseInt(document.getElementById('editMatrixRowIndex').value);
    const val = input.value.trim();
    if (!val) return;

    try {
        if (editIndex >= 0) {
            matrixRows[editIndex].name = val;
            showToast("✅ Ligne mise à jour !");
        } else {
            let defaultDots = matrixColumns.map(() => false);
            const rowData = { name: val, dots: defaultDots };
            
            // الإرسال لفايربيز
            await addDoc(collection(db, "matrixRows"), {
                ...rowData,
                createdAt: serverTimestamp()
            });
            matrixRows.push(rowData);
            showToast("✅ Ligne ajoutée à Firebase !");
        }
        if (typeof saveToStorage === 'function') saveToStorage();
        if (typeof renderAdminMatrixTable === 'function') renderAdminMatrixTable();
        if (typeof resetMatrixRowForm === 'function') resetMatrixRowForm();
    } catch (error) {
        console.error("Erreur Firebase (Matrice):", error);
        alert("❌ فايربيز رفض الحفظ! / Firebase a refusé la sauvegarde !");
    }
};

function resetMatrixRowForm() {
    document.getElementById('newMatrixRowName').value = '';
    document.getElementById('editMatrixRowIndex').value = '-1';
    document.getElementById('cancelMatrixRowEdit').classList.add('hidden');
}

function matrixDeleteRow(index) {
    if (confirm("Êtes-vous sûr de supprimer cette ligne ?")) {
        matrixRows.splice(index, 1);
        saveToStorage();
        renderAdminMatrixTable();
        showToast("🗑️ Ligne supprimée !");
    }
}

function renderAdminMatrixTable() {
    const adminHead = document.getElementById('adminMatrixEditorHead');
    const adminBody = document.getElementById('adminMatrixEditorBody');
    if (!adminHead || !adminBody) return;

    let headHtml = `<tr><th class="p-2 border">Allergène</th>`;
    matrixColumns.forEach((col, cIdx) => {
        headHtml += `<th class="p-2 border text-center">
            <input type="text" id="matCol_${cIdx}" value="${col}" class="w-14 text-center font-bold bg-white border rounded px-1 py-0.5">
        </th>`;
    });
    headHtml += `<th class="p-2 border text-center">Actions</th></tr>`;
    adminHead.innerHTML = headHtml;

    let bodyHtml = '';
    matrixRows.forEach((row, rIdx) => {
        bodyHtml += `<tr class="border-b">
            <td class="p-2 border font-bold">
                <span class="text-xs text-amber-600">${String.fromCharCode(65 + rIdx)}</span> 
                <input type="text" id="matRowName_${rIdx}" value="${row.name}" class="w-32 font-bold bg-white border rounded px-2 py-0.5 text-xs">
            </td>`;
        matrixColumns.forEach((col, cIdx) => {
            const checked = row.dots && row.dots[cIdx];
            bodyHtml += `<td class="p-2 border text-center">
                <input type="checkbox" id="matDot_${rIdx}_${cIdx}" ${checked ? 'checked' : ''} class="w-4 h-4 text-burgundy-800 rounded cursor-pointer">
            </td>`;
        });
        bodyHtml += `<td class="p-2 border text-center">
            <button onclick="matrixDeleteRow(${rIdx})" class="px-2 py-1 bg-red-600 text-white rounded text-xs font-bold">Supprimer</button>
        </td></tr>`;
    });
    bodyHtml += `<tr><td colspan="${matrixColumns.length + 2}" class="p-3 text-center bg-slate-100">
        
    </td></tr>`;
    adminBody.innerHTML = bodyHtml;
}

function saveAdminMatrixChanges() {
    matrixColumns.forEach((col, cIdx) => {
        const inputCol = document.getElementById(`matCol_${cIdx}`);
        if (inputCol) {
            matrixColumns[cIdx] = inputCol.value.trim() || String(cIdx + 1);
        }
    });

    matrixRows.forEach((row, rIdx) => {
        const inputRowName = document.getElementById(`matRowName_${rIdx}`);
        if (inputRowName) {
            row.name = inputRowName.value.trim() || `Ligne ${rIdx + 1}`;
        }
        if (!row.dots) row.dots = matrixColumns.map(() => false);
        matrixColumns.forEach((col, cIdx) => {
            const chk = document.getElementById(`matDot_${rIdx}_${cIdx}`);
            if (chk) {
                row.dots[cIdx] = chk.checked;
            }
        });
    });

    saveToStorage();
    renderAdminMatrixTable();
    showToast("💾 Modifications de la matrice enregistrées !");
}

window.saveProductHierarchical = async function(e) {
    e.preventDefault();
    const editId = document.getElementById('editProdId').value;
    const name = document.getElementById('hierProdName').value.trim();
    const price = parseFloat(document.getElementById('hierProdPrice').value) || 0;
    const cat = document.getElementById('hierProdCatSelect').value;
    const stock = parseInt(document.getElementById('hierProdStock').value) || 10;
    const hasTemp = document.getElementById('hierProdHasTemp').checked;
    const hasSize = document.getElementById('hierProdHasSize').checked;
    const img = document.getElementById('hierProdImg').value.trim() || "https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=500&q=80";

    const productData = { id: Date.now(), name, price, cat, stock, infinite: false, hasTemp, hasSize, img };

    try {
        if (editId) {
            const index = menuItems.findIndex(i => i.id == editId);
            if (index !== -1) {
                menuItems[index] = { ...menuItems[index], name, price, cat, stock, hasTemp, hasSize, img };
            }
            showToast("Produit mis à jour !");
            document.getElementById('editProdId').value = "";
        } else {
            // الإرسال لفايربيز (نحفظها في كولكشن menu)
            await addDoc(collection(db, "menu"), {
                ...productData,
                createdAt: serverTimestamp()
            });
            menuItems.push(productData);
            showToast("Produit ajouté à Firebase !");
        }
        e.target.reset();
        if (typeof saveToStorage === 'function') saveToStorage();
        if (typeof updateAdminDashboard === 'function') updateAdminDashboard();
    } catch (error) {
        console.error("Erreur Firebase (Produits):", error);
        alert("❌ فايربيز رفض الحفظ! / Firebase a refusé la sauvegarde !");
    }
};

function editHierarchicalProduct(prodId) {
    const item = menuItems.find(i => i.id === prodId);
    if (!item) return;
    document.getElementById('editProdId').value = item.id;
    document.getElementById('hierProdName').value = item.name;
    document.getElementById('hierProdPrice').value = item.price;
    document.getElementById('hierProdCatSelect').value = item.cat;
    document.getElementById('hierProdStock').value = item.stock;
    document.getElementById('hierProdImg').value = item.img;
    document.getElementById('hierProdHasTemp').checked = !!item.hasTemp;
    document.getElementById('hierProdHasSize').checked = !!item.hasSize;
    document.getElementById('prodFormTitle').innerHTML = '<i class="fa-solid fa-pen-to-square text-amber-500"></i> <span>Modifier le produit : ' + item.name + '</span>';
    document.getElementById('hierProdName').focus();
}

function deleteHierarchicalProduct(prodId) {
    if (confirm("Supprimer ce produit ?")) {
        menuItems = menuItems.filter(i => i.id !== prodId);
        saveToStorage();
        updateAdminDashboard();
        showToast("Produit supprimé");
    }
}

// دالة حذف طلب محدد من لوحة التحكم
function deleteOrder(orderId) {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette commande définitivement ?")) {
        ordersHistory = ordersHistory.filter(o => o.id != orderId);
        saveToStorage();
        updateAdminDashboard();
        showToast("🗑️ Commande supprimée !");
    }
}

let searchTimeout;
function debouncedAdminSearch(val) { clearTimeout(searchTimeout); searchTimeout = setTimeout(() => { updateAdminDashboard(); }, 300); }
function debouncedFilterMenu(val) { clearTimeout(searchTimeout); searchTimeout = setTimeout(() => { filterMenu(); }, 300); }

function filterMenu() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    if(!query) return;
    for(let [id, item] of menuMap) {
        if(item.name.toLowerCase().includes(query)) {
            openCategoryModal(item.cat);
            break;
        }
    }
}

function updateAdminDashboard() {
    const statProd = document.getElementById('statTotalProducts');
    const statCat = document.getElementById('statTotalCategories');
    const statOrd = document.getElementById('statTotalOrders');
    const statRev = document.getElementById('statTotalRevenue');
    if (!statProd || !statCat || !statOrd || !statRev) return;

    statProd.innerText = `Produits : ${menuItems.length}`;
    statCat.innerText = `Catégories : ${categories.length}`;
    statOrd.innerText = `Commandes : ${ordersHistory.length}`;
    const totalRev = ordersHistory.reduce((acc, o) => acc + o.total, 0);
    statRev.innerText = `Revenus : ${totalRev.toFixed(2)} €`;

    const lowStockItems = menuItems.filter(i => !i.infinite && i.stock <= 2);
    const lowStockFormules = formules.filter(f => !f.infinite && f.stock <= 2);
    const lowStockBanner = document.getElementById('lowStockBanner');
    if (lowStockItems.length > 0 || lowStockFormules.length > 0) {
        lowStockBanner.classList.remove('hidden');
        const names = [...lowStockItems.map(i => i.name), ...lowStockFormules.map(f => f.title)].join(', ');
        document.getElementById('lowStockText').innerText = `⚠️ Alerte Stock : (${names}) bientôt épuisés !`;
    } else {
        lowStockBanner.classList.add('hidden');
    }

    const pendingOrdersCount = ordersHistory.filter(o => o.status === 'En attente de paiement').length;
    const adminModalContent = document.getElementById('adminModalContent');
    if (pendingOrdersCount > 0) {
        if(adminModalContent) adminModalContent.classList.add('dashboard-alert-pulse');
    } else {
        if(adminModalContent) adminModalContent.classList.remove('dashboard-alert-pulse');
    }

    const formulesTableEl = document.getElementById('adminFormulesTable');
    if (formulesTableEl) {
        formulesTableEl.innerHTML = formules.map((f, idx) => `
            <tr class="border-b hover:bg-slate-50 transition">
                <td class="p-3 text-center">
                    <div class="flex items-center justify-center gap-1">
                        <button onclick="moveFormuleOrder(${idx}, -1)" class="w-5 h-5 bg-slate-200 hover:bg-slate-300 rounded text-[10px] font-bold" title="Monter">⬆️</button>
                        <button onclick="moveFormuleOrder(${idx}, 1)" class="w-5 h-5 bg-slate-200 hover:bg-slate-300 rounded text-[10px] font-bold" title="Descendre">⬇️</button>
                    </div>
                </td>
                <td class="p-3 flex items-center gap-2">
                    <img src="${f.img}" loading="lazy" class="w-8 h-8 rounded object-cover flex-shrink-0">
                    <input type="text" value="${f.title}" onchange="updateInlineFormule(${f.id}, 'title', this.value)" class="w-full px-2 py-1 text-xs border rounded bg-white font-bold transition focus:ring-1 focus:ring-burgundy-500">
                </td>
                <td class="p-3">
                    <input type="number" step="0.01" value="${f.price}" onchange="updateInlineFormule(${f.id}, 'price', this.value)" class="w-20 px-2 py-1 text-xs border rounded bg-white font-black text-burgundy-800 transition focus:ring-1 focus:ring-burgundy-500">
                </td>
                <td class="p-3">
                    ${f.infinite ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800">♾️ Infini</span>` : `
                        <input type="number" value="${f.stock}" onchange="updateInlineFormule(${f.id}, 'stock', this.value)" class="w-16 px-2 py-1 text-xs border rounded bg-white font-bold transition focus:ring-1 focus:ring-burgundy-500">
                    `}
                </td>
                <td class="p-3 text-right flex items-center justify-end gap-1.5">
                    <button onclick="editFormule(${f.id})" class="text-amber-600 hover:text-amber-800 font-bold px-2 py-1 bg-amber-50 rounded transition hover:scale-110" title="Modification détaillée"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button onclick="duplicateFormule(${f.id})" class="text-purple-600 hover:text-purple-800 font-bold px-2 py-1 bg-purple-50 rounded transition hover:scale-110" title="Copie rapide"><i class="fa-solid fa-copy"></i></button>
                    <button onclick="deleteFormule(${f.id})" class="text-red-600 hover:text-red-800 font-bold px-2 py-1 bg-red-50 rounded transition hover:scale-110" title="Supprimer"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    }

    const hierarchicalContainer = document.getElementById('hierarchicalCategoriesContainer');
    if (hierarchicalContainer) {
        hierarchicalContainer.innerHTML = categories.map(cat => {
            const catProducts = menuItems.filter(i => i.cat === cat.id);
            const catAddons = cat.allowedAddons || [];
            return `
                <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div class="p-4 bg-burgundy-900 text-cream-100 flex items-center justify-between flex-wrap gap-3">
                        <div class="flex items-center gap-3">
                            <img src="${cat.img}" loading="lazy" class="w-10 h-10 rounded-lg object-cover border-2 border-amber-400">
                            <div>
                                <h3 class="font-black text-base text-amber-300">${cat.fr}</h3>
                                <span class="text-[11px] text-cream-200">ID: ${cat.id} | Produits : ${catProducts.length}</span>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <button onclick="editCategory('${cat.id}')" class="px-3 py-1.5 bg-amber-500 text-burgundy-900 font-bold text-xs rounded-lg shadow hover:bg-amber-400 transition" title="Modifier">
                                <i class="fa-solid fa-pen-to-square"></i> Modifier
                            </button>
                            <button onclick="deleteCategory('${cat.id}')" class="px-3 py-1.5 bg-red-600 text-white font-bold text-xs rounded-lg shadow hover:bg-red-500 transition" title="Supprimer">
                                <i class="fa-solid fa-trash"></i> Supprimer
                            </button>
                        </div>
                    </div>

                    <div class="p-3 bg-amber-50/70 border-b border-amber-200/60 flex items-center justify-between flex-wrap gap-2">
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="text-xs font-extrabold text-burgundy-900">✨ Suppléments & Prix :</span>
                            ${catAddons.length === 0 ? `<span class="text-xs text-slate-400 italic">Aucun supplément</span>` : 
                                catAddons.map((addonObj, aIdx) => `
                                    <span class="bg-white px-2.5 py-1 rounded-lg border text-[11px] font-bold ${addonObj.enabled ? 'text-slate-800 border-emerald-400' : 'text-slate-400 bg-slate-100 border-slate-300 line-through'} flex items-center gap-1.5 shadow-sm">
                                        ${addonObj.name} (${Number(addonObj.price || 0).toFixed(2)}€)
                                        <button onclick="toggleCategoryAddonStatus('${cat.id}', ${aIdx})" class="px-1.5 py-0.5 rounded text-[10px] font-extrabold ${addonObj.enabled ? 'bg-emerald-600 text-white' : 'bg-slate-400 text-white'}" title="Activer ou désactiver">
                                            ${addonObj.enabled ? 'ON' : 'OFF'}
                                        </button>
                                        <button onclick="removeAddonFromCategory('${cat.id}', ${aIdx})" class="text-red-600 hover:text-red-800 ml-1" title="Supprimer"><i class="fa-solid fa-xmark"></i></button>
                                    </span>
                                `).join('')
                            }
                        </div>
                        <button onclick="addAddonToCategory('${cat.id}')" class="px-3 py-1 bg-burgundy-800 hover:bg-burgundy-700 text-amber-300 rounded-lg text-xs font-bold shadow transition">
                            <i class="fa-solid fa-plus"></i> Ajouter un supplément
                        </button>
                    </div>

                    <div class="p-4 bg-slate-50">
                        ${catProducts.length === 0 ? `
                            <div class="text-center py-4 text-xs text-slate-400">Aucun produit dans cette catégorie pour le moment.</div>
                        ` : `
                            <div class="space-y-2">
                                ${catProducts.map(item => `
                                    <div class="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between flex-wrap gap-2 shadow-sm">
                                        <div class="flex items-center gap-2 flex-grow">
                                            <img src="${item.img}" loading="lazy" class="w-8 h-8 rounded object-cover flex-shrink-0">
                                            <input type="text" value="${item.name}" onchange="updateInlineProduct(${item.id}, 'name', this.value)" class="w-full sm:w-36 px-2 py-1 text-xs border rounded bg-white font-bold">
                                        </div>
                                        <div class="flex items-center gap-3 flex-wrap">
                                            <div>
                                                <span class="text-[10px] text-slate-400 block">Prix (€)</span>
                                                <input type="number" step="0.01" value="${item.price}" onchange="updateInlineProduct(${item.id}, 'price', this.value)" class="w-16 px-2 py-1 text-xs border rounded font-black text-burgundy-800">
                                            </div>
                                            <div>
                                                <span class="text-[10px] text-slate-400 block">Stock</span>
                                                <input type="number" value="${item.stock}" onchange="updateInlineProduct(${item.id}, 'stock', this.value)" class="w-14 px-2 py-1 text-xs border rounded font-bold">
                                            </div>
                                            <div class="flex items-center gap-2 bg-slate-100 px-2 py-1 rounded-lg">
                                                <label class="text-[10px] font-bold text-slate-700 flex items-center gap-1 cursor-pointer">
                                                    <input type="checkbox" ${item.hasTemp ? 'checked' : ''} onchange="toggleItemOption(${item.id}, 'hasTemp', this.checked)"> 🌡️ Temp
                                                </label>
                                                <label class="text-[10px] font-bold text-slate-700 flex items-center gap-1 cursor-pointer">
                                                    <input type="checkbox" ${item.hasSize ? 'checked' : ''} onchange="toggleItemOption(${item.id}, 'hasSize', this.checked)"> 📏 Taille
                                                </label>
                                            </div>
                                            <div class="flex items-center gap-1">
                                                <button onclick="editHierarchicalProduct(${item.id})" class="text-amber-600 hover:text-amber-800 p-1.5 bg-amber-50 rounded" title="Modifier"><i class="fa-solid fa-pen-to-square"></i></button>
                                                <button onclick="duplicateProduct(${item.id})" class="text-purple-600 hover:text-purple-800 p-1.5 bg-purple-50 rounded" title="Copier"><i class="fa-solid fa-copy"></i></button>
                                                <button onclick="deleteHierarchicalProduct(${item.id})" class="text-red-600 hover:text-red-800 p-1.5 bg-red-50 rounded" title="Supprimer"><i class="fa-solid fa-trash"></i></button>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        `}
                    </div>
                </div>
            `;
        }).join('');
    }

    const dietsListEl = document.getElementById('adminDietsList');
    if (dietsListEl) {
        dietsListEl.innerHTML = dietaryFilters.map(diet => `
            <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <div class="flex items-center justify-between">
                    <span class="font-extrabold text-burgundy-900 text-xs">${diet.fr}</span>
                    <div class="flex items-center gap-1">
                        <button onclick="editDietaryFilter('${diet.id}')" class="text-amber-600 hover:text-amber-800 p-1.5 bg-amber-50 rounded text-xs"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button onclick="deleteDietaryFilter('${diet.id}')" class="text-red-600 hover:text-red-800 p-1.5 bg-red-50 rounded text-xs"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
                <div class="flex flex-wrap gap-2 pt-1">
                    <span class="text-[11px] font-bold text-slate-500 self-center">Options :</span>
                    ${(!diet.subOptions || diet.subOptions.length === 0) ? `<span class="text-[11px] text-slate-400 italic">Aucune sous-option</span>` : 
                        diet.subOptions.map((sub, sIdx) => `
                            <span class="bg-white px-2.5 py-1 rounded-lg border text-[11px] font-bold ${sub.enabled !== false ? 'text-slate-800 border-emerald-400' : 'text-slate-400 bg-slate-100 border-slate-300 line-through'} flex items-center gap-1.5 shadow-sm">
                                ${sub.name} (${Number(sub.price || 0).toFixed(2)}€)
                                <button onclick="toggleDietSubOptionStatus('${diet.id}', ${sIdx})" class="px-1.5 py-0.5 rounded text-[10px] font-extrabold ${sub.enabled !== false ? 'bg-emerald-600 text-white' : 'bg-slate-400 text-white'}" title="Activer ou désactiver">
                                    ${sub.enabled !== false ? 'ON' : 'OFF'}
                                </button>
                            </span>
                        `).join('')
                    }
                </div>
            </div>
        `).join('');
    }

    const ordersCardsContainer = document.getElementById('adminOrdersCardsContainer');
    if (ordersCardsContainer) {
        let filteredOrders = ordersHistory.slice().reverse();
        if (currentOrderFilter !== 'all') {
            filteredOrders = filteredOrders.filter(o => o.status === currentOrderFilter);
        }

        if (filteredOrders.length === 0) {
            ordersCardsContainer.innerHTML = `<div class="col-span-2 text-center text-slate-400 py-10 bg-white rounded-2xl border border-slate-200">Aucune commande trouvée</div>`;
        } else {
            let lateSoundPlayedThisTick = false;

            ordersCardsContainer.innerHTML = filteredOrders.map(order => {
                const orderTime = order.timestamp ? new Date(order.timestamp).getTime() : Date.now();
                const totalMinutes = Math.max(0, Math.floor((Date.now() - orderTime) / 60000));
                const elapsedHours = Math.floor(totalMinutes / 60);
                const remainingMins = totalMinutes % 60;
                const timeDisplay = elapsedHours > 0 ? `${elapsedHours}h ${remainingMins}m` : `${totalMinutes} min`;
                
                let cardBorderColor = "border-amber-300";
                let cardHeaderBg = "bg-amber-50 text-amber-900 border-amber-200";
                let statusBadgeHtml = `<span class="px-2.5 py-1 rounded-lg text-[11px] font-black bg-amber-100 text-amber-800">En attente 🟡</span>`;

                if (order.status === 'En préparation') {
                    cardBorderColor = "border-blue-300";
                    cardHeaderBg = "bg-blue-50 text-blue-900 border-blue-200";
                    statusBadgeHtml = `<span class="px-2.5 py-1 rounded-lg text-[11px] font-black bg-blue-100 text-blue-800">En préparation 🔄</span>`;
                } else if (order.status === 'Prêt') {
                    cardBorderColor = "border-emerald-400";
                    cardHeaderBg = "bg-emerald-50 text-emerald-900 border-emerald-200";
                    statusBadgeHtml = `<span class="px-2.5 py-1 rounded-lg text-[11px] font-black bg-emerald-100 text-emerald-800">Prêt ! ☕</span>`;
                }

                // Déclenchement de l'alerte visuelle et sonore pour les commandes en retard
                const isLate = order.status === 'En préparation' && totalMinutes >= 20;
                if (isLate) {
                    cardBorderColor = "border-red-500 animate-pulse";
                    if (!lateSoundPlayedThisTick) {
                        playLateOrderSound();
                        lateSoundPlayedThisTick = true;
                    }
                }

                return `
                    <div class="bg-white rounded-2xl shadow-sm border-2 ${cardBorderColor} overflow-hidden transition hover:shadow-md flex flex-col justify-between">
                        <div class="p-3.5 border-b ${cardHeaderBg} flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <span class="font-black text-sm">#${order.id}</span>
                                <span class="text-[11px] opacity-75">(${order.date})</span>
                            </div>
                            <div class="flex items-center gap-2">
                                ${statusBadgeHtml}
                                <span class="text-xs font-black px-2.5 py-1 rounded-lg bg-white shadow-sm">${order.total.toFixed(2)} €</span>
                            </div>
                        </div>

                        <div class="p-4 space-y-3 flex-grow text-xs">
                            <p class="font-bold text-slate-800">👤 Client : <span class="font-normal text-slate-600">${order.client || 'Client'}</span></p>
                            <p class="font-bold text-slate-800">🛍️ Articles :</p>
                            <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-700 font-medium">
                                ${order.items.map(i => `<div class="py-0.5">• <b>${i.qty}x</b> ${i.name}</div>`).join('')}
                            </div>
                        </div>

                        <div class="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2 text-xs">
                            <span class="font-bold ${isLate ? 'text-red-600 animate-bounce' : 'text-slate-600'}">⏱️ il y a ${timeDisplay} ${isLate ? '⚠️ (Retard)' : ''}</span>
                            
                            <div class="flex items-center gap-1.5 flex-wrap">
                                <button onclick="updateOrderStatus('${order.id}', 'En attente de paiement')" class="px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition shadow-sm ${order.status === 'En attente de paiement' ? 'bg-amber-500 text-burgundy-900 ring-2 ring-amber-600' : 'bg-white text-slate-700 border hover:bg-slate-100'}">
                                    🟡 En attente
                                </button>
                                <button onclick="updateOrderStatus('${order.id}', 'En préparation')" class="px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition shadow-sm ${order.status === 'En préparation' ? 'bg-blue-600 text-white ring-2 ring-blue-700' : 'bg-white text-slate-700 border hover:bg-slate-100'}">
                                    🔄 Préparation
                                </button>
                                <button onclick="updateOrderStatus('${order.id}', 'Prêt')" class="px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition shadow-sm ${order.status === 'Prêt' ? 'bg-emerald-600 text-white ring-2 ring-emerald-700' : 'bg-white text-slate-700 border hover:bg-slate-100'}">
                                    ☕ Prêt
                                </button>
                                <button onclick="printOrderTicket('${order.id}')" class="px-3 py-1.5 bg-burgundy-800 hover:bg-burgundy-700 text-amber-300 rounded-lg font-bold shadow transition flex items-center gap-1.5">
                                    <i class="fa-solid fa-print"></i>
                                </button>
                                <button onclick="deleteOrder('${order.id}')" class="px-2.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 border border-red-200 rounded-lg font-bold shadow transition flex items-center gap-1.5" title="Supprimer">
                                    <i class="fa-solid fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }
}

window.saveDietaryFilterForm = async function(e) {
    e.preventDefault();
    const editId = document.getElementById('editDietId').value;
    let idVal = document.getElementById('newDietId').value.trim().toLowerCase();
    const id = idVal === "" ? "diet_" + Date.now() : idVal;
    let frVal = document.getElementById('newDietFr').value.trim();
    const fr = frVal === "" ? "🌱 Option" : frVal;
    const subRaw = document.getElementById('newDietSubOptions').value;
    const subNames = subRaw ? subRaw.split(',').map(s => s.trim()).filter(Boolean) : [];
    const subOptions = subNames.map(name => ({ name, price: 0.50, enabled: true }));

    const dietData = { id, fr, subOptions };

    try {
        if (editId) {
            const index = dietaryFilters.findIndex(d => d.id === editId);
            if (index !== -1) dietaryFilters[index] = dietData;
            showToast("Filtre mis à jour avec succès !");
            resetDietForm();
        } else {
            // الإرسال لفايربيز
            await addDoc(collection(db, "diets"), {
                ...dietData,
                createdAt: serverTimestamp()
            });
            dietaryFilters.push(dietData);
            showToast("Filtre ajouté à Firebase !");
            e.target.reset();
        }
        if (typeof saveToStorage === 'function') saveToStorage();
        if (typeof renderDietaryFiltersBar === 'function') renderDietaryFiltersBar();
        if (typeof renderSubDietaryBar === 'function') renderSubDietaryBar();
        if (typeof updateAdminDashboard === 'function') updateAdminDashboard();
    } catch (error) {
        console.error("Erreur Firebase (Filtres):", error);
        alert("❌ فايربيز رفض الحفظ! / Firebase a refusé la sauvegarde !");
    }
};

function editDietaryFilter(dietId) {
    const diet = dietaryFilters.find(d => d.id === dietId);
    if (!diet) return;
    document.getElementById('editDietId').value = diet.id;
    document.getElementById('newDietId').value = diet.id;
    document.getElementById('newDietId').disabled = true;
    document.getElementById('newDietFr').value = diet.fr;
    const names = diet.subOptions ? diet.subOptions.map(s => s.name).join(', ') : '';
    document.getElementById('newDietSubOptions').value = names;
    document.getElementById('dietFormTitle').innerText = "Modifier le filtre et ses options";
    document.getElementById('cancelDietEditBtn').classList.remove('hidden');
}

function resetDietForm() {
    document.getElementById('editDietId').value = "";
    document.getElementById('newDietId').disabled = false;
    document.getElementById('dietFormTitle').innerText = "Ajouter un filtre principal et ses sous-options";
    document.getElementById('cancelDietEditBtn').classList.add('hidden');
    const form = document.querySelector('#adminTabDiets form');
    if (form) form.reset();
}

function deleteDietaryFilter(dietId) {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce filtre ?")) {
        dietaryFilters = dietaryFilters.filter(d => d.id !== dietId);
        if (currentDietaryFilter === dietId) { currentDietaryFilter = 'all'; currentSubDietaryFilter = 'all'; }
        saveToStorage();
        renderDietaryFiltersBar();
        renderSubDietaryBar();
        updateAdminDashboard();
        showToast("Filtre supprimé");
    }
}

function clearCompletedOrders() {
    if (confirm("Effacer toutes les commandes prêtes ?")) {
        ordersHistory = ordersHistory.filter(o => o.status !== 'Prêt');
        saveToStorage();
        updateAdminDashboard();
        showToast("🗑️ Commandes prêtes effacées !");
    }
}

function exportCSVReport() {
    let csv = "ID,Client,Date,Total,Status\n";
    ordersHistory.forEach(o => { csv += `${o.id},"${o.client || ''}",${o.date},${o.total},${o.status}\n`; });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `club_cafe_report_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    showToast("📊 Rapport Excel exporté !");
}

function printOrderTicket(orderId) {
    const order = ordersHistory.find(o => o.id == orderId);
    if (!order) return;
    const area = document.getElementById('printReceiptArea');
    let itemsHtml = order.items.map(i => {
        let baseName = "";
        let subLines = [];
        if (i.itemData && i.itemData.baseName) {
            baseName = i.itemData.baseName;
            if (i.itemData.options) subLines.push(...i.itemData.options);
            if (i.itemData.addons) subLines.push(...i.itemData.addons);
            if (i.itemData.note) subLines.push(`Note: ${i.itemData.note}`);
        } else {
            let fullName = i.name;
            let parts = fullName.split('[');
            baseName = parts[0].trim();
            for (let p = 1; p < parts.length; p++) {
                let cleanPart = parts[p].replace(']', '').trim();
                if (cleanPart) {
                    if (cleanPart.includes('(')) {
                        let subParts = cleanPart.split('(');
                        subLines.push(subParts[0].trim());
                        let inner = subParts[1].replace(')', '').trim();
                        if (inner) subLines.push(...inner.split(',').map(s => s.trim()));
                    } else {
                        subLines.push(...cleanPart.split(',').map(s => s.trim()));
                    }
                }
            }
        }
        return `
            <div style="margin-bottom: 12px; border-bottom: 1px dotted #ccc; padding-bottom: 6px;">
                <div style="font-size: 15px; font-weight: bold; text-transform: uppercase;"><b>${i.qty}x</b> ${baseName}</div>
                ${subLines.length > 0 ? `<div style="font-size: 10px; color: #333; padding-left: 14px; margin-top: 4px; line-height: 1.4;">${subLines.map(sub => `• ${sub}`).join('<br>')}</div>` : ''}
            </div>
        `;
    }).join('');

    area.innerHTML = `
        <div style="font-family:monospace; padding:15px; max-width:300px; margin:0 auto; color:#000; font-size:12px;">
            <h2 style="text-align:center; margin:0; font-size:16px; font-weight: bold;">CLUB CAFÉ - KITCHEN</h2>
            <p style="text-align:center; font-size:12px; margin:4px 0;">Ticket #${order.id} | ${order.date}</p>
            <p style="text-align:center; font-weight:bold; font-size:14px; margin:4px 0;">👤 ${order.client || 'Client'}</p>
            <hr style="border:1px dashed #000; margin:8px 0;"/>
            <div style="margin: 10px 0;">${itemsHtml}</div>
            <hr style="border:1px dashed #000; margin:8px 0;"/>
            <h3 style="text-align:center; margin:6px 0; font-size:15px; font-weight: bold;">Total: ${order.total.toFixed(2)} €</h3>
            <p style="text-align:center; font-size:10px; margin-top:5px;">--- Bon Appétit ---</p>
        </div>
    `;
    window.print();
}

function updateOrderStatus(id, newStatus) {
    const ord = ordersHistory.find(o => o.id == id);
    if (ord) { 
        ord.status = newStatus; 
        saveToStorage(); 
        if (newStatus === 'En préparation') printOrderTicket(id);
        showToast("Statut mis à jour"); 
        updateClientTrackerBanner();
        updateAdminDashboard();
    }
}

// في ملف admin.js
function openAdminModal() {
    if (isAdminLoggedIn) {
        document.getElementById('orderNotificationBadge').classList.add('hidden');
        
        // استدعاء جلب الطلبات من فايربيز قبل التحديث
        if (typeof window.fetchOrdersFromFirebase === 'function') {
            window.fetchOrdersFromFirebase().then(() => {
                updateAdminDashboard();
            });
        } else {
             updateAdminDashboard();
        }

        const modal = document.getElementById('adminModal');
        const content = document.getElementById('adminModalContent');
        modal.classList.remove('hidden');
        setTimeout(() => { modal.classList.remove('opacity-0'); content.classList.remove('scale-95'); }, 10);
        document.body.style.overflow = 'hidden';
    } else {
        const modal = document.getElementById('adminLoginModal');
        const content = document.getElementById('adminLoginModalContent');
        modal.classList.remove('hidden');
        setTimeout(() => { modal.classList.remove('opacity-0'); content.classList.remove('scale-95'); }, 10);
        document.getElementById('adminPasswordInput').value = '';
        document.getElementById('adminPasswordInput').focus();
        document.body.style.overflow = 'hidden';
    }
}

function closeAdminLoginModal() {
    const modal = document.getElementById('adminLoginModal');
    const content = document.getElementById('adminLoginModalContent');
    modal.classList.add('opacity-0');
    content.classList.add('scale-95');
    setTimeout(() => { modal.classList.add('hidden'); document.body.style.overflow = 'auto'; }, 300);
}

// الكود الجديد للدخول اللي يكلم فايربيز مباشرة / Le nouveau code de connexion qui parle directement à Firebase
window.verifyAdminPassword = async function(e) {
    e.preventDefault();
    
    // الإيميل اللي حطيته في فايربيز بالخطوة 2 / L'email que vous avez mis dans Firebase à l'étape 2
    const email = "admin@clubcafe.com"; 
    const pass = document.getElementById('adminPasswordInput').value;
    
    try {
        // محاولة تسجيل الدخول الرسمية / Tentative de connexion officielle
        await signInWithEmailAndPassword(auth, email, pass);
        isAdminLoggedIn = true;
        closeAdminLoginModal();
        alert("🔓 تم الدخول بنجاح! / Connexion réussie !");
        document.getElementById('masterSettingsBtn').classList.remove('hidden');
        openAdminModal();
    } catch (error) {
        console.error(error);
        alert("❌ الباسورد غلط أو الحساب مو موجود! / Mot de passe incorrect ou compte introuvable !");
        document.getElementById('adminPasswordInput').value = '';
    }
};

function openAdminSettingsModal() {
    const modal = document.getElementById('adminSettingsModal');
    const content = document.getElementById('adminSettingsModalContent');
    modal.classList.remove('hidden');
    setTimeout(() => { modal.classList.remove('opacity-0'); content.classList.remove('scale-95'); }, 10);
    document.getElementById('masterKeyInput').value = '';
    document.getElementById('newAdminPasswordInput').value = '';
}

function closeAdminSettingsModal() {
    const modal = document.getElementById('adminSettingsModal');
    const content = document.getElementById('adminSettingsModalContent');
    modal.classList.add('opacity-0');
    content.classList.add('scale-95');
    setTimeout(() => { modal.classList.add('hidden'); }, 300);
}

function updateAdminPassword(e) {
    e.preventDefault();
    const masterKey = document.getElementById('masterKeyInput').value.trim();
    const newPass = document.getElementById('newAdminPasswordInput').value.trim();
    const SECRET_MASTER_KEY = "mohamed2026";
    if (masterKey !== SECRET_MASTER_KEY) { alert("❌ Code secret master incorrect !"); return; }
    if (newPass.length < 4) { alert("Le mot de passe doit contenir au moins 4 caractères."); return; }
    currentAdminPassword = newPass;
    saveToStorage();
    closeAdminSettingsModal();
    showToast("🔒 Mot de passe mis à jour avec succès !");
}

function logoutAdmin() {
    isAdminLoggedIn = false;
    closeAdminModal();
    showToast("🔒 Déconnecté du dashboard");
}

function closeAdminModal() {
    const modal = document.getElementById('adminModal');
    const content = document.getElementById('adminModalContent');
    modal.classList.add('opacity-0');
    content.classList.add('scale-95');
    setTimeout(() => { modal.classList.add('hidden'); document.body.style.overflow = 'auto'; }, 300);
}

// Modal Click Outside Listeners
window.addEventListener('click', function(e) {
    const categoryDetailModal = document.getElementById('categoryDetailModal');
    const customizationModal = document.getElementById('customizationModal');
    const cartModal = document.getElementById('cartModal');
    const favoritesModal = document.getElementById('favoritesModal');
    const adminModal = document.getElementById('adminModal');
    const adminLoginModal = document.getElementById('adminLoginModal');
    const adminSettingsModal = document.getElementById('adminSettingsModal');
    const clientAllergensModal = document.getElementById('clientAllergensModal');

    if (e.target === categoryDetailModal) closeCategoryModal();
    if (e.target === customizationModal) closeCustomizationModal();
    if (e.target === cartModal) closeCartModal();
    if (e.target === favoritesModal) closeFavoritesModal();
    if (e.target === adminModal) closeAdminModal();
    if (e.target === adminLoginModal) closeAdminLoginModal();
    if (e.target === adminSettingsModal) closeAdminSettingsModal();
    if (e.target === clientAllergensModal) closeClientAllergensModal();
});

// تحديث لوحة التحكم تلقائياً كل دقيقة لتحديث أوقات الطلبات، وتنبيهات التأخر الصوتية والبصرية
setInterval(() => {
    if (isAdminLoggedIn && typeof updateAdminDashboard === 'function') {
        updateAdminDashboard();
    }
}, 60000);

// Fonction pour convertir l'image téléchargée en Base64
// MODIFICATION : Remplacement de window.convertImageToBase64 par la fonction ci-dessous
// L'écouteur d'événement est attaché directement à l'input file si l'élément existe.
const fileInput = document.getElementById('hiddenCatFile');
if (fileInput) {
    fileInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(loadEvent) {
            const base64String = loadEvent.target.result;
            const imgInput = document.getElementById('newCatImg');
            if (imgInput) {
                imgInput.value = base64String;
                console.log("✅ Image convertie en Base64 avec succès !");
            }
        };
        reader.readAsDataURL(file);
    });
}
// دالة مركزية لحفظ كافة بيانات لوحة التحكم والموقع في فايربيز تلقائياً
// دالة مزامنة شاملة ومتقدمة تغطي كافة جداول وأقسام لوحة التحكم في فايربيز
async function syncEverythingToFirebase() {
    try {
        // 1. مزامنة المنتجات والمنيو
        if (menuItems && menuItems.length > 0) {
            await addDoc(collection(db, "menu"), {
                items: menuItems,
                updatedAt: serverTimestamp()
            });
        }

        // 2. مزامنة التصنيفات
        if (categories && categories.length > 0) {
            await addDoc(collection(db, "categories"), {
                list: categories,
                updatedAt: serverTimestamp()
            });
        }

        // 3. مزامنة العروض
        if (formules && formules.length > 0) {
            await addDoc(collection(db, "formules"), {
                list: formules,
                updatedAt: serverTimestamp()
            });
        }

        // 4. مزامنة الفلاتر الغذائية
        if (dietaryFilters && dietaryFilters.length > 0) {
            await addDoc(collection(db, "diets"), {
                list: dietaryFilters,
                updatedAt: serverTimestamp()
            });
        }

        // 5. مزامنة الطلبات
        if (ordersHistory && ordersHistory.length > 0) {
            await addDoc(collection(db, "ordersHistory"), {
                history: ordersHistory,
                updatedAt: serverTimestamp()
            });
        }

        // 6. مزامنة أعمدة مصفوفة الحساسية
        if (matrixColumns && matrixColumns.length > 0) {
            await addDoc(collection(db, "matrixColumns"), {
                columns: matrixColumns,
                updatedAt: serverTimestamp()
            });
        }

        // 7. مزامنة صفوف مصفوفة الحساسية
        if (matrixRows && matrixRows.length > 0) {
            await addDoc(collection(db, "matrixRows"), {
                rows: matrixRows,
                updatedAt: serverTimestamp()
            });
        }

        // 8. مزامنة السلة النشطة والمفضلة للعملاء (Panier & Favoris)
        if ((cart && cart.length > 0) || (favorites && favorites.length > 0)) {
            await addDoc(collection(db, "clientState"), {
                cart: cart || [],
                favorites: favorites || [],
                updatedAt: serverTimestamp()
            });
        }

        console.log("☁️ تم مزامنة وتنظيم كافة أقسام المقهى بما فيها السلة والمفضلة في فايربيز بنجاح!");
    } catch (error) {
        console.error("Erreur Sync Firebase:", error);
    }
}
// --- ربط الدوال بالـ window لتعمل مع أزرار HTML ---
// --- Rendre les fonctions globales pour les boutons HTML ---
window.openAdminModal = openAdminModal;
window.closeAdminModal = closeAdminModal;
window.closeAdminLoginModal = closeAdminLoginModal;
window.openAdminSettingsModal = openAdminSettingsModal;
window.closeAdminSettingsModal = closeAdminSettingsModal;
window.updateAdminPassword = updateAdminPassword;
window.logoutAdmin = logoutAdmin;
window.debouncedFilterMenu = debouncedFilterMenu;
window.switchAdminTab = switchAdminTab;
window.toggleRushHour = toggleRushHour;
window.exportDatabaseJSON = exportDatabaseJSON;
window.importDatabaseJSON = importDatabaseJSON;
window.exportCSVReport = exportCSVReport;
window.saveCategory = saveCategory;
window.editCategory = editCategory;
window.deleteCategory = deleteCategory;
window.resetCategoryForm = resetCategoryForm;
window.addAddonToCategory = addAddonToCategory;
window.toggleCategoryAddonStatus = toggleCategoryAddonStatus;
window.removeAddonFromCategory = removeAddonFromCategory;
window.saveFormule = saveFormule;
window.saveProductHierarchical = saveProductHierarchical;
window.saveDietaryFilterForm = saveDietaryFilterForm;
window.matrixSaveRow = matrixSaveRow;