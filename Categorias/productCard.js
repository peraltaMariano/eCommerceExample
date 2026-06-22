const FAVORITES_STORAGE_KEY = 'favorites';

function readFavorites() {
	try {
		const storedValue = localStorage.getItem(FAVORITES_STORAGE_KEY);
		if (!storedValue) return [];

		const parsedItems = JSON.parse(storedValue);
		if (!Array.isArray(parsedItems)) return [];

		return parsedItems.filter((item) => item && typeof item.name === 'string');
	} catch (error) {
		console.error(error);
		return [];
	}
}

function saveFavorites(items) {
	localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(items));
}

function isFavorite(productName) {
	return readFavorites().some((item) => item.name === productName);
}

function toggleFavorite(product) {
	const favorites = readFavorites();
	const index = favorites.findIndex((item) => item.name === product.name);

	if (index >= 0) {
		favorites.splice(index, 1);
		saveFavorites(favorites);
		return false;
	}

	favorites.push({
		name: product.name,
		image: product.image || '',
		alt: product.alt || product.name,
		description: product.description || '',
		price: product.price || ''
	});
	saveFavorites(favorites);
	return true;
}

function createProductCard(product) {
	const favoriteClass = isFavorite(product.name) ? ' is-favorite' : '';
	const imageInner = product.image
		? `<img class="thumbnail" src="${product.image}" alt="${product.alt}">`
		: '';

	return `
		<div class="product-card">
			<div class="image-container">
				${imageInner}
				<button type="button" class="favorite-button${favoriteClass}" aria-label="Toggle favorite" aria-pressed="${isFavorite(product.name)}" data-product-name="${product.name}">
					<img src="../Imagenes/favorites.svg" alt="Favorite icon">
				</button>
			</div>
			<p class="product-name">${product.name}</p>
			<p class="product-description">${product.description}</p>
			<div class="product-actions-row">
				<p class="precio">${product.price}</p>
				<select class="qty-select" aria-label="Quantity selector">
					<option value="1">1</option>
					<option value="2">2</option>
					<option value="3">3</option>
					<option value="4">4</option>
					<option value="5">5</option>
					<option value="6">6</option>
				</select>
				<button type="button" class="add-button">Agregar</button>
			</div>
		</div>
	`;
}

function ShowAddModal() {
	let modal = document.getElementById('add-modal');
	if (modal) return modal;

	modal = document.createElement('div');
	modal.id = 'add-modal';
	modal.className = 'add-modal-overlay hidden';
	modal.innerHTML = `
		<div class="add-modal" role="dialog" aria-modal="true" aria-live="polite" aria-label="Agregado al carrito">
			<div class="add-modal-header">
				<div class="add-modal-title">Agregado al carrito!</div>
				<button type="button" class="add-modal-close" aria-label="Cerrar">×</button>
			</div>
			<div class="add-modal-body">
				<p class="add-modal-item"></p>
				<p class="add-modal-qty"></p>
				<button type="button" class="go-to-cart-button">Ir al carrito</button>
			</div>
		</div>
	`;
	document.body.appendChild(modal);
	const closeButton = modal.querySelector('.add-modal-close');
	const goToCartButton = modal.querySelector('.go-to-cart-button');
	closeButton.addEventListener('click', () => hideAddModal());
	goToCartButton.addEventListener('click', () => {
		window.location.href = '../Cart/cart.html';
	});
	modal.addEventListener('click', (event) => {
		if (event.target === modal) hideAddModal();
	});

	return modal;
}

function showAddModal(itemName, quantity) {
	const modal = ShowAddModal();
	const itemEl = modal.querySelector('.add-modal-item');
	const qtyEl = modal.querySelector('.add-modal-qty');

	itemEl.textContent = `${itemName}`;
	qtyEl.textContent = `Unidades: ${quantity}`;

	modal.classList.remove('hidden');
}

function hideAddModal() {
	const modal = document.getElementById('add-modal');
	if (!modal) return;

	modal.classList.add('hidden');
}



function wireAddButtons() {
	const container = document.getElementById('product-section-root');
	if (!container) return;

	container.addEventListener('click', (event) => {
		const favoriteButton = event.target.closest('.favorite-button');
		if (favoriteButton) {
			const card = favoriteButton.closest('.product-card');
			if (!card) return;

			const nameEl = card.querySelector('.product-name');
			const imageEl = card.querySelector('.thumbnail');
			const descriptionEl = card.querySelector('.product-description');
			const priceEl = card.querySelector('.precio');
			if (!nameEl) return;

			const product = {
				name: nameEl.textContent.trim(),
				image: imageEl ? imageEl.getAttribute('src') || '' : '',
				alt: imageEl ? imageEl.getAttribute('alt') || nameEl.textContent.trim() : nameEl.textContent.trim(),
				description: descriptionEl ? descriptionEl.textContent.trim() : '',
				price: priceEl ? priceEl.textContent.trim() : ''
			};

			const added = toggleFavorite(product);
			favoriteButton.classList.toggle('is-favorite', added);
			favoriteButton.setAttribute('aria-pressed', String(added));

			if (added) {
				favoriteButton.classList.remove('favorite-pop');
				void favoriteButton.offsetWidth;
				favoriteButton.classList.add('favorite-pop');
			}

			return;
		}

		const addButton = event.target.closest('.add-button');
		if (!addButton) return;

		const card = addButton.closest('.product-card');
		if (!card) return;

		const nameEl = card.querySelector('.product-name');
		const qtyEl = card.querySelector('.qty-select');
		if (!nameEl || !qtyEl) return;

		const itemName = nameEl.textContent.trim();
		const quantity = Number.parseInt(qtyEl.value, 10);
		const imageEl = card.querySelector('.thumbnail');
		const descriptionEl = card.querySelector('.product-description');
		const priceEl = card.querySelector('.precio');
		const metadata = {
			image: imageEl ? imageEl.getAttribute('src') || '' : '',
			alt: imageEl ? imageEl.getAttribute('alt') || itemName : itemName,
			description: descriptionEl ? descriptionEl.textContent.trim() : '',
			price: priceEl ? priceEl.textContent.trim() : ''
		};

		if (window.CartState && typeof window.CartState.addItem === 'function') {
			window.CartState.addItem(itemName, quantity, metadata);
		}

		showAddModal(itemName, quantity);
	});
}

async function renderProductCards() {
	const container = document.getElementById('product-section-root');
	if (!container) return;

	const category = document.body.dataset.category;
	if (!category) return;

	try {
		const response = await fetch('products.json');
		if (!response.ok) {
			throw new Error(`Failed to load products.json: ${response.status}`);
		}

		const productsByCategory = await response.json();
		if (!productsByCategory[category]) return;

		const cards = productsByCategory[category]
			.map((product) => createProductCard(product))
			.join('');

		container.innerHTML = cards;
		wireAddButtons();
		ShowAddModal();
	} catch (error) {
		console.error(error);
	}
}

document.addEventListener('DOMContentLoaded', () => {
	renderProductCards();
});
