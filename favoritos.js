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

function removeFavoriteByName(name) {
    const nextFavorites = readFavorites().filter((item) => item.name !== name);
    saveFavorites(nextFavorites);
}

function createFavoriteCard(item) {
    const imageInner = item.image
        ? `<img class="thumbnail" src="${item.image}" alt="${item.alt || item.name}">`
        : '';

    return `
        <div class="product-card">
            <div class="image-container">
                ${imageInner}
                <button type="button" class="favorite-button is-favorite" aria-label="Remove from favorites" aria-pressed="true" data-product-name="${item.name}">
                    <img src="favorites.svg" alt="Favorite icon">
                </button>
            </div>
            <p class="product-name">${item.name}</p>
            <p class="product-description">${item.description || ''}</p>
            <div class="product-actions-row">
                <p class="precio">${item.price || ''}</p>
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

function ensureAddModal() {
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
                <button type="button" class="go-to-cart-button">Go to Cart</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const closeButton = modal.querySelector('.add-modal-close');
    const goToCartButton = modal.querySelector('.go-to-cart-button');
    closeButton.addEventListener('click', () => hideAddModal());
    goToCartButton.addEventListener('click', () => {
        window.location.href = 'cart.html';
    });
    modal.addEventListener('click', (event) => {
        if (event.target === modal) hideAddModal();
    });

    return modal;
}

function showAddModal(itemName, quantity) {
    const modal = ensureAddModal();
    const itemEl = modal.querySelector('.add-modal-item');
    const qtyEl = modal.querySelector('.add-modal-qty');

    itemEl.textContent = itemName;
    qtyEl.textContent = `Unidades: ${quantity}`;

    modal.classList.remove('hidden');
}

function hideAddModal() {
    const modal = document.getElementById('add-modal');
    if (!modal) return;
    modal.classList.add('hidden');
}

function wireFavoriteCards() {
    const favoritesItemsRoot = document.getElementById('favorites-items-root');
    if (!favoritesItemsRoot) return;

    favoritesItemsRoot.addEventListener('click', (event) => {
        const favoriteButton = event.target.closest('.favorite-button');
        if (favoriteButton) {
            const name = favoriteButton.getAttribute('data-product-name');
            if (!name) return;

            removeFavoriteByName(name);
            renderFavorites();
            return;
        }

        const addButton = event.target.closest('.add-button');
        if (!addButton) return;

        const card = addButton.closest('.product-card');
        if (!card) return;

        const nameEl = card.querySelector('.product-name');
        const qtyEl = card.querySelector('.qty-select');
        const imageEl = card.querySelector('.thumbnail');
        const descriptionEl = card.querySelector('.product-description');
        const priceEl = card.querySelector('.precio');
        if (!nameEl || !qtyEl) return;

        const itemName = nameEl.textContent.trim();
        const quantity = Number.parseInt(qtyEl.value, 10);
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

function renderFavorites() {
    const favoritesItemsRoot = document.getElementById('favorites-items-root');
    if (!favoritesItemsRoot) return;

    const favorites = readFavorites();

    if (favorites.length === 0) {
        favoritesItemsRoot.innerHTML = '<p class="favorites-empty">Todavia no agregaste favoritos.</p>';
        return;
    }

    favoritesItemsRoot.innerHTML = favorites.map((item) => createFavoriteCard(item)).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    renderFavorites();
    wireFavoriteCards();
    ensureAddModal();
});