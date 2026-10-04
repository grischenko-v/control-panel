// Этот файл выполняется напрямую в изолированном окне браузера. Не добавляйте
// сюда import/export: CommonJS-обёртка ожидает Node.js-объект `exports`, который
// намеренно недоступен при nodeIntegration: false.
interface SettingsPanelData {
  title: string;
  url: string;
}

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Не найден элемент интерфейса: ${selector}`);
  }
  return element;
}

const form = requireElement<HTMLFormElement>('#settings-form');
const fields = requireElement<HTMLDivElement>('#panel-fields');
const errorMessage = requireElement<HTMLParagraphElement>('#form-error');
const submitButton = requireElement<HTMLButtonElement>('#settings-form button');

function createField(panel: SettingsPanelData, position: number): void {
  const label = document.createElement('label');
  const caption = document.createElement('span');
  const input = document.createElement('input');
  caption.textContent = panel.title || `Панель ${position + 1}`;
  input.type = 'url';
  input.name = `panel-${position}`;
  input.placeholder = 'https://адрес-сайта.рф';
  input.setAttribute('autocomplete', 'url');
  input.value = panel.url || '';
  label.append(caption, input);
  fields.append(label);
}

void window.settingsAPI.load()
  .then(({ panels }) => {
    panels.forEach(createField);
    fields.querySelector('input')?.focus();
  })
  .catch(() => {
    errorMessage.textContent = 'Не удалось загрузить настройки';
  });

form.addEventListener('submit', (event) => {
  event.preventDefault();
  errorMessage.textContent = '';
  const inputs = [...fields.querySelectorAll<HTMLInputElement>('input')];
  const addresses: string[] = [];
  for (const [position, input] of inputs.entries()) {
    const value = input.value.trim();
    if (!value) {
      errorMessage.textContent = `Укажите адрес для панели ${position + 1}`;
      input.focus();
      return;
    }
    try {
      const url = new URL(value);
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Неподдерживаемый протокол');
      }
      addresses.push(url.toString());
    } catch {
      errorMessage.textContent = `Проверьте адрес панели ${position + 1}`;
      input.focus();
      return;
    }
  }

  submitButton.disabled = true;
  void window.settingsAPI.save(addresses).then((result) => {
    if (!result.ok) {
      errorMessage.textContent = result.error;
      submitButton.disabled = false;
    }
  });
});
