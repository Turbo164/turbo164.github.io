(() => {
  'use strict';
  const button = document.getElementById('installAppBtn');
  const dialog = document.getElementById('installAppDialog');
  const title = document.getElementById('installAppTitle');
  const intro = document.getElementById('installAppIntro');
  const steps = document.getElementById('installAppSteps');
  const close = document.getElementById('installAppClose');
  if (!button || !dialog || !title || !intro || !steps || !close) return;

  const ua = navigator.userAgent || '';
  const isIOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const installed = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  let installPrompt = null;

  const instructions = () => {
    let description;
    let items;
    if (isIOS) {
      description = 'Save Turbo164 on your iPhone or iPad for quick access.';
      items = [
        'Open Turbo164 in Safari.',
        'Tap the Share button in the Safari toolbar.',
        'Scroll and choose Add to Home Screen.',
        'Tap Add to confirm.'
      ];
    } else if (isAndroid) {
      description = 'Install Turbo164 on your Android device for quick access.';
      items = [
        'In Chrome, tap the ⋮ menu.',
        'Choose Install app or Add to Home Screen.',
        'Confirm by tapping Install or Add.'
      ];
    } else {
      description = 'Use Safari on an iPhone or iPad to add Turbo164 to your Home Screen.';
      items = [
        'Open Turbo164 in your browser.',
        'Open the browser menu or Share menu.',
        'Choose Install app or Add to Home Screen, then follow the prompt.'
      ];
    }
    title.textContent = 'Add Turbo164 to your Home Screen';
    intro.textContent = description;
    steps.replaceChildren(...items.map(label => {
      const item = document.createElement('li');
      item.textContent = label;
      return item;
    }));
  };

  const openInstructions = () => {
    instructions();
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  };

  button.hidden = installed() || !(isIOS || isAndroid);

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
    if (!installed()) {
      button.hidden = false;
      button.textContent = 'Install Turbo164';
    }
  });

  window.addEventListener('appinstalled', () => {
    button.hidden = true;
    installPrompt = null;
  });

  button.addEventListener('click', async () => {
    if (!installPrompt) {
      openInstructions();
      return;
    }
    const prompt = installPrompt;
    installPrompt = null;
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice && choice.outcome === 'accepted') {
      button.hidden = true;
      const status = document.createElement('p');
      status.className = 'muted';
      status.setAttribute('role', 'status');
      status.textContent = 'Turbo164 was added to your Home Screen.';
      button.insertAdjacentElement('afterend', status);
    } else if (isAndroid) {
      openInstructions();
    }
  });

  close.addEventListener('click', () => {
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  });
})();
