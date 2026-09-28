document.addEventListener('DOMContentLoaded', () => {
    const replayBtn = document.getElementById('replay-game-btn');
    const returnBtn = document.getElementById('back-to-menu-btn');
    const dashboardWrapper = document.querySelector('.dashboard-wrapper');

    // ==========================================================================
    // 01. ЖЕЛЕЗОБЕТОННЫЙ ВЫВОД ЖИВОГО УРОВНЯ СТАБИЛЬНОСТИ
    // ==========================================================================
    const stabilityLabel = document.getElementById('stability-value-label') || document.querySelector('.stability-value');
    if (stabilityLabel) {
        // Чистый боевой сбор: Читаем живой скор из памяти браузера без заглушек
        const finalStability = parseInt(localStorage.getItem('confession_stability_score') || '100', 10);
        stabilityLabel.innerText = finalStability + '%';

        // Динамически переключаем цвета на самом верхнем уровне приоритета
        if (finalStability <= 50) {
            stabilityLabel.style.setProperty('color', '#ff3b3b', 'important');
        } else if (finalStability < 80) {
            stabilityLabel.style.setProperty('color', '#ffb800', 'important');
        } else {
            stabilityLabel.style.setProperty('color', '#00ff88', 'important');
        }
    }

    // ==========================================================================
    // 02. ЧИСТЫЙ МАТЕМАТИЧЕСКИЙ РАСЧЕТ И ИНЖЕКЦИЯ ПРОЦЕНТОВ ИЗ LOCALSTORAGE
    // ==========================================================================
    const cAnalytics = parseInt(localStorage.getItem('confession_clicks_analytics') || '0', 10);
    const cFighter = parseInt(localStorage.getItem('confession_clicks_fighter') || '0', 10);
    const cDiplomat = parseInt(localStorage.getItem('confession_clicks_diplomat') || '0', 10);
    const cCharismatic = parseInt(localStorage.getItem('confession_clicks_charismatic') || '0', 10);

    const totalClicks = cAnalytics + cFighter + cDiplomat + cCharismatic;
    
    let pAnalytics = 0, pFighter = 0, pDiplomat = 0, pCharismatic = 0;
    
    // ЗАГЛУШКИ УДАЛЕНЫ: Если игра не сыграна, базовый баланс по 25%. Иначе — честный расчет!
    if (totalClicks === 0) {
        pAnalytics = 25; pFighter = 25; pDiplomat = 25; pCharismatic = 25;
    } else {
        pAnalytics = Math.round((cAnalytics / totalClicks) * 100);
        pFighter = Math.round((cFighter / totalClicks) * 100);
        pDiplomat = Math.round((cDiplomat / totalClicks) * 100);
        pCharismatic = Math.round((cCharismatic / totalClicks) * 100);
    }

    // ОРИГИНАЛЬНАЯ БЕЗБАГОВАЯ ФУНКЦИЯ ОБНОВЛЕНИЯ DOM
    function updateSkillDOM(barSelector, textSelector, value) {
        const barEl = document.querySelector(barSelector);
        if (barEl) {
            // Передаем живое значение в CSS-переменную для плавного роста кусков пирога
            barEl.style.setProperty('--circle-pct', value, 'important');
        }
        
        // Определяем ID внутренних спанов для безопасного вывода цифр без затирания имен классов
        let targetTextId = 'text-pct-analytics';
        if (barSelector.includes('fighter')) targetTextId = 'text-pct-fighter';
        if (barSelector.includes('diplomat')) targetTextId = 'text-pct-diplomat';
        if (barSelector.includes('charismatic')) targetTextId = 'text-pct-charismatic';
        
        const textEl = document.getElementById(targetTextId);
        if (textEl) textEl.textContent = ' ' + value + '%';
    }

    // Запуск боевого рендеринга вынесен в микро-таймаут (50ms) для инициализации transition-анимации
    setTimeout(() => {
        updateSkillDOM('.bar-analytics', '.label-analytics', pAnalytics);
        updateSkillDOM('.bar-fighter', '.label-fighter', pFighter);
        updateSkillDOM('.bar-diplomat', '.label-diplomat', pDiplomat);
        updateSkillDOM('.bar-charismatic', '.label-charismatic', pCharismatic);
    }, 50);

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
            localStorage.removeItem('confession_stability_score');
            localStorage.removeItem('scene2_saved_step');
            setTimeout(() => { window.location.href = '/pages/scene3.html'; }, 400);
        });
    }

    if (returnBtn) {
        returnBtn.addEventListener('click', () => {
            if (dashboardWrapper) { 
                dashboardWrapper.style.transition = 'all 0.4s ease'; 
                dashboardWrapper.style.opacity = '0'; 
            }
            window.location.href = '/pages/menu.html';
        });
    }
});
