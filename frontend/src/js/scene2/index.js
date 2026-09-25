document.addEventListener('DOMContentLoaded', () => {
    // ==========================================================================
    // 01. АВТОНОМНЫЙ ТРИГГЕР МЕНЮ
    // ==========================================================================
    const menuToggleBtn = document.getElementById('menu-toggle-btn');
    const sideMenuPanel = document.getElementById('side-menu-panel');
    const actionExit = document.getElementById('action-exit');
    const actionSaveExit = document.getElementById('action-save-exit');

    let currentStep = 'step1';
    let database = null;
    let selectedTactic = null;

    if (menuToggleBtn && sideMenuPanel) {
        menuToggleBtn.addEventListener('click', (e) => {
            e.preventDefault(); e.stopPropagation();
            menuToggleBtn.classList.toggle('menu-open');
            sideMenuPanel.classList.toggle('panel-open');
        });
        document.addEventListener('click', (e) => {
            if (!sideMenuPanel.contains(e.target) && !menuToggleBtn.contains(e.target)) {
                menuToggleBtn.classList.remove('menu-open');
                sideMenuPanel.classList.remove('panel-open');
            }
        });
        if (actionExit) { actionExit.addEventListener('click', () => { if (confirm('Вы уверены?')) window.location.href = '../index.html'; }); }
        if (actionSaveExit) { actionSaveExit.addEventListener('click', () => { localStorage.setItem('scene2_saved_step', currentStep); alert('Сохранено!'); window.location.href = '../index.html'; }); }
    }

    // ==========================================================================
    // 02. СЕЛЕКТОРЫ УПРАВЛЕНИЯ КВЕСТОМ И НАЧАЛЬНЫЙ СБРОС МЕТРИК
    // ==========================================================================
    const buttons = document.querySelectorAll('.tactic-button');
    const tacticsBox = document.querySelector('.tactics-box');
    const robotFaceText = document.getElementById('robotFace');
    const confirmBtn = document.getElementById('confirm-selection-btn');

    const backupDatabase = {
        "step1": { "text": "«Критическое падение маржинальности. Протокол нарушен. Требую обоснований, коммандер.»", "next_step": "step2" },
        "step2": { "text": "«Анализ ваших аргументов завершен. Корректировка стратегии Quantise принята. Переходим к финальной фазе интеграции финансового контура. Вы готовы развернуть главный узел?»", "next_step": "final" }
    };

    const responses = {
        analytics: "«Анализ данных подтвержден. Контур изолирован. Сканирование выявило 0 угроз. Доступ разрешен.»",
        fighter: "«Внимание! Попытка давления на судебные алгоритмы. Фиксация протокола агрессии. Ядро перегружено!»",
        diplomat: "«Параметры патча безопасности приняты к рассмотрению. Ожидаю завершения деплоя в течение 60 секунд.»",
        charismatic: "«Долгосрочная стратегия Quantise совпадает с вектором развития. Фиксация долгосрочных рисков снижена.»"
    };

    async function loadScenario() {
        try {
            const response = await fetch('../src/data/scenario.json');
            if (!response.ok) throw new Error('Ошибка');
            const data = await response.json(); database = data.scene2;
        } catch (error) { database = backupDatabase; }
        finally { if (robotFaceText && database && database[currentStep]) { robotFaceText.innerHTML = `<div class="ai-text-output">${database[currentStep].text}</div>`; updateTacticTexts(); } }
    }

    function updateTacticTexts() {
        document.getElementById('text-analytics').textContent = '«Инициировать экстренную перезагрузку финансового ядра и временно изолировать контур.»';
        document.getElementById('text-fighter').textContent = '«Отклонить обвинения. Системы Quantise работают в штатном автономном режиме, пресеките прессинг.»';
        document.getElementById('text-diplomat').textContent = '«Мы признаем просадку метрик, но группа инженеров уже разворачивает патч безопасности.»';
        document.getElementById('text-charismatic').textContent = '«Риск — это часть интеграции нового ИИ. Давайте смотреть на долгосрочную выгоду, а не на сиюминутные баги.»';
    }

    // ИСПРАВЛЕНО: Проверка сессии переписана так, чтобы она не сбрасывала данные при переключении шагов
    if (!localStorage.getItem('confession_stability_score')) {
        localStorage.setItem('confession_clicks_analytics', '0');
        localStorage.setItem('confession_clicks_fighter', '0');
        localStorage.setItem('confession_clicks_diplomat', '0');
        localStorage.setItem('confession_clicks_charismatic', '0');
        localStorage.setItem('confession_stability_score', '100');
    }

    loadScenario();

    // МЕХАНИКА ВЫБОРА РОЛИ
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (confirmBtn.classList.contains('selection-locked')) return;
            if (btn.classList.contains('revealed')) return;

            confirmBtn.removeAttribute('disabled');
            confirmBtn.classList.add('ready-to-submit');

            buttons.forEach(otherBtn => otherBtn.classList.remove('revealed'));
            tacticsBox.classList.add('has-chosen');
            btn.classList.add('revealed');

            selectedTactic = btn.getAttribute('data-tactic');
            robotFaceText.style.opacity = '0.2';
            
            setTimeout(() => {
                if (responses[selectedTactic]) { robotFaceText.innerHTML = `<div class="ai-text-output">${responses[selectedTactic]}</div>`; }
                robotFaceText.style.opacity = '1';
            }, 180);
        });
    });

    // ПОДТВЕРЖДЕНИЕ ВЫБОРА И ДИНАМИЧЕСКИЙ УРОН СТАБИЛЬНОСТИ
    confirmBtn.addEventListener('click', () => {
        if (confirmBtn.hasAttribute('disabled') || !database || confirmBtn.classList.contains('selection-locked')) return;

        if (selectedTactic) {
            const currentClicks = parseInt(localStorage.getItem(`confession_clicks_${selectedTactic}`) || '0', 10);
            localStorage.setItem(`confession_clicks_${selectedTactic}`, (currentClicks + 1).toString());

            let currentStability = parseInt(localStorage.getItem('confession_stability_score') || '100', 10);
            
            if (selectedTactic === 'fighter') {
                currentStability -= 25; 
            } else if (selectedTactic === 'charismatic') {
                currentStability -= 10; 
            }
            
            if (currentStability < 0) currentStability = 0;
            localStorage.setItem('confession_stability_score', currentStability.toString());
        }

        const nextStepKey = database[currentStep].next_step;

        if (nextStepKey && database[nextStepKey]) {
            currentStep = nextStepKey;
            robotFaceText.style.opacity = '0.1';
            
            setTimeout(() => {
                robotFaceText.innerHTML = `<div class="ai-text-output" style="color: #c084fc; text-shadow: 0 0 10px rgba(192,132,252,0.6);">${database[currentStep].text}</div>`;
                robotFaceText.style.opacity = '1';
                buttons.forEach(b => b.classList.remove('revealed'));
                tacticsBox.classList.remove('has-chosen');
                confirmBtn.setAttribute('disabled', 'true');
                confirmBtn.classList.remove('ready-to-submit');
            }, 400);

        } else {
            confirmBtn.classList.remove('ready-to-submit');
            confirmBtn.classList.add('selection-locked');
            confirmBtn.setAttribute('disabled', 'true');
            
            confirmBtn.style.background = 'linear-gradient(135deg, #042f1a 0%, #10b981 100%)';
            confirmBtn.style.borderColor = '#10b981';
            confirmBtn.style.boxShadow = '0 0 25px rgba(16, 185, 129, 0.6)';
            confirmBtn.querySelector('.confirm-btn-text').textContent = 'Фиксация данных...';
            
            robotFaceText.innerHTML = `<div class="ai-text-output" style="color: #ffffff;">[ СЦЕНАРИЙ УСПЕШНО ПРОЙДЕН. ФОРМИРОВАНИЕ ОТЧЕТА... ]</div>`;

            setTimeout(() => { window.location.href = './dashboard.html'; }, 1500);
        }
    });
});
