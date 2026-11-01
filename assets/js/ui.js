// Function to show toast notification
function showToast(msg) {
    const toast = document.getElementById('toastNotification');
    if (!toast) return;
    document.getElementById('toastMessage').innerText = msg;
    toast.classList.remove('translate-y-24', 'opacity-0');
    setTimeout(() => toast.classList.add('translate-y-24', 'opacity-0'), 3000);
}

// Drag to Scroll functionality with performance optimizations
document.addEventListener('DOMContentLoaded', () => {
    const scrollableContainers = document.querySelectorAll('.overflow-x-auto');
    scrollableContainers.forEach(container => {
        let isDown = false; 
        let startX; 
        let scrollLeft;
        
        container.addEventListener('mousedown', (e) => {
            isDown = true; 
            container.classList.add('cursor-grabbing');
            startX = e.pageX - container.offsetLeft; 
            scrollLeft = container.scrollLeft;
        }, { passive: true });
        
        container.addEventListener('mouseleave', () => { 
            isDown = false; 
            container.classList.remove('cursor-grabbing'); 
        });
        
        container.addEventListener('mouseup', () => { 
            isDown = false; 
            container.classList.remove('cursor-grabbing'); 
        });
        
        container.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - container.offsetLeft;
            const walk = (x - startX) * 2;
            container.scrollLeft = scrollLeft - walk;
        });
    });
    
    // Initial UI Renders
    if (typeof renderCategoriesGrid === 'function') {
        renderCategoriesGrid();
        renderQuickCategoryPills();
        renderDietaryFiltersBar();
        renderSubDietaryBar();
        renderFormulesGrid();
    }
});

// Modal Global Click Listener
window.addEventListener('click', function(e) {
    const modals = [
        { el: document.getElementById('categoryDetailModal'), closeFunc: closeCategoryModal },
        { el: document.getElementById('customizationModal'), closeFunc: closeCustomizationModal },
        { el: document.getElementById('cartModal'), closeFunc: closeCartModal },
        { el: document.getElementById('favoritesModal'), closeFunc: closeFavoritesModal },
        { el: document.getElementById('adminModal'), closeFunc: closeAdminModal },
        { el: document.getElementById('adminLoginModal'), closeFunc: closeAdminLoginModal },
        { el: document.getElementById('adminSettingsModal'), closeFunc: closeAdminSettingsModal },
        { el: document.getElementById('clientAllergensModal'), closeFunc: closeClientAllergensModal }
    ];
    modals.forEach(modal => {
        if (modal.el && e.target === modal.el && typeof modal.closeFunc === 'function') {
            modal.closeFunc();
        }
    });
});

let searchTimeout;
function debouncedFilterMenu(val) { 
    clearTimeout(searchTimeout); 
    searchTimeout = setTimeout(() => filterMenu(), 300); 
}

function filterMenu() {
    const searchInput = document.getElementById('searchInput');
    const searchInputMobile = document.getElementById('searchInputMobile');
    const query = (searchInput ? searchInput.value.toLowerCase() : '') || (searchInputMobile ? searchInputMobile.value.toLowerCase() : '');
    if(!query) return;
    
    if (typeof menuMap !== 'undefined') {
        for(let [id, item] of menuMap) {
            if(item.name.toLowerCase().includes(query)) {
                if (typeof openCategoryModal === 'function') {
                    openCategoryModal(item.cat);
                }
                break;
            }
        }
    }
}

function renderCategoriesGrid() {
    const container = document.getElementById('categoriesGridContainer');
    if (!container || typeof categories === 'undefined') return;
    
    container.innerHTML = categories.map(cat => `
        <div onclick="openCategoryModal('${cat.id}')" class="h-36 sm:h-44 rounded-2xl shadow-md overflow-hidden relative group cursor-pointer border border-amber-300/30 hover:scale-105 transition duration-300 flex flex-col justify-end">
            <img src="${cat.img}" loading="lazy" class="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition duration-500">
            <div class="absolute inset-0 bg-gradient-to-t from-burgundy-900/80 via-transparent to-transparent"></div>
            <div class="relative p-3 sm:p-4 text-cream-100 flex flex-col justify-end">
                <h3 class="font-extrabold text-base sm:text-lg tracking-wide">${cat.fr}</h3>
                <span class="text-xs text-amber-300 font-semibold mt-1">Voir les produits <i class="fa-solid fa-arrow-up text-[10px]"></i></span>
            </div>
        </div>
    `).join('');
}

function renderQuickCategoryPills() {
    const pillsContainer = document.getElementById('quickCategoryPills');
    if (!pillsContainer || typeof categories === 'undefined') return;
    pillsContainer.innerHTML = categories.map(cat => `
        <button onclick="openCategoryModal('${cat.id}')" class="px-3.5 py-1.5 rounded-full bg-burgundy-900 text-cream-100 hover:bg-burgundy-700 text-xs font-bold shadow flex-shrink-0 transition flex items-center gap-1.5 hover:scale-105">
            <img src="${cat.img}" class="w-4 h-4 rounded-full object-cover">
            <span>${cat.fr}</span>
        </button>
    `).join('');
}

function renderDietaryFiltersBar() {
    const bar = document.getElementById('dietaryFiltersBar');
    if (!bar || typeof currentDietaryFilter === 'undefined' || typeof dietaryFilters === 'undefined') return;
    let html = `<button onclick="filterDietary('all')" class="px-4 py-2 rounded-full ${currentDietaryFilter === 'all' ? 'bg-burgundy-800 text-amber-300 shadow' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'} text-xs font-bold flex-shrink-0 transition">🍽️ Tous</button>`;
    dietaryFilters.forEach(diet => {
        const isActive = currentDietaryFilter === diet.id;
        html += `<button onclick="filterDietary('${diet.id}')" class="px-4 py-2 rounded-full ${isActive ? 'bg-burgundy-800 text-amber-300 shadow' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'} text-xs font-bold flex-shrink-0 transition">${diet.fr}</button>`;
    });
    bar.innerHTML = html;
}

function renderSubDietaryBar() {
    const subBar = document.getElementById('subDietaryFiltersBar');
    if (!subBar || typeof currentDietaryFilter === 'undefined' || typeof dietaryFilters === 'undefined') return;
    const activeDiet = dietaryFilters.find(d => d.id === currentDietaryFilter);
    if (!activeDiet || !activeDiet.subOptions || activeDiet.subOptions.length === 0) {
        subBar.classList.add('hidden');
        subBar.innerHTML = '';
        return;
    }
    const activeSubOpts = activeDiet.subOptions.filter(sub => sub.enabled !== false);
    if (activeSubOpts.length === 0) {
        subBar.classList.add('hidden');
        subBar.innerHTML = '';
        return;
    }

    let html = `<button onclick="filterSubDietary('all')" class="px-3 py-1 rounded-full ${currentSubDietaryFilter === 'all' ? 'bg-burgundy-800 text-amber-300 shadow' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'} text-[11px] font-bold flex-shrink-0 transition">✨ Tous</button>`;
    activeSubOpts.forEach(sub => {
        const isSubActive = currentSubDietaryFilter === sub.name;
        html += `<button onclick="filterSubDietary('${sub.name}')" class="px-3 py-1 rounded-full ${isSubActive ? 'bg-burgundy-800 text-amber-300 shadow' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'} text-[11px] font-bold flex-shrink-0 transition">🔹 ${sub.name}</button>`;
    });
    subBar.innerHTML = html;
    subBar.classList.remove('hidden');
}

function renderFormulesGrid() {
    const container = document.getElementById('formulesGridContainer');
    if (!container || typeof formules === 'undefined') return;
    const availableFormules = formules.filter(f => f.infinite || (f.stock !== undefined ? f.stock > 0 : true));
    if (availableFormules.length === 0) {
        container.innerHTML = `<div class="col-span-2 text-center text-slate-400 py-4">Aucune offre disponible</div>`;
        return;
    }
    container.innerHTML = availableFormules.map(f => `
        <div class="min-w-[280px] sm:min-w-[340px] md:min-w-[420px] w-[300px] sm:w-[360px] md:w-[440px] bg-white rounded-2xl shadow-md border border-amber-200 overflow-hidden flex flex-col justify-between group hover:shadow-xl transition duration-300 flex-shrink-0">
            <div class="relative h-36 sm:h-40 bg-slate-100">
                <img src="${f.img}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
                <span class="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase">${f.badge}</span>
            </div>
            <div class="p-4 space-y-2 flex flex-col justify-between flex-grow">
                <div>
                    <h3 class="font-extrabold text-sm sm:text-base text-burgundy-900">${f.title}</h3>
                    <p class="text-xs text-slate-600 mt-1">${f.desc}</p>
                </div>
                <div class="flex items-center justify-between pt-2 border-t mt-2">
                    <span class="text-base sm:text-lg font-black text-burgundy-800">${Number(f.price).toFixed(2)} €</span>
                    <button onclick="addSpecialToCart('${f.title}', ${f.price}, '${f.img}', ${f.id})" class="px-3.5 py-1.5 bg-burgundy-800 text-amber-300 rounded-lg text-xs font-bold shadow transition hover:scale-105">
                        <i class="fa-solid fa-plus"></i> Ajouter
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function openCategoryModal(catId) {
    if (typeof categoriesMap === 'undefined') return;
    const cat = categoriesMap.get(catId);
    if (!cat) return;
    document.getElementById('modalCatTitle').innerText = cat.fr;
    document.getElementById('modalCatImg').src = cat.img;

    let catItems = menuItems.filter(i => i.cat === catId);
    if (currentDietaryFilter !== 'all') catItems = catItems.filter(i => i.diet === currentDietaryFilter);
    if (currentSubDietaryFilter !== 'all') catItems = catItems.filter(i => i.allergens && i.allergens.includes(currentSubDietaryFilter));

    const listContainer = document.getElementById('modalCatItemsList');
    if (catItems.length === 0) {
        listContainer.innerHTML = `<div class="text-center py-10 text-slate-400">Aucun produit trouvé</div>`;
    } else {
        listContainer.innerHTML = catItems.map(item => {
            const isAvailable = item.infinite || item.stock > 0;
            return `
                <div class="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm ${!isAvailable ? 'opacity-50 grayscale' : ''} transition hover:shadow-md">
                    <div class="flex items-center gap-3">
                        <img src="${item.img}" loading="lazy" class="w-14 h-14 rounded-lg object-cover">
                        <div>
                            <h4 class="font-bold text-slate-800 text-sm">${item.name} ${!isAvailable ? `<span class="text-red-600 text-[10px]">(Épuisé)</span>` : ''}</h4>
                            <p class="text-xs text-burgundy-800 font-black mt-1">${Number(item.price).toFixed(2)} €</p>
                        </div>
                    </div>
                    ${isAvailable ? `<button onclick="openCustomizationModal(${item.id})" class="px-3.5 py-2 bg-burgundy-800 hover:bg-burgundy-700 text-amber-300 rounded-lg text-xs font-bold shadow transition hover:scale-105"><i class="fa-solid fa-plus"></i> Ajouter</button>` : `<span class="px-3 py-1 bg-slate-200 text-slate-500 rounded-lg text-xs font-bold">Épuisé</span>`}
                </div>
            `;
        }).join('');
    }
    const modal = document.getElementById('categoryDetailModal');
    const sheet = document.getElementById('bottomSheet');
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        sheet.classList.remove('translate-y-full');
    }, 10);
    document.body.style.overflow = 'hidden';
}

function closeCategoryModal() {
    const modal = document.getElementById('categoryDetailModal');
    const sheet = document.getElementById('bottomSheet');
    modal.classList.add('opacity-0');
    sheet.classList.add('translate-y-full');
    setTimeout(() => {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }, 300);
}

function openCustomizationModal(itemId) {
    if (typeof menuMap === 'undefined') return;
    const item = menuMap.get(itemId);
    if (!item || (!item.infinite && item.stock <= 0)) return;
    currentCustomizingItem = item;
    document.getElementById('custItemName').innerText = item.name;
    document.getElementById('custItemBasePrice').innerText = Number(item.price).toFixed(2) + " €";
    document.getElementById('custModalImg').src = item.img;
    document.getElementById('customerItemNote').value = "";
    updateFavoriteHeartIcon();

    const tempSection = document.querySelector('input[name="temp"]').closest('.space-y-2');
    if (item.hasTemp) tempSection.style.display = 'block';
    else tempSection.style.display = 'none';

    const sizeSection = document.querySelector('input[name="size"]').closest('.space-y-2');
    if (item.hasSize) sizeSection.style.display = 'block';
    else sizeSection.style.display = 'none';

    const matchedDiet = dietaryFilters.find(d => d.id === item.diet);
    const nestedSection = document.getElementById('nestedDietaryOptionsSection');
    const nestedContainer = document.getElementById('nestedDietaryOptionsContainer');
    const nestedLabel = document.getElementById('nestedDietaryLabel');

    if (matchedDiet && matchedDiet.subOptions && matchedDiet.subOptions.length > 0) {
        const activeSubOpts = matchedDiet.subOptions.filter(sub => sub.enabled !== false);
        if (activeSubOpts.length > 0) {
            nestedLabel.innerText = `🥛 Choix (${matchedDiet.fr}) :`;
            nestedContainer.innerHTML = activeSubOpts.map((sub, idx) => `
                <label class="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs font-bold transition">
                    <div class="flex items-center gap-2">
                        <input type="radio" name="nestedDiet" value="${sub.name}" data-price="${sub.price || 0}" ${idx === 0 ? 'checked' : ''} class="w-4 h-4 text-burgundy-800"> <span>${sub.name}</span>
                    </div>
                    ${sub.price > 0 ? `<span class="text-burgundy-800 font-black">+${Number(sub.price).toFixed(2)} €</span>` : ''}
                </label>
            `).join('');
            nestedSection.classList.remove('hidden');
        } else {
            nestedSection.classList.add('hidden');
        }
    } else {
        nestedSection.classList.add('hidden');
    }

    const parentCat = categories.find(c => c.id === item.cat);
    const catAddons = parentCat && parentCat.allowedAddons ? parentCat.allowedAddons.filter(a => a.enabled !== false) : [];
    const addonsContainer = document.getElementById('dynamicAddonsContainer');
    if (catAddons.length > 0) {
        addonsContainer.innerHTML = catAddons.map(addonObj => {
            return `
                <label class="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                    <div class="flex items-center gap-3">
                        <input type="checkbox" name="addon" value="${addonObj.name}" data-price="${addonObj.price || 0}" class="w-4 h-4 text-burgundy-800 rounded">
                        <span class="text-xs font-bold text-slate-700">${addonObj.name}</span>
                    </div>
                    ${addonObj.price > 0 ? `<span class="text-xs font-black text-burgundy-800">+${Number(addonObj.price).toFixed(2)} €</span>` : ''}
                </label>
            `;
        }).join('');
        addonsContainer.closest('.space-y-3').style.display = 'block';
    } else {
        addonsContainer.innerHTML = '';
        addonsContainer.closest('.space-y-3').style.display = 'none';
    }

    updateCustomizationTotal();
    const modal = document.getElementById('customizationModal');
    const content = document.getElementById('customizationModalContent');
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        content.classList.remove('scale-95');
    }, 10);
    document.body.style.overflow = 'hidden';
}

function closeCustomizationModal() {
    const modal = document.getElementById('customizationModal');
    const content = document.getElementById('customizationModalContent');
    modal.classList.add('opacity-0');
    content.classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
        currentCustomizingItem = null;
        document.body.style.overflow = 'auto';
    }, 300);
}

function openCartModal() {
    const modal = document.getElementById('cartModal');
    const content = document.getElementById('cartModalContent');
    modal.classList.remove('hidden');
    setTimeout(() => { modal.classList.remove('opacity-0'); content.classList.remove('translate-x-full'); }, 10);
    document.body.style.overflow = 'hidden';
}

function closeCartModal() {
    const modal = document.getElementById('cartModal');
    const content = document.getElementById('cartModalContent');
    modal.classList.add('opacity-0');
    content.classList.add('translate-x-full');
    setTimeout(() => { modal.classList.add('hidden'); document.body.style.overflow = 'auto'; }, 300);
}

function openFavoritesModal() {
    updateFavoritesUI();
    const modal = document.getElementById('favoritesModal');
    const content = document.getElementById('favoritesModalContent');
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        content.classList.remove('translate-x-full');
    }, 10);
    document.body.style.overflow = 'hidden';
}

function closeFavoritesModal() {
    const modal = document.getElementById('favoritesModal');
    const content = document.getElementById('favoritesModalContent');
    modal.classList.add('opacity-0');
    content.classList.add('translate-x-full');
    setTimeout(() => {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }, 300);
}

function openAdminModal() {
    if (isAdminLoggedIn) {
        document.getElementById('orderNotificationBadge').classList.add('hidden');
        updateAdminDashboard();
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

function openClientAllergensModal() {
    const matrixHead = document.getElementById('clientMatrixHead');
    const matrixBody = document.getElementById('clientMatrixBody');
    if (matrixHead && matrixBody) {
        let headHtml = `<tr class="bg-cream-200 border-b-2 border-burgundy-800 font-black">
            <th class="p-2.5 border-r border-burgundy-800 text-left pl-4">Allergène</th>`;
        matrixColumns.forEach(col => {
            headHtml += `<th class="p-2.5 border-r border-burgundy-800 w-12">${col}</th>`;
        });
        headHtml += `</tr>`;
        matrixHead.innerHTML = headHtml;

        let bodyHtml = '';
        matrixRows.forEach((row, rIdx) => {
            bodyHtml += `<tr class="border-b border-burgundy-800/40 hover:bg-cream-100 transition">
                <td class="p-2.5 border-r border-burgundy-800/40 font-bold text-burgundy-900 text-left pl-4 flex items-center gap-2">
                    <span class="text-xs text-amber-600 font-extrabold">${String.fromCharCode(65 + rIdx)}</span> ${row.name}
                </td>`;
            matrixColumns.forEach((col, cIdx) => {
                const hasDot = row.dots && row.dots[cIdx];
                bodyHtml += `<td class="p-2.5 border-r border-burgundy-800/40">${hasDot ? '<i class="fa-solid fa-circle text-burgundy-900 text-xs"></i>' : ''}</td>`;
            });
            bodyHtml += `</tr>`;
        });
        matrixBody.innerHTML = bodyHtml;
    }

    const modal = document.getElementById('clientAllergensModal');
    const content = document.getElementById('clientAllergensModalContent');
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        content.classList.remove('scale-95');
    }, 10);
    document.body.style.overflow = 'hidden';
}

function closeClientAllergensModal() {
    const modal = document.getElementById('clientAllergensModal');
    const content = document.getElementById('clientAllergensModalContent');
    modal.classList.add('opacity-0');
    content.classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }, 300);
}
document.addEventListener("DOMContentLoaded", () => {
    if (typeof renderCategoriesGrid === 'function') renderCategoriesGrid();
    if (typeof renderFormulesGrid === 'function') renderFormulesGrid();
});
document.addEventListener("DOMContentLoaded", () => {
    if (typeof syncMaps === 'function') syncMaps();
    if (typeof renderCategoriesGrid === 'function') renderCategoriesGrid();
    if (typeof renderQuickCategoryPills === 'function') renderQuickCategoryPills();
    if (typeof renderDietaryFiltersBar === 'function') renderDietaryFiltersBar();
    if (typeof renderSubDietaryBar === 'function') renderSubDietaryBar();
    if (typeof renderFormulesGrid === 'function') renderFormulesGrid();
    if (typeof updateFavoritesUI === 'function') updateFavoritesUI();
    if (typeof updateCartUI === 'function') updateCartUI();
    if (typeof updateClientTrackerBanner === 'function') updateClientTrackerBanner();
    if (typeof checkFlashPromoStatus === 'function') checkFlashPromoStatus();
});