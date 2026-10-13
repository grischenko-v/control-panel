import { ipcRenderer } from 'electron';

let expandButton: HTMLButtonElement | undefined;
let panelExpanded = false;
const clickedPageControls = new WeakSet<Element>();

function ensureExpandButton(): HTMLButtonElement | undefined {
  if (expandButton || !document.body) {
    return expandButton;
  }

  expandButton = document.createElement('button');
  expandButton.type = 'button';
  expandButton.textContent = '⤢';
  expandButton.title = 'Развернуть панель';
  expandButton.setAttribute('aria-label', 'Развернуть панель');
  expandButton.style.position = 'fixed';
  expandButton.style.top = '10px';
  expandButton.style.right = '10px';
  expandButton.style.zIndex = '2147483647';
  expandButton.style.width = '34px';
  expandButton.style.height = '34px';
  expandButton.style.border = '1px solid rgba(255, 255, 255, 0.72)';
  expandButton.style.borderRadius = '8px';
  expandButton.style.background = 'rgba(11, 60, 51, 0.92)';
  expandButton.style.color = '#ffffff';
  expandButton.style.font = '18px/1 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  expandButton.style.boxShadow = '0 6px 18px rgba(0, 0, 0, 0.28)';
  expandButton.style.cursor = 'pointer';
  expandButton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    ipcRenderer.send('panel:toggle-expanded');
  });
  document.body.append(expandButton);
  return expandButton;
}

function setExpandedState(expanded: boolean): void {
  panelExpanded = expanded;
  const button = ensureExpandButton();
  if (!button) {
    return;
  }

  button.textContent = expanded ? '↙' : '⤢';
  button.title = expanded ? 'Вернуть панель на место' : 'Развернуть панель';
  button.setAttribute('aria-label', button.title);
  applyPageAutomation();
}

function clickOnce(element: Element | null | undefined): void {
  if (!element || clickedPageControls.has(element)) {
    return;
  }

  clickedPageControls.add(element);
  if (element instanceof HTMLElement) {
    element.click();
  }
}

function clickPageControl(selector: string): void {
  const element = document.querySelector(selector);
  clickOnce(element?.closest('button, [role="button"], a') ?? element);
}

function applyPageAutomation(): void {
  if (panelExpanded) {
    return;
  }

  clickPageControl('.header-hide-all-button__icon');
}

function isEditableElement(element: Element | null): boolean {
  if (!element) {
    return false;
  }

  if (element.closest('[contenteditable=""], [contenteditable="true"], [role="textbox"]')) {
    return true;
  }

  return ['INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName);
}

window.addEventListener('keydown', (event) => {
  if (
    event.key !== 'Backspace' ||
    event.repeat ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    isEditableElement(document.activeElement)
  ) {
    return;
  }

  event.preventDefault();
  ipcRenderer.send('panel:navigate-back');
}, true);

window.addEventListener('DOMContentLoaded', () => {
  ensureExpandButton();
  applyPageAutomation();
  new MutationObserver(applyPageAutomation).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
});

ipcRenderer.on('panel:expanded-state', (_event, expanded: boolean) => {
  setExpandedState(expanded);
});
