document.addEventListener('DOMContentLoaded', () => {
    const btnLogin = document.getElementById('btn-login');
    const btnRegister = document.getElementById('btn-register');
    const formsSlider = document.getElementById('forms-slider');
    const eyeButtons = document.querySelectorAll('.password-toggle-eye');
    
    const loginForm = document.querySelector('.login-form');
    const registerForm = document.querySelector('.register-form');
    const loginError = document.getElementById('login-error');
    const registerError = document.getElementById('register-error');


    if (btnRegister && btnLogin && formsSlider) {
        btnRegister.addEventListener('click', () => {
            btnLogin.classList.remove('active');
            btnRegister.classList.add('active');
            formsSlider.classList.add('show-register');
            if (loginError) loginError.textContent = '';
            if (registerError) registerError.textContent = '';
        });

        btnLogin.addEventListener('click', () => {
            btnRegister.classList.remove('active');
            btnLogin.classList.add('active');
            formsSlider.classList.remove('show-register');
            if (loginError) loginError.textContent = '';
            if (registerError) registerError.textContent = '';
        });
    }

    eyeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const passwordInput = btn.previousElementSibling;
            if (passwordInput && passwordInput.type === 'password') {
                passwordInput.type = 'text';
                btn.classList.add('hidden-state');
            } else if (passwordInput) {
                passwordInput.type = 'password';
                btn.classList.remove('hidden-state');
            }
        });
    });

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            e.stopPropagation();
            if (loginError) loginError.textContent = '';

            const usernameInput = loginForm.querySelector('input[name="username"]');
            const passwordInput = loginForm.querySelector('input[name="password"]');

            try {
                const response = await fetch('/api_v1/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: usernameInput.value.trim(),
                        password: passwordInput.value
                    })
                });

                const result = await response.json();

                if (response.ok) {
                    localStorage.setItem('user_id', result.user_id);
                    localStorage.setItem('username', usernameInput.value.trim());
                    localStorage.setItem('isAuth', 'true');
                    window.location.href = '/index.html';
                } else {
                    if (loginError) loginError.textContent = result.detail || "Неверный логин или пароль.";
                }
            } catch (error) {
                if (loginError) loginError.textContent = "Сбой бэкенда! Проверьте соединение с PostgreSQL.";
                console.error(error);
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            e.stopPropagation();
            if (registerError) registerError.textContent = '';

            const usernameInput = registerForm.querySelector('input[name="username"]');
            const passwordInput = registerForm.querySelector('input[name="password"]');
            const submitBtn = registerForm.querySelector('.submit-btn');

            if (usernameInput.value.trim().length < 3) {
                if (registerError) registerError.textContent = 'Никнейм должен быть не короче 3 символов.';
                return;
            }

            if (passwordInput.value.length < 6) {
                if (registerError) registerError.textContent = 'Придумайте пароль от 6 символов.';
                return;
            }

            if (submitBtn) submitBtn.classList.add('loading');

            try {
                const response = await fetch('/api_v1/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: usernameInput.value.trim(),
                        password: passwordInput.value
                    })
                });

                const result = await response.json();

                if (response.ok) {
                    alert('Аккаунт успешно создан в системе Quantise! Теперь войдите в него.');
                    registerForm.reset();
                    
                    if (btnLogin && formsSlider) {
                        btnRegister.classList.remove('active');
                        btnLogin.classList.add('active');
                        formsSlider.classList.remove('show-register');
                    }
                } else {
                    if (registerError) registerError.textContent = result.detail || "Этот никнейм уже занят.";
                }
            } catch (error) {
                if (registerError) registerError.textContent = "Ошибка сети при попытке регистрации.";
                console.error(error);
            } finally {
                if (submitBtn) submitBtn.classList.remove('loading');
            }
        });
    }
});
