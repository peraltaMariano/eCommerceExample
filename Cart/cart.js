function renderCartItems() {
	const cartRoot = document.getElementById('cart-items-root');
	if (!cartRoot) return;

	const canReadCart = window.CartState && typeof window.CartState.readItems === 'function';
	if (!canReadCart) {
		cartRoot.innerHTML = '<p class="cart-empty">No se pudo cargar el carrito.</p>';
		return;
	}

	const items = window.CartState.readItems();
	if (!items.length) {
		cartRoot.innerHTML = '<p class="cart-empty">El carrito esta vacio.</p>';
		return;
	}

	cartRoot.innerHTML = items
		.map(
			(item) => `
				<div class="cart-item-row" data-item-name="${item.name}">
					${item.price ? `<span class="cart-item-price">${item.price.includes('·') ? item.price.split('·').pop().trim() : item.price} x ${item.quantity}</span>` : ''}
					<div class="cart-item-left">
						<div class="cart-item-image-wrap">
							${
								item.image
									? `<img class="cart-item-image" src="${item.image}" alt="${item.alt || item.name}">`
									: '<div class="cart-item-image-placeholder"></div>'
							}
						</div>
						<div class="cart-item-info">
							<span class="cart-item-name">${item.name}</span>
							<span class="cart-item-qty">Cantidad actual: ${item.quantity}</span>
							<span class="cart-item-description">${item.description || 'Sin descripcion'}</span>
						</div>
					</div>
					<div class="cart-item-controls">
						<select class="qty-select cart-item-qty-select" aria-label="Cantidad del producto">
							${Array.from({ length: Math.max(6, item.quantity) }, (_, index) => {
								const value = index + 1;
								const isSelected = value === item.quantity ? ' selected' : '';
								return `<option value="${value}"${isSelected}>${value}</option>`;
							}).join('')}
						</select>

						<button type="button" class="cart-remove-all">Quitar</button>
					</div>
				</div>
			`
		)
		.join('');
}

function wireCartRemoveButtons() {
	const cartRoot = document.getElementById('cart-items-root');
	if (!cartRoot) return;

	cartRoot.addEventListener('click', (event) => {
		const row = event.target.closest('.cart-item-row');
		if (!row) return;

		const itemName = row.dataset.itemName;
		if (!itemName) return;

		const removeAllButton = event.target.closest('.cart-remove-all');
		if (!removeAllButton) return;

		if (window.CartState && typeof window.CartState.removeAllOfKind === 'function') {
			window.CartState.removeAllOfKind(itemName);
		}
	});

	cartRoot.addEventListener('change', (event) => {
		const selector = event.target.closest('.cart-item-qty-select');
		if (!selector) return;

		const row = selector.closest('.cart-item-row');
		if (!row) return;

		const itemName = row.dataset.itemName;
		if (!itemName) return;

		if (window.CartState && typeof window.CartState.setQuantity === 'function') {
			window.CartState.setQuantity(itemName, selector.value);
		}
	});
}

document.addEventListener('DOMContentLoaded', () => {
	renderCartItems();
	wireCartRemoveButtons();
});

document.addEventListener('cart:updated', () => {
	renderCartItems();
});
