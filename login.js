
function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Store user info in localStorage
    localStorage.setItem('userEmail', email);
    localStorage.setItem('isLoggedIn', 'true');
    window.location.href = 'index.html';
}

function handleRegister(event) {
    event.preventDefault();
    
    const nombre = document.getElementById('nombre').value;
    const apellido = document.getElementById('apellido').value;
    const email = document.getElementById('email').value;
    localStorage.setItem('userName', nombre + ' ' + apellido);
    localStorage.setItem('userEmail', email);
    localStorage.setItem('isLoggedIn', 'true');
    window.location.href = 'index.html';
}
function handleLogout(event) {
    event.preventDefault();
    
    
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('isLoggedIn');
    window.location.href = 'login.html';
}


function updateHeaderLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const loginLink = document.querySelector('a[href="login.html"]');
    
    if (!loginLink) return;
    if (isLoggedIn) {
        const userEmail = localStorage.getItem('userEmail') || 'User';
        const userButton = document.createElement('li');
        userButton.innerHTML = `<a href="#">${userEmail.split('@')[0]}</a>`;
        const logoutLi = document.createElement('li');
        logoutLi.innerHTML = `<a href="#" id="logoutBtn" class="logout-btn"><img src="logout.svg" alt="Logout"></a>`;
        const loginLi = loginLink.closest('li');
        const nav = loginLi.closest('ul');
        loginLi.replaceWith(userButton);
        nav.appendChild(logoutLi);
        document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    }
}

document.addEventListener('navbar:rendered', updateHeaderLoginStatus);
document.addEventListener('DOMContentLoaded', updateHeaderLoginStatus);
