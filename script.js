document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const screens = {
        home: document.getElementById('home-screen'),
        instructions: document.getElementById('instruction-screen'),
        setup: document.getElementById('setup-screen'),
        quiz: document.getElementById('quiz-screen'),
        result: document.getElementById('result-screen')
    };

    // Buttons & Inputs
    const ui = {
        modeCards: document.querySelectorAll('.mode-card'),
        instructionText: document.getElementById('instruction-text'),
        gotoSetupBtn: document.getElementById('goto-setup-btn'),
        backBtns: document.querySelectorAll('.back-btn'),
        setupModeName: document.getElementById('setup-mode-name'),
        questionCountInput: document.getElementById('question-count'),
        startGameBtn: document.getElementById('start-game-btn'),

        // Quiz UI
        currentQ: document.getElementById('current-q'),
        totalQ: document.getElementById('total-q'),
        scoreDisplay: document.getElementById('score-display'),
        questionLetter: document.getElementById('question-letter'),
        inputInstruction: document.getElementById('input-instruction'),
        typedDisplay: document.getElementById('typed-display'),
        inputContainer: document.getElementById('input-container'),

        // Result UI
        finalScore: document.getElementById('final-score'),
        finalTotal: document.getElementById('final-total'),
        homeBtn: document.getElementById('home-btn')
    };

    // --- State ---
    const state = {
        currentMode: null, // 'opposite' or 'places'
        totalQuestions: 30,
        currentQuestionIndex: 0,
        score: 0,
        currentLetter: '',
        currentTypedInput: '', // For numpad mode
        isAcceptingInput: false
    };

    // --- Configurations ---
    const modes = {
        opposite: {
            title: "Opposite Letters",
            instructions: "You will be shown a letter. Identify its <strong>reverse pair</strong> in the alphabet (e.g., A ↔ Z, B ↔ Y, M ↔ N).<br><br>Use the <strong>Alphabet Keypad</strong> to select your answer.",
            inputMethod: 'alphabet',
            getQuestionInstruction: () => "Select the opposite letter",
            getAnswer: (char) => {
                const code = char.charCodeAt(0);
                return String.fromCharCode(155 - code); // A(65)+Z(90)=155
            }
        },
        places: {
            title: "Letter Places",
            instructions: "You will be shown a letter. Identify its <strong>numerical position</strong> in the alphabet (e.g., A = 1, S = 19, Z = 26).<br><br>Use the <strong>Phone Dialer</strong> to type the number. It will <strong>automatically submit</strong> when you type the correct number of digits.",
            inputMethod: 'numpad',
            getQuestionInstruction: () => "Enter the position (1-26)",
            getAnswer: (char) => {
                return (char.charCodeAt(0) - 64).toString(); // A(65)-64 = 1
            }
        }
    };

    // --- Navigation ---
    const showScreen = (screenName) => {
        Object.values(screens).forEach(s => {
            s.classList.remove('active');
            s.classList.add('hidden');
        });
        screens[screenName].classList.remove('hidden');
        screens[screenName].classList.add('active');
    };

    // --- Setup & Start ---
    ui.modeCards.forEach(card => {
        card.addEventListener('click', () => {
            state.currentMode = card.dataset.mode;
            const modeConfig = modes[state.currentMode];

            ui.instructionText.innerHTML = modeConfig.instructions;
            ui.setupModeName.textContent = modeConfig.title;

            showScreen('instructions');
        });
    });

    ui.gotoSetupBtn.addEventListener('click', () => showScreen('setup'));

    ui.backBtns.forEach(btn => btn.addEventListener('click', () => {
        // Simple back logic: if in setup/instructions, go home. 
        showScreen('home');
    }));

    ui.startGameBtn.addEventListener('click', startGame);
    ui.homeBtn.addEventListener('click', () => showScreen('home'));

    // --- Game Logic ---
    function startGame() {
        state.totalQuestions = parseInt(ui.questionCountInput.value) || 30;
        state.totalQuestions = Math.max(1, Math.min(50, state.totalQuestions));

        state.currentQuestionIndex = 0;
        state.score = 0;

        ui.totalQ.textContent = state.totalQuestions;
        ui.scoreDisplay.textContent = '0';
        ui.inputInstruction.textContent = modes[state.currentMode].getQuestionInstruction();

        setupInputMethod();
        showScreen('quiz');
        nextQuestion();
    }

    function setupInputMethod() {
        ui.inputContainer.innerHTML = '';
        state.currentTypedInput = '';
        ui.typedDisplay.textContent = '';

        if (modes[state.currentMode].inputMethod === 'alphabet') {
            ui.typedDisplay.classList.add('hidden');
            createAlphabetKeypad();
        } else {
            ui.typedDisplay.classList.remove('hidden');
            createNumpad();
        }
    }

    function createAlphabetKeypad() {
        const grid = document.createElement('div');
        grid.className = 'keypad-grid';

        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
        letters.forEach(letter => {
            const btn = document.createElement('button');
            btn.className = 'key-btn';
            btn.textContent = letter;
            btn.dataset.value = letter;
            btn.addEventListener('click', () => handleAlphabetInput(letter, btn));
            grid.appendChild(btn);
        });
        ui.inputContainer.appendChild(grid);
    }

    function createNumpad() {
        const grid = document.createElement('div');
        grid.className = 'numpad-grid';

        // 1-9
        for (let i = 1; i <= 9; i++) {
            const btn = document.createElement('button');
            btn.className = 'num-btn';
            btn.textContent = i;
            btn.addEventListener('click', () => handleRangeInput(i.toString()));
            grid.appendChild(btn);
        }

        // 0
        const zeroBtn = document.createElement('button');
        zeroBtn.className = 'num-btn span-two'; // Span 2 columns
        zeroBtn.textContent = '0';
        zeroBtn.addEventListener('click', () => handleRangeInput('0'));
        grid.appendChild(zeroBtn);

        // Delete
        const delBtn = document.createElement('button');
        delBtn.className = 'num-btn delete-btn';
        delBtn.innerHTML = '⌫'; // Backspace symbol
        delBtn.addEventListener('click', () => handleRangeInput('DEL'));
        grid.appendChild(delBtn);

        ui.inputContainer.appendChild(grid);
    }

    function nextQuestion() {
        if (state.currentQuestionIndex >= state.totalQuestions) {
            endGame();
            return;
        }

        state.currentQuestionIndex++;
        ui.currentQ.textContent = state.currentQuestionIndex;

        state.currentLetter = getRandomLetter();
        ui.questionLetter.textContent = state.currentLetter;

        // Reset inputs
        state.currentTypedInput = '';
        ui.typedDisplay.textContent = '';

        // Instant transition (No animation)
        ui.questionLetter.parentElement.style.transform = 'scale(1)';
        ui.questionLetter.parentElement.style.opacity = '1';

        state.isAcceptingInput = true;
    }

    function getRandomLetter() {
        const code = Math.floor(Math.random() * 26) + 65;
        return String.fromCharCode(code);
    }

    // --- Input Handlers ---
    function handleAlphabetInput(input, btnElement) {
        if (!state.isAcceptingInput) return;
        state.isAcceptingInput = false;

        const correct = modes[state.currentMode].getAnswer(state.currentLetter);

        if (input === correct) {
            handleCorrect(btnElement);
        } else {
            handleWrong(btnElement);
        }
    }

    function handleRangeInput(action) {
        if (!state.isAcceptingInput) return;

        if (action === 'DEL') {
            state.currentTypedInput = state.currentTypedInput.slice(0, -1);
            ui.typedDisplay.textContent = state.currentTypedInput;
            return;
        }

        // Is number
        if (state.currentTypedInput.length < 2) {
            state.currentTypedInput += action;
            ui.typedDisplay.textContent = state.currentTypedInput;

            checkAutoSubmit();
        }
    }

    function checkAutoSubmit() {
        const correct = modes[state.currentMode].getAnswer(state.currentLetter);

        // Logic: Wait until input length matches correct answer length
        if (state.currentTypedInput.length === correct.length) {
            state.isAcceptingInput = false;

            if (state.currentTypedInput === correct) {
                ui.typedDisplay.style.color = 'var(--success)';
                handleCorrect(null);
            } else {
                ui.typedDisplay.style.color = 'var(--error)';
                handleWrong(null);
            }
        }
    }

    function handleCorrect(btnElement) {
        state.score++;
        ui.scoreDisplay.textContent = state.score;
        ui.typedDisplay.style.color = 'var(--accent)'; // Reset
        nextQuestion();
    }

    function handleWrong(btnElement) {
        ui.typedDisplay.style.color = 'var(--accent)';
        nextQuestion();
    }

    function endGame() {
        ui.finalScore.textContent = state.score;
        ui.finalTotal.textContent = state.totalQuestions;
        showScreen('result');
    }

    // Keyboard support (Global)
    document.addEventListener('keydown', (e) => {
        if (!screens.quiz.classList.contains('active')) return;

        if (modes[state.currentMode].inputMethod === 'alphabet') {
            const char = e.key.toUpperCase();
            if (char >= 'A' && char <= 'Z' && char.length === 1) {
                // Simulate button click
                const btn = Array.from(document.querySelectorAll('.key-btn')).find(b => b.dataset.value === char);
                if (btn) btn.click();
            }
        } else {
            // Numpad mode
            if (e.key >= '0' && e.key <= '9') {
                handleRangeInput(e.key);
            } else if (e.key === 'Backspace') {
                handleRangeInput('DEL');
            }
        }
    });

});
