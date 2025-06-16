const API_BASE_URL = 'http://localhost:8080'; // ajuste para sua API

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

function checkPasswordStrength(password) {
    const strengthDiv = document.getElementById('passwordStrength');
    let strength = 0;
    let message = '';
    
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    switch (strength) {
        case 0:
        case 1:
            message = '<small class="text-danger">Senha muito fraca</small>';
            break;
        case 2:
            message = '<small class="text-warning">Senha fraca</small>';
            break;
        case 3:
            message = '<small class="text-info">Senha média</small>';
            break;
        case 4:
        case 5:
            message = '<small class="text-success">Senha forte</small>';
            break;
    }
    
    strengthDiv.innerHTML = message;
    return strength >= 3;
}

function checkPasswordMatch(password, confirmPassword) {
    const matchDiv = document.getElementById('passwordMatch');
    if (confirmPassword === '') {
        matchDiv.innerHTML = '';
        return false;
    }
    
    if (password === confirmPassword) {
        matchDiv.innerHTML = '<small class="text-success">Senhas coincidem</small>';
        return true;
    } else {
        matchDiv.innerHTML = '<small class="text-danger">Senhas não coincidem</small>';
        return false;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const form = document.querySelector('.auth-form');
    
    passwordInput.addEventListener('input', function() {
        checkPasswordStrength(this.value);
        if (confirmPasswordInput.value) {
            checkPasswordMatch(this.value, confirmPasswordInput.value);
        }
    });
    
    confirmPasswordInput.addEventListener('input', function() {
        checkPasswordMatch(passwordInput.value, this.value);
    });
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const displayName = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (!displayName || !email || !password || !confirmPassword) {
            showMessage('Por favor, preencha todos os campos.');
            return;
        }
        if (!checkPasswordStrength(password)) {
            showMessage('A senha deve ser forte (mínimo 8 caracteres, letras e números).');
            return;
        }
        if (!checkPasswordMatch(password, confirmPassword)) {
            showMessage('As senhas não coincidem.');
            return;
        }

        try {
            // Cria o usuário no Firebase
            const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
            await userCredential.user.updateProfile({ displayName });

            // Obtém o idToken do Firebase
            const idToken = await userCredential.user.getIdToken();

            // Envia para o backend para criar o usuário lá também
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    password,
                    display_name: displayName
                })
            });

            // MUDANÇA: lê como texto, depois tenta converter para JSON
            const responseText = await response.text();
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                data = responseText;
            }

            if (response.ok) {
                const successMessage = typeof data === 'object' && data.message 
                    ? data.message 
                    : 'Conta criada com sucesso! Redirecionando...';
                showMessage(successMessage, 'success');
                setTimeout(() => window.location.href = 'login.html', 2000);
            } else {
                const errorMessage = typeof data === 'object' && data.message 
                    ? data.message 
                    : (typeof data === 'string' ? data : 'Erro ao registrar.');
                showMessage(errorMessage);
            }
        } catch (error) {
            showMessage(error.message || 'Erro ao registrar.');
        }
    });

    if (localStorage.getItem('isLoggedIn') === 'true') {
        window.location.href = 'index.html';
    }
});