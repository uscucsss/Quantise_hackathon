// База данных разветвленных горизонтальных графов розвилок
const storiesData = {
    crisis: {
        title: "Кризис-менеджмент (Дерево развилок)",
        html: `
            <div class="tree-branch-level" style="display: flex; align-items: center; gap: 20px;">
                <div class="tree-node-card current">
                    <div class="node-number">Шаг 01</div>
                    <h4>Паника клиента</h4>
                    <div class="node-tactics"><span class="tactic-tag diplomat">Дипломатия</span></div>
                </div>
                <div class="tree-connector-line"></div>
                <div class="tree-node-card locked">
                    <div class="node-number">Шаг 02</div>
                    <h4>Стабилизация контракта</h4>
                </div>
            </div>
        `
    },
    deadline: {
        title: "Сдвиг дедлайнов (Дерево развилок)",
        html: `
            <div class="tree-branch-level" style="display: flex; align-items: center; gap: 20px;">
                <div class="tree-node-card current">
                    <div class="node-number">Шаг 01</div>
                    <h4>Старт переговоров</h4>
                    <div class="node-tactics"><span class="tactic-tag analyst">Аналитика</span><span class="tactic-tag fighter">Давление</span></div>
                </div>
                <div class="tree-connector-line"></div>
                <div class="tree-column-branches" style="display: flex; flex-direction: column; gap: 20px;">
                    <div class="tree-node-card reached"><h4>Ветка А: Компромисс</h4></div>
                    <div class="tree-node-card reached"><h4>Ветка Б: Штрафы</h4></div>
                </div>
            </div>
        `
    },
    check: {
        title: "Повышение чека (Дерево развилок)",
        html: `
            <div class="tree-branch-level" style="display: flex; align-items: center; gap: 20px;">
                <div class="tree-node-card current">
                    <div class="node-number">Шаг 01</div>
                    <h4>Аргументация цены</h4>
                    <div class="node-tactics"><span class="tactic-tag charismatic">Обаяние</span></div>
                </div>
                <div class="tree-connector-line"></div>
                <div class="tree-node-card locked">
                    <div class="node-number">Шаг 02</div>
                    <h4>Новое доп. соглашение</h4>
                </div>
            </div>
        `
    },
    budget: {
        title: "Правки бюджета (Дерево развилок)",
        html: `
            <div class="tree-branch-level" style="display: flex; align-items: center; gap: 20px;">
                <div class="tree-node-card current">
                    <div class="node-number">Шаг 01</div>
                    <h4>Срез сметы на 30%</h4>
                    <div class="node-tactics"><span class="tactic-tag fighter">Давление</span></div>
                </div>
                <div class="tree-connector-line dashed"></div>
                <div class="tree-node-card locked">
                    <div class="node-number">Шаг 02</div>
                    <h4>Фиксация маржи</h4>
                </div>
            </div>
        `
    },
    final: {
        title: "Финальный контракт (Дерево развилок)",
        html: `
            <div class="tree-branch-level" style="display: flex; align-items: center; gap: 20px;">
                <div class="tree-node-card current">
                    <div class="node-number">Шаг 01</div>
                    <h4>Защита SLA</h4>
                    <div class="node-tactics"><span class="tactic-tag analyst">Аналитика</span></div>
                </div>
            </div>
        `
    }
};

const storyIds = ['crisis', 'deadline', 'check', 'budget', 'final'];
let currentActiveIndex = 0;
let activeStoryId = "crisis";

// Новые точные углы сжатия дуги
const rotationAngles = { crisis: 36, deadline: 18, check: 0, budget: -18, final: -36 };

function loadStoryTree(storyId) {
    const mainStartBtn = document.getElementById('startSimBtn');
    const rightPanel = document.querySelector('.right-panel');
    const scenariosList = document.querySelector('.scenarios-list');
    const titleElement = document.getElementById('currentStoryTitle');
    const treeZone = document.getElementById('treeFlowZone');

    // 1. ПРОВЕРКА НАЛИЧИЯ ДАННЫХ ДЛЯ ОБЫЧНЫХ СЦЕНАРИЕВ
    // Если это закрытые модули, которых нет в базе, мы НЕ делаем вылет из функции, а даем карусели прокрутиться
    const isLocked = (storyId === 'budget' || storyId === 'final');

    if (!storiesData[storyId] && !isLocked) return;

    // 2. ВОЗВРАЩАЕМ ПАШИНУ МАТЕМАТИКУ ИНДЕКСОВ И ВРАЩЕНИЯ (Колесо больше не заклинит)
    activeStory = storyId;
    currentActiveIndex = storyIds.indexOf(storyId);

    if (rotationAngles[storyId] !== undefined && scenariosList) {
        scenariosList.style.transform = `translateY(-50%) rotate(${rotationAngles[storyId]}deg)`;
    }

    document.querySelectorAll('.scenario-item').forEach(item => item.classList.remove('active'));
    const targetCard = document.getElementById(`item_${storyId}`);
    if (targetCard) targetCard.classList.add('active');

    // 3. БЛОК УПРАВЛЕНИЯ КНОПКОЙ И ДЕРЕВОМ (Разделяем логику открытых и закрытых)
    if (isLocked) {
        if (titleElement) titleElement.innerText = "МОДУЛЬ В РАЗРАБОТКЕ";
        if (treeZone) treeZone.innerHTML = ''; // Очищаем дерево
        
        if (mainStartBtn) {
            mainStartBtn.innerText = "В РАЗРАБОТКЕ";
            mainStartBtn.disabled = true;
            mainStartBtn.style.background = "#2a2440"; // Серый цвет
            mainStartBtn.style.color = "rgba(255,255,255,0.2)";
            mainStartBtn.style.cursor = "pointer";
            mainStartBtn.onclick = null;
        }
    } else {
        // Логика плавного переключения для ОТКРЫТЫХ сценариев
        if (rightPanel) rightPanel.classList.add('fade-out');

        setTimeout(() => {
            const story = storiesData[storyId];
            if (titleElement) titleElement.innerText = story.title;
            if (treeZone) treeZone.innerHTML = story.html;
            if (rightPanel) rightPanel.classList.remove('fade-out');

            if (mainStartBtn) {
                mainStartBtn.innerText = "НАЧАТЬ СИМУЛЯЦИЮ";
                mainStartBtn.disabled = false;
                mainStartBtn.style.background = ""; // Возвращаем фиолетовый из CSS
                mainStartBtn.style.color = "";
                mainStartBtn.style.cursor = "pointer";
                
                // Перенаправление на нужные страницы
                mainStartBtn.onclick = () => {
                    if (storyId === 'final') {
                        window.location.href = 'scene1.html'; // Твой готовый дашборд
                    } else {
                        window.location.href = `${storyId}.html`;
                    }
                };
            }
        }, 200);
    }
}
    // Подсветка активной карточки
    document.querySelectorAll('.scenario-item').forEach(item => item.classList.remove('active'));
// ПЕРЕХВАТЧИК КОЛЕСИКА МЫШИ ДЛЯ РАДИАЛЬНОГО ВРАЩЕНИЯ
window.addEventListener('wheel', function(event) {
    const leftPanel = document.querySelector('.left-panel');
    if (!leftPanel || !leftPanel.contains(event.target)) return;

    event.preventDefault(); // Блокируем скролл сайта

    if (event.deltaY > 0) {
        if (currentActiveIndex < storyIds.length - 1) {
            currentActiveIndex++;
            loadStoryTree(storyIds[currentActiveIndex]);
        }
    } else {
        if (currentActiveIndex > 0) {
            currentActiveIndex--;
            loadStoryTree(storyIds[currentActiveIndex]);
        }
    }
}, { passive: false });

function startActiveSimulation() {
    window.location.href = `chat.html?scenario=${activeStoryId}`;
}

document.addEventListener("DOMContentLoaded", function() {
    loadStoryTree('crisis'); // Стартуем с легкого уровня по центру
});
// Автоматический блокиратор кнопки для закрытых сценариев
setInterval(() => {
    // 1. Находим Пашину кнопку "Начать симуляцию" по тексту
    const startBtn = document.querySelector('.main-action-btn') || document.querySelector('button'); 
    const titleElement = document.getElementById('currentStoryTitle');

    if (!startBtn || !titleElement) return;

    // 2. Если заголовок сменился на статус разработки
    if (titleElement.innerText.includes("В РАЗРАБОТКЕ")) {
        startBtn.innerText = "В РАЗРАБОТКЕ";
        startBtn.disabled = true;
        
        // Отключаем клики и красим в строгий серый цвет
        startBtn.style.pointerEvents = "none";
        startBtn.style.background = "rgba(255, 255, 255, 0.05)";
        startBtn.style.color = "rgba(255, 255, 255, 0.2)";
        startBtn.style.border = "1px solid rgba(255, 255, 255, 0.05)";
        startBtn.style.boxShadow = "none";
        startBtn.style.cursor = "not-allowed";
    } else {
        // Если сценарий открыт — возвращаем оригинальный рабочий фиолетовый вид Паши
        startBtn.innerText = "НАЧАТЬ СИМУЛЯЦИЮ";
        startBtn.disabled = false;
        startBtn.style.pointerEvents = "auto";
        startBtn.style.background = ""; // Возвращает фиолетовый цвет из CSS
        startBtn.style.color = "";
        startBtn.style.border = "";
        startBtn.style.boxShadow = "";
        startBtn.style.cursor = "pointer";
        
        // Привязываем переход на нашу новую шикарную фиолетовую сцену при выборе финального контракта
        startBtn.onclick = () => {
            if (titleElement.innerText.includes("Финальный контракт")) {
                window.location.href = "scene1.html"; // Твой готовый дашборд
            }
        };
    }
}, 100); // Проверка работает непрерывно каждые 100 миллисекунд

