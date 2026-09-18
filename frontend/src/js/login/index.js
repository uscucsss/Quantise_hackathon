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


//начало заглушки


// --- СИМУЛЯЦИЯ БАЗЫ ДАННЫХ (MOCK FETCH) ---

if (!localStorage.getItem('sql_users_table')) {
  localStorage.setItem('sql_users_table', JSON.stringify([{ username: 'admin', password: '123' }]));
}

async function mockFetch(url, options) {
  await new Promise(resolve => setTimeout(resolve, 1500)); 
  const body = JSON.parse(options.body);
  const usersTable = JSON.parse(localStorage.getItem('sql_users_table'));

  if (url === '/api/register') {
    const userExists = usersTable.some(u => u.username.toLowerCase() === body.username.toLowerCase());
    if (userExists) {
      return { ok: false, json: async () => ({ message: 'Этот никнейм уже занят!' }) };
    }
    usersTable.push({ username: body.username, password: body.password });
    localStorage.setItem('sql_users_table', JSON.stringify(usersTable));
    return { ok: true, json: async () => ({ message: 'Регистрация успешна!' }) };
  }

  if (url === '/api/login') {
    const foundUser = usersTable.find(u => u.username.toLowerCase() === body.username.toLowerCase());
    if (!foundUser || foundUser.password !== body.password) {
      return { ok: false, json: async () => ({ message: 'invalid_credentials' }) };
    }
    return { ok: true, json: async () => ({ message: 'Успешный вход!' }) };
  }
}

//конец заглушки



// --- ОБРАБОТЧИКИ ОТПРАВКИ ФОРМ ---

// ВХОД
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.style.display = 'none';
  
  const submitBtn = loginForm.querySelector('.submit-btn');
  submitBtn.classList.add('loading');

  const formData = new FormData(loginForm);
  const dataObject = Object.fromEntries(formData.entries());

  try {
    const response = await mockFetch('/api/login', { method: 'POST', body: JSON.stringify(dataObject) });
    const result = await response.json();

    if (response.ok) {
      alert('Вы успешно вошли!');
      window.location.href = '/profile.html';
    } else {
      if (result.message === 'invalid_credentials') {
        loginError.innerHTML = 'Неверный логин или пароль! Попробуйте снова или если у вас нет аккаунта, <span class="error-link" id="go-to-reg">зарегистрируйтесь</span>';
        loginError.style.display = 'block';

        document.getElementById('go-to-reg').addEventListener('click', () => {
          showRegister();
          window.location.hash = 'register';
        });
      }
    }
  } catch (error) {
    loginError.textContent = 'Ошибка соединения с сервером';
    loginError.style.display = 'block';
  } finally {
    submitBtn.classList.remove('loading');
  }
});

// РЕГИСТРАЦИЯ
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  registerError.style.display = 'none';

  const submitBtn = registerForm.querySelector('.submit-btn');
  submitBtn.classList.add('loading');

  const formData = new FormData(registerForm);
  const dataObject = Object.fromEntries(formData.entries());

  try {
    const response = await mockFetch('/api/register', { method: 'POST', body: JSON.stringify(dataObject) });
    const result = await response.json();

    if (response.ok) {
      alert('Аккаунт успешно создан!');
      window.location.href = '/profile.html';
    } else {
      registerError.textContent = result.message;
      registerError.style.display = 'block';
    }
  } catch (error) {
    registerError.textContent = 'Ошибка соединения с сервером';
    registerError.style.display = 'block';
  } finally {
    submitBtn.classList.remove('loading');
  }
});






// далее рабочий код, вставить вместо заглушки


/* 

// --- ВЗАИМОДЕЙСТВИЕ С РЕАЛЬНЫМ БЭКЕНДОМ НА PYTHON ---

// 1. ОБРАБОТЧИК ДЛЯ ФОРМЫ ВХОДА
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault(); // Запрещаем браузеру перезагружать страницу
  loginError.style.display = 'none'; // Прячем прошлую ошибку
  
  // Включаем спиннер загрузки на кнопке
  const submitBtn = loginForm.querySelector('.submit-btn');
  submitBtn.classList.add('loading');

  // Собираем данные из полей ввода в JS-объект
  const formData = new FormData(loginForm);
  const dataObject = Object.fromEntries(formData.entries()); // Получаем { username: "...", password: "..." }

  try {
    // Делаем РЕАЛЬНЫЙ сетевой запрос к серверу на Python
    const response = await fetch('http://127.0.0', { 
      method: 'POST', // Метод отправки данных
      headers: { 
        'Content-Type': 'application/json' // Говорим серверу, что отправляем JSON
      },
      body: JSON.stringify(dataObject) // Превращаем объект в JSON-строку
    });

    // Ждем ответ от Python-сервера и парсим его JSON
    const result = await response.json();

    if (response.ok) {
      // Если Python вернул статус успешного ответа (код 200)
      alert('Вы успешно вошли!');
      window.location.href = '/profile.html'; // Перенаправляем в личный кабинет
    } else {
      // Если Python вернул ошибку (например, код 401 - Неверные данные)
      if (result.message === 'invalid_credentials') {
        loginError.innerHTML = 'Неверный логин или пароль! Попробуйте снова или если у вас нет аккаунта, <span class="error-link" id="go-to-reg">зарегистрируйтесь</span>';
        loginError.style.display = 'block';

        // Вешаем клик на ссылку "зарегистрируйтесь" внутри ошибки
        document.getElementById('go-to-reg').addEventListener('click', () => {
          showRegister();
          window.location.hash = 'register';
        });
      } else {
        // Любая другая ошибка от бэкенда (например, сервер сломался)
        loginError.textContent = result.message || 'Произошла ошибка при входе';
        loginError.style.display = 'block';
      }
    }
  } catch (error) {
    // Сработает, если у пользователя пропал интернет или Python-сервер вообще выключен
    loginError.textContent = 'Не удалось связаться с сервером. Проверьте подключение.';
    loginError.style.display = 'block';
  } finally {
    // В любом случае (успех или ошибка) выключаем спиннер и возвращаем текст кнопке
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
    // Шлём запрос на эндпоинт регистрации Python-сервера
    const response = await fetch('http://127.0.0', { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataObject)
    });

    const result = await response.json();

    if (response.ok) {
      alert('Аккаунт успешно создан!');
      window.location.href = '/profile.html';
    } else {
      // Выводим ошибку от бэкенда (например: "Этот никнейм уже занят!")
      registerError.textContent = result.message || 'Ошибка при регистрации';
      registerError.style.display = 'block';
    }
  } catch (error) {
    registerError.textContent = 'Не удалось связаться с сервером. Проверьте подключение.';
    registerError.style.display = 'block';
  } finally {
    submitBtn.classList.remove('loading');
  }
});



 */