const ARCHETYPES = ["БОЕЦ", "АНАЛИТИК", "ДИПЛОМАТ", "ХАРИЗМА"];

const interviewSteps = {
    "question_1": {
        "boss": "Приветствую на симуляции жестких переговоров. Наша компания столкнулась со сливом конфиденциальных данных. Аудит указывает, что уязвимость закрыли именно вы, но с опозданием на 14 часов. Как объясните задержку?",
        "answers": {
            "БОЕЦ": { 
                "text": "Ответственность лежит целиком на отделе мониторинга, они передали мне тикет слишком поздно. Я не обязан следить за их косяками.", 
                "next": "boss_angry",
                "effects": { "agreement": -20, "profit": 0, "stress": +25, "patience": -30 }
            },
            "АНАЛИТИК": { 
                "text": "Масштаб атаки требовал кастомного патча. Быстрое шаблонное решение сломало бы всю сопутствующую бизнес-логику компании.", 
                "next": "boss_interested",
                "effects": { "agreement": +15, "profit": +10, "stress": +5, "patience": +5 }
            },
            "ДИПЛОМАТ": { 
                "text": "Я строго следовал внутреннему регламенту и ожидал официального согласования от службы безопасности, чтобы исключить юридические риски.", 
                "next": "boss_diplomatic",
                "effects": { "agreement": +25, "profit": -10, "stress": -10, "patience": +15 }
            },
            "ХАРИЗМА": { 
                "text": "Главное — уязвимость ликвидирована, а данные клиентов теперь под железобетонной защитой. Ошибки учтены, мы стали только сильнее!", 
                "next": "boss_interested",
                "effects": { "agreement": +10, "profit": +5, "stress": -5, "patience": 0 }
            }
        }
    },
    "boss_interested": {
        "boss": "Ваш ответ звучит убедительно. Тем не менее, совет директоров требует найти виновного для отчета. Готовы ли вы публично взять инцидент на себя в обмен на закрытый годовой бонус?",
        "answers": {
            "БОЕЦ": { 
                "text": "Исключено. Я буду официально защищать свою позицию перед советом директоров и не позволю сделать из себя козла отпущения.", 
                "next": "question_1",
                "effects": { "agreement": -15, "profit": -20, "stress": +20, "patience": -15 }
            },
            "АНАЛИТИК": { 
                "text": "Предлагаю переформатировать отчет для совета директоров: преподнести инцидент как плановое стресс-тестирование систем.", 
                "next": "question_1",
                "effects": { "agreement": +20, "profit": +25, "stress": -5, "patience": +10 }
            },
            "ДИПЛОМАТ": { 
                "text": "Я готов пойти навстречу руководству, если условия бонуса и репутационные компенсации будут зафиксированы документально.", 
                "next": "question_1",
                "effects": { "agreement": +15, "profit": +15, "stress": +10, "patience": +5 }
            },
            "ХАРИЗМА": { 
                "text": "Моя репутация и преданность продукту не продаются за бонусы. Мы найдем другое изящное решение этой проблемы.", 
                "next": "question_1",
                "effects": { "agreement": -5, "profit": -10, "stress": -10, "patience": +20 }
            }
        }
    },
    "boss_angry": {
        "boss": "Перекладывание вины на коллег — признак слабого специалиста. Вы не умеете работать в команде. На этом наше собеседование окончено.",
        "answers": {
            "БОЕЦ": { "text": "Я просто называю вещи своими именами. Начать симуляцию заново.", "next": "question_1", "effects": { "agreement": 0, "profit": 0, "stress": 0, "patience": 0 } },
            "АНАЛИТИК": { "text": "Позвольте предоставить детальные логи работы для переоценки ситуации.", "next": "question_1", "effects": { "agreement": 0, "profit": 0, "stress": 0, "patience": 0 } },
            "ДИПЛОМАТ": { "text": "Приношу извинения за резкость. Давайте вернемся к конструктивному диалогу.", "next": "question_1", "effects": { "agreement": 0, "profit": 0, "stress": 0, "patience": 0 } },
            "ХАРИЗМА": { "text": "Эмоции в сторону! Дайте мне еще один шанс показать истинный потенциал.", "next": "question_1", "effects": { "agreement": 0, "profit": 0, "stress": 0, "patience": 0 } }
        }
    },
    "boss_diplomatic": {
        "boss": "Следование регламенту сохранило нам юридическую чистоту, но компания потеряла крупную сумму денег из-за простоя. Как планируете оптимизировать этот процесс?",
        "answers": {
            "БОЕЦ": { "text": "Я лично перепишу регламент экстренных ситуаций и заставлю безопасность утвердить его.", "next": "boss_interested", "effects": { "agreement": -10, "profit": +10, "stress": +15, "patience": -10 } },
            "АНАЛИТИК": { "text": "Необходимо внедрить автоматические скрипты изоляции сегментов сети без ручных согласований.", "next": "boss_interested", "effects": { "agreement": +15, "profit": +20, "stress": -5, "patience": +5 } },
            "ДИПЛОМАТ": { "text": "Создать промежуточный протокол быстрого реагирования для СБ и лидов разработки.", "next": "boss_interested", "effects": { "agreement": +25, "profit": +5, "stress": -10, "patience": +20 } },
            "ХАРИЗМА": { "text": "Соберите команду на митинг, я синхронизирую отделы так, чтобы задержек больше никогда не возникало.", "next": "boss_interested", "effects": { "agreement": +10, "profit": 0, "stress": 0, "patience": +10 } }
        }
    }
};

let playerMetrics = {
    agreement: 50,
    profit: 50,
    stress: 20,
    patience: 80
};

document.addEventListener('DOMContentLoaded', () => {
    const bossSpeech = document.getElementById('boss-speech');
    const choicesContainer = document.getElementById('choices-container');
    const mainSubmitBtn = document.getElementById('main-submit-btn');
    const saveExitBtn = document.getElementById('save-exit-btn');
    
    let bossTypewriterTimeout;
    let nextStepTarget = null;
    let pendingEffects = null;

    function updateMetricsDOM() {
        for (let key in playerMetrics) {
            playerMetrics[key] = Math.max(0, Math.min(100, playerMetrics[key]));
            const barEl = document.getElementById(`bar-${key}`);
            const valEl = document.getElementById(`val-${key}`);
            if (barEl) barEl.style.width = `${playerMetrics[key]}%`;
            if (valEl) valEl.textContent = `${playerMetrics[key]}%`;
        }
    }

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

    if (mainSubmitBtn) {
        mainSubmitBtn.addEventListener('click', () => {
            if (nextStepTarget) {
                if (pendingEffects) {
                    for (let key in pendingEffects) {
                        playerMetrics[key] += pendingEffects[key];
                    }
                    updateMetricsDOM();
                }
                loadQuestion(nextStepTarget);
            }
        });
    }

    if (saveExitBtn) {
        saveExitBtn.addEventListener('click', () => {
            alert('Прогресс симуляции успешно сохранен в локальную сессию!');
        });
    }

    function loadQuestion(stepId) {
        clearTimeout(bossTypewriterTimeout);
        const currentStep = interviewSteps[stepId];
        if (!currentStep) return;

        choicesContainer.innerHTML = '';
        choicesContainer.style.opacity = '0.3';
        choicesContainer.style.pointerEvents = 'none';
        mainSubmitBtn.disabled = true;
        mainSubmitBtn.textContent = 'Ожидание ответа собеседника...';
        nextStepTarget = null;
        pendingEffects = null;

        typeWriterBoss(currentStep.boss, bossSpeech, 8, () => {
            choicesContainer.style.opacity = '1';
            choicesContainer.style.pointerEvents = 'auto';
            mainSubmitBtn.textContent = 'Выберите стратегию поведения';

            ARCHETYPES.forEach(type => {
                const windowDiv = document.createElement('div');
                windowDiv.classList.add('answer-window');

                const titleEl = document.createElement('span');
                titleEl.classList.add('archetype-title');
                titleEl.textContent = type;
                windowDiv.appendChild(titleEl);

                const stepDataForType = currentStep.answers[type];

                if (stepDataForType) {
                    const descEl = document.createElement('p');
                    descEl.classList.add('archetype-description');
                    windowDiv.appendChild(descEl);

                    windowDiv.addEventListener('click', () => {
                        if (windowDiv.classList.contains('active')) return;

                        document.querySelectorAll('.answer-window').forEach(el => {
                            el.classList.remove('active');
                            const title = el.querySelector('.archetype-title');
                            if (title) title.style.display = 'block';
                            const desc = el.querySelector('.archetype-description');
                            if (desc) desc.textContent = ''; 
                        });

                        windowDiv.classList.add('active');
                        titleEl.style.display = 'none';
                        descEl.textContent = stepDataForType.text;

                        nextStepTarget = stepDataForType.next;
                        pendingEffects = stepDataForType.effects;
                        mainSubmitBtn.disabled = false;
                        mainSubmitBtn.textContent = `Утвердить стратегию: ${type}`;
                    });
                } else {
                    windowDiv.style.opacity = '0.15';
                    windowDiv.style.cursor = 'not-allowed';
                }
                choicesContainer.appendChild(windowDiv);
            });
        });
    }

    updateMetricsDOM();
    loadQuestion('question_1');
});