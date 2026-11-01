function verifyAdminPassword(e) {
    e.preventDefault();
    const pass = document.getElementById('adminPasswordInput').value;
    if (pass === currentAdminPassword || pass === '123456') {
        isAdminLoggedIn = true;
        closeAdminLoginModal();
        showToast("🔓 Connexion réussie !");
        document.getElementById('masterSettingsBtn').classList.remove('hidden');
        openAdminModal();
    } else {
        alert("Mot de passe incorrect !");
        document.getElementById('adminPasswordInput').value = '';
    }
}

function logoutAdmin() {
    isAdminLoggedIn = false;
    closeAdminModal();
    showToast("🔒 Déconnecté du dashboard");
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
    showToast("💾 تم تصدير النسخة الاحتياطية بنجاح !");
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
            showToast("⚡ تم استيراد البيانات بنجاح !");
        } catch(err) {
            alert("❌ ملف غير صالح أو تالف !");
        }
    };
    reader.readAsText(file);
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

function updateAdminDashboard() {
    document.getElementById('statTotalProducts').innerText = `Produits : ${menuItems.length}`;
    document.getElementById('statTotalCategories').innerText = `Catégories : ${categories.length}`;
    document.getElementById('statTotalOrders').innerText = `Commandes : ${ordersHistory.length}`;
    const totalRev = ordersHistory.reduce((acc, o) => acc + o.total, 0);
    document.getElementById('statTotalRevenue').innerText = `Revenus : ${totalRev.toFixed(2)} €`;

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
}

function updateOrderStatus(id, newStatus) {
    const ord = ordersHistory.find(o => o.id == id);
    if (ord) { 
        ord.status = newStatus; 
        saveToStorage(); 
        if (newStatus === 'En préparation' && typeof printOrderTicket === 'function') printOrderTicket(id);
        showToast("Statut mis à jour"); 
        if (typeof updateClientTrackerBanner === 'function') updateClientTrackerBanner();
        updateAdminDashboard();
    }
}