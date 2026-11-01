function playNewOrderSound() {
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

function triggerFlashPromo() {
    localStorage.setItem('club_cafe_flash_promo', 'true');
    showToast("⚡ تم إرسال عرض الفلاش للزباين بنجاح!");
    checkFlashPromoStatus();
}

function checkFlashPromoStatus() {
    const isPromoOn = localStorage.getItem('club_cafe_flash_promo') === 'true';
    const promoBanner = document.getElementById('flashPromoClientBanner');
    if (isPromoOn && promoBanner) {
        promoBanner.classList.remove('hidden');
    } else if (promoBanner) {
        promoBanner.classList.add('hidden');
    }
}

function applyFlashPromo() {
    flashDiscountActive = true;
    localStorage.removeItem('club_cafe_flash_promo');
    document.getElementById('flashPromoClientBanner').classList.add('hidden');
    showToast("🎉 تم تطبيق خصم 10% على سلتك بنجاح!");
    updateCartUI();
}

function updateFavoritesUI() {
    const container = document.getElementById('favoritesItemsContainer');
    const badge = document.getElementById('favBadge');
    if (!container || !badge) return;
    if (favorites.length > 0) { badge.innerText = favorites.length; badge.classList.remove('hidden'); }
    else badge.classList.add('hidden');

    const favItems = menuItems.filter(i => favorites.includes(i.id));
    if (favItems.length === 0) {
        container.innerHTML = `<div class="text-center text-slate-400 py-10"><i class="fa-solid fa-heart text-4xl mb-2 opacity-30"></i><p>Aucun favori pour le moment</p></div>`;
    } else {
        container.innerHTML = favItems.map(item => `
            <div class="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 transition hover:shadow-sm">
                <div class="flex items-center gap-3">
                    <img src="${item.img}" loading="lazy" class="w-12 h-12 rounded-lg object-cover">
                    <div><h4 class="text-xs font-bold text-slate-800">${item.name}</h4><p class="text-xs text-burgundy-800 font-black">${Number(item.price).toFixed(2)} €</p></div>
                </div>
                <button onclick="openCustomizationModal(${item.id}); closeFavoritesModal();" class="px-3 py-1.5 bg-burgundy-800 text-amber-300 rounded-lg text-xs font-bold transition hover:scale-105">Ajouter</button>
            </div>
        `).join('');
    }
}

function updateCartUI() {
    const badge = document.getElementById('cartBadge');
    const container = document.getElementById('cartItemsContainer');
    const totalEl = document.getElementById('cartTotal');
    if (!container || !badge || !totalEl) return;
    const totalQty = cart.reduce((acc, i) => acc + i.qty, 0);
    let totalPrice = cart.reduce((acc, i) => acc + (i.price * i.qty), 0);

    if (totalQty > 0) { badge.innerText = totalQty; badge.classList.remove('hidden'); }
    else badge.classList.add('hidden');

    if (cart.length === 0) {
        container.innerHTML = `<div class="text-center text-slate-400 py-10"><i class="fa-solid fa-basket-shopping text-4xl mb-2 opacity-30"></i><p>Votre panier est vide</p></div>`;
    } else {
        container.innerHTML = cart.map((item, index) => `
            <div class="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 transition hover:shadow-sm">
                <img src="${item.img}" loading="lazy" class="w-12 h-12 rounded-lg object-cover">
                <div class="flex-grow"><h4 class="text-xs font-bold text-slate-800">${item.name}</h4><p class="text-xs text-burgundy-800 font-black">${Number(item.price).toFixed(2)} €</p></div>
                <div class="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-slate-200">
                    <button onclick="changeQty(${index}, -1)" class="text-xs text-slate-500 font-bold px-1 transition hover:scale-110">-</button>
                    <span class="text-xs font-bold">${item.qty}</span>
                    <button onclick="changeQty(${index}, 1)" class="text-xs text-slate-500 font-bold px-1 transition hover:scale-110">+</button>
                </div>
            </div>
        `).join('');
    }
    if (flashDiscountActive) {
        totalEl.innerHTML = `<span class="line-through text-xs text-slate-400 mr-2">${(totalPrice / 0.90).toFixed(2)} €</span> <span class="text-emerald-700">${totalPrice.toFixed(2)} € (-10%)</span>`;
    } else {
        totalEl.innerText = totalPrice.toFixed(2) + " €";
    }
    if (typeof updateClientsTabUI === 'function') updateClientsTabUI();
}

function changeQty(index, delta) {
    const cartItem = cart[index];
    if (cartItem.isFormule) {
        const f = formules.find(item => item.id === cartItem.id);
        if (delta > 0 && f && !f.infinite) {
            if (cartItem.qty + 1 > f.stock) {
                alert(`⚠️ عذراً، المخزون المتوفر لهذا العرض هو ${f.stock} فقط.`);
                return;
            }
        }
    } else {
        const product = menuMap.get(cartItem.id);
        if (delta > 0 && product && !product.infinite) {
            if (cartItem.qty + 1 > product.stock) {
                alert(`⚠️ عذراً، الكمية المتوفرة في المخزون هي ${product.stock} فقط.`);
                return;
            }
        }
    }
    cart[index].qty += delta;
    if (cart[index].qty <= 0) cart.splice(index, 1);
    saveToStorage();
    updateCartUI();
}

function submitOrderInternal(e) {
    e.preventDefault();
    if (isRushHour) { alert("⚠️ Désolé, le café est en heure de pointe."); return; }
    if (cart.length === 0) return;

    const clientName = document.getElementById('clientNameInput').value.trim();
    if (!clientName) { alert("Veuillez entrer votre nom."); document.getElementById('clientNameInput').focus(); return; }

    cart.forEach(cartItem => {
        if (cartItem.isFormule) {
            const f = formules.find(item => item.id === cartItem.id);
            if (f && !f.infinite) f.stock = Math.max(0, f.stock - cartItem.qty);
        } else {
            const product = menuMap.get(cartItem.id);
            if (product && !product.infinite) product.stock = Math.max(0, product.stock - cartItem.qty);
        }
    });

    const totalPrice = cart.reduce((acc, i) => acc + (i.price * i.qty), 0);
    let lastOrderSeq = parseInt(localStorage.getItem('club_cafe_order_seq') || '0') + 1;
    localStorage.setItem('club_cafe_order_seq', lastOrderSeq);
    const newOrderId = String(lastOrderSeq).padStart(3, '0');

    const newOrder = {
        id: newOrderId,
        client: clientName,
        table: 'Comptoir',
        timestamp: Date.now(),
        date: new Date().toLocaleTimeString(),
        items: [...cart],
        total: totalPrice,
        status: 'En attente de paiement'
    };

    ordersHistory.push(newOrder);
    localStorage.setItem('club_cafe_my_last_order', JSON.stringify(newOrder));
    localStorage.removeItem('club_cafe_dismissed_order');

    saveToStorage();
    playNewOrderSound();
    document.getElementById('orderNotificationBadge').classList.remove('hidden');
    cart = [];
    flashDiscountActive = false;
    saveToStorage();
    updateCartUI();
    closeCartModal();
    document.getElementById('checkoutForm').reset();
    showToast("✅ Commande envoyée !");
    updateClientTrackerBanner();
    renderFormulesGrid();
}