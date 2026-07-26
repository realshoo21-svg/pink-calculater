// ========================================
// SCIENTIFIC CALCULATOR - MAIN SCRIPT
// ========================================

// Global Variables
let display = document.getElementById('display');
let displayInfo = document.getElementById('displayInfo');
let currentValue = '';
let previousValue = '';
let operator = '';
let memory = 0;
let isDegree = true;
let calculation = '';
let history = [];
let deferredPrompt;
let installBtn = document.getElementById('installBtn');

// Constants
const EPSILON = 1e-10;

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    loadHistory();
    setupEventListeners();
    registerServiceWorker();
});

function initializeApp() {
    // Load saved settings
    const savedTheme = localStorage.getItem('theme') || 'default';
    const savedMode = localStorage.getItem('darkMode') || 'false';
    
    if (savedTheme) {
        document.body.setAttribute('data-theme', savedTheme);
    }
    
    if (savedMode === 'true') {
        document.body.classList.add('dark-mode');
        document.getElementById('themeToggle').textContent = '☀️';
    }

    // Check if app can be installed
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installBtn.style.display = 'flex';
    });

    window.addEventListener('appinstalled', () => {
        console.log('App installed successfully');
        installBtn.style.display = 'none';
    });
}

function setupEventListeners() {
    // Number buttons
    document.querySelectorAll('.btn-number').forEach(btn => {
        btn.addEventListener('click', () => appendNumber(btn.dataset.number));
    });

    // Operator buttons
    document.querySelectorAll('.btn-operator').forEach(btn => {
        btn.addEventListener('click', () => setOperator(btn.dataset.operator));
    });

    // Function buttons
    document.querySelectorAll('.btn-function').forEach(btn => {
        btn.addEventListener('click', () => applyFunction(btn.dataset.value));
    });

    // Control buttons
    document.getElementById('clearBtn').addEventListener('click', clear);
    document.getElementById('deleteBtn').addEventListener('click', deleteLastChar);
    document.getElementById('bracketBtn').addEventListener('click', toggleBrackets);
    document.getElementById('degreeToggle').addEventListener('click', toggleDegreeRadian);

    // Memory buttons
    document.querySelectorAll('.btn-memory').forEach(btn => {
        btn.addEventListener('click', () => handleMemory(btn.dataset.memory));
    });

    // Action buttons
    document.getElementById('equalsBtn').addEventListener('click', calculate);
    document.getElementById('copyBtn').addEventListener('click', copyResult);
    document.getElementById('shareBtn').addEventListener('click', shareResult);

    // History
    document.getElementById('clearHistoryBtn').addEventListener('click', clearHistory);
    document.getElementById('historySearch').addEventListener('input', searchHistory);

    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleDarkMode);

    // Theme options
    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.addEventListener('click', () => changeTheme(btn.dataset.theme));
    });

    // Tool buttons
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.addEventListener('click', () => openTool(btn.dataset.tool));
    });

    // Modal close
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('toolsModal').addEventListener('click', (e) => {
        if (e.target.id === 'toolsModal') closeModal();
    });

    // Install button
    installBtn.addEventListener('click', installApp);

    // Keyboard support
    document.addEventListener('keydown', handleKeyboard);

    // History item click
    updateHistoryDisplay();
}

// ========================================
// CALCULATOR CORE FUNCTIONS
// ========================================

function appendNumber(num) {
    if (num === '.' && currentValue.includes('.')) return;
    currentValue += num;
    updateDisplay();
}

function setOperator(op) {
    if (currentValue === '' && previousValue === '') return;
    
    if (currentValue !== '') {
        if (previousValue !== '') {
            calculate();
        } else {
            previousValue = currentValue;
        }
        currentValue = '';
    }
    
    operator = op;
    calculation = `${previousValue} ${op}`;
    updateDisplay();
}

function calculate() {
    if (previousValue === '' || currentValue === '' || operator === '') return;

    let result = 0;
    const prev = parseFloat(previousValue);
    const curr = parseFloat(currentValue);

    switch (operator) {
        case '+':
            result = prev + curr;
            break;
        case '-':
            result = prev - curr;
            break;
        case '*':
            result = prev * curr;
            break;
        case '/':
            result = curr !== 0 ? prev / curr : NaN;
            break;
        case '%':
            result = prev % curr;
            break;
    }

    if (isNaN(result)) {
        displayError('Invalid calculation');
        return;
    }

    // Round to avoid floating point errors
    result = Math.round(result * 1e10) / 1e10;

    // Add to history
    addToHistory(`${previousValue} ${operator} ${currentValue}`, result);

    currentValue = result.toString();
    previousValue = '';
    operator = '';
    calculation = '';
    updateDisplay();
}

function applyFunction(func) {
    if (currentValue === '' && func !== 'pi' && func !== 'e' && func !== 'random' && func !== 'voice') return;

    let result = 0;
    const value = parseFloat(currentValue);

    try {
        switch (func) {
            case 'sqrt':
                result = Math.sqrt(value);
                currentValue = result.toString();
                addToHistory(`√${value}`, result);
                break;

            case 'cbrt':
                result = Math.cbrt(value);
                currentValue = result.toString();
                addToHistory(`∛${value}`, result);
                break;

            case 'pow2':
                result = value * value;
                currentValue = result.toString();
                addToHistory(`${value}²`, result);
                break;

            case 'pow3':
                result = value * value * value;
                currentValue = result.toString();
                addToHistory(`${value}³`, result);
                break;

            case 'pow':
                displayInfo.textContent = 'Enter exponent and press =';
                operator = '^';
                previousValue = currentValue;
                currentValue = '';
                break;

            case 'sin':
                result = isDegree ? Math.sin(value * Math.PI / 180) : Math.sin(value);
                currentValue = result.toString();
                addToHistory(`sin(${value}${isDegree ? '°' : ''})`, result);
                break;

            case 'cos':
                result = isDegree ? Math.cos(value * Math.PI / 180) : Math.cos(value);
                currentValue = result.toString();
                addToHistory(`cos(${value}${isDegree ? '°' : ''})`, result);
                break;

            case 'tan':
                result = isDegree ? Math.tan(value * Math.PI / 180) : Math.tan(value);
                currentValue = result.toString();
                addToHistory(`tan(${value}${isDegree ? '°' : ''})`, result);
                break;

            case 'cot':
                const cotVal = isDegree ? 1 / Math.tan(value * Math.PI / 180) : 1 / Math.tan(value);
                result = cotVal;
                currentValue = result.toString();
                addToHistory(`cot(${value}${isDegree ? '°' : ''})`, result);
                break;

            case 'sec':
                const secVal = isDegree ? 1 / Math.cos(value * Math.PI / 180) : 1 / Math.cos(value);
                result = secVal;
                currentValue = result.toString();
                addToHistory(`sec(${value}${isDegree ? '°' : ''})`, result);
                break;

            case 'cosec':
                const cosecVal = isDegree ? 1 / Math.sin(value * Math.PI / 180) : 1 / Math.sin(value);
                result = cosecVal;
                currentValue = result.toString();
                addToHistory(`cosec(${value}${isDegree ? '°' : ''})`, result);
                break;

            case 'log':
                if (value <= 0) throw new Error('Log of non-positive number');
                result = Math.log10(value);
                currentValue = result.toString();
                addToHistory(`log(${value})`, result);
                break;

            case 'ln':
                if (value <= 0) throw new Error('ln of non-positive number');
                result = Math.log(value);
                currentValue = result.toString();
                addToHistory(`ln(${value})`, result);
                break;

            case 'factorial':
                if (value < 0 || value !== Math.floor(value)) throw new Error('Invalid factorial');
                result = factorial(value);
                currentValue = result.toString();
                addToHistory(`${value}!`, result);
                break;

            case 'abs':
                result = Math.abs(value);
                currentValue = result.toString();
                addToHistory(`|${value}|`, result);
                break;

            case 'percent':
                result = value / 100;
                currentValue = result.toString();
                addToHistory(`${value}%`, result);
                break;

            case 'reciprocal':
                if (value === 0) throw new Error('Cannot divide by zero');
                result = 1 / value;
                currentValue = result.toString();
                addToHistory(`1/${value}`, result);
                break;

            case 'negative':
                currentValue = (value * -1).toString();
                addToHistory(`Negate ${value}`, parseFloat(currentValue));
                break;

            case 'pi':
                currentValue = Math.PI.toString();
                addToHistory('π', Math.PI);
                break;

            case 'e':
                currentValue = Math.E.toString();
                addToHistory('e', Math.E);
                break;

            case 'exp':
                result = Math.exp(value);
                currentValue = result.toString();
                addToHistory(`e^${value}`, result);
                break;

            case 'mod':
                displayInfo.textContent = 'Enter divisor and press =';
                operator = 'mod';
                previousValue = currentValue;
                currentValue = '';
                break;

            case 'voice':
                startVoiceInput();
                break;

            case 'random':
                result = Math.random();
                currentValue = result.toString();
                addToHistory('Random', result);
                break;
        }

        // Handle power operator
        if (operator === '^' && currentValue !== '') {
            const base = parseFloat(previousValue);
            const exp = parseFloat(currentValue);
            result = Math.pow(base, exp);
            currentValue = result.toString();
            addToHistory(`${base}^${exp}`, result);
            previousValue = '';
            operator = '';
        }

        // Handle modulus operator
        if (operator === 'mod' && currentValue !== '') {
            const a = parseFloat(previousValue);
            const b = parseFloat(currentValue);
            result = a % b;
            currentValue = result.toString();
            addToHistory(`${a} mod ${b}`, result);
            previousValue = '';
            operator = '';
        }

        updateDisplay();
    } catch (error) {
        displayError(error.message);
    }
}

function factorial(n) {
    if (n > 170) throw new Error('Number too large');
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

function clear() {
    currentValue = '';
    previousValue = '';
    operator = '';
    calculation = '';
    displayInfo.textContent = '';
    updateDisplay();
}

function deleteLastChar() {
    currentValue = currentValue.toString().slice(0, -1);
    updateDisplay();
}

function toggleBrackets() {
    if (!currentValue.includes('(')) {
        currentValue += '(';
    } else if (!currentValue.includes(')')) {
        currentValue += ')';
    }
    updateDisplay();
}

function toggleDegreeRadian() {
    isDegree = !isDegree;
    document.getElementById('degreeToggle').textContent = isDegree ? 'DEG' : 'RAD';
    updateDisplay();
}

function updateDisplay() {
    if (currentValue !== '') {
        display.value = currentValue;
    } else if (previousValue !== '') {
        display.value = previousValue;
    } else {
        display.value = '0';
    }

    if (operator) {
        displayInfo.textContent = `${calculation} ${currentValue}`;
    } else {
        displayInfo.textContent = '';
    }
}

function displayError(message) {
    display.value = 'Error: ' + message;
    setTimeout(() => {
        clear();
    }, 1500);
}

// ========================================
// MEMORY FUNCTIONS
// ========================================

function handleMemory(action) {
    const value = parseFloat(currentValue) || 0;

    switch (action) {
        case 'mc':
            memory = 0;
            displayInfo.textContent = 'Memory Cleared';
            break;
        case 'mr':
            currentValue = memory.toString();
            displayInfo.textContent = `Memory: ${memory}`;
            break;
        case 'mplus':
            memory += value;
            currentValue = '';
            displayInfo.textContent = `M+ (Total: ${memory})`;
            break;
        case 'mminus':
            memory -= value;
            currentValue = '';
            displayInfo.textContent = `M- (Total: ${memory})`;
            break;
    }

    localStorage.setItem('memory', memory);
    updateDisplay();
    setTimeout(() => {
        displayInfo.textContent = '';
    }, 1000);
}

// ========================================
// HISTORY SYSTEM
// ========================================

function addToHistory(expression, result) {
    const timestamp = new Date().toLocaleTimeString();
    history.unshift({
        expression,
        result: Math.round(result * 1e10) / 1e10,
        timestamp
    });

    // Keep only last 100 items
    if (history.length > 100) {
        history.pop();
    }

    saveHistory();
    updateHistoryDisplay();
}

function saveHistory() {
    localStorage.setItem('calculatorHistory', JSON.stringify(history));
}

function loadHistory() {
    const saved = localStorage.getItem('calculatorHistory');
    history = saved ? JSON.parse(saved) : [];
}

function updateHistoryDisplay() {
    const historyList = document.getElementById('historyList');
    
    if (history.length === 0) {
        historyList.innerHTML = '<p class="history-empty">No history yet</p>';
        return;
    }

    historyList.innerHTML = history.map((item, index) => `
        <div class="history-item">
            <div class="history-item-text">
                <strong>${item.expression}</strong>
                <div style="font-size: 0.8rem; color: var(--text-secondary);">${item.timestamp}</div>
            </div>
            <div class="history-item-result">${item.result}</div>
            <button class="history-delete-btn" onclick="deleteHistoryItem(${index})" title="Delete">×</button>
        </div>
    `).join('');

    // Add click listeners to copy
    document.querySelectorAll('.history-item').forEach((item, index) => {
        item.addEventListener('click', function(e) {
            if (!e.target.classList.contains('history-delete-btn')) {
                currentValue = history[index].result.toString();
                updateDisplay();
            }
        });
    });
}

function deleteHistoryItem(index) {
    history.splice(index, 1);
    saveHistory();
    updateHistoryDisplay();
}

function clearHistory() {
    if (confirm('Are you sure you want to delete all history?')) {
        history = [];
        saveHistory();
        updateHistoryDisplay();
    }
}

function searchHistory() {
    const searchTerm = document.getElementById('historySearch').value.toLowerCase();
    const historyList = document.getElementById('historyList');

    const filtered = history.filter(item =>
        item.expression.toLowerCase().includes(searchTerm) ||
        item.result.toString().includes(searchTerm)
    );

    if (filtered.length === 0) {
        historyList.innerHTML = '<p class="history-empty">No matching history</p>';
        return;
    }

    historyList.innerHTML = filtered.map((item, index) => `
        <div class="history-item">
            <div class="history-item-text">
                <strong>${item.expression}</strong>
                <div style="font-size: 0.8rem; color: var(--text-secondary);">${item.timestamp}</div>
            </div>
            <div class="history-item-result">${item.result}</div>
        </div>
    `).join('');
}

// ========================================
// COPY & SHARE FUNCTIONS
// ========================================

function copyResult() {
    const value = currentValue || previousValue || '0';
    navigator.clipboard.writeText(value).then(() => {
        document.getElementById('copyBtn').textContent = '✓';
        setTimeout(() => {
            document.getElementById('copyBtn').textContent = '📋';
        }, 1500);
    });
}

function shareResult() {
    const value = currentValue || previousValue || '0';
    
    if (navigator.share) {
        navigator.share({
            title: 'Scientific Calculator Result',
            text: `Result: ${value}`
        });
    } else {
        alert(`Result: ${value}\n\nCopied to clipboard!`);
        navigator.clipboard.writeText(value);
    }
}

// ========================================
// VOICE INPUT
// ========================================

function startVoiceInput() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        alert('Voice input not supported in your browser');
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    document.getElementById('voiceBtn').innerHTML = '🎤 Listening...';

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        processVoiceCommand(transcript);
        document.getElementById('voiceBtn').innerHTML = '🎤';
    };

    recognition.onerror = (event) => {
        console.error('Voice error:', event.error);
        document.getElementById('voiceBtn').innerHTML = '🎤';
    };

    recognition.start();
}

function processVoiceCommand(command) {
    // Simple voice command processing
    const numbers = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
    
    for (let i = 0; i < numbers.length; i++) {
        if (command.includes(numbers[i])) {
            appendNumber(i.toString());
            return;
        }
    }

    if (command.includes('plus')) setOperator('+');
    else if (command.includes('minus')) setOperator('-');
    else if (command.includes('times') || command.includes('multiply')) setOperator('*');
    else if (command.includes('divide')) setOperator('/');
    else if (command.includes('equals') || command.includes('calculate')) calculate();
    else if (command.includes('clear')) clear();
    else if (command.includes('sin')) applyFunction('sin');
    else if (command.includes('cos')) applyFunction('cos');
    else if (command.includes('tan')) applyFunction('tan');
    else if (command.includes('square')) applyFunction('pow2');
    else if (command.includes('sqrt') || command.includes('square root')) applyFunction('sqrt');
}

// ========================================
// THEME FUNCTIONS
// ========================================

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
    document.getElementById('themeToggle').textContent = isDark ? '☀️' : '🌙';
}

function changeTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    // Update active indicator
    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.closest('.theme-option').classList.add('active');
}

// ========================================
// TOOLS MODAL
// ========================================

function openTool(tool) {
    const modal = document.getElementById('toolsModal');
    const container = document.getElementById('toolContainer');

    let content = '';

    switch (tool) {
        case 'unit-converter':
            content = createUnitConverter();
            break;
        case 'age-calc':
            content = createAgeCalculator();
            break;
        case 'bmi-calc':
            content = createBMICalculator();
            break;
        case 'random':
            content = createRandomGenerator();
            break;
        case 'equation-solver':
            content = createEquationSolver();
            break;
        case 'currency':
            content = createCurrencyConverter();
            break;
    }

    container.innerHTML = content;
    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('toolsModal').classList.remove('active');
}

// Tool Templates

function createUnitConverter() {
    return `
        <div class="tool-form">
            <h2>📏 Unit Converter</h2>
            <div class="tool-input-group">
                <label>From Unit</label>
                <select id="unitFrom">
                    <option value="m">Meters</option>
                    <option value="km">Kilometers</option>
                    <option value="ft">Feet</option>
                    <option value="inch">Inches</option>
                    <option value="cm">Centimeters</option>
                    <option value="mile">Miles</option>
                </select>
            </div>
            <div class="tool-input-group">
                <label>Value</label>
                <input type="number" id="unitValue" placeholder="Enter value">
            </div>
            <div class="tool-input-group">
                <label>To Unit</label>
                <select id="unitTo">
                    <option value="m">Meters</option>
                    <option value="km">Kilometers</option>
                    <option value="ft">Feet</option>
                    <option value="inch">Inches</option>
                    <option value="cm">Centimeters</option>
                    <option value="mile">Miles</option>
                </select>
            </div>
            <button class="tool-button" onclick="convertUnits()">Convert</button>
            <div id="unitResult"></div>
        </div>
    `;
}

function createAgeCalculator() {
    return `
        <div class="tool-form">
            <h2>🎂 Age Calculator</h2>
            <div class="tool-input-group">
                <label>Birth Date</label>
                <input type="date" id="birthDate">
            </div>
            <button class="tool-button" onclick="calculateAge()">Calculate Age</button>
            <div id="ageResult"></div>
        </div>
    `;
}

function createBMICalculator() {
    return `
        <div class="tool-form">
            <h2>⚖️ BMI Calculator</h2>
            <div class="tool-input-group">
                <label>Height (cm)</label>
                <input type="number" id="height" placeholder="Enter height">
            </div>
            <div class="tool-input-group">
                <label>Weight (kg)</label>
                <input type="number" id="weight" placeholder="Enter weight">
            </div>
            <button class="tool-button" onclick="calculateBMI()">Calculate BMI</button>
            <div id="bmiResult"></div>
        </div>
    `;
}

function createRandomGenerator() {
    return `
        <div class="tool-form">
            <h2>🎲 Random Number Generator</h2>
            <div class="tool-input-group">
                <label>Minimum</label>
                <input type="number" id="randomMin" placeholder="0">
            </div>
            <div class="tool-input-group">
                <label>Maximum</label>
                <input type="number" id="randomMax" placeholder="100">
            </div>
            <div class="tool-input-group">
                <label>Count</label>
                <input type="number" id="randomCount" value="1" min="1" max="10">
            </div>
            <button class="tool-button" onclick="generateRandom()">Generate</button>
            <div id="randomResult"></div>
        </div>
    `;
}

function createEquationSolver() {
    return `
        <div class="tool-form">
            <h2>🧮 Percentage Calculator</h2>
            <div class="tool-input-group">
                <label>Value</label>
                <input type="number" id="percentValue" placeholder="Enter value">
            </div>
            <div class="tool-input-group">
                <label>Percentage (%)</label>
                <input type="number" id="percentAmount" placeholder="Enter percentage">
            </div>
            <button class="tool-button" onclick="calculatePercent()">Calculate</button>
            <div id="percentResult"></div>
        </div>
    `;
}

function createCurrencyConverter() {
    return `
        <div class="tool-form">
            <h2>💱 Currency Converter</h2>
            <div class="tool-input-group">
                <label>Amount</label>
                <input type="number" id="currencyAmount" placeholder="Enter amount">
            </div>
            <div class="tool-input-group">
                <label>From Currency</label>
                <select id="currencyFrom">
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="INR">INR</option>
                </select>
            </div>
            <div class="tool-input-group">
                <label>To Currency</label>
                <select id="currencyTo">
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                    <option value="INR">INR</option>
                </select>
            </div>
            <button class="tool-button" onclick="convertCurrency()">Convert</button>
            <div id="currencyResult"></div>
        </div>
    `;
}

// Tool Functions

function convertUnits() {
    const value = parseFloat(document.getElementById('unitValue').value);
    const from = document.getElementById('unitFrom').value;
    const to = document.getElementById('unitTo').value;

    const conversions = {
        'm': 1,
        'km': 1000,
        'cm': 0.01,
        'ft': 0.3048,
        'inch': 0.0254,
        'mile': 1609.34
    };

    const result = (value * conversions[from]) / conversions[to];
    document.getElementById('unitResult').innerHTML = `
        <div class="tool-result">
            <strong>${value} ${from} = ${result.toFixed(4)} ${to}</strong>
        </div>
    `;
}

function calculateAge() {
    const birthDate = new Date(document.getElementById('birthDate').value);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    document.getElementById('ageResult').innerHTML = `
        <div class="tool-result">
            <strong>Age: ${age} years</strong>
        </div>
    `;
}

function calculateBMI() {
    const height = parseFloat(document.getElementById('height').value) / 100;
    const weight = parseFloat(document.getElementById('weight').value);
    const bmi = (weight / (height * height)).toFixed(2);

    let category = '';
    if (bmi < 18.5) category = 'Underweight';
    else if (bmi < 25) category = 'Normal weight';
    else if (bmi < 30) category = 'Overweight';
    else category = 'Obese';

    document.getElementById('bmiResult').innerHTML = `
        <div class="tool-result">
            <strong>BMI: ${bmi}</strong><br>
            <strong>Category: ${category}</strong>
        </div>
    `;
}

function generateRandom() {
    const min = parseInt(document.getElementById('randomMin').value) || 0;
    const max = parseInt(document.getElementById('randomMax').value) || 100;
    const count = parseInt(document.getElementById('randomCount').value) || 1;

    const numbers = [];
    for (let i = 0; i < count; i++) {
        numbers.push(Math.floor(Math.random() * (max - min + 1)) + min);
    }

    document.getElementById('randomResult').innerHTML = `
        <div class="tool-result">
            <strong>Random Numbers:</strong><br>
            ${numbers.join(', ')}
        </div>
    `;
}

function calculatePercent() {
    const value = parseFloat(document.getElementById('percentValue').value);
    const percent = parseFloat(document.getElementById('percentAmount').value);
    const result = (value * percent) / 100;

    document.getElementById('percentResult').innerHTML = `
        <div class="tool-result">
            <strong>${percent}% of ${value} = ${result.toFixed(2)}</strong>
        </div>
    `;
}

function convertCurrency() {
    // Note: In a real app, you'd fetch real exchange rates from an API
    // This is a demo with fixed rates
    const rates = {
        'USD': 1,
        'EUR': 0.92,
        'GBP': 0.79,
        'INR': 83.12
    };

    const amount = parseFloat(document.getElementById('currencyAmount').value);
    const from = document.getElementById('currencyFrom').value;
    const to = document.getElementById('currencyTo').value;

    const usdAmount = amount / rates[from];
    const result = usdAmount * rates[to];

    document.getElementById('currencyResult').innerHTML = `
        <div class="tool-result">
            <strong>${amount} ${from} = ${result.toFixed(2)} ${to}</strong>
            <small style="display: block; margin-top: 0.5rem;">* Rates are approximate</small>
        </div>
    `;
}

// ========================================
// PWA & SERVICE WORKER
// ========================================

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.log('Service Worker registration failed'));
    }
}

function installApp() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(choiceResult => {
            if (choiceResult.outcome === 'accepted') {
                console.log('App installation accepted');
            }
            deferredPrompt = null;
            installBtn.style.display = 'none';
        });
    }
}

// ========================================
// KEYBOARD SUPPORT
// ========================================

function handleKeyboard(e) {
    const key = e.key;

    // Numbers
    if (/^[0-9.]$/.test(key)) {
        appendNumber(key);
    }

    // Operators
    if (key === '+') {
        e.preventDefault();
        setOperator('+');
    }
    if (key === '-') {
        e.preventDefault();
        setOperator('-');
    }
    if (key === '*') {
        e.preventDefault();
        setOperator('*');
    }
    if (key === '/') {
        e.preventDefault();
        setOperator('/');
    }

    // Enter to calculate
    if (key === 'Enter') {
        e.preventDefault();
        calculate();
    }

    // Backspace to delete
    if (key === 'Backspace') {
        e.preventDefault();
        deleteLastChar();
    }

    // Escape to clear
    if (key === 'Escape') {
        clear();
    }
}

// Load memory on startup
window.addEventListener('load', () => {
    const savedMemory = localStorage.getItem('memory');
    if (savedMemory) {
        memory = parseFloat(savedMemory);
    }
});
