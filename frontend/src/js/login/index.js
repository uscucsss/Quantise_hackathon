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
        // Переключение на форму регистрации
        btnRegister.addEventListener('click', () => {
            btnLogin.classList.remove('active');
            btnRegister.classList.add('active');
            formsSlider.classList.add('show-register');
            // Очищаем ошибки при переключении
            if (loginError) loginError.textContent = '';
            if (registerError) registerError.textContent = '';
        });

        // Возврат на форму входа
        btnLogin.addEventListener('click', () => {
            btnRegister.classList.remove('active');
            btnLogin.classList.add('active');
            formsSlider.classList.remove('show-register');
            // Очищаем ошибки при переключении
            if (loginError) loginError.textContent = '';
            if (registerError) registerError.textContent = '';
        });
    }

    // --------------------------------------------------------------------------
    // 03. ФУНКЦИОНАЛ ПОКАЗА / СКРЫТИЯ ПАРОЛЯ (ГЛАЗИК)
    // --------------------------------------------------------------------------
    eyeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Ищем инпут, который находится прямо перед кнопкой глазика
            const passwordInput = btn.previousElementSibling;
            
            if (passwordInput && passwordInput.type === 'password') {
                passwordInput.type = 'text';
                btn.classList.add('hidden-state'); // Меняет SVG на перечеркнутый глаз
            } else if (passwordInput) {
                passwordInput.type = 'password';
                btn.classList.remove('hidden-state'); // Возвращает обычный глаз
            }
        });
    });

    // --------------------------------------------------------------------------
    // 04. ОБРАБОТКА ФОРМЫ АВТОРИЗАЦИИ (LOGIN)
    // --------------------------------------------------------------------------
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Запрещаем стандартную перезагрузку страницы
            if (loginError) loginError.textContent = '';

            const usernameInput = loginForm.querySelector('input[name="username"]');
            const passwordInput = loginForm.querySelector('input[name="password"]');
            const submitBtn = loginForm.querySelector('.submit-btn');

            // Простейшая фронтенд-валидация
            if (usernameInput.value.trim().length < 3) {
                if (loginError) loginError.textContent = 'Никнейм должен быть не короче 3 символов.';
                return;
            }

            if (passwordInput.value.length < 4) {
                if (loginError) loginError.textContent = 'Пароль слишком короткий.';
                return;
            }

            // Включаем анимацию загрузки на кнопке (для бэкенда команды Quantise)
            if (submitBtn) submitBtn.classList.add('loading');

            // Имитируем запрос к бэкенду (в будущем меняется на fetch/axios)
            setTimeout(() => {
                if (submitBtn) submitBtn.classList.remove('loading');
                
                // Сохраняем сессию в локальное хранилище браузера
                localStorage.setItem('isAuth', 'true');
                localStorage.setItem('username', usernameInput.value.trim());

                // Редирект на главную страницу (выходим из папки pages в корень)
                window.location.href = '../index.html';
            }, 1200); // 1.2 секунды красивой симуляции загрузки
        });
    }

    // --------------------------------------------------------------------------
    // 05. ОБРАБОТКА ФОРМЫ РЕГИСТРАЦИИ (REGISTER)
    // --------------------------------------------------------------------------
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
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

            // Имитируем создание аккаунта
            setTimeout(() => {
                if (submitBtn) submitBtn.classList.remove('loading');

                // Переводим пользователя на форму входа после успешной регистрации
                if (btnLogin && formsSlider) {
                    alert('Аккаунт успешно создан! Теперь войдите в него.');
                    registerForm.reset(); // Очищаем поля
                    btnRegister.classList.remove('active');
                    btnLogin.classList.add('active');
                    formsSlider.classList.remove('show-register');
                }
            }, 1500);
        });
    }
});
