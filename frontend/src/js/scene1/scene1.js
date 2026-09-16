// Логика для сцены 1
document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('action-btn');

    if (button) {
        button.addEventListener('click', () => {
            alert('Скрипт scene1.js успешно подключен и работает!');
        });
    }
});
