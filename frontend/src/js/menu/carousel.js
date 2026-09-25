// База данных разветвленных горизонтальных графов развилок
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

const rotationAngles = { crisis: 36, deadline: 18, check: 0, budget: -18, final: -36 };

function loadStoryTree(storyId) {
    const mainStartBtn = document.getElementById('startSimBtn') || document.querySelector('.main-action-btn');
    const rightPanel = document.querySelector('.right-panel');
    const scenariosList = document.querySelector('.scenarios-list');
    const titleElement = document.getElementById('currentStoryTitle');
    const treeZone = document.getElementById('treeFlowZone');

    const isLocked = (storyId === 'budget' || storyId === 'final');

    if (!storiesData[storyId] && !isLocked) return;

    activeStoryId = storyId; // Исправлено: пишем в глобальный activeStoryId
    currentActiveIndex = storyIds.indexOf(storyId);

    if (rotationAngles[storyId] !== undefined && scenariosList) {
        scenariosList.style.transform = `translateY(-50%) rotate(${rotationAngles[storyId]}deg)`;
    }

    document.querySelectorAll('.scenario-item').forEach(item => item.classList.remove('active'));
    const targetCard = document.getElementById(`item_${storyId}`);
    if (targetCard) targetCard.classList.add('active');

    if (isLocked) {
        if (titleElement) titleElement.innerText = "МОДУЛЬ В РАЗРАБОТКЕ";
        if (treeZone) treeZone.innerHTML = ''; 
        
        if (mainStartBtn) {
            mainStartBtn.innerText = "В РАЗРАБОТКЕ";
            mainStartBtn.disabled = true;
            mainStartBtn.style.background = "#2a2440"; 
            mainStartBtn.style.color = "rgba(255,255,255,0.2)";
            mainStartBtn.style.cursor = "not-allowed";
            mainStartBtn.style.pointerEvents = "none";
        }
    } else {
        if (rightPanel) rightPanel.classList.add('fade-out');

        setTimeout(() => {
            const story = storiesData[storyId];
            if (titleElement) titleElement.innerText = story.title;
            if (treeZone) treeZone.innerHTML = story.html;
            if (rightPanel) rightPanel.classList.remove('fade-out');

            if (mainStartBtn) {
                mainStartBtn.innerText = "НАЧАТЬ СИМУЛЯЦИЮ";
                mainStartBtn.disabled = false;
                mainStartBtn.style.background = ""; 
                mainStartBtn.style.color = "";
                mainStartBtn.style.cursor = "pointer";
                mainStartBtn.style.pointerEvents = "auto";
            }
        }, 200);
    }
}

// ПЕРЕХВАТЧИК КОЛЕСИКА МЫШИ ДЛЯ РАДИАЛЬНОГО ВРАЩЕНИЯ
window.addEventListener('wheel', function(event) {
    const leftPanel = document.querySelector('.left-panel');
    if (!leftPanel || !leftPanel.contains(event.target)) return;

    event.preventDefault(); 

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

// --- УНИВЕРСАЛЬНЫЙ РОУТЕР ДЛЯ СЦЕНЫ 3 ---
function startActiveSimulation() {
    let targetScenarioJsonId = "deadline_crisis"; // По умолчанию Антон

    if (activeStoryId === "crisis") {
        targetScenarioJsonId = "crisis_management"; // Сложный Михаил (Кризис)
    } else if (activeStoryId === "check") {
        targetScenarioJsonId = "price_increase"; // Средняя Елена (Повышение чека)
    }

    // НАМЕРТВО отправляем все 3 сценария на scene3.html
    window.location.href = `/pages/scene3.html?scenario=${targetScenarioJsonId}`;
}


document.addEventListener("DOMContentLoaded", function() {
    loadStoryTree('crisis'); // Стартуем с кризиса
    
    // Вешаем обработчик клика на главную кнопку ОДИН РАЗ и намертво
    const startBtn = document.getElementById('startSimBtn') || document.querySelector('.main-action-btn');
    if (startBtn) {
        startBtn.addEventListener('click', startActiveSimulation);
    }
});
