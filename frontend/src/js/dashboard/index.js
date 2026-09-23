document.addEventListener('DOMContentLoaded', () => {
    const replayBtn = document.getElementById('replay-game-btn');
    const returnBtn = document.getElementById('back-to-menu-btn');
    const dashboardWrapper = document.querySelector('.dashboard-wrapper');

    // ==========================================================================
    // 01. ЖЕЛЕЗОБЕТОННЫЙ ВЫВОД ЖИВОГО УРОВНЯ СТАБИЛЬНОСТИ
    // ==========================================================================
    const stabilityLabel = document.getElementById('stability-value-label');
    if (stabilityLabel) {
        // Читаем живой скор из памяти браузера
        const finalStability = parseInt(localStorage.getItem('confession_stability_score') || '100', 10);
        
        // Принудительно вставляем живую цифру в тег
        stabilityLabel.innerText = finalStability + '%';

        // Динамически переключаем цвета на самом верхнем уровне приоритета
        if (finalStability <= 50) {
            stabilityLabel.style.setProperty('color', '#ff3b3b', 'important'); // Аварийный красный
        } else if (finalStability < 80) {
            stabilityLabel.style.setProperty('color', '#ffb800', 'important'); // Предупреждающий желтый
        } else {
            stabilityLabel.style.setProperty('color', '#00ff88', 'important'); // Штатный зеленый
        }
    }

    // ==========================================================================
    // 02. МАТЕМАТИЧЕСКИЙ РАСЧЕТ И ИНЖЕКЦИЯ ПРОЦЕНТОВ РОЛЕЙ
    // ==========================================================================
    const cAnalytics = parseInt(localStorage.getItem('confession_clicks_analytics') || '0', 10);
    const cFighter = parseInt(localStorage.getItem('confession_clicks_fighter') || '0', 10);
    const cDiplomat = parseInt(localStorage.getItem('confession_clicks_diplomat') || '0', 10);
    const cCharismatic = parseInt(localStorage.getItem('confession_clicks_charismatic') || '0', 10);

    const totalClicks = cAnalytics + cFighter + cDiplomat + cCharismatic;
    
    let pAnalytics = 0, pFighter = 0, pDiplomat = 0, pCharismatic = 0;
    if (totalClicks === 0) {
        pAnalytics = 25; pFighter = 25; pDiplomat = 25; pCharismatic = 25;
    } else {
        pAnalytics = Math.round((cAnalytics / totalClicks) * 100);
        pFighter = Math.round((cFighter / totalClicks) * 100);
        pDiplomat = Math.round((cDiplomat / totalClicks) * 100);
        pCharismatic = Math.round((cCharismatic / totalClicks) * 100);
    }

    const barAnalytics = document.querySelector('.bar-analytics');
    if (barAnalytics) {
        barAnalytics.style.setProperty('width', pAnalytics + '%', 'important');
        barAnalytics.closest('.skill-item').querySelector('.skill-percent').textContent = pAnalytics + '%';
    }

    const barFighter = document.querySelector('.bar-fighter');
    if (barFighter) {
        barFighter.style.setProperty('width', pFighter + '%', 'important');
        barFighter.closest('.skill-item').querySelector('.skill-percent').textContent = pFighter + '%';
    }

    const barDiplomat = document.querySelector('.bar-diplomat');
    if (barDiplomat) {
        barDiplomat.style.setProperty('width', pDiplomat + '%', 'important');
        barDiplomat.closest('.skill-item').querySelector('.skill-percent').textContent = pDiplomat + '%';
    }

    const barCharismatic = document.querySelector('.bar-charismatic');
    if (barCharismatic) {
        barCharismatic.style.setProperty('width', pCharismatic + '%', 'important');
        barCharismatic.closest('.skill-item').querySelector('.skill-percent').textContent = pCharismatic + '%';
    }

    // ==========================================================================
    // 03. ОБРАБОТЧИКИ НАЖАТИЙ КНОПОК КОНТРОЛЯ
    // ==========================================================================
    if (replayBtn) {
        replayBtn.addEventListener('click', () => {
            if (dashboardWrapper) {
                dashboardWrapper.style.transition = 'all 0.4s ease';
                dashboardWrapper.style.opacity = '0';
                dashboardWrapper.style.transform = 'scale(0.95)';
            }
            // Стираем старую сессию и скоры стабильности для чистого перезапуска
            localStorage.removeItem('confession_stability_score');
            localStorage.removeItem('scene2_saved_step');
            setTimeout(() => { window.location.href = './scene2.html'; }, 400);
        });
    }

    if (returnBtn) {
        returnBtn.addEventListener('click', () => {
            if (dashboardWrapper) { dashboardWrapper.style.transition = 'all 0.4s ease'; dashboardWrapper.style.opacity = '0'; }
            setTimeout(() => { window.location.href = '../index.html'; }, 300);
        });
    }
});
