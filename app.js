/**
 * Modern Tailwind & JavaScript Calculator
 * Full-featured with keyboard support, history log, theme toggle, and Web Audio feedback.
 */

class Calculator {
  constructor(prevDisplayElement, currDisplayElement) {
    this.prevDisplayElement = prevDisplayElement;
    this.currDisplayElement = currDisplayElement;
    this.history = JSON.parse(localStorage.getItem('calc_history') || '[]');
    this.soundEnabled = localStorage.getItem('calc_sound') !== 'false';
    this.theme = localStorage.getItem('calc_theme') || 'dark';
    this.audioCtx = null;
    this.clear();
  }

  clear() {
    this.currentOperand = '0';
    this.previousOperand = '';
    this.operation = undefined;
    this.shouldResetScreen = false;
  }

  delete() {
    if (this.shouldResetScreen) {
      this.currentOperand = '0';
      this.shouldResetScreen = false;
      return;
    }
    if (this.currentOperand === 'Error' || this.currentOperand === 'Cannot divide by 0') {
      this.currentOperand = '0';
      return;
    }
    if (this.currentOperand.length <= 1) {
      this.currentOperand = '0';
    } else {
      this.currentOperand = this.currentOperand.slice(0, -1);
    }
  }

  appendNumber(number) {
    if (this.shouldResetScreen || this.currentOperand === 'Error' || this.currentOperand === 'Cannot divide by 0') {
      this.currentOperand = '';
      this.shouldResetScreen = false;
    }

    if (number === '.' && this.currentOperand.includes('.')) return;
    if (number === '.' && this.currentOperand === '') {
      this.currentOperand = '0.';
      return;
    }
    if (this.currentOperand === '0' && number !== '.') {
      this.currentOperand = number.toString();
      return;
    }

    // Limit maximum length to prevent overflow
    if (this.currentOperand.length >= 16) return;

    this.currentOperand = this.currentOperand.toString() + number.toString();
  }

  chooseOperation(operation) {
    if (this.currentOperand === 'Error' || this.currentOperand === 'Cannot divide by 0') {
      this.clear();
    }

    if (this.operation && !this.shouldResetScreen) {
      this.compute();
    }

    this.operation = operation;
    this.previousOperand = this.currentOperand;
    this.shouldResetScreen = true;
  }

  negate() {
    if (this.currentOperand === '0' || this.currentOperand === '' || this.currentOperand === 'Error') return;
    if (this.currentOperand.startsWith('-')) {
      this.currentOperand = this.currentOperand.substring(1);
    } else {
      this.currentOperand = '-' + this.currentOperand;
    }
  }

  percent() {
    if (this.currentOperand === '' || this.currentOperand === 'Error') return;
    const value = parseFloat(this.currentOperand);
    if (isNaN(value)) return;
    this.currentOperand = this.formatNumber(value / 100);
    this.shouldResetScreen = true;
  }

  formatNumber(number) {
    if (isNaN(number) || !isFinite(number)) return 'Error';
    // Format to 12 significant figures to remove floating point errors like 0.1 + 0.2
    const cleanNumber = parseFloat(Number(number).toPrecision(12));
    
    // Check if exponent notation is needed
    if (Math.abs(cleanNumber) >= 1e12 || (Math.abs(cleanNumber) > 0 && Math.abs(cleanNumber) < 1e-6)) {
      return cleanNumber.toExponential(6);
    }

    return cleanNumber.toString();
  }

  compute() {
    let computation;
    const prev = parseFloat(this.previousOperand);
    const current = parseFloat(this.currentOperand);

    if (isNaN(prev) || isNaN(current)) return;

    switch (this.operation) {
      case '+':
        computation = prev + current;
        break;
      case '-':
        computation = prev - current;
        break;
      case '×':
      case '*':
        computation = prev * current;
        break;
      case '÷':
      case '/':
        if (current === 0) {
          this.currentOperand = 'Cannot divide by 0';
          this.previousOperand = '';
          this.operation = undefined;
          this.shouldResetScreen = true;
          return;
        }
        computation = prev / current;
        break;
      default:
        return;
    }

    const expressionStr = `${this.previousOperand} ${this.operation} ${this.currentOperand}`;
    const resultStr = this.formatNumber(computation);

    // Save to history
    this.addHistory(expressionStr, resultStr);

    this.currentOperand = resultStr;
    this.operation = undefined;
    this.previousOperand = '';
    this.shouldResetScreen = true;
  }

  addHistory(expression, result) {
    this.history.unshift({
      expression,
      result,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    if (this.history.length > 30) {
      this.history.pop();
    }

    try {
      localStorage.setItem('calc_history', JSON.stringify(this.history));
    } catch (e) {
      console.warn('Could not save history to localStorage', e);
    }

    renderHistory();
  }

  clearHistory() {
    this.history = [];
    localStorage.removeItem('calc_history');
    renderHistory();
  }

  playFeedback(type = 'click') {
    if (!this.soundEnabled) return;
    try {
      if (!this.audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioContext();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      const now = this.audioCtx.currentTime;

      if (type === 'equals') {
        // Cheerful higher confirmation chord
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08); // A5
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.start(now);
        osc.stop(now + 0.09);
      } else if (type === 'op') {
        // Operator tone
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'clear') {
        // Reset tone
        osc.frequency.setValueAtTime(329.63, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.07);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        osc.start(now);
        osc.stop(now + 0.07);
      } else {
        // Standard digit click
        osc.frequency.setValueAtTime(700, now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        osc.start(now);
        osc.stop(now + 0.03);
      }
    } catch (e) {
      // Audio context might be restricted before interaction
    }
  }

  updateDisplay() {
    // Dynamic text size reduction if numbers get too long
    const length = this.currentOperand.length;
    if (length > 13) {
      this.currDisplayElement.className = this.currDisplayElement.className.replace(/text-[2-5]xl|sm:text-[2-5]xl/g, '');
      this.currDisplayElement.classList.add('text-2xl', 'sm:text-3xl');
    } else if (length > 9) {
      this.currDisplayElement.className = this.currDisplayElement.className.replace(/text-[2-5]xl|sm:text-[2-5]xl/g, '');
      this.currDisplayElement.classList.add('text-3xl', 'sm:text-4xl');
    } else {
      this.currDisplayElement.className = this.currDisplayElement.className.replace(/text-[2-5]xl|sm:text-[2-5]xl/g, '');
      this.currDisplayElement.classList.add('text-4xl', 'sm:text-5xl');
    }

    this.currDisplayElement.innerText = this.currentOperand;

    if (this.operation != null) {
      this.prevDisplayElement.innerText = `${this.previousOperand} ${this.operation}`;
    } else {
      this.prevDisplayElement.innerText = '';
    }
  }
}

// DOM Elements
const prevDisplay = document.getElementById('prevDisplay');
const currDisplay = document.getElementById('currDisplay');
const historyDrawer = document.getElementById('historyDrawer');
const historyList = document.getElementById('historyList');
const historyBadge = document.getElementById('historyBadge');
const btnToggleHistory = document.getElementById('btnToggleHistory');
const btnCloseHistory = document.getElementById('btnCloseHistory');
const btnClearHistory = document.getElementById('btnClearHistory');
const btnSoundToggle = document.getElementById('btnSoundToggle');
const iconSoundOn = document.getElementById('iconSoundOn');
const iconSoundOff = document.getElementById('iconSoundOff');
const btnThemeToggle = document.getElementById('btnThemeToggle');
const iconThemeLight = document.getElementById('iconThemeLight');
const iconThemeDark = document.getElementById('iconThemeDark');

// Initialize Calculator instance
const calc = new Calculator(prevDisplay, currDisplay);

// Sound State UI sync
function syncSoundUI() {
  if (calc.soundEnabled) {
    iconSoundOn.classList.remove('hidden');
    iconSoundOff.classList.add('hidden');
  } else {
    iconSoundOn.classList.add('hidden');
    iconSoundOff.classList.remove('hidden');
  }
}

btnSoundToggle.addEventListener('click', () => {
  calc.soundEnabled = !calc.soundEnabled;
  localStorage.setItem('calc_sound', calc.soundEnabled);
  syncSoundUI();
  if (calc.soundEnabled) {
    calc.playFeedback('click');
  }
});

// Theme Management
function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
    iconThemeLight.classList.remove('hidden');
    iconThemeDark.classList.add('hidden');
  } else {
    root.classList.remove('dark');
    iconThemeLight.classList.add('hidden');
    iconThemeDark.classList.remove('hidden');
  }
  localStorage.setItem('calc_theme', theme);
  calc.theme = theme;
}

btnThemeToggle.addEventListener('click', () => {
  calc.playFeedback('click');
  const newTheme = calc.theme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
});

// History Drawer UI
function renderHistory() {
  historyList.innerHTML = '';
  if (calc.history.length === 0) {
    historyList.innerHTML = `
      <div class="text-center py-8 text-xs text-slate-400 dark:text-slate-500">
        No calculations yet
      </div>
    `;
    historyBadge.classList.add('hidden');
    return;
  }

  historyBadge.classList.remove('hidden');

  calc.history.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'group p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/50 cursor-pointer transition-all duration-150 flex items-center justify-between';
    card.innerHTML = `
      <div class="flex-1 pr-2 truncate">
        <div class="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">${item.expression} =</div>
        <div class="text-base font-mono font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">${item.result}</div>
      </div>
      <span class="text-[10px] text-slate-400 font-mono self-start">${item.timestamp}</span>
    `;

    // Click history item to recall the result into calculator
    card.addEventListener('click', () => {
      calc.playFeedback('click');
      calc.currentOperand = item.result;
      calc.previousOperand = '';
      calc.operation = undefined;
      calc.shouldResetScreen = true;
      calc.updateDisplay();
      closeHistoryDrawer();
    });

    historyList.appendChild(card);
  });
}

function openHistoryDrawer() {
  calc.playFeedback('click');
  historyDrawer.classList.remove('translate-y-full', 'opacity-0', 'pointer-events-none');
  historyDrawer.classList.add('translate-y-0', 'opacity-100', 'pointer-events-auto');
}

function closeHistoryDrawer() {
  calc.playFeedback('click');
  historyDrawer.classList.add('translate-y-full', 'opacity-0', 'pointer-events-none');
  historyDrawer.classList.remove('translate-y-0', 'opacity-100', 'pointer-events-auto');
}

btnToggleHistory.addEventListener('click', openHistoryDrawer);
btnCloseHistory.addEventListener('click', closeHistoryDrawer);
btnClearHistory.addEventListener('click', () => {
  calc.playFeedback('clear');
  calc.clearHistory();
});

// Event Delegation for keypad buttons
document.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;

  // Number Button
  if (btn.hasAttribute('data-number')) {
    calc.playFeedback('click');
    calc.appendNumber(btn.getAttribute('data-number'));
    calc.updateDisplay();
    return;
  }

  // Operator Button
  if (btn.hasAttribute('data-operator')) {
    calc.playFeedback('op');
    calc.chooseOperation(btn.getAttribute('data-operator'));
    calc.updateDisplay();
    return;
  }

  // Action Button
  if (btn.hasAttribute('data-action')) {
    const action = btn.getAttribute('data-action');
    switch (action) {
      case 'clear':
        calc.playFeedback('clear');
        calc.clear();
        break;
      case 'delete':
        calc.playFeedback('click');
        calc.delete();
        break;
      case 'equals':
        calc.playFeedback('equals');
        calc.compute();
        break;
      case 'negate':
        calc.playFeedback('click');
        calc.negate();
        break;
      case 'percent':
        calc.playFeedback('op');
        calc.percent();
        break;
      case 'decimal':
        calc.playFeedback('click');
        calc.appendNumber('.');
        break;
    }
    calc.updateDisplay();
  }
});

// Full Keyboard Support
window.addEventListener('keydown', (e) => {
  // Ignore if user is inside an input or typing somewhere else
  if (['input', 'textarea'].includes(document.activeElement.tagName.toLowerCase())) return;

  let matchedButton = null;

  if (e.key >= '0' && e.key <= '9') {
    calc.playFeedback('click');
    calc.appendNumber(e.key);
    calc.updateDisplay();
    matchedButton = document.querySelector(`[data-number="${e.key}"]`);
  } else if (e.key === '.') {
    calc.playFeedback('click');
    calc.appendNumber('.');
    calc.updateDisplay();
    matchedButton = document.querySelector('[data-action="decimal"]');
  } else if (e.key === '+') {
    calc.playFeedback('op');
    calc.chooseOperation('+');
    calc.updateDisplay();
    matchedButton = document.querySelector('[data-operator="+"]');
  } else if (e.key === '-') {
    calc.playFeedback('op');
    calc.chooseOperation('-');
    calc.updateDisplay();
    matchedButton = document.querySelector('[data-operator="-"]');
  } else if (e.key === '*') {
    calc.playFeedback('op');
    calc.chooseOperation('×');
    calc.updateDisplay();
    matchedButton = document.querySelector('[data-operator="×"]');
  } else if (e.key === '/') {
    e.preventDefault();
    calc.playFeedback('op');
    calc.chooseOperation('÷');
    calc.updateDisplay();
    matchedButton = document.querySelector('[data-operator="÷"]');
  } else if (e.key === 'Enter' || e.key === '=') {
    e.preventDefault();
    calc.playFeedback('equals');
    calc.compute();
    calc.updateDisplay();
    matchedButton = document.querySelector('[data-action="equals"]');
  } else if (e.key === 'Backspace') {
    calc.playFeedback('click');
    calc.delete();
    calc.updateDisplay();
    matchedButton = document.querySelector('[data-action="delete"]');
  } else if (e.key === 'Escape') {
    calc.playFeedback('clear');
    calc.clear();
    calc.updateDisplay();
    matchedButton = document.querySelector('[data-action="clear"]');
  } else if (e.key === '%') {
    calc.playFeedback('op');
    calc.percent();
    calc.updateDisplay();
    matchedButton = document.querySelector('[data-action="percent"]');
  }

  // Trigger brief active visual animation on matched button
  if (matchedButton) {
    matchedButton.classList.add('ring-2', 'ring-indigo-400', 'scale-95');
    setTimeout(() => {
      matchedButton.classList.remove('ring-2', 'ring-indigo-400', 'scale-95');
    }, 120);
  }
});

// Initial boot
applyTheme(calc.theme);
syncSoundUI();
renderHistory();
calc.updateDisplay();
