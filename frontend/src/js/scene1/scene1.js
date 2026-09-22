let currentSessionId = null;
let activeScenarioId = "crisis"; // Значение по умолчанию, если в URL ничего нет
let currentOptions = {}; // Сюда сохраняем 4 текста развилок от ИИ
let selectedArchetype = null;

document.addEventListener('DOMContentLoaded', () => {
    // Автоматически вытаскиваем сценарий из строки браузера (например, ?scenario=deadline)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('scenario')) {
        activeScenarioId = urlParams.get('scenario');
    }

    const bossSpeech = document.getElementById('boss-speech');
    const choicesContainer = document.getElementById('choices-container');
    const mainSubmitBtn = document.getElementById('main-submit-btn');
    
    let bossTypewriterTimeout;

    // Функция отрисовки шкал на HTML-странице
    function updateMetricsDOM(metrics) {
        const keys = ['agreement', 'stress', 'profit', 'patience'];
        keys.forEach(key => {
            if (metrics[key] !== undefined) {
                const barEl = document.getElementById(`bar-${key}`);
                const valEl = document.getElementById(`val-${key}`);
                if (barEl) barEl.style.width = `${metrics[key]}%`;
                if (valEl) valEl.textContent = `${metrics[key]}%`;
            }
        });
    }

    // Эффект печатной машинки
    function typeWriterBoss(text, element, speed = 8, callback) {
        element.textContent = ''; 
        let i = 0;
        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                bossTypewriterTimeout = setTimeout(type, speed);
            } else if (callback) {
                callback();
            }
        }
        type();
    }

    // Функция, которая берет 4 варианта от ИИ и создает под них интерактивные карточки
    function renderDynamicCards(options) {
        choicesContainer.innerHTML = '';
        choicesContainer.style.opacity = '1';
        choicesContainer.style.pointerEvents = 'auto';
        mainSubmitBtn.textContent = 'Выберите стратегию поведения';
        mainSubmitBtn.disabled = true;
        selectedArchetype = null;

        const archetypes = ["БОЕЦ", "АНАЛИТИК", "ДИПЛОМАТ", "ХАРИЗМА"];

        archetypes.forEach(type => {
            const windowDiv = document.createElement('div');
            windowDiv.classList.add('answer-window');

            const titleEl = document.createElement('span');
            titleEl.classList.add('archetype-title');
            titleEl.textContent = type;
            windowDiv.appendChild(titleEl);

            const descEl = document.createElement('p');
            descEl.classList.add('archetype-description');
            windowDiv.appendChild(descEl);

            // Достаем сгенерированный нейросетью текст для этой карточки
            const optionText = options[type] || "Директор не оставил выбора для этой стратегии.";

            windowDiv.addEventListener('click', () => {
                document.querySelectorAll('.answer-window').forEach(el => {
                    el.classList.remove('active');
                    const title = el.querySelector('.archetype-title');
                    if (title) title.style.display = 'block';
                    const desc = el.querySelector('.archetype-description');
                    if (desc) desc.textContent = ''; 
                });

                windowDiv.classList.add('active');
                titleEl.style.display = 'none';
                
                descEl.textContent = optionText;
                selectedArchetype = type; // Запоминаем архетип

                mainSubmitBtn.disabled = false;
                mainSubmitBtn.textContent = `Утвердить стратегию: ${type}`;
            });

            choicesContainer.appendChild(windowDiv);
        });
    }

    // Сетевой запрос к FastAPI для совершения хода
    async function makeTurn(isFirstRun = false) {
        choicesContainer.style.opacity = '0.3';
        choicesContainer.style.pointerEvents = 'none';
        mainSubmitBtn.disabled = true;
        mainSubmitBtn.textContent = isFirstRun ? 'Инициализация симуляции...' : 'Ожидание ответа ИИ...';

        const bodyData = {
            session_id: currentSessionId,
            scenario_id: activeScenarioId,
            player_message: isFirstRun ? null : currentOptions[selectedArchetype],
            chosen_archetype: isFirstRun ? null : selectedArchetype
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
                currentOptions = data.options; // Обновляем пул вариантов

                updateMetricsDOM({
                    agreement: data.new_agreement,
                    stress: data.new_stress,
                    profit: data.radar_metrics.argumentation,
                    patience: 100 - data.new_stress
                });

                // Обработка условий победы/поражения
                if (data.game_status !== "in_progress") {
                    typeWriterBoss(data.client_replica, bossSpeech, 8, () => {
                        mainSubmitBtn.textContent = data.game_status === "win" ? "ПОБЕДА!" : "ИГРА ОКОНЧЕНА";
                        choicesContainer.innerHTML = `<div style="font-size:20px;color:#a78bfa;text-align:center;width:100%;padding:20px;">${data.feedback}</div>`;
                    });
                    return;
                }

                // Выводим новую фразу директора
                clearTimeout(bossTypewriterTimeout);
                typeWriterBoss(data.client_replica, bossSpeech, 8, () => {
                    renderDynamicCards(data.options);
                });

            } else {
                bossSpeech.textContent = "Ошибка сервера при генерации развилки.";
            }
        } catch (error) {
            bossSpeech.textContent = "Не удалось связаться с сервером игры.";
            console.error(error);
        }
    }

    if (mainSubmitBtn) {
        mainSubmitBtn.addEventListener('click', () => makeTurn(false));
    }

    // Первый автоматический запуск при входе на страницу, чтобы ИИ выдал приветственный наезд
    makeTurn(true);
});
