const expressionEl = document.querySelector('[data-expression]');
const resultEl = document.querySelector('[data-result]');
const historyList = document.getElementById('historyList');
const historySearch = document.getElementById('historySearch');
const themeToggle = document.getElementById('themeToggle');
const themeSelector = document.getElementById('themeSelector');
const modeToggle = document.getElementById('modeToggle');
const installButton = document.getElementById('installButton');
const copyResultButton = document.getElementById('copyResult');
const shareResultButton = document.getElementById('shareResult');
const voiceInputButton = document.getElementById('voiceInput');
const clearHistoryButton = document.getElementById('clearHistory');
const exportTxtButton = document.getElementById('exportTxt');
const exportPdfButton = document.getElementById('exportPdf');
const loadingScreen = document.getElementById('loadingScreen');
const modeBadge = document.getElementById('modeBadge');
const statusBadge = document.getElementById('statusBadge');
const percentAmount = document.getElementById('percentAmount');
const percentRate = document.getElementById('percentRate');
const percentResult = document.getElementById('percentResult');
const unitValue = document.getElementById('unitValue');
const unitFrom = document.getElementById('unitFrom');
const unitTo = document.getElementById('unitTo');
const unitResult = document.getElementById('unitResult');
const dobInput = document.getElementById('dobInput');
const ageResult = document.getElementById('ageResult');
const heightInput = document.getElementById('heightInput');
const weightInput = document.getElementById('weightInput');
const bmiResult = document.getElementById('bmiResult');
const randMin = document.getElementById('randMin');
const randMax = document.getElementById('randMax');
const randResult = document.getElementById('randResult');
const dateFrom = document.getElementById('dateFrom');
const dateTo = document.getElementById('dateTo');
const dateDiffResult = document.getElementById('dateDiffResult');

let expression = '0';
let result = '0';
let memory = 0;
let history = [];
let deferredPrompt = null;
let isDark = true;
let angleMode = 'deg';
let activeTheme = 'glitter';

const buttons = Array.from(document.querySelectorAll('.btn, .pill-btn'));
const historyStorageKey = 'pink-calc-history-v2';
const themeStorageKey = 'pink-calc-theme-v2';
const modeStorageKey = 'pink-calc-mode-v2';
const lightModeStorageKey = 'pink-calc-light-v2';

function initialize() {
  document.body.classList.add('loaded');
  loadHistory();
  restorePreferences();
  attachEvents();
  registerServiceWorker();
  manageInstallPrompt();
  updateDisplay();
  setStatus('Ready');
}

function attachEvents() {
  buttons.forEach((button) => {
    button.addEventListener('click', () => handleButton(button));
  });

  themeToggle.addEventListener('click', toggleTheme);
  themeSelector.addEventListener('change', (event) => setTheme(event.target.value));
  modeToggle.addEventListener('click', toggleMode);
  copyResultButton.addEventListener('click', copyResult);
  shareResultButton.addEventListener('click', shareResult);
  voiceInputButton.addEventListener('click', handleVoiceInput);
  clearHistoryButton.addEventListener('click', clearHistory);
  exportTxtButton.addEventListener('click', exportHistoryTxt);
  exportPdfButton.addEventListener('click', exportHistoryPdf);
  historySearch.addEventListener('input', renderHistory);
  historyList.addEventListener('click', handleHistoryListClick);

  document.addEventListener('keydown', handleKeyboard);
  document.getElementById('percentCalc').addEventListener('click', calculatePercentage);
  document.getElementById('unitCalc').addEventListener('click', calculateUnitConversion);
  document.getElementById('ageCalc').addEventListener('click', calculateAge);
  document.getElementById('bmiCalc').addEventListener('click', calculateBmi);
  document.getElementById('randCalc').addEventListener('click', generateRandomNumber);
  document.getElementById('dateDiffCalc').addEventListener('click', calculateDateDifference);
}

function handleButton(button) {
  const action = button.dataset.action;
  const value = button.dataset.value;

  if (action === 'equals') {
    evaluateExpression();
    return;
  }

  if (action === 'clear') {
    clearDisplay();
    return;
  }

  if (action === 'backspace') {
    backspace();
    return;
  }

  if (action === 'memory') {
    handleMemory(value);
    return;
  }

  appendValue(value);
}

function appendValue(value) {
  if (expression === '0' || expression === 'Error' || expression === 'Infinity') {
    expression = '';
  }

  if (value === '0' && expression === '') {
    expression = '0';
    updateDisplay();
    return;
  }

  const replacements = {
    'x²': '^2',
    'x³': '^3',
    'xʸ': '^',
    '√': 'sqrt(',
    '∛': 'cbrt(',
    'π': 'π',
    'e': 'e'
  };

  expression += replacements[value] || value;
  updateDisplay();
}

function backspace() {
  if (expression === 'Error' || expression === '0') {
    expression = '0';
    result = '0';
    updateDisplay();
    return;
  }

  expression = expression.slice(0, -1) || '0';
  updateDisplay();
}

function clearDisplay() {
  expression = '0';
  result = '0';
  updateDisplay();
  setStatus('Cleared');
}

function evaluateExpression() {
  const displayScreen = document.querySelector('.display-screen');
  displayScreen.classList.add('transitioning');

  try {
    const inputExpression = expression.trim();
    if (!inputExpression || inputExpression === '0') {
      result = '0';
      expression = '0';
    } else {
      const computed = evaluate(inputExpression);
      result = formatNumber(computed);
      expression = result;
      addHistory(inputExpression, result);
      setStatus('Calculated');
    }
  } catch (error) {
    result = 'Error';
    expression = 'Error';
    setStatus('Input error');
  }

  updateDisplay();
  setTimeout(() => displayScreen.classList.remove('transitioning'), 180);
}

function addHistory(input, output) {
  history.unshift({ id: Date.now().toString(), input, output, createdAt: new Date().toLocaleString() });
  history = history.slice(0, 20);
  saveHistory();
  renderHistory();
}

function loadHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(historyStorageKey) || '[]');
    history = Array.isArray(saved) ? saved : [];
  } catch (error) {
    history = [];
  }
  renderHistory();
}

function saveHistory() {
  localStorage.setItem(historyStorageKey, JSON.stringify(history));
}

function renderHistory() {
  const query = historySearch.value.trim().toLowerCase();
  const visible = history.filter((item) => `${item.input} ${item.output}`.toLowerCase().includes(query));

  if (!visible.length) {
    historyList.innerHTML = '<li class="empty-state">Your calculations will appear here.</li>';
    return;
  }

  historyList.innerHTML = visible
    .map(
      (item) => `
        <li class="history-item">
          <div class="meta">
            <div class="expr">${escapeHtml(item.input)}</div>
            <div class="value">${escapeHtml(item.output)}</div>
          </div>
          <button class="history-remove" data-id="${item.id}" aria-label="Delete item">×</button>
        </li>
      `
    )
    .join('');
}

function handleHistoryListClick(event) {
  const removeButton = event.target.closest('.history-remove');
  if (!removeButton) return;
  deleteHistoryItem(removeButton.dataset.id);
}

function deleteHistoryItem(id) {
  history = history.filter((item) => item.id !== id);
  saveHistory();
  renderHistory();
}

function clearHistory() {
  history = [];
  saveHistory();
  renderHistory();
  setStatus('History cleared');
}

function handleMemory(action) {
  const currentValue = Number.parseFloat(result);
  if (Number.isNaN(currentValue)) {
    setStatus('No value to store');
    return;
  }

  if (action === 'MC') {
    memory = 0;
    result = 'Memory cleared';
  } else if (action === 'MR') {
    result = formatNumber(memory);
  } else if (action === 'M+') {
    memory += currentValue;
    result = 'Stored';
  } else if (action === 'M-') {
    memory -= currentValue;
    result = 'Stored';
  } else if (action === 'MS') {
    memory = currentValue;
    result = 'Stored';
  }

  expression = result;
  updateDisplay();
  setStatus('Memory updated');
}

function updateDisplay() {
  expressionEl.textContent = expression;
  resultEl.textContent = result;
  resizeDisplay();
}

function resizeDisplay() {
  const value = String(expression.length > result.length ? expression : result);
  const maxSize = window.innerWidth < 600 ? 1.7 : 2.8;
  const size = Math.max(1, maxSize - value.length * 0.05);
  expressionEl.style.fontSize = `${size}rem`;
  resultEl.style.fontSize = `${Math.max(1.6, size + 0.8)}rem`;
}

function copyResult() {
  navigator.clipboard.writeText(result).then(() => {
    setStatus('Copied');
  });
}

function shareResult() {
  const text = `${expression} = ${result}`;
  if (navigator.share) {
    navigator.share({ title: 'Pink Calculator Result', text }).catch(() => {});
  } else {
    navigator.clipboard.writeText(text).then(() => setStatus('Shared copy ready'));
  }
}

function toggleTheme() {
  isDark = !isDark;
  document.body.classList.toggle('light-theme', !isDark);
  themeToggle.textContent = isDark ? '☀️ Light' : '🌙 Dark';
  localStorage.setItem(lightModeStorageKey, String(isDark));
}

function setTheme(theme) {
  activeTheme = theme;
  document.body.setAttribute('data-theme', theme);
  localStorage.setItem(themeStorageKey, theme);
}

function restorePreferences() {
  const savedTheme = localStorage.getItem(themeStorageKey) || 'glitter';
  const savedMode = localStorage.getItem(modeStorageKey) || 'deg';
  const savedLight = localStorage.getItem(lightModeStorageKey);
  activeTheme = savedTheme;
  angleMode = savedMode;
  document.body.setAttribute('data-theme', savedTheme);
  themeSelector.value = savedTheme;
  if (savedLight === 'false') {
    isDark = false;
    document.body.classList.add('light-theme');
    themeToggle.textContent = '🌙 Dark';
  } else {
    isDark = true;
    document.body.classList.remove('light-theme');
    themeToggle.textContent = '☀️ Light';
  }
  updateModeBadge();
}

function toggleMode() {
  angleMode = angleMode === 'deg' ? 'rad' : 'deg';
  localStorage.setItem(modeStorageKey, angleMode);
  updateModeBadge();
}

function updateModeBadge() {
  modeBadge.textContent = angleMode.toUpperCase();
  modeToggle.textContent = angleMode === 'deg' ? 'DEG' : 'RAD';
  modeToggle.classList.toggle('active', angleMode === 'deg');
}

function setStatus(message) {
  statusBadge.textContent = message;
}

function handleKeyboard(event) {
  const key = event.key;
  const map = {
    '+': '+',
    '-': '-',
    '*': '*',
    '/': '/',
    '%': '%',
    '.': '.',
    '(': '(',
    ')': ')',
    '^': '^',
    '=': 'equals',
    Enter: 'equals',
    Backspace: 'backspace',
    Escape: 'clear'
  };

  if (/^[0-9]$/.test(key)) {
    appendValue(key);
    event.preventDefault();
    return;
  }

  if (map[key]) {
    if (map[key] === 'equals') {
      evaluateExpression();
    } else if (map[key] === 'backspace') {
      backspace();
    } else if (map[key] === 'clear') {
      clearDisplay();
    } else {
      appendValue(map[key]);
    }
    event.preventDefault();
  }
}

function manageInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    installButton.style.display = 'inline-flex';
  });

  installButton.addEventListener('click', async () => {
    if (!deferredPrompt) {
      setStatus('Install is ready on supported devices');
      return;
    }
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      installButton.style.display = 'none';
    }
    deferredPrompt = null;
  });
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  }
}

function formatNumber(value) {
  if (!Number.isFinite(value)) {
    return 'Error';
  }
  if (Math.abs(value) > 1e12 || (Math.abs(value) < 1e-8 && value !== 0)) {
    return value.toExponential(8);
  }
  const rounded = Math.round(value * 1e12) / 1e12;
  const text = rounded.toString();
  return text === '-0' ? '0' : text;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function tokenize(input) {
  const tokens = [];
  let index = 0;

  while (index < input.length) {
    const char = input[index];

    if (/\s/.test(char)) {
      index += 1;
      continue;
    }

    if (/[0-9.]/.test(char)) {
      let number = '';
      let sawDot = false;
      while (index < input.length && /[0-9.]/.test(input[index])) {
        if (input[index] === '.') {
          if (sawDot) break;
          sawDot = true;
        }
        number += input[index];
        index += 1;
      }
      tokens.push({ type: 'number', value: Number(number) });
      continue;
    }

    if (char === 'π' || char === 'e') {
      tokens.push({ type: 'constant', value: char });
      index += 1;
      continue;
    }

    if (/[a-zA-Z]/.test(char)) {
      let identifier = '';
      while (index < input.length && /[a-zA-Z]/.test(input[index])) {
        identifier += input[index];
        index += 1;
      }
      tokens.push({ type: 'identifier', value: identifier.toLowerCase() });
      continue;
    }

    if ('+-*/%^()!'.includes(char)) {
      tokens.push({ type: 'operator', value: char });
      index += 1;
      continue;
    }

    throw new Error('Invalid token');
  }

  return tokens;
}

function evaluate(input) {
  const tokens = tokenize(input.replace(/×/g, '*').replace(/÷/g, '/'));
  let index = 0;

  function parseExpression() {
    return parseAddition();
  }

  function parseAddition() {
    let value = parseMultiplication();
    while (index < tokens.length && (tokens[index].value === '+' || tokens[index].value === '-')) {
      const operator = tokens[index++].value;
      const right = parseMultiplication();
      value = operator === '+' ? value + right : value - right;
    }
    return value;
  }

  function parseMultiplication() {
    let value = parseUnary();
    while (index < tokens.length && (tokens[index].value === '*' || tokens[index].value === '/' || tokens[index].value === '%')) {
      const operator = tokens[index++].value;
      const right = parseUnary();
      if (operator === '*') value *= right;
      if (operator === '/') value /= right;
      if (operator === '%') value %= right;
    }
    return value;
  }

  function parseUnary() {
    if (index < tokens.length && (tokens[index].value === '+' || tokens[index].value === '-')) {
      const operator = tokens[index++].value;
      const value = parseUnary();
      return operator === '+' ? value : -value;
    }
    return parsePower();
  }

  function parsePower() {
    let value = parsePrimary();
    if (index < tokens.length && tokens[index].value === '^') {
      index += 1;
      const exponent = parseUnary();
      value = Math.pow(value, exponent);
    }
    if (index < tokens.length && tokens[index].value === '!') {
      index += 1;
      value = factorial(value);
    }
    return value;
  }

  function parsePrimary() {
    const token = tokens[index];
    if (!token) throw new Error('Unexpected end');

    if (token.type === 'number') {
      index += 1;
      return token.value;
    }

    if (token.type === 'constant') {
      index += 1;
      return token.value === 'π' ? Math.PI : Math.E;
    }

    if (token.type === 'identifier') {
      const identifier = token.value;
      index += 1;
      if (tokens[index] && tokens[index].value === '(') {
        index += 1;
        const argument = parseExpression();
        if (tokens[index] && tokens[index].value === ')') {
          index += 1;
        }
        return applyFunction(identifier, argument);
      }
      return applyFunction(identifier, 0);
    }

    if (token.value === '(') {
      index += 1;
      const value = parseExpression();
      if (tokens[index] && tokens[index].value === ')') {
        index += 1;
      }
      return value;
    }

    throw new Error('Invalid expression');
  }

  const result = parseExpression();
  if (index < tokens.length) {
    throw new Error('Unexpected token');
  }
  return result;
}

function applyFunction(name, value) {
  switch (name) {
    case 'sqrt':
      return Math.sqrt(value);
    case 'cbrt':
      return Math.cbrt(value);
    case 'sin':
      return toAngleResult('sin', value);
    case 'cos':
      return toAngleResult('cos', value);
    case 'tan':
      return toAngleResult('tan', value);
    case 'cot':
      return toAngleResult('cot', value);
    case 'sec':
      return toAngleResult('sec', value);
    case 'csc':
      return toAngleResult('csc', value);
    case 'asin':
      return toAngleResult('asin', value);
    case 'acos':
      return toAngleResult('acos', value);
    case 'atan':
      return toAngleResult('atan', value);
    case 'log':
      return Math.log10(value);
    case 'ln':
      return Math.log(value);
    case 'abs':
      return Math.abs(value);
    case 'exp':
      return Math.exp(value);
    case 'random':
      return Math.random();
    case 'fact':
      return factorial(value);
    case 'mod':
      return value % 1;
    default:
      throw new Error('Unsupported function');
  }
}

function toAngleResult(name, value) {
  const radians = angleMode === 'deg' ? value * (Math.PI / 180) : value;
  let result;
  switch (name) {
    case 'sin':
      result = Math.sin(radians);
      break;
    case 'cos':
      result = Math.cos(radians);
      break;
    case 'tan':
      result = Math.tan(radians);
      break;
    case 'cot':
      result = 1 / Math.tan(radians);
      break;
    case 'sec':
      result = 1 / Math.cos(radians);
      break;
    case 'csc':
      result = 1 / Math.sin(radians);
      break;
    case 'asin':
      result = Math.asin(radians);
      break;
    case 'acos':
      result = Math.acos(radians);
      break;
    case 'atan':
      result = Math.atan(radians);
      break;
    default:
      result = value;
  }

  return angleMode === 'deg' && ['sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'asin', 'acos', 'atan'].includes(name)
    ? result * (180 / Math.PI)
    : result;
}

function factorial(value) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error('Factorial expects a non-negative integer');
  }
  let result = 1;
  for (let i = 2; i <= value; i += 1) {
    result *= i;
  }
  return result;
}

function calculatePercentage() {
  const amount = Number(percentAmount.value);
  const rate = Number(percentRate.value);
  const value = (amount * rate) / 100;
  percentResult.textContent = `${value.toFixed(2)} (${rate}% of ${amount})`;
}

function calculateUnitConversion() {
  const value = Number(unitValue.value);
  const rates = {
    m: 1,
    km: 1000,
    ft: 0.3048,
    mi: 1609.344
  };
  const resultValue = (value * rates[unitFrom.value]) / rates[unitTo.value];
  unitResult.textContent = `${resultValue.toFixed(4)} ${unitTo.value}`;
}

function calculateAge() {
  const birthDate = new Date(dobInput.value);
  if (!dobInput.value) {
    ageResult.textContent = 'Choose a birth date';
    return;
  }
  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    years -= 1;
  }
  ageResult.textContent = `${years} years old`;
}

function calculateBmi() {
  const height = Number(heightInput.value);
  const weight = Number(weightInput.value);
  const bmi = weight / (height * height);
  bmiResult.textContent = `BMI ${bmi.toFixed(1)}`;
}

function generateRandomNumber() {
  const min = Number(randMin.value);
  const max = Number(randMax.value);
  const randomValue = Math.floor(Math.random() * (max - min + 1)) + min;
  randResult.textContent = `Random: ${randomValue}`;
}

function calculateDateDifference() {
  const start = new Date(dateFrom.value);
  const end = new Date(dateTo.value);
  if (!dateFrom.value || !dateTo.value) {
    dateDiffResult.textContent = 'Choose both dates';
    return;
  }
  const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
  dateDiffResult.textContent = `${diffDays} days`;
}

function handleVoiceInput() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    setStatus('Voice input not supported');
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map((result) => result[0].transcript)
      .join(' ')
      .trim();
    expression = transcript
      .replace(/plus/gi, '+')
      .replace(/minus/gi, '-')
      .replace(/times/gi, '*')
      .replace(/divided by/gi, '/')
      .replace(/point/gi, '.')
      .replace(/pi/gi, 'π')
      .replace(/euler/gi, 'e');
    updateDisplay();
    setStatus(`Heard: ${transcript}`);
  };
  recognition.onerror = () => setStatus('Voice input failed');
  recognition.start();
}

function exportHistoryTxt() {
  const content = history.length ? history.map((item) => `${item.input} = ${item.output}`).join('\n') : 'No history yet';
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'pink-calculator-history.txt';
  link.click();
  URL.revokeObjectURL(url);
}

function exportHistoryPdf() {
  const content = history.length ? history.map((item) => `${item.input} = ${item.output}`).join('\n') : 'No history yet';
  const lines = content.split('\n');
  const text = lines.map((line) => `(${escapePdf(line)})`).join('\\n');
  const pdf = `%PDF-1.4\n1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>endobj\n4 0 obj<< /Length 100 >>stream\nBT /F1 12 Tf 72 760 Td ${text} Tj ET\nendstream\nendobj\n5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\nxref\n0 6\n0000000000 65535 f \n0000000010 00000 n \n0000000062 00000 n \n0000000119 00000 n \n0000000206 00000 n \n0000000300 00000 n \ntrailer<< /Size 6 /Root 1 0 R >>\nstartxref\n0\n%%EOF`;
  const blob = new Blob([pdf], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'pink-calculator-history.pdf';
  link.click();
  URL.revokeObjectURL(url);
}

function escapePdf(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

window.addEventListener('resize', resizeDisplay);
window.addEventListener('load', initialize);
