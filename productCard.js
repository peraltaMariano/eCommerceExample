function createProductCard(product) {
	const imageMarkup = product.image
		? `<img class="thumbnail" src="${product.image}" alt="${product.alt}">`
		: '<div class="image-container"></div>';

	return `
		<div class="product-card">
			${imageMarkup}
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
				<button type="button" class="add-button">Add</button>
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
		<div class="add-modal" role="dialog" aria-modal="true" aria-live="polite" aria-label="Item added to cart">
			<div class="add-modal-header">
				<div class="add-modal-title">Item added to cart</div>
				<button type="button" class="add-modal-close" aria-label="Close">×</button>
			</div>
			<div class="add-modal-body">
				<p class="add-modal-item"></p>
				<p class="add-modal-qty"></p>
			</div>
		</div>
	`;
	document.body.appendChild(modal);
	const closeButton = modal.querySelector('.add-modal-close');
	closeButton.addEventListener('click', () => hideAddModal());
	modal.addEventListener('click', (event) => {
		if (event.target === modal) hideAddModal();
	});

	return modal;
}

function showAddModal(itemName, quantity) {
	const modal = ShowAddModal();
	const itemEl = modal.querySelector('.add-modal-item');
	const qtyEl = modal.querySelector('.add-modal-qty');

	itemEl.textContent = `Item: ${itemName}`;
	qtyEl.textContent = `Quantity: ${quantity}`;

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
		const addButton = event.target.closest('.add-button');
		if (!addButton) return;

		const card = addButton.closest('.product-card');
		if (!card) return;

		const nameEl = card.querySelector('.product-name');
		const qtyEl = card.querySelector('.qty-select');
		if (!nameEl || !qtyEl) return;

		showAddModal(nameEl.textContent.trim(), qtyEl.value);
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
