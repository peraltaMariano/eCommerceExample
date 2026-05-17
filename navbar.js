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

		navbarRoot.innerHTML = `
<header>
	<div class="logo-section">
		<img src="${navbarData.brand.logo}" alt="${navbarData.brand.logoAlt}">
		<h1>${navbarData.brand.title}</h1>
	</div>

	<nav>
		<ul>
			${linksMarkup}
		</ul>
	</nav>
</header>
		`;
	} catch (error) {
		console.error(error);
	}

	document.dispatchEvent(new CustomEvent('navbar:rendered'));
}

document.addEventListener('DOMContentLoaded', () => {
	renderNavbar();
});
