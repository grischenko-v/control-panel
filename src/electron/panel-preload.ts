import { ipcRenderer } from 'electron';

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
