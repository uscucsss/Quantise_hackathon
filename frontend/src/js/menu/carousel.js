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
    const rightPanel = document.querySelector('.right-panel');
    const scenariosList = document.querySelector('.scenarios-list');
    const titleElement = document.getElementById('currentStoryTitle');
    const treeZone = document.getElementById('treeFlowZone');

    if (!storiesData[storyId]) return;

    activeStoryId = storyId;
    currentActiveIndex = storyIds.indexOf(storyId);

    // Вращаем дугу вокруг зафиксированного центра
    if (rotationAngles[storyId] !== undefined) {
        scenariosList.style.transform = `translateY(-50%) rotate(${rotationAngles[storyId]}deg)`;
    }

    // Подсветка активной карточки
    document.querySelectorAll('.scenario-item').forEach(item => item.classList.remove('active'));
    const targetCard = document.getElementById(`item_${storyId}`);
    if (targetCard) targetCard.classList.add('active');

    // Плавное растворение
    rightPanel.classList.add('fade-out');

    setTimeout(() => {
        const story = storiesData[storyId];
        titleElement.innerText = story.title;
        treeZone.innerHTML = story.html; 
        rightPanel.classList.remove('fade-out');
    }, 200);
}

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
    // Проверяем, определен ли текущий активный сценарий
    const scenario = typeof activeStoryId !== 'undefined' ? activeStoryId : 'crisis';
    
    // Перенаправляем на новую страницу игры в той же папке
    window.location.href = `scene1.html?scenario=${scenario}`;
}
