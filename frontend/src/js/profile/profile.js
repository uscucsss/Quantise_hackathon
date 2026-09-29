const API_BASE_URL = "/api_v1"; 

document.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem('user_id');
    if (!userId || userId === '0' || userId === 'null') {
        alert("Доступ запрещен. Пожалуйста, войдите в аккаунт.");
        window.location.href = "/pages/login.html";
        return;
    }
    fetchRealProfileData(userId);
    initControls(userId);
});

async function fetchRealProfileData(userId) {
    try {
        const response = await fetch(`${API_BASE_URL}/user/profile/${userId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) throw new Error('Ошибка обновления профиля');
        const data = await response.json();

        document.getElementById('user-nickname').innerText = data.nickname;
        document.getElementById('user-password').value = data.password;

        document.getElementById('total-wins').innerText = data.wins;
        document.getElementById('total-draws').innerText = data.draws;
        document.getElementById('total-losses').innerText = data.losses;

        renderGlobalMetrics(data.stats);
    } catch (error) {
        console.error("Сбой интеграции профиля:", error);
        document.getElementById('user-nickname').innerText = "Ошибка сервера";
    }
}

function renderGlobalMetrics(stats) {
    const finalAnalyst = stats.analyst || 0;
    const finalFighter = stats.fighter || 0;
    const finalDiplomat = stats.diplomat || 0;
    const finalCharismatic = stats.charismatic || 0;

    document.getElementById('pct-analyst').innerText = finalAnalyst + "%";
    document.getElementById('pct-fighter').innerText = finalFighter + "%";
    document.getElementById('pct-diplomat').innerText = finalDiplomat + "%";
    document.getElementById('pct-charismatic').innerText = finalCharismatic + "%";

    document.getElementById('bar-analyst').style.width = finalAnalyst + "%";
    document.getElementById('bar-fighter').style.width = finalFighter + "%";
    document.getElementById('bar-diplomat').style.width = finalDiplomat + "%";
    document.getElementById('bar-charismatic').style.width = finalCharismatic + "%";
}

function initControls(userId) {
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

    document.getElementById('logout-button').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('user_id'); 
        window.location.href = "/pages/login.html#login"; 
    });

    document.getElementById('delete-account-button').addEventListener('click', async (e) => {
        e.preventDefault();
        if (confirm("Вы уверены, что хотите полностью удалить аккаунт и всю историю игр безвозвратно?")) {
            try {
                const res = await fetch(`${API_BASE_URL}/user/profile/${userId}`, { 
                    method: 'DELETE' 
                });
                if (res.ok) {
                    localStorage.removeItem('user_id');
                    window.location.href = "/pages/login.html#register";
                } else {
                    alert("Ошибка сервера при попытке удаления.");
                }
            } catch (err) {
                console.error("Ошибка сети при удалении:", err);
            }
        }
    });
}
