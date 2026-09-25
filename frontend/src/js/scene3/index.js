let gameState = { agree: 50, profit: 40, stress: 15, patience: 100 };

const dialogueDatabase = {
    analytics: {
        speech: "«Ваши цифры аудита выглядят убедительно. Однако клиенты всё равно высказали недовольство. Какие регламенты вы измените?»",
        agree: +10, profit: 0, stress: -5, patience: +5
    },
    force: {
        speech: "«Юридическая чистота — это хорошо, но вы забываете, что наш бизнес строится на лояльности, а не на сухих законах!»",
        agree: -15, profit: +10, stress: +25, patience: -30
    },
    diplomacy: {
        speech: "«Разделение рисков — это конструктивно. Давайте обсудим конкретные проценты ответственности в доп. соглашении.»",
        agree: +20, profit: -10, stress: 0, patience: +15
    },
    charisma: {
        speech: "«Ваша уверенность подкупает, и видение сверхприбыли звучит заманчиво. Но где гарантии, что команда не совершит ту же ошибку завтра?»",
        agree: +15, profit: +5, stress: -10, patience: 0
    }
};

let selectedTactic = null;

document.addEventListener("DOMContentLoaded", () => {
    updateUIBars();
    setupEventListeners();
});

function updateUIBars() {
    for (let key in gameState) gameState[key] = Math.max(0, Math.min(100, gameState[key]));
    
    document.getElementById("kpi-agree").style.width = gameState.agree + "%";
    document.getElementById("kpi-profit").style.width = gameState.profit + "%";
    document.getElementById("kpi-stress").style.width = gameState.stress + "%";
    document.getElementById("kpi-patience").style.width = gameState.patience + "%";

    document.getElementById("val-agree").innerText = gameState.agree + "%";
    document.getElementById("val-profit").innerText = gameState.profit + "%";
    document.getElementById("val-stress").innerText = gameState.stress + "%";
    document.getElementById("val-patience").innerText = gameState.patience + "%";
}

function setupEventListeners() {
    const buttons = document.querySelectorAll(".tactic-item-btn");
    const confirmBtn = document.getElementById("confirm-btn");

    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            buttons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            selectedTactic = btn.getAttribute("data-tactic");
            confirmBtn.disabled = false;
        });
    });

    confirmBtn.addEventListener("click", () => {
        if (!selectedTactic || !dialogueDatabase[selectedTactic]) return;
        const effect = dialogueDatabase[selectedTactic];
        gameState.agree += effect.agree;
        gameState.profit += effect.profit;
        gameState.stress += effect.stress;
        gameState.patience += effect.patience;
        updateUIBars();
        document.getElementById("text-output").innerText = effect.speech;
        confirmBtn.disabled = true;
        buttons.forEach(b => b.classList.remove("active"));
        selectedTactic = null;
    });
}
// Плавное скрытие экрана загрузки через 2 секунды после старта
setTimeout(() => {
    const preloader = document.getElementById('app-preloader');
    if (preloader) preloader.classList.add('fade-away');
}, 1500); // 2000 миллисекунд = 2 секунды (хватит для вау-эффекта и подгрузки ассетов)
