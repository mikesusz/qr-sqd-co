// This file contains the JavaScript code that uses qrcode.js to generate QR codes.
// Handles user input, size controls and generation state.

document.addEventListener('DOMContentLoaded', () => {
	const form = document.getElementById('qrCodeForm');
	const input = document.getElementById('qrCodeInput');
	const output = document.getElementById('qrCodeOutput');

	const toggle = document.getElementById('toggleAdvanced');
	const advanced = document.getElementById('advancedControls');
	const slider = document.getElementById('qrSizeSlider');
	const sizeValue = document.getElementById('qrSizeValue');
	const resetBtn = document.getElementById('qrResetSize');
	const currentSizeBadge = document.getElementById('currentSizeBadge');

	// exact-number input
	const textInput = document.getElementById('qrSizeText');

	// generate button and input error element
	const genButton = document.getElementById('generateBtn');
	const inputError = document.getElementById('inputError');

	const DEFAULT_SIZE = 128;

	let hasGenerated = false;
	let lastGeneratedSize = DEFAULT_SIZE;
	let lastGeneratedText = ''; // track last generated text

	// helper to reflect size everywhere; accepts number or string (during typing)
	function updateSizeDisplays(val, updateTextInput = false) {
		const s = String(val);
		if (sizeValue) sizeValue.textContent = s;
		if (currentSizeBadge) currentSizeBadge.textContent = `${s}px`;
		if (textInput && updateTextInput) {
			textInput.value = s;
		}
	}

	// visually mark output as "dirty" and update button text
	function setDirty(isDirty) {
		if (!output) return;
		if (isDirty) {
			output.classList.add('dirty');
			if (genButton) genButton.textContent = 'Re-generate QR Code';
		} else {
			output.classList.remove('dirty');
			if (genButton) genButton.textContent = 'Generate QR Code';
		}
	}

	// helper to mark the UI as "dirty" (needs re-generate) if size differs from last generated, or text input has changed
	function markDirtyIfNeeded(newSize) {
		if (!hasGenerated) return;
		if (typeof newSize === 'number' && newSize !== lastGeneratedSize) {
			setDirty(true);
		} else {
			// size matches; check text too
			if (input && input.value.trim() === lastGeneratedText) {
				setDirty(false);
			} else {
				setDirty(true);
			}
		}
	}

	// helper for text changes
	function markTextDirtyIfNeeded(newText) {
		if (!hasGenerated) return;
		if (typeof newText !== 'string') newText = String(newText);
		if (newText.trim() !== lastGeneratedText) {
			setDirty(true);
		} else {
			// if text matches last generated and size also matches, clear dirty
			const currentSize = textInput && textInput.value.trim() !== '' ? parseInt(textInput.value, 10) : (slider ? parseInt(slider.value, 10) : DEFAULT_SIZE);
			if (!Number.isNaN(currentSize) && currentSize === lastGeneratedSize) {
				setDirty(false);
			} else {
				setDirty(true);
			}
		}
	}

	// clamp helper and sync slider when appropriate
	function clampAndSync(n) {
		const min = slider ? (parseInt(slider.min, 10) || 1) : 1;
		const max = slider ? (parseInt(slider.max, 10) || 10000) : 10000;
		let v = Number.isFinite(n) ? Math.round(n) : DEFAULT_SIZE;
		if (v < min) v = min;
		if (v > max) v = max;
		// sync slider only when within bounds
		if (slider) {
			slider.value = v;
		}
		updateSizeDisplays(v, true);
		markDirtyIfNeeded(v);
		return v;
	}

	// initialize display
	updateSizeDisplays(slider?.value ?? DEFAULT_SIZE, true);
	if (slider && textInput) textInput.value = slider.value;

	// clear input error when user starts typing
	input?.addEventListener('input', () => {
		if (inputError) {
			inputError.classList.add('hidden');
			inputError.textContent = '';
		}
		if (input) input.classList.remove('input-error');
		// if they change the main text after generating, mark as dirty
		if (input) markTextDirtyIfNeeded(input.value);
	});

	// toggle advanced controls visibility
	toggle?.addEventListener('click', (e) => {
		e.preventDefault();
		if (!advanced) return;
		advanced.classList.toggle('hidden');
		const shown = !advanced.classList.contains('hidden');
		advanced.setAttribute('aria-hidden', String(!shown));
		toggle.textContent = shown ? 'Hide size control' : 'Show size control';

		// if the controls were closed -> reset to default
		if (!shown) {
			clampAndSync(DEFAULT_SIZE);
		}
	});

	// live update from slider (step value is defined in the HTML input element, e.g. <input step="8">)
	slider?.addEventListener('input', () => {
		const v = parseInt(slider.value, 10) || DEFAULT_SIZE;
		// slider changes should update the exact input as well (when aligned)
		if (textInput) textInput.value = v;
		updateSizeDisplays(v);
		markDirtyIfNeeded(v);
		// also consider text dirty state (if main text hasn't changed, keep button state coherent)
		if (input) markTextDirtyIfNeeded(input.value);
	});

	// live update from exact text input (allows non-step values)
	// allow the user to type freely; don't immediately clamp during typing
	textInput?.addEventListener('input', () => {
		const raw = textInput.value.trim();
		// show the raw typed value in the UI badge/display so user sees feedback
		if (raw === '') {
			updateSizeDisplays('', false);
			return;
		}
		// if raw is a (possibly partial) number, reflect it but don't force slider/strict clamp yet
		const maybe = parseInt(raw, 10);
		if (!Number.isNaN(maybe)) {
			// display typed numeric value; only sync slider if it aligns with the slider step and is within bounds
			const min = slider ? (parseInt(slider.min, 10) || 1) : 1;
			const max = slider ? (parseInt(slider.max, 10) || 10000) : 10000;
			const step = slider ? (parseInt(slider.step, 10) || 1) : 1;
			updateSizeDisplays(raw, false);
			if (maybe >= min && maybe <= max && ((maybe - min) % step === 0)) {
				slider.value = maybe;
			}
			// only mark dirty if parsed number differs from last generated
			markDirtyIfNeeded(maybe);
		} else {
			// non-numeric typed; just show raw
			updateSizeDisplays(raw, false);
		}
		// text input (size) changed -> also consider whether main text differs from last generated
		if (input) markTextDirtyIfNeeded(input.value);
	});

	// enforce clamp when the user finishes editing (blur) or presses Enter in the number field
	textInput?.addEventListener('blur', () => {
		const n = parseInt(textInput.value, 10);
		if (Number.isNaN(n)) {
			// restore to slider/default if invalid
			clampAndSync(slider ? parseInt(slider.value, 10) : DEFAULT_SIZE);
		} else {
			const clamped = clampAndSync(n);
			markDirtyIfNeeded(clamped);
		}
		if (input) markTextDirtyIfNeeded(input.value);
	});
	textInput?.addEventListener('keydown', (ev) => {
		if (ev.key === 'Enter') {
			ev.preventDefault();
			textInput.blur(); // trigger blur handler to clamp and sync
		}
	});

	// reset button
	resetBtn?.addEventListener('click', () => {
		clampAndSync(DEFAULT_SIZE);
		if (input) markTextDirtyIfNeeded(input.value);
	});

	// generate QR on submit
	form?.addEventListener('submit', (e) => {
		e.preventDefault();
		const text = input.value.trim();
		if (!text) {
			// show validation error
			if (input) input.classList.add('input-error');
			if (inputError) {
				inputError.textContent = 'Please enter text or a URL to generate a QR code.';
				inputError.classList.remove('hidden');
			}
			if (input) input.focus();
			return;
		}

		// clear previous output
		output.innerHTML = '';

		// prefer exact text input value (allows non-8 increments), fallback to slider, fallback to default
		let size = DEFAULT_SIZE;
		if (textInput && textInput.value.trim() !== '') {
			const n = parseInt(textInput.value, 10);
			if (!Number.isNaN(n)) {
				// clamp on submit
				size = clampAndSync(n);
			} else if (slider) {
				size = parseInt(slider.value, 10) || DEFAULT_SIZE;
			}
		} else if (slider) {
			size = parseInt(slider.value, 10) || DEFAULT_SIZE;
		}

		// generate QR
		new QRCode(output, {
			text,
			width: size,
			height: size,
			colorDark: "#000000",
			colorLight: "#ffffff",
			correctLevel: QRCode.CorrectLevel.H,
		});

		// update state / reset button text
		hasGenerated = true;
		lastGeneratedSize = size;
		lastGeneratedText = text;
		setDirty(false);
	});
});