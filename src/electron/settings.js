const form = document.querySelector('#settings-form');
const fields = document.querySelector('#panel-fields');
const error = document.querySelector('#form-error');
const submitButton = form.querySelector('button');

function createField(panel, position) {
  const label = document.createElement('label');
  const caption = document.createElement('span');
  const input = document.createElement('input');
  caption.textContent = panel.title || `Панель ${position + 1}`;
  input.type = 'url';
  input.name = `panel-${position}`;
  input.placeholder = 'https://example.com';
  input.required = true;
  input.autocomplete = 'url';
  input.value = panel.url || '';
  label.append(caption, input);
  fields.append(label);
}

window.settingsAPI.load().then(({ panels }) => {
  panels.forEach(createField);
  fields.querySelector('input')?.focus();
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  error.textContent = '';
  submitButton.disabled = true;
  const addresses = [...fields.querySelectorAll('input')].map((input) => input.value);
  const result = await window.settingsAPI.save(addresses);
  if (!result.ok) {
    error.textContent = result.error;
    submitButton.disabled = false;
  }
});
