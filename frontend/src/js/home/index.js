// ТВОЙ СТАРТОВЫЙ КОД (БЕЗУПРЕЧНЫЙ И СТАБИЛЬНЫЙ)
const btnLogin = document.getElementById('btn-login');
const btnRegister = document.getElementById('btn-register');

btnLogin.addEventListener('click', () => {
    window.location.href = 'pages/login.html#login';
});

btnRegister.addEventListener('click', () => {
    window.location.href = 'pages/login.html#register';
});

// ==========================================
// ИНТЕРАКТИВНОЕ СИЯНИЕСФЕРЫ (БЕЗ ЛАГОВ И МУСОРА)
// ==========================================
document.addEventListener('mousemove', (e) => {
    // Ищем контейнер, в котором лежит сфера (найди его класс или id в index.html)
    const sphereContainer = document.querySelector('.sphere-wrapper') || document.querySelector('.main-sphere-class')?.parentElement; 
    
    if (sphereContainer) {
        // Мягкое смещение центра свечения за курсором в пределах 15 пикселей
        const x = (window.innerWidth / 2 - e.clientX) / 40;
        const y = (window.innerHeight / 2 - e.clientY) / 40;
        
        sphereContainer.style.transform = `translate(${-x}px, ${-y}px)`;
        sphereContainer.style.transition = 'transform 0.2s cubic-bezier(0.25, 1, 0.5, 1)';
    }
});
