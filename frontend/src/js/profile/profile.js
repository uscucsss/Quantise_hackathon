//https://docs.google.com/document/d/16R4tewOn8N9vn74iG5B14q5oIjZLKiezJsVzn5NTjqk/edit?usp=sharing 
// кир.ха, на, чекни, там часть бред например про ссылки, но с состальным можно работать
const API_URL = "https://quantise-game.ru"; 

document.addEventListener('DOMContentLoaded', () => {
    // verifySession(); // Раскомментировать на бэке, когда настроите JWT
    fetchProfileData();
    initControls();
});

function verifySession() {
    if (!localStorage.getItem('authToken')) {
        window.location.href = "/frontend/pages/login.html"; 
    }
}

async function fetchProfileData() {
    // --- ВАРИАНТ А: ЗАГРУЗКА ЗАГЛУШКИ (РАБОТАЕТ СЕЙЧАС) ---
    try {
        const mockData = {
            nickname: "Ivan_Quantise",
            password: "SuperSecretPassword2026",
            gameHistory: [
                { result: "WIN",  stats: { charismatic: 90, fighter: 40, diplomat: 75, analyst: 60 } },
                { result: "DRAW", stats: { charismatic: 50, fighter: 85, diplomat: 40, analyst: 90 } },
                { result: "LOSS", stats: { charismatic: 30, fighter: 70, diplomat: 20, analyst: 40 } },
                { result: "WIN",  stats: { charismatic: 80, fighter: 50, diplomat: 65, analyst: 70 } }
            ]
        };
        
        document.getElementById('user-nickname').innerText = mockData.nickname;
        document.getElementById('user-password').value = mockData.password;
        renderGlobalAnalytics(mockData.gameHistory);
    } catch (e) {
        console.error(e);
    }

    // --- ВАРИАНТ Б: РЕАЛЬНЫЙ БЭКЕНД (РАСКОММЕНТИРОВАТЬ ДЛЯ ИНТЕГРАЦИИ С БД) ---
    /*
    const token = localStorage.getItem('authToken');
    try {
        const response = await fetch(`${API_URL}/user/profile`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error('Сессия устарела');
        
        const data = await response.json();
        document.getElementById('user-nickname').innerText = data.nickname;
        document.getElementById('user-password').value = data.password;
        renderGlobalAnalytics(data.gameHistory);
    } catch (error) {
        console.error(error);
        localStorage.removeItem('authToken');
        window.location.href = "/frontend/pages/login.html"; //Поставить нужный путь
    }
    */
}

function renderGlobalAnalytics(games) {
    let wins = 0, draws = 0, losses = 0;
    let avg = { charismatic: 0, fighter: 0, diplomat: 0, analyst: 0 };
    const total = games.length;

    games.forEach(game => {
        if (game.result === 'WIN') wins++;
        if (game.result === 'DRAW') draws++;
        if (game.result === 'LOSS') losses++;

        avg.charismatic += game.stats.charismatic;
        avg.fighter += game.stats.fighter;
        avg.diplomat += game.stats.diplomat;
        avg.analyst += game.stats.analyst;
    });

    document.getElementById('total-wins').innerText = wins;
    document.getElementById('total-draws').innerText = draws;
    document.getElementById('total-losses').innerText = losses;

    if (total > 0) {
        const finalAnalyst = Math.round(avg.analyst / total);
        const finalFighter = Math.round(avg.fighter / total);
        const finalDiplomat = Math.round(avg.diplomat / total);
        const finalCharismatic = Math.round(avg.charismatic / total);

        document.getElementById('pct-analyst').innerText = finalAnalyst + "%";
        document.getElementById('pct-fighter').innerText = finalFighter + "%";
        document.getElementById('pct-diplomat').innerText = finalDiplomat + "%";
        document.getElementById('pct-charismatic').innerText = finalCharismatic + "%";

        document.getElementById('bar-analyst').style.width = finalAnalyst + "%";
        document.getElementById('bar-fighter').style.width = finalFighter + "%";
        document.getElementById('bar-diplomat').style.width = finalDiplomat + "%";
        document.getElementById('bar-charismatic').style.width = finalCharismatic + "%";
    }
}

function initControls() {
    const passInput = document.getElementById('user-password');
    const eyeIcon = document.getElementById('eye-icon');
    
    document.getElementById('toggle-password').addEventListener('click', () => {
        if (passInput.type === 'password') {
            passInput.type = 'text';
            eyeIcon.innerHTML = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>`;
        } else {
            passInput.type = 'password';
            eyeIcon.innerHTML = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`;
        }
    });

    document.getElementById('logout-button').addEventListener('click', () => {
        localStorage.removeItem('authToken');
        window.location.href = "/frontend/index.html"; 
    });

    document.getElementById('delete-account-button').addEventListener('click', async () => {
        if (confirm("Вы уверены, что хотите полностью удалить профиль аккаунта?")) {
            /* Реальный запрос к БД:
            const token = localStorage.getItem('authToken');
            const res = await fetch(`${API_URL}/user/profile`, { 
                method: 'DELETE', 
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            if (res.ok) {
                localStorage.removeItem('authToken');
                window.location.href = "/register.html";
            }
            */
            alert("Профиль удален (режим заглушки)."); // При интеграции с БД удалить
        }
    });
}
