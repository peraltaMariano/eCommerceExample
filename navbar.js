const CART_STORAGE_KEY = 'cartItems';

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

async function renderNavbar() {
	const navbarRoot = document.getElementById('navbar-root');

	if (!navbarRoot) return;

	try {
		const response = await fetch('navbar.json');
		if (!response.ok) {
			throw new Error(`Failed to load navbar.json: ${response.status}`);
		}

		const navbarData = await response.json();
		const linksMarkup = (navbarData.links || [])
			.map((link) => `<li><a href="${link.href}">${link.label}</a></li>`)
			.join('');
		const favoritesMarkup = `
			<li class="favorites-item">
				<a href="favoritos.html" aria-label="Favorites">
					<img src="favorites.svg" alt="Favorites">
				</a>
			</li>
		`;
		const cartMarkup = `
			<li class="cart-item">
				<a href="cart.html" aria-label="Cart">
					<img src="Cart.svg" alt="Cart">
					<span id="cart-count-badge" class="cart-count-badge hidden" aria-live="polite">0</span>
				</a>
			</li>
		`;

		navbarRoot.innerHTML = `
<header>
	<div class="logo-section">
		<img src="${navbarData.brand.logo}" alt="${navbarData.brand.logoAlt}">
		<h1>${navbarData.brand.title}</h1>
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

	document.dispatchEvent(new CustomEvent('navbar:rendered'));
}

document.addEventListener('DOMContentLoaded', () => {
	renderNavbar();
});

document.addEventListener('cart:updated', () => {
	updateCartBadge();
});
