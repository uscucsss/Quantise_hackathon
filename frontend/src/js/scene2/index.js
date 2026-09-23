let currentSessionId = null;
let activeScenarioId = "deadline_crisis"; 
let currentOptions = {}; 
let selectedArchetype = null;
let currentStageId = "step_1_greeting";
let currentStressVal = 20;
let currentAgreementVal = 30;


document.addEventListener('DOMContentLoaded', () => {
<<<<<<< Updated upstream
    // ==========================================================================
    // 01. АВТОНОМНЫЙ ТРИГГЕР МЕНЮ
    // ==========================================================================
=======
    // ПРОВЕРКА АВТОРИЗАЦИИ И РЕЖИМ ГОСТЯ
    let userId = localStorage.getItem('user_id');
    let isGuestMode = false;

    if (!userId) {
        // Выводим явное предупреждение пользователю
        const choice = confirm(
            "ВНИМАНИЕ: Вы не вошли в систему!\n\n" +
            "Если вы продолжите игру, активируется [РЕЖИМ ГОСТЯ]. Ваши радар-метрики, история диалогов и результаты переговоров НЕ будут сохранены в базу данных.\n\n" +
            "Нажмите 'ОК', чтобы играть как Гость.\n" +
            "Нажмите 'Отмена', чтобы вернуться на страницу авторизации."
        );

        if (choice) {
            isGuestMode = true;
            localStorage.setItem('user_id', '0'); // Временный маркер гостя для бэкенда
        } else {
            window.location.href = '/pages/login.html'; // Выкидываем на вход
            return;
        }
    }


    // Элементы выдвижного меню
>>>>>>> Stashed changes
    const menuToggleBtn = document.getElementById('menu-toggle-btn');
    const sideMenuPanel = document.getElementById('side-menu-panel');
    const actionExit = document.querySelector('.btn-exit');
    const actionSaveExit = document.querySelector('.btn-save');

<<<<<<< Updated upstream
    let currentStep = 'step1';
    let database = null;
    let selectedTactic = null;

=======
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
        if (actionExit) { actionExit.addEventListener('click', () => { if (confirm('Вы уверены?')) window.location.href = '../index.html'; }); }
        if (actionSaveExit) { actionSaveExit.addEventListener('click', () => { localStorage.setItem('scene2_saved_step', currentStep); alert('Сохранено!'); window.location.href = '../index.html'; }); }
    }

    // ==========================================================================
    // 02. СЕЛЕКТОРЫ УПРАВЛЕНИЯ КВЕСТОМ И НАЧАЛЬНЫЙ СБРОС МЕТРИК
    // ==========================================================================
    const buttons = document.querySelectorAll('.tactic-button');
    const tacticsBox = document.querySelector('.tactics-box');
=======

        if (actionExit) {
            actionExit.addEventListener('click', () => {
                if (confirm('Вы уверены, что хотите выйти? Прогресс текущего шага будет потерян.')) {
                    window.location.href = '/pages/menu.html'; 
                }
            });
        }

        if (actionSaveExit) {
            actionSaveExit.addEventListener('click', () => {
                alert('Прогресс симуляции успешно сохранен в системе Quantise!');
                window.location.href = '/pages/menu.html';
            });
        }
    }

    // Элементы 3D HUD-интерфейса
>>>>>>> Stashed changes
    const robotFaceText = document.getElementById('robotFace');
    const tacticsBox = document.querySelector('.tactics-box');
    const confirmBtn = document.getElementById('confirm-selection-btn');
<<<<<<< Updated upstream

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
=======
    const speakerBadge = document.querySelector('.speaker-badge'); // Плашка имени спикера
    
    let bossTypewriterTimeout;

    // Функция обновления шкал
    function updateMetricsDOM(metrics) {
        const keys = ['agreement', 'profit', 'stress', 'patience'];
        keys.forEach(key => {
            if (metrics[key] !== undefined) {
                const barEl = document.querySelector(`.metric-fill.${key}`);
                if (barEl) barEl.style.width = `${metrics[key]}%`;
            }
>>>>>>> Stashed changes
        });
    }

<<<<<<< Updated upstream
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
=======
    // Печатная машинка для экрана робота
    function typeWriterBoss(text, element, speed = 8, callback) {
        if (!element) return;
        element.style.opacity = '0.3'; 
        setTimeout(() => {
            element.innerHTML = `<div class="ai-text-output">${text}</div>`;
            element.style.opacity = '1';
            if (callback) callback();
        }, 150);
    }

    // Отрисовка 4 высоких кнопок тактик
    function renderDynamicTactics(options) {
        if (!tacticsBox || !confirmBtn) return;

        tacticsBox.innerHTML = ''; 
        tacticsBox.classList.remove('has-chosen');
        
        confirmBtn.setAttribute('disabled', 'true');
        confirmBtn.classList.remove('ready-to-submit');
        selectedArchetype = null;

        const archetypes = [
            { key: "АНАЛИТИК", roleClass: "role-analytics", label: "АНАЛИТИК" },
            { key: "БОЕЦ", roleClass: "role-fighter", label: "БОЕЦ" },
            { key: "ДИПЛОМАТ", roleClass: "role-diplomat", label: "ДИПЛОМАТ" },
            { key: "ХАРИЗМА", roleClass: "role-charismatic", label: "ХАРИЗМАТИК" }
        ];

        archetypes.forEach(arch => {
            const btn = document.createElement('div');
            btn.classList.add('tactic-button');
            btn.setAttribute('data-tactic', arch.key);

            const roleSpan = document.createElement('span');
            roleSpan.className = `tactic-role ${arch.roleClass}`;
            roleSpan.textContent = `[ ${arch.label} ]`;
            btn.appendChild(roleSpan);

            const textDiv = document.createElement('div');
            textDiv.classList.add('tactic-text-hidden');
            textDiv.textContent = options[arch.key] || "Данный вектор заблокирован.";
            btn.appendChild(textDiv);

            btn.addEventListener('click', () => {
                if (confirmBtn.classList.contains('selection-locked')) return;
                if (btn.classList.contains('revealed')) return;

                confirmBtn.removeAttribute('disabled');
                confirmBtn.classList.add('ready-to-submit');

                document.querySelectorAll('.tactic-button').forEach(b => b.classList.remove('revealed'));
                tacticsBox.classList.add('has-chosen');
                btn.classList.add('revealed');

                // ТУТ ИСПРАВЛЕНО: При выборе карточки подпись меняется на Игрока
                if (speakerBadge) speakerBadge.textContent = "Игрок";
                selectedArchetype = arch.key;
            });

            tacticsBox.appendChild(btn);
        });
    }

    // Сетевой ход на бэкенд
    async function makeTurn(isFirstRun = false) {
        if (!confirmBtn || !robotFaceText) return;

        confirmBtn.setAttribute('disabled', 'true');
        confirmBtn.classList.remove('ready-to-submit');
        confirmBtn.querySelector('.confirm-btn-text').textContent = isFirstRun ? 'Синхронизация ИИ...' : 'Считывание директивы...';

              const bodyData = {
         session_id: currentSessionId,
         user_id: parseInt(localStorage.getItem('user_id')) || 0,
         scenario_id: activeScenarioId,
         player_message: isFirstRun ? null : currentOptions[selectedArchetype],
         chosen_archetype: isFirstRun ? null : selectedArchetype,
         // Передаем текущие виртуальные параметры
         current_stage: currentStageId,
         stress: currentStressVal,
         agreement: currentAgreementVal
     };



        try {
            const response = await fetch('/game/chat', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyData)
            });

            const data = await response.json();

            if (response.ok) {
             currentSessionId = data.session_id;
             currentOptions = data.options;
             // ИСПРАВЛЕНО: Запоминаем новые шкалы и шаг для следующего хода гостя!
             currentStageId = data.current_stage || currentStageId;
             currentStressVal = data.new_stress;
             currentAgreementVal = data.new_agreement;


                updateMetricsDOM({
                    agreement: data.new_agreement,
                    stress: data.new_stress,
                    profit: data.radar_metrics.argumentation,
                    patience: 100 - data.new_stress
                });

                if (data.game_status !== "in_progress") {
                    // ТУТ ИСПРАВЛЕНО: При финале подпись остается за Антоном
                    if (speakerBadge) speakerBadge.textContent = "Антон";
                    
                    typeWriterBoss(data.client_replica, robotFaceText, 8, () => {
                        confirmBtn.classList.remove('ready-to-submit');
                        confirmBtn.classList.add('selection-locked');
                        confirmBtn.setAttribute('disabled', 'true');
                        
                        if (data.game_status === "win") {
                            confirmBtn.style.background = 'linear-gradient(135deg, #042f1a 0%, #10b981 100%)';
                            confirmBtn.style.borderColor = '#10b981';
                            confirmBtn.style.boxShadow = '0 0 25px rgba(16, 185, 129, 0.6)';
                            confirmBtn.querySelector('.confirm-btn-text').textContent = 'МИССИЯ УСПЕШНА';
                        } else {
                            confirmBtn.style.background = 'linear-gradient(135deg, #450a0a 0%, #ef4444 100%)';
                            confirmBtn.style.borderColor = '#ef4444';
                            confirmBtn.style.boxShadow = '0 0 25px rgba(239, 44, 68, 0.6)';
                            confirmBtn.querySelector('.confirm-btn-text').textContent = 'КОНТРАКТ РАЗОРВАН';
                        }
                        
                        if (tacticsBox) {
                            tacticsBox.innerHTML = `<div style="font-size:1.1rem;color:#c084fc;text-align:center;width:100%;font-weight:700;padding:20px;">[ АНАЛИЗ РЕЗУЛЬТАТА ]: ${data.feedback}</div>`;
                        }
                    });
                    return;
                }

                confirmBtn.querySelector('.confirm-btn-text').textContent = 'Подтвердить выбор';
                
                // ТУТ ИСПРАВЛЕНО: Когда Антон берет слово, плашка меняется на "Антон"
                if (speakerBadge) speakerBadge.textContent = data.speaker || "Антон";
                
                clearTimeout(bossTypewriterTimeout);
                typeWriterBoss(data.client_replica, robotFaceText, 8, () => {
                    renderDynamicTactics(data.options); 
                });

            } else {
                robotFaceText.innerHTML = `<div class="ai-text-output" style="color:#ff3b3b;">[ КРИТИЧЕСКАЯ ОШИБКА БЭКЕНДА ]</div>`;
            }
        } catch (error) {
            robotFaceText.innerHTML = `<div class="ai-text-output" style="color:#ff3b3b;">[ ОШИБКА ПОДКЛЮЧЕНИЯ К СЕТИ ]</div>`;
            console.error(error);
>>>>>>> Stashed changes
        }
    }

    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            if (selectedArchetype) makeTurn(false);
        });
    }

    makeTurn(true);
});
