
const SECTION_FOLDERS = ['categorias', 'cart', 'favoritos', 'login', 'home'];

function getRoutePrefix() {
    const path = window.location.pathname.toLowerCase().replace(/\\/g, '/');
    return SECTION_FOLDERS.some((folder) => path.includes(`/${folder}/`)) ? '../' : './';
}

function toProjectPath(path) {
    const prefix = getRoutePrefix();
    const normalizedPath = String(path || '').replace(/^\.?\//, '');
    return `${prefix}${normalizedPath}`;
}

function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    localStorage.setItem('userEmail', email);
    localStorage.setItem('isLoggedIn', 'true');
    window.location.href = toProjectPath('Home/index.html');
}

function handleRegister(event) {
    event.preventDefault();
    
    const nombre = document.getElementById('nombre').value;
    const apellido = document.getElementById('apellido').value;
    const email = document.getElementById('email').value;
    localStorage.setItem('userName', nombre + ' ' + apellido);
    localStorage.setItem('userEmail', email);
    localStorage.setItem('isLoggedIn', 'true');
    window.location.href = toProjectPath('Home/index.html');
}
function handleLogout(event) {
    event.preventDefault();
    
    
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('isLoggedIn');
    window.location.href = toProjectPath('Login/login.html');
}


function updateHeaderLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const loginLink = document.querySelector('a[data-login-link="true"]');
    
    if (!loginLink) return;
    if (isLoggedIn) {
        const userEmail = localStorage.getItem('userEmail') || 'User';
        const userButton = document.createElement('li');
        userButton.innerHTML = `<a href="#">${userEmail.split('@')[0]}</a>`;
        const logoutLi = document.createElement('li');
        logoutLi.innerHTML = `<a href="#" id="logoutBtn" class="logout-btn"><img src="${toProjectPath('Imagenes/logout.svg')}" alt="Logout"></a>`;
        const loginLi = loginLink.closest('li');
        const nav = loginLi.closest('ul');
        loginLi.replaceWith(userButton);
        nav.appendChild(logoutLi);
        document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    }
}

document.addEventListener('navbar:rendered', updateHeaderLoginStatus);
document.addEventListener('DOMContentLoaded', updateHeaderLoginStatus);
