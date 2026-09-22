const btnLogin = document.getElementById('btn-login');
const btnRegister = document.getElementById('btn-register');
const formsSlider = document.getElementById('forms-slider');

const loginForm = document.querySelector('.login-form');
const registerForm = document.querySelector('.register-form');
const loginError = document.getElementById('login-error');
const registerError = document.getElementById('register-error');

function showLogin() {
  formsSlider.classList.remove('slide-register');
  btnLogin.classList.add('active');
  btnRegister.classList.remove('active');
  loginError.style.display = 'none';
  registerError.style.display = 'none';
}

function showRegister() {
  formsSlider.classList.add('slide-register');
  btnRegister.classList.add('active');
  btnLogin.classList.remove('active');
  loginError.style.display = 'none';
  registerError.style.display = 'none';
}

btnRegister.addEventListener('click', () => { showRegister(); window.location.hash = 'register'; });
btnLogin.addEventListener('click', () => { showLogin(); window.location.hash = 'login'; });

function checkHash() {
  if (window.location.hash === '#register') showRegister();
  else if (window.location.hash === '#login') showLogin();
}
window.addEventListener('DOMContentLoaded', checkHash);
window.addEventListener('hashchange', checkHash);

document.querySelectorAll('.password-wrapper').forEach(wrapper => {
  const eyeBtn = wrapper.querySelector('.password-toggle-eye');
  const passwordInput = wrapper.querySelector('input[type="password"]');

  eyeBtn.addEventListener('click', () => {
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      eyeBtn.classList.add('hidden-mode');
    } else {
      passwordInput.type = 'password';
      eyeBtn.classList.remove('hidden-mode');
    }
  });
});

// --- ВЗАИМОДЕЙСТВИЕ С РЕАЛЬНЫМ БЭКЕНДОМ FASTAPI (POSTGRESQL) ---

// 1. ОБРАБОТЧИК ДЛЯ ФОРМЫ ВХОДА
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.style.display = 'none';
  
  const submitBtn = loginForm.querySelector('.submit-btn');
  submitBtn.classList.add('loading');

  const formData = new FormData(loginForm);
  const dataObject = Object.fromEntries(formData.entries());

  try {
    // Отправляем реальный запрос на эндпоинт FastAPI
    const response = await fetch('/api/login', { 
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dataObject)
    });

    const result = await response.json();

    if (response.ok) {
      alert('Вы успешно вошли!');
      // Перенаправляем на игровое меню вместо несуществующего профиля
      window.location.href = '/pages/menu.html'; 
    } else {
      // Получаем текст ошибки валидации Pydantic или FastAPI HTTPException
      const errDetail = result.detail || 'Неверный логин или пароль';
      
      if (errDetail === 'invalid_credentials') {
        loginError.innerHTML = 'Неверный логин или пароль! Попробуйте снова или если у вас нет аккаунта, <span class="error-link" id="go-to-reg">зарегистрируйтесь</span>';
        loginError.style.display = 'block';

        document.getElementById('go-to-reg').addEventListener('click', () => {
          showRegister();
          window.location.hash = 'register';
        });
      } else {
        loginError.textContent = errDetail;
        loginError.style.display = 'block';
      }
    }
  } catch (error) {
    loginError.textContent = 'Не удалось связаться с сервером. Проверьте подключение.';
    loginError.style.display = 'block';
  } finally {
    submitBtn.classList.remove('loading');
  }
});


// 2. ОБРАБОТЧИК ДЛЯ ФОРМЫ РЕГИСТРАЦИИ
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  registerError.style.display = 'none';

  const submitBtn = registerForm.querySelector('.submit-btn');
  submitBtn.classList.add('loading');

  const formData = new FormData(registerForm);
  const dataObject = Object.fromEntries(formData.entries());

  try {
    // Отправляем запрос на регистрацию в PostgreSQL
    const response = await fetch('/api/register', { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataObject)
    });

    const result = await response.json();

    if (response.ok) {
      alert('Аккаунт успешно создан! Теперь вы можете войти.');
      showLogin(); // Переключаем форму на вход
      window.location.hash = 'login';
    } else {
      // Отображаем ошибку от FastAPI (например, "Этот никнейм уже занят!")
      registerError.textContent = result.detail || 'Ошибка при регистрации';
      registerError.style.display = 'block';
    }
  } catch (error) {
    registerError.textContent = 'Не удалось связаться с сервером. Проверьте подключение.';
    registerError.style.display = 'block';
  } finally {
    submitBtn.classList.remove('loading');
  }
});
