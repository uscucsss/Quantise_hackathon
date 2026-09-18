const btnLogin = document.getElementById('btn-login');
const btnRegister = document.getElementById('btn-register');

// Перенаправление на страницу авторизации, сразу на форму Входа
btnLogin.addEventListener('click', () => {
  window.location.href = 'pages/login.html#login';
});

// Перенаправление на страницу авторизации, сразу на форму Регистрации
btnRegister.addEventListener('click', () => {
  window.location.href = 'pages/login.html#register';
});