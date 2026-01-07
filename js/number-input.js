class NumberInputController {
  constructor() {
    this.maxDigits = 3;
    this.container = null;
    this.display = null;
    this.digitButtons = [];
    this.deleteButton = null;
    this.enterButton = null;
    this.currentDigits = [];
  }

  init() {
    this.container = document.querySelector('.number-screen');
    if (!this.container) return;

    this.display = this.container.querySelector('[data-number-display]');
    this.digitButtons = Array.from(this.container.querySelectorAll('[data-digit]'));
    this.deleteButton = this.container.querySelector('[data-action="delete"]');
    this.enterButton = this.container.querySelector('[data-action="enter"]');
    this.currentDigits = [];

    this.bindEvents();
    this.updateDisplay();
  }

  bindEvents() {
    this.digitButtons.forEach((button) => {
      button.addEventListener('click', () => {
        this.handleDigit(button.dataset.digit);
      });
    });

    if (this.deleteButton) {
      this.deleteButton.addEventListener('click', () => this.handleDelete());
    }

    if (this.enterButton) {
      this.enterButton.addEventListener('click', () => this.handleEnter());
    }
  }

  handleDigit(digit) {
    if (this.currentDigits.length >= this.maxDigits) return;
    this.currentDigits.push(digit);
    this.updateDisplay();
  }

  handleDelete() {
    if (!this.currentDigits.length) return;
    this.currentDigits = [];
    this.updateDisplay();
  }

  handleEnter() {
    if (!this.currentDigits.length) return;
    // Noch keine Aktion vorgesehen
  }

  updateDisplay() {
    if (!this.display) return;

    const slots = Array.from({ length: this.maxDigits }, (_, index) => {
      return this.currentDigits[index] || '_';
    });

    this.display.textContent = slots.join(' ');

    const hasDigits = this.currentDigits.length > 0;
    this.display.classList.toggle('number-display-filled', hasDigits);
    this.display.classList.toggle('number-display-empty', !hasDigits);

    this.toggleActionState(this.deleteButton, hasDigits, 'images/icons/button_delete_red.png', 'images/icons/button_delete_grey.png');
    this.toggleActionState(this.enterButton, hasDigits, 'images/icons/button_enter_grey.png', 'images/icons/button_enter_grey.png');
  }

  toggleActionState(button, isActive, activeIcon, inactiveIcon) {
    if (!button) return;
    button.classList.toggle('number-action-active', isActive);
    button.setAttribute('aria-disabled', String(!isActive));
    button.disabled = !isActive;

    const icon = button.querySelector('img');
    if (icon) {
      icon.src = isActive ? activeIcon : inactiveIcon;
    }
  }
}

window.NumberInputController = NumberInputController;
