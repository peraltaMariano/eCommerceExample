const CART_STORAGE_KEY = 'cartItems';
const AUTH_LOGIN_KEY = 'isLoggedIn';
const AUTH_EMAIL_KEY = 'userEmail';
const AUTH_NAME_KEY = 'userName';
const SECTION_FOLDERS = ['categorias', 'cart', 'favoritos', 'login', 'home'];

function getRoutePrefix() {
	const path = window.location.pathname.toLowerCase().replace(/\\/g, '/');
	return SECTION_FOLDERS.some((folder) => path.includes(`/${folder}/`)) ? '../' : './';
}

function toProjectPath(path) {
	const prefix = getRoutePrefix();
	const normalizedPath = String(path || '').replace(/^((\.\.\/)|(\.\/))+/, '');
	return `${prefix}${normalizedPath}`;
}

function readCartItems() {
	try {
		const storedValue = localStorage.getItem(CART_STORAGE_KEY);
		if (!storedValue) return [];

		const parsedItems = JSON.parse(storedValue);
		if (!Array.isArray(parsedItems)) return [];

		return parsedItems.filter(
			(item) => item && typeof item.name === 'string' && Number.isInteger(item.quantity)
		);
	} catch (error) {
		console.error(error);
		return [];
	}
}

function saveCartItems(items) {
	localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

function getCartCount() {
	return readCartItems().reduce((total, item) => total + Math.max(0, item.quantity), 0);
}

function notifyCartUpdated() {
	document.dispatchEvent(new CustomEvent('cart:updated', { detail: { count: getCartCount() } }));
}

function addItemToCart(name, quantityToAdd, metadata = {}) {
	const quantity = Number.parseInt(quantityToAdd, 10);
	if (!name || Number.isNaN(quantity) || quantity <= 0) return;

	const items = readCartItems();
	const existingItem = items.find((item) => item.name === name);
	const nextImage = typeof metadata.image === 'string' ? metadata.image : '';
	const nextAlt = typeof metadata.alt === 'string' ? metadata.alt : '';
	const nextDescription = typeof metadata.description === 'string' ? metadata.description : '';
	const nextPrice = typeof metadata.price === 'string' ? metadata.price : '';

	if (existingItem) {
		existingItem.quantity += quantity;
		if (!existingItem.image && nextImage) existingItem.image = nextImage;
		if (!existingItem.alt && nextAlt) existingItem.alt = nextAlt;
		if (!existingItem.description && nextDescription) existingItem.description = nextDescription;
		if (!existingItem.price && nextPrice) existingItem.price = nextPrice;
	} else {
		items.push({
			name,
			quantity,
			image: nextImage,
			alt: nextAlt,
			description: nextDescription,
			price: nextPrice
		});
	}

	saveCartItems(items);
	notifyCartUpdated();
}

function removeOneFromCart(name) {
	if (!name) return;

	const items = readCartItems();
	const existingItem = items.find((item) => item.name === name);
	if (!existingItem) return;

	existingItem.quantity -= 1;
	const nextItems = items.filter((item) => item.quantity > 0);

	saveCartItems(nextItems);
	notifyCartUpdated();
}

function removeQuantityFromCart(name, quantityToRemove) {
	if (!name) return;

	const quantity = Number.parseInt(quantityToRemove, 10);
	if (Number.isNaN(quantity) || quantity <= 0) return;

	const items = readCartItems();
	const existingItem = items.find((item) => item.name === name);
	if (!existingItem) return;

	existingItem.quantity -= quantity;
	const nextItems = items.filter((item) => item.quantity > 0);

	saveCartItems(nextItems);
	notifyCartUpdated();
}

function removeAllOfKindFromCart(name) {
	if (!name) return;

	const nextItems = readCartItems().filter((item) => item.name !== name);
	saveCartItems(nextItems);
	notifyCartUpdated();
}

function setItemQuantity(name, nextQuantityValue) {
	if (!name) return;

	const nextQuantity = Number.parseInt(nextQuantityValue, 10);
	if (Number.isNaN(nextQuantity) || nextQuantity < 0) return;

	const items = readCartItems();
	const existingItem = items.find((item) => item.name === name);
	if (!existingItem) return;

	if (nextQuantity === 0) {
		const nextItems = items.filter((item) => item.name !== name);
		saveCartItems(nextItems);
		notifyCartUpdated();
		return;
	}

	existingItem.quantity = nextQuantity;
	saveCartItems(items);
	notifyCartUpdated();
}

function clearCart() {
	saveCartItems([]);
	notifyCartUpdated();
}

window.CartState = {
	readItems: readCartItems,
	getCount: getCartCount,
	addItem: addItemToCart,
	removeOne: removeOneFromCart,
	removeQuantity: removeQuantityFromCart,
	removeAllOfKind: removeAllOfKindFromCart,
	setQuantity: setItemQuantity,
	clear: clearCart
};

function updateCartBadge() {
	const badge = document.getElementById('cart-count-badge');
	if (!badge) return;

	const count = getCartCount();
	badge.textContent = String(count);
	badge.classList.toggle('hidden', count === 0);
}

function handleLogout(event) {
	if (event) event.preventDefault();

	localStorage.removeItem(AUTH_EMAIL_KEY);
	localStorage.removeItem(AUTH_NAME_KEY);
	localStorage.removeItem(AUTH_LOGIN_KEY);
	window.location.href = toProjectPath('Login/login.html');
}

function updateHeaderLoginStatus() {
	const isLoggedIn = localStorage.getItem(AUTH_LOGIN_KEY) === 'true';
	const loginLink = document.querySelector('a[data-login-link="true"]');

	if (!loginLink) return;

	const loginLi = loginLink.closest('li');
	if (!loginLi) return;

	const nav = loginLi.closest('ul');
	if (!nav) return;

	const existingUserItem = nav.querySelector('[data-auth-user-item]');
	const existingLogoutItem = nav.querySelector('[data-auth-logout-item]');

	if (existingUserItem) existingUserItem.remove();
	if (existingLogoutItem) existingLogoutItem.remove();

	if (!isLoggedIn) return;

	const userEmail = localStorage.getItem(AUTH_EMAIL_KEY) || 'User';
	const userLabel = userEmail.split('@')[0];
	const userItem = document.createElement('li');
	userItem.dataset.authUserItem = 'true';
	userItem.innerHTML = `<a href="#">${userLabel}</a>`;

	const logoutItem = document.createElement('li');
	logoutItem.dataset.authLogoutItem = 'true';
	logoutItem.innerHTML = `<a href="#" id="logoutBtn" class="logout-btn"><img src="${toProjectPath('Imagenes/logout.svg')}" alt="Logout"></a>`;

	loginLi.replaceWith(userItem);
	nav.appendChild(logoutItem);

	const logoutButton = document.getElementById('logoutBtn');
	if (logoutButton) {
		logoutButton.addEventListener('click', handleLogout);
	}
}

async function renderNavbar() {
	const navbarRoot = document.getElementById('navbar-root');

	if (!navbarRoot) return;

	try {
		const response = await fetch(toProjectPath('Navbar/navbar.json'));
		if (!response.ok) {
			throw new Error(`Failed to load navbar.json: ${response.status}`);
		}

		const navbarData = await response.json();
		const linksMarkup = (navbarData.links || [])
			.map((link) => {
				const isLoginLink = String(link.label || '').toLowerCase() === 'login';
				return `<li><a href="${toProjectPath(link.href)}"${isLoginLink ? ' data-login-link="true"' : ''}>${link.label}</a></li>`;
			})
			.join('');
		const favoritesMarkup = `
			<li class="favorites-item">
				<a href="${toProjectPath('Favoritos/favoritos.html')}" aria-label="Favorites">
					<img src="${toProjectPath('Imagenes/favorites.svg')}" alt="Favorites">
				</a>
			</li>
		`;
		const cartMarkup = `
			<li class="cart-item">
				<a href="${toProjectPath('Cart/cart.html')}" aria-label="Cart">
					<img src="${toProjectPath('Imagenes/Cart.svg')}" alt="Cart">
					<span id="cart-count-badge" class="cart-count-badge hidden" aria-live="polite">0</span>
				</a>
			</li>
		`;

		navbarRoot.innerHTML = `
<header>
	<div class="logo-section">
		<a class="logo-home-link" href="${toProjectPath('index.html')}" aria-label="Ir al inicio">
			<img src="${toProjectPath(navbarData.brand.logo)}" alt="${navbarData.brand.logoAlt}">
			<h1>${navbarData.brand.title}</h1>
		</a>
	</div>

	<nav>
		<ul>
			${linksMarkup}
			${favoritesMarkup}
			${cartMarkup}
		</ul>
	</nav>
</header>
		`;
	} catch (error) {
		console.error(error);
	}

	updateCartBadge();
	updateHeaderLoginStatus();

	document.dispatchEvent(new CustomEvent('navbar:rendered'));
}

document.addEventListener('DOMContentLoaded', () => {
	renderNavbar();
});

document.addEventListener('cart:updated', () => {
	updateCartBadge();
});

document.addEventListener('storage', (event) => {
	if (event.key === AUTH_LOGIN_KEY || event.key === AUTH_EMAIL_KEY || event.key === AUTH_NAME_KEY) {
		updateHeaderLoginStatus();
	}
});
