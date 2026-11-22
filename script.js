// ─── AUTH HELPERS ────────────────────────────────────────────────────────────

const USERS_KEY = 'bpit_users';
const SESSION_KEY = 'bpit_session';

function getUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [
        // default demo account
        { email: 'student@bpitindia.edu.in', password: '1234', name: 'Demo Student' }
    ];
}

function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getSession() {
    return JSON.parse(localStorage.getItem(SESSION_KEY)) || null;
}

function setSession(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function clearSession() {
    localStorage.removeItem(SESSION_KEY);
}

function isLoggedIn() {
    return getSession() !== null;
}

// ─── NAV: show Login or Logout dynamically ───────────────────────────────────

function updateNav() {
    const loginLink = document.getElementById('navLogin');
    const logoutLink = document.getElementById('navLogout');
    if (!loginLink) return;

    if (isLoggedIn()) {
        loginLink.style.display = 'none';
        if (logoutLink) logoutLink.style.display = 'inline-block';
    } else {
        loginLink.style.display = 'inline-block';
        if (logoutLink) logoutLink.style.display = 'none';
    }
}

function logout() {
    clearSession();
    window.location.href = 'login.html';
}

// ─── ROUTE GUARD: redirect to login if not authenticated ─────────────────────

function requireAuth() {
    if (!isLoggedIn()) {
        window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.pathname.split('/').pop());
    }
}

// ─── LOGIN PAGE ──────────────────────────────────────────────────────────────

function initLogin() {
    // If already logged in, go home
    if (isLoggedIn()) { window.location.href = 'index.html'; return; }

    const form = document.getElementById('loginForm');
    const registerLink = document.getElementById('registerLink');
    const formTitle = document.getElementById('formTitle');
    const submitBtn = document.getElementById('submitBtn');
    const toggleMsg = document.getElementById('toggleMsg');
    const errorMsg = document.getElementById('errorMsg');

    let isRegisterMode = false;

    if (registerLink) {
        registerLink.addEventListener('click', function (e) {
            e.preventDefault();
            isRegisterMode = !isRegisterMode;
            if (isRegisterMode) {
                formTitle.textContent = 'Create Account';
                submitBtn.textContent = 'Register';
                registerLink.textContent = 'Already have an account? Login';
                toggleMsg.textContent = 'Register with your BPIT email';
            } else {
                formTitle.textContent = 'Login';
                submitBtn.textContent = 'Sign In';
                registerLink.textContent = "Don't have an account? Register";
                toggleMsg.textContent = 'Login using your student ID';
            }
        });
    }

    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            errorMsg.textContent = '';
            const email = document.getElementById('username').value.trim().toLowerCase();
            const password = document.getElementById('password').value;

            if (!email.endsWith('@bpitindia.edu.in')) {
                errorMsg.textContent = '⚠ Please use your BPIT email (@bpitindia.edu.in)';
                return;
            }

            const users = getUsers();

            if (isRegisterMode) {
                if (users.find(u => u.email === email)) {
                    errorMsg.textContent = '⚠ An account with this email already exists.';
                    return;
                }
                const name = email.split('@')[0];
                users.push({ email, password, name });
                saveUsers(users);
                setSession({ email, name });
            } else {
                const user = users.find(u => u.email === email && u.password === password);
                if (!user) {
                    errorMsg.textContent = '⚠ Invalid email or password.';
                    return;
                }
                setSession({ email: user.email, name: user.name });
            }

            // redirect back if came from a protected page
            const params = new URLSearchParams(window.location.search);
            const redirect = params.get('redirect') || 'index.html';
            window.location.href = redirect;
        });
    }
}

// ─── SELL PAGE ───────────────────────────────────────────────────────────────

function initSell() {
    requireAuth();
    updateNav();

    const form = document.getElementById('sellForm');
    const msg = document.getElementById('sellMsg');
    if (!form) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        const item = {
            name: document.getElementById('itemName').value,
            category: document.getElementById('itemCategory').value,
            description: document.getElementById('itemDesc').value,
            condition: document.getElementById('itemCondition').value,
            price: document.getElementById('itemPrice').value,
            contact: document.getElementById('itemContact').value,
            seller: getSession().email,
            id: Date.now()
        };

        const listings = JSON.parse(localStorage.getItem('bpit_listings') || '[]');
        listings.push(item);
        localStorage.setItem('bpit_listings', JSON.stringify(listings));

        msg.textContent = '✅ Item posted successfully!';
        msg.style.color = '#2d5f5e';
        form.reset();
        setTimeout(() => msg.textContent = '', 3000);
    });
}

// ─── WISHLIST PAGE ───────────────────────────────────────────────────────────

function initWishlist() {
    requireAuth();
    updateNav();
    renderWishlist();
}

function getWishlistItems() {
    return JSON.parse(localStorage.getItem('bpit_wishlist') || '[]');
}

function saveWishlistItems(items) {
    localStorage.setItem('bpit_wishlist', JSON.stringify(items));
}

function renderWishlist() {
    const grid = document.getElementById('wishlistGrid');
    const totalEl = document.getElementById('wishlistTotal');
    if (!grid) return;

    const items = getWishlistItems();
    grid.innerHTML = '';

    if (items.length === 0) {
        grid.innerHTML = '<p style="text-align:center;color:#4a8080;grid-column:1/-1;padding:40px;">Your wishlist is empty. <a href="explore.html" style="color:#2d5f5e;font-weight:600;">Browse items →</a></p>';
        if (totalEl) totalEl.textContent = '0';
        return;
    }

    let total = 0;
    items.forEach(item => {
        total += parseInt(item.price);
        const card = document.createElement('div');
        card.className = 'wishlist-card';
        card.innerHTML = `
            <img src="${item.img}" onerror="this.src='images/notes.png'" alt="${item.name}">
            <h3>${item.name}</h3>
            <p class="price">₹${item.price}</p>
            <button class="negotiate-price-btn" onclick="negotiateItem(${item.id}, '${item.name}', ${item.price})">Negotiate Price</button>
            <button class="remove-btn" onclick="removeFromWishlist(${item.id})">Remove</button>
        `;
        grid.appendChild(card);
    });

    if (totalEl) totalEl.textContent = total;
}

function removeFromWishlist(id) {
    let items = getWishlistItems();
    items = items.filter(i => i.id !== id);
    saveWishlistItems(items);
    renderWishlist();
}

function negotiateItem(id, name, price) {
    const offer = prompt(`Enter your offer for "${name}" (listed at ₹${price}):`);
    if (offer && !isNaN(offer)) {
        alert(`✅ Offer of ₹${offer} submitted for "${name}"! The seller will be notified.`);
    }
}

// ─── EXPLORE PAGE ────────────────────────────────────────────────────────────

function initExplore() {
    updateNav();

    // Build master product list combining static + user-listed items
    const staticItems = [
        { id: 1, name: 'Notes & PYQs', category: 'notes', price: 100, img: 'images/notes.png', desc: 'Notes and PYQs of 1st year.' },
        { id: 2, name: 'Scientific Calculator', category: 'tools', price: 400, img: 'images/calculator.jpg', desc: 'Casio MS991 in good condition.' },
        { id: 3, name: 'Drafter', category: 'tools', price: 150, img: 'images/drafter.jpg', desc: 'Complete engineering drafter set.' },
        { id: 4, name: 'Sheet Holder', category: 'tools', price: 90, img: 'images/sheet holder.jpg', desc: 'Sheet holder in good condition.' },
        { id: 5, name: 'All EG Tools', category: 'tools', price: 100, img: 'images/eg tools.jpg', desc: 'Compass, pencils etc.' },
        { id: 6, name: 'Lab Coat', category: 'clothing', price: 100, img: 'images/labcoat.jpg', desc: 'White lab coat, size L.' },
        { id: 7, name: 'Apron', category: 'clothing', price: 80, img: 'images/apron.jpg', desc: 'Blue apron, size L.' },
    ];
    const userListings = JSON.parse(localStorage.getItem('bpit_listings') || '[]');
    const allItems = [...staticItems, ...userListings];

    const grid = document.getElementById('productGrid');
    if (!grid) return;

    // Store items by id for easy lookup in event delegation
    const itemMap = {};

    function renderGrid(items) {
        grid.innerHTML = '';
        if (items.length === 0) {
            grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#4a8080;padding:40px;">No items found.</p>';
            return;
        }
        items.forEach(item => {
            itemMap[item.id] = item;
            const card = document.createElement('div');
            card.className = 'card';
            card.dataset.category = item.category;
            card.dataset.price = item.price;
            const inWishlist = isInWishlist(item.id);
            card.innerHTML = `
                <img src="${item.img}" onerror="this.src='images/notes.png'" alt="${item.name}">
                <h3>${item.name}</h3>
                <p class="price">₹${item.price}</p>
                <div class="card-buttons">
                    <button class="view-btn" data-id="${item.id}">View</button>
                    <button class="wishlist-btn ${inWishlist ? 'active' : ''}" data-id="${item.id}">
                        ${inWishlist ? '♥' : '♡'}
                    </button>
                </div>
            `;
            grid.appendChild(card);
        });
        updateWishlistCount();
    }

    // Single event listener on grid — no inline onclick needed
    grid.addEventListener('click', function(e) {
        const wishBtn = e.target.closest('.wishlist-btn');
        const viewBtn = e.target.closest('.view-btn');

        if (wishBtn) {
            const id = parseInt(wishBtn.dataset.id);
            const item = itemMap[id];
            if (!item) return;
            toggleWishlist(wishBtn, item);
        }

        if (viewBtn) {
            const id = parseInt(viewBtn.dataset.id);
            const item = itemMap[id];
            if (!item) return;
            openModal(item.name, '₹' + item.price, item.desc || '');
        }
    });

    function getFiltered() {
        const search = document.getElementById('searchInput').value.toLowerCase();
        const cat = document.getElementById('categoryFilter').value;
        const sort = document.getElementById('priceSort').value;

        let filtered = allItems.filter(item => {
            const matchSearch = item.name.toLowerCase().includes(search);
            const matchCat = cat === 'all' || item.category === cat;
            return matchSearch && matchCat;
        });

        if (sort === 'low') filtered.sort((a, b) => a.price - b.price);
        if (sort === 'high') filtered.sort((a, b) => b.price - a.price);
        return filtered;
    }

    document.getElementById('searchInput').addEventListener('input', () => renderGrid(getFiltered()));
    document.getElementById('categoryFilter').addEventListener('change', () => renderGrid(getFiltered()));
    document.getElementById('priceSort').addEventListener('change', () => renderGrid(getFiltered()));

    renderGrid(allItems);
}

function isInWishlist(id) {
    return getWishlistItems().some(i => i.id === id);
}

function toggleWishlist(btn, item) {
    if (!isLoggedIn()) {
        if (confirm('You need to be logged in to save items. Go to login?')) {
            window.location.href = 'login.html?redirect=explore.html';
        }
        return;
    }
    let items = getWishlistItems();
    if (isInWishlist(item.id)) {
        items = items.filter(i => i.id !== item.id);
        btn.classList.remove('active');
        btn.innerHTML = '♡';
    } else {
        items.push(item);
        btn.classList.add('active');
        btn.innerHTML = '♥';
    }
    saveWishlistItems(items);
    updateWishlistCount();
}

function updateWishlistCount() {
    const el = document.getElementById('wishlistCount');
    if (el) el.textContent = getWishlistItems().length;
}

function openModal(title, price, desc) {
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalPrice').innerText = price;
    document.getElementById('modalDesc').innerText = desc;
    document.getElementById('modal').classList.add('show');
}

function closeModal() {
    document.getElementById('modal').classList.remove('show');
}

// ─── INDEX PAGE ──────────────────────────────────────────────────────────────

function initIndex() {
    updateNav();
}

// ─── AUTO INIT based on page ──────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function () {
    const page = window.location.pathname.split('/').pop() || 'index.html';
    if (page === 'login.html') initLogin();
    else if (page === 'sell.html') initSell();
    else if (page === 'wishlist.html') initWishlist();
    else if (page === 'explore.html') initExplore();
    else initIndex();
});
