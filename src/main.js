// This file contains the JavaScript code that utilizes the qrcode.js library to generate QR codes. 
// It exports functions to handle user input, generate QR codes, and display them on the webpage.

document.addEventListener('DOMContentLoaded', function() {
    const qrCodeForm = document.getElementById('qrCodeForm');
    const qrCodeInput = document.getElementById('qrCodeInput');
    const qrCodeOutput = document.getElementById('qrCodeOutput');

    qrCodeForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const inputText = qrCodeInput.value;
        generateQRCode(inputText);
    });

    function generateQRCode(text) {
        const qrCode = new QRCode(qrCodeOutput, {
            text: text,
            width: 128,
            height: 128,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    }
});