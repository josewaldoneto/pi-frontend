const API_BASE_URL = 'http://localhost:8080';

function showMessage(message, type = 'error') {
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type === 'error' ? 'danger' : 'success'} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    const form = document.querySelector('.auth-form');
    form.parentNode.insertBefore(alertDiv, form);
}

document.querySelector('.auth-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
        showMessage('Por favor, preencha todos os campos.');
        return;
    }

    try {
        // Autentica no Firebase
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Obtém o idToken do Firebase
        const idToken = await user.getIdToken();

        // Envia o idToken para o backend para finalizar login e obter o token JWT
        const response = await fetch(`${API_BASE_URL}/auth/finalize-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken })
        });

        const data = await response.json();

        if (response.ok) {
            // Armazena o token JWT do backend para requests protegidas
            // Se o backend retornar um token próprio, use data.token ou similar
            // Aqui, vamos usar o idToken do Firebase como Bearer
            localStorage.setItem('authToken', `Bearer ${idToken}`);
            localStorage.setItem('isLoggedIn', 'true');
            showMessage('Login realizado com sucesso!', 'success');
            setTimeout(() => window.location.href = 'index.html', 1500);
        } else {
            showMessage(data.message || 'Erro ao fazer login.');
        }
    } catch (error) {
        showMessage(error.message || 'Erro ao fazer login.');
    }
});

document.addEventListener('DOMContentLoaded', function() {
    if (localStorage.getItem('isLoggedIn') === 'true') {
        window.location.href = 'index.html';
    }
});