document.addEventListener('DOMContentLoaded', () => {
    // ==========================================================================
    // 01. АВТОНОМНЫЙ ТРИГГЕР МЕНЮ (РАБОТАЕТ ПРИ ЛЮБЫХ УСЛОВИЯХ И ОШИБКАХ file:///)
    // ==========================================================================
    const menuToggleBtn = document.getElementById('menu-toggle-btn');
    const sideMenuPanel = document.getElementById('side-menu-panel');
    const actionExit = document.getElementById('action-exit');
    const actionSaveExit = document.getElementById('action-save-exit');

    if (menuToggleBtn && sideMenuPanel) {
        // Открытие и закрытие меню по клику на кнопку сверху слева
        menuToggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation(); // Предотвращаем мгновенное закрытие от глобального клика
            menuToggleBtn.classList.toggle('menu-open');   // Включает анимацию крестика
            sideMenuPanel.classList.toggle('panel-open'); // Выдвигает шторку меню
        });

        // Клик по любому пустому месту экрана вне меню — автоматически сворачивает шторку
        document.addEventListener('click', (e) => {
            if (!sideMenuPanel.contains(e.target) && !menuToggleBtn.contains(e.target)) {
                menuToggleBtn.classList.remove('menu-open');
                sideMenuPanel.classList.remove('panel-open');
            }
        });

        // Логика кнопки "Выйти" внутри панели
        if (actionExit) {
            actionExit.addEventListener('click', () => {
                if (confirm('Вы уверены, что хотите выйти? Прогресс текущего шага будет потерян.')) {
                    window.location.href = '../index.html'; // Выход в корень к главной
                }
            });
        }

        // Логика кнопки "Сохранить и выйти" внутри панели
        if (actionSaveExit) {
            actionSaveExit.addEventListener('click', () => {
                localStorage.setItem('scene2_saved_step', currentStep);
                alert('Прогресс симуляции успешно сохранен в системе Quantise!');
                window.location.href = '../index.html'; // Выход в корень к главной
            });
        }
    }

    // ==========================================================================
    // 02. СЕЛЕКТОРЫ УПРАВЛЕНИЯ КВЕСТОМ И ИНТЕРФЕЙСОМ ШКАЛ
    // ==========================================================================
    const buttons = document.querySelectorAll('.tactic-button');
    const tacticsBox = document.querySelector('.tactics-box');
    const robotFaceText = document.getElementById('robotFace');
    const confirmBtn = document.getElementById('confirm-selection-btn');
    
    let currentStep = 'step1';
    let database = null;
    let selectedTactic = null;

    // Локальная резервная копия на случай, если fetch-запрос заблокирован браузером
    const backupDatabase = {
        "step1": {
            "text": "«Критическое падение маржинальности. Протокол нарушен. Требую обоснований, коммандер.»",
            "next_step": "step2"
        },
        "step2": {
            "text": "«Анализ ваших аргументов завершен. Корректировка стратегии Quantise принята. Переходим к финальной фазе интеграции финансового контура. Вы готовы развернуть главный узел?»",
            "next_step": "final"
        }
    };

    // База ответов ИИ на выбранные тактики
    const responses = {
        analytics: "«Анализ данных подтвержден. Контур изолирован. Сканирование выявило 0 угроз. Доступ разрешен.»",
        fighter: "«Внимание! Попытка давления на судебные алгоритмы. Фиксация протокола агрессии. Ядро перегружено!»",
        diplomat: "«Параметры патча безопасности приняты к рассмотрению. Ожидаю завершения деплоя в течение 60 секунд.»",
        charismatic: "«Долгосрочная стратегия Quantise совпадает с вектором развития. Фиксация долгосрочных рисков снижена.»"
    };

    // ==========================================================================
    // 03. АСИНХРОННЫЙ ДВИЖОК ЗАГРУЗКИ СЦЕНАРИЯ С АВТО-БЭКАПОМ
    // ==========================================================================
    async function loadScenario() {
        try {
            const response = await fetch('../src/data/scenario.json');
            if (!response.ok) throw new Error('Локальный файл сценария не найден');
            const data = await response.json();
            database = data.scene2;
        } catch (error) {
            console.warn('Внимание: Запущена автономная резервная копия сценария из ОЗУ.');
            // Автоматически включаем встроенный бэкап, обходя блокировки file:///
            database = backupDatabase;
        } finally {
            if (robotFaceText && database && database[currentStep]) {
                robotFaceText.innerHTML = `<div class="ai-text-output">${database[currentStep].text}</div>`;
                updateTacticTexts();
            }
        }
    }

    // Подгрузка текстов внутрь увеличенных кнопок тактик
    function updateTacticTexts() {
        const textAnalytics = document.getElementById('text-analytics');
        const textFighter = document.getElementById('text-fighter');
        const textDiplomat = document.getElementById('text-diplomat');
        const textCharismatic = document.getElementById('text-charismatic');

        if (textAnalytics) textAnalytics.textContent = '«Инициировать экстренную перезагрузку финансового ядра и временно изолировать контур.»';
        if (textFighter) textFighter.textContent = '«Отклонить обвинения. Системы Quantise работают в штатном автономном режиме, пресеките прессинг.»';
        if (textDiplomat) textDiplomat.textContent = '«Мы признаем просадку метрик, но группа инженеров уже разворачивает патч безопасности.»';
        if (textCharismatic) textCharismatic.textContent = '«Риск — это часть интеграции нового ИИ. Давайте смотреть на долгосрочную выгоду, а не на сиюминутные баги.»';
    }

    // Инициализируем загрузку логов диалога
    loadScenario();

    // ==========================================================================
    // 04. МЕХАНИКА ДИНАМИЧЕСКОГО ПЕРЕКЛЮЧЕНИЯ РОЛЕЙ (РАСКРЫТИЕ КНОПОК)
    // ==========================================================================
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Если раунд уже зафиксирован зеленой кнопкой подтверждения, клики блокируются
            if (confirmBtn.classList.contains('selection-locked')) return;
            // Если игрок кликнул по уже открытой кнопке, повторно ничего не делаем
            if (btn.classList.contains('revealed')) return;

            // Активируем фиолетовую пульсирующую кнопку фиксации выбора
            confirmBtn.removeAttribute('disabled');
            confirmBtn.classList.add('ready-to-submit');

            // Сворачиваем текст у всех остальных кнопок
            buttons.forEach(otherBtn => otherBtn.classList.remove('revealed'));
            tacticsBox.classList.add('has-chosen');
            btn.classList.add('revealed');

            selectedTactic = btn.getAttribute('data-tactic');
            robotFaceText.style.opacity = '0.2'; // Эффект помех матрицы дисплея
            
            setTimeout(() => {
                if (responses[selectedTactic]) {
                    robotFaceText.innerHTML = `<div class="ai-text-output">${responses[selectedTactic]}</div>`;
                }
                robotFaceText.style.opacity = '1';
            }, 180);
        });
    });

    // ==========================================================================
    // 05. ПОДТВЕРЖДЕНИЕ ВЫБОРА: СЛЕДУЮЩИЙ ШАГ СЦЕНАРИЯ ИЗ JSON/БЭКАПА
    // ==========================================================================
    confirmBtn.addEventListener('click', () => {
        if (confirmBtn.hasAttribute('disabled') || !database || confirmBtn.classList.contains('selection-locked')) return;

        const nextStepKey = database[currentStep].next_step;

        if (nextStepKey && database[nextStepKey]) {
            // Переключаем текущий шаг сценария вперед
            currentStep = nextStepKey;
            robotFaceText.style.opacity = '0.1';
            
            setTimeout(() => {
                // Выводим следующий текст на монитор робота
                robotFaceText.innerHTML = `<div class="ai-text-output" style="color: #c084fc; text-shadow: 0 0 10px rgba(192,132,252,0.6);">${database[currentStep].text}</div>`;
                robotFaceText.style.opacity = '1';

                // Очищаем и сворачиваем кнопки тактик для нового раунда
                buttons.forEach(b => b.classList.remove('revealed'));
                tacticsBox.classList.remove('has-chosen');
                
                // Деактивируем кнопку фиксации ответа до тех пор, пока пользователь не сделает новый клик
                confirmBtn.setAttribute('disabled', 'true');
                confirmBtn.classList.remove('ready-to-submit');
            }, 400);

        } else {
            // Если все шаги диалога в сценарии исчерпаны — фиксируем финальное состояние
            confirmBtn.classList.remove('ready-to-submit');
            confirmBtn.classList.add('selection-locked');
            confirmBtn.setAttribute('disabled', 'true');
            
            // Кнопка переходит в постоянный зеленый неон [УСПЕШНО]
            confirmBtn.style.background = 'linear-gradient(135deg, #042f1a 0%, #10b981 100%)';
            confirmBtn.style.borderColor = '#10b981';
            confirmBtn.style.boxShadow = '0 0 25px rgba(16, 185, 129, 0.6)';
            confirmBtn.querySelector('.confirm-btn-text').textContent = 'Решение зафиксировано';
            confirmBtn.querySelector('.confirm-btn-text').style.color = '#ffffff';
            
            // Финальный отчет системы на экране андроида
            robotFaceText.innerHTML = `<div class="ai-text-output" style="color: #ffffff;">[ СЦЕНАРИЙ УСПЕШНО ПРОЙДЕН ]</div>`;
        }
    });
});
