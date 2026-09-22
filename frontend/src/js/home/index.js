<<<<<<< HEAD
console.log("Confession JS успешно подключен!");
=======
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
>>>>>>> d4f6d46ff6385b97c52b0398b75ca628b8d04f36
