let currentSessionId = null;
let activeScenarioId = "deadline_crisis"; 
let currentOptions = {}; 
let selectedArchetype = null;

let currentStageId = "step_1_greeting";
let currentStressVal = 20;
let currentAgreementVal = 30;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Вытаскиваем реальный ID сценария из параметров URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('scenario')) {
        activeScenarioId = urlParams.get('scenario');
    }

    // Жесткая привязка к кнопке-триггеру шторки и панели
    const menuToggleBtn = document.getElementById('menu-toggle-btn') || document.querySelector('.menu-trigger-btn');
    const sideMenuPanel = document.getElementById('side-menu-panel') || document.querySelector('.side-navigation-panel');
    const actionExit = document.querySelector('.btn-exit') || document.getElementById('action-exit');

    // Намертво убираем Пашину кнопку "Сохранить и выйти" из DOM, раз мы от неё отказались
    const actionSaveExit = document.querySelector('.btn-save') || document.getElementById('action-save-exit');
    if (actionSaveExit) {
        actionSaveExit.style.display = 'none';
    }

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
    }

    // Кнопка чистого выхода в лобби теперь работает со всеми селекторами
    if (actionExit) {
        actionExit.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Вы уверены, что хотите выйти в лобби? Прогресс симуляции будет сброшен.')) {
                window.location.href = '/pages/menu.html'; 
            }
        });
    }

    // Привязываемся к элементам 3D HUD-интерфейса
    const robotFaceText = document.getElementById('robotFace');
    const tacticsBox = document.querySelector('.tactics-box');
    const confirmBtn = document.getElementById('confirm-selection-btn');
    const speakerBadge = document.querySelector('.speaker-badge'); 
    
    let bossTypewriterTimeout;

    // Функция обновления шкал
    function updateMetricsDOM(metrics) {
        const keys = ['agreement', 'profit', 'stress', 'patience'];
        keys.forEach(key => {
            if (metrics[key] !== undefined) {
                const barEl = document.querySelector(`.metric-fill.${key}`);
                if (barEl) barEl.style.width = `${metrics[key]}%`;
            }
        });
    }

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

    // Динамическая генерация 4 высоких кнопок тактик
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

                if (speakerBadge) speakerBadge.textContent = "ИГРОК";
                selectedArchetype = arch.key;
            });

            tacticsBox.appendChild(btn);
        });
    }

    // Сетевой ход на бэкенд FastAPI
    async function makeTurn(isFirstRun = false) {
        if (!confirmBtn || !robotFaceText) return;

        confirmBtn.setAttribute('disabled', 'true');
        confirmBtn.classList.remove('ready-to-submit');
        
        const btnTextEl = confirmBtn.querySelector('.confirm-btn-text');
        if (btnTextEl) {
            btnTextEl.textContent = isFirstRun ? 'Синхронизация ИИ...' : 'Считывание директивы...';
        }

        const bodyData = {
            session_id: currentSessionId,
            user_id: parseInt(localStorage.getItem('user_id')) || 0,
            scenario_id: activeScenarioId,
            player_message: isFirstRun ? null : currentOptions[selectedArchetype],
            chosen_archetype: isFirstRun ? null : selectedArchetype,
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

            if (response.ok) {
                // ИСПРАВЛЕНО: Читаем JSON строго ПОСЛЕ проверки ответа и ДО использования переменной data!
                const data = await response.json();

                // ИСПРАВЛЕНО: Только убедившись, что данные долетели, сносим Пашины оверлеи загрузки
                const preloader = document.getElementById('app-preloader') || document.querySelector('.preloader-overlay');
                if (preloader) preloader.classList.add('fade-away');
                
                const lockOverlay = document.querySelector('.landscape-lock-overlay') || document.querySelector('.orientation-blocker-overlay');
                if (lockOverlay) {
                    lockOverlay.style.display = 'none';
                    lockOverlay.style.opacity = '0';
                    lockOverlay.style.pointerEvents = 'none';
                }

                currentSessionId = data.session_id;
                currentOptions = data.options;
                currentStageId = data.current_stage || currentStageId;
                currentStressVal = data.new_stress;
                currentAgreementVal = data.new_agreement;

                updateMetricsDOM({
                    agreement: data.new_agreement,
                    stress: data.new_stress,
                    profit: data.radar_metrics?.argumentation || 0,
                    patience: 100 - data.new_stress
                });

                if (data.game_status !== "in_progress") {
                    if (speakerBadge) speakerBadge.textContent = data.speaker || "КЛИЕНТ";
                    
                    typeWriterBoss(data.client_replica, robotFaceText, 8, () => {
                        confirmBtn.classList.remove('ready-to-submit');
                        confirmBtn.classList.add('selection-locked');
                        confirmBtn.setAttribute('disabled', 'true');
                        
                        if (btnTextEl) {
                            if (data.game_status === "win") {
                                confirmBtn.style.background = 'linear-gradient(135deg, #042f1a 0%, #10b981 100%)';
                                confirmBtn.style.borderColor = '#10b981';
                                btnTextEl.textContent = 'МИССИЯ УСПЕШНА';
                            } else {
                                confirmBtn.style.background = 'linear-gradient(135deg, #450a0a 0%, #ef4444 100%)';
                                confirmBtn.style.borderColor = '#ef4444';
                                btnTextEl.textContent = 'КОНТРАКТ РАЗОРВАН';
                            }
                        }
                        
                        if (tacticsBox) {
                            tacticsBox.innerHTML = `<div style="font-size:1.1rem;color:#c084fc;text-align:center;width:100%;font-weight:700;padding:20px;">[ АНАЛИЗ РЕЗУЛЬТАТА ]: ${data.feedback}</div>`;
                        }
                    });
                    return;
                }

                if (btnTextEl) btnTextEl.textContent = 'Подтвердить выбор';
                if (speakerBadge) speakerBadge.textContent = data.speaker || "КЛИЕНТ";
                
                clearTimeout(bossTypewriterTimeout);
                typeWriterBoss(data.client_replica, robotFaceText, 8, () => {
                    renderDynamicTactics(data.options); 
                });

            } else {
// Если бэкенд упал — скрываем лоадер, чтобы увидеть системную ошибку
                const preloader = document.getElementById('app-preloader') || document.querySelector('.preloader-overlay');
                if (preloader) preloader.classList.add('fade-away');
                robotFaceText.innerHTML = <div class="ai-text-output" style="color:#ff3b3b;">[ КРИТИЧЕСКАЯ ОШИБКА БЭКЕНДА ]</div>;}
            } catch (error) {const preloader = document.getElementById('app-preloader') || document.querySelector('.preloader-overlay');if (preloader) preloader.classList.add('fade-away');robotFaceText.innerHTML = <div class="ai-text-output" style="color:#ff3b3b;">[ ОШИБКА ПОДКЛЮЧЕНИЯ К СЕТИ ]</div>;console.error(error);}}if (confirmBtn) {confirmBtn.addEventListener('click', () => {if (selectedArchetype && !confirmBtn.classList.contains('selection-locked')) {makeTurn(false);}});}makeTurn(true);});
            