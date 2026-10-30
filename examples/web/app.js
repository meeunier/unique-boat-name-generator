import { boatNameStream, usernameStream, boatNameCapacity, USERNAME_BASES } from './lib/index.js';

function connect(buttonId, listId, errorId, stream) {
  const button = document.getElementById(buttonId);
  const list = document.getElementById(listId);
  const error = document.getElementById(errorId);
  button.addEventListener('click', () => {
    try {
      const next = stream.next();
      if (next.done) {
        error.textContent = 'All available names generated. Reload to start again.';
        button.disabled = true;
        return;
      }
      const name = next.value;
      const row = document.createElement('li');
      if (typeof name === 'string') {
        row.className = 'username';
        row.textContent = name;
      } else {
        const display = document.createElement('div');
        display.textContent = name.display;
        const code = document.createElement('code');
        code.textContent = name.username;
        row.append(display, code);
      }
      list.prepend(row);
    } catch {
      error.textContent = 'Could not generate a name. Reload to try again.';
      button.disabled = true;
    }
  });
}

connect('generate-boat', 'boat-names', 'boat-error', boatNameStream());
connect('generate-user', 'user-names', 'user-error', usernameStream());
document.getElementById('counts').textContent =
  `${boatNameCapacity().toLocaleString()} boat names · ${USERNAME_BASES.length.toLocaleString()} characters`;
