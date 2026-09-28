document.addEventListener('DOMContentLoaded', () => {
    // --------------------------------------------------------------------------
    // 01. ПОИСК ВСЕХ НЕОБХОДИМЫХ СЕЛЕКТОРОВ ИНТЕРФЕЙСА
    // --------------------------------------------------------------------------
    const btnLogin = document.getElementById('btn-login');
    const btnRegister = document.getElementById('btn-register');
    const formsSlider = document.getElementById('forms-slider');
    const eyeButtons = document.querySelectorAll('.password-toggle-eye');
    
    const loginForm = document.querySelector('.login-form');
    const registerForm = document.querySelector('.register-form');
    const loginError = document.getElementById('login-error');
    const registerError = document.getElementById('register-error');

    // --------------------------------------------------------------------------
    // 02. МЕХАНИКА СЛАЙДЕРА (ПЛАВНОЕ ПЕРЕКЛЮЧЕНИЕ ТАБОВ)
    // --------------------------------------------------------------------------
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

    // --------------------------------------------------------------------------
    // 03. ФУНКЦИОНАЛ ПОКАЗА / СКРЫТИЯ ПАРОЛЯ (ГЛАЗИК)
    // --------------------------------------------------------------------------
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

    // --------------------------------------------------------------------------
    // 04. ЖИВАЯ ОБРАБОТКА ФОРМЫ АВТОРИЗАЦИИ (РЕАЛЬНЫЙ БЭКЕНД)
    // --------------------------------------------------------------------------
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            if (loginError) loginError.textContent = '';

            const usernameInput = loginForm.querySelector('input[name="username"]');
            const passwordInput = loginForm.querySelector('input[name="password"]');
            const submitBtn = loginForm.querySelector('.submit-btn');

            if (usernameInput.value.trim().length < 3) {
                if (loginError) loginError.textContent = 'Никнейм должен быть не короче 3 символов.';
                return;
            }

            if (passwordInput.value.length < 4) {
                if (loginError) loginError.textContent = 'Пароль слишком короткий.';
                return;
            }

            if (submitBtn) submitBtn.classList.add('loading');

            try {
                // ОТПРАВЛЯЕМ ЗАПРОС НА НАШ НАСТОЯЩИЙ API БЭКЕНДА
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
                    // ЗАПОМИНАЕМ ТОКЕН ЮЗЕРА ДЛЯ СЦЕН И ДАШБОРДОВ
                    localStorage.setItem('user_id', result.user_id);
                    localStorage.setItem('username', usernameInput.value.trim());

                    // ПРАВИЛЬНЫЙ РЕДИРЕКТ: перенаправляем строго в лобби выбора сценариев
                    window.location.href = '/pages/menu.html';
                } else {
                    if (loginError) {
                        loginError.textContent = result.detail === "invalid_credentials" 
                            ? "Неверный никнейм или пароль." 
                            : "Ошибка авторизации. Проверьте данные.";
                    }
                }
            } catch (error) {
                if (loginError) loginError.textContent = "Не удалось связаться с сервером базы данных.";
                console.error(error);
            } finally {
                if (submitBtn) submitBtn.classList.remove('loading');
            }
        });
    }

    // --------------------------------------------------------------------------
    // 05. ЖИВАЯ ОБРАБОТКА ФОРМЫ РЕГИСТРАЦИИ (РЕАЛЬНЫЙ БЭКЕНД)
    // --------------------------------------------------------------------------
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
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
                // ОТПРАВЛЯЕМ ЗАПРОС НА СОЗДАНИЕ ЮЗЕРА В POSTGRES
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
                    
                    // Переводим слайдер обратно на вкладку LOGIN
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
