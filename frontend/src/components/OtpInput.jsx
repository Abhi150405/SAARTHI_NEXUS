import React, { useRef, useEffect } from 'react';

/**
 * OtpInput
 * A high-performance, accessible 6-box numeric OTP input component.
 * Supports auto-focus, paste, backspace jumps, and arrow keys.
 */
const OtpInput = ({ length = 6, value = '', onChange, disabled = false, autoFocus = true }) => {
    const inputRefs = useRef([]);

    useEffect(() => {
        if (autoFocus && inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, [autoFocus]);

    const digits = (value || '').split('').concat(Array(length).fill('')).slice(0, length);

    const handleChange = (e, index) => {
        const val = e.target.value;
        // Only accept single numeric digit
        const lastChar = val.slice(-1);
        if (lastChar && !/^\d$/.test(lastChar)) return;

        const newDigits = [...digits];
        newDigits[index] = lastChar || '';
        const newCode = newDigits.join('');
        onChange(newCode);

        // Move to next input if digit entered
        if (lastChar && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace') {
            if (!digits[index] && index > 0) {
                // If current slot is empty, backspace moves to and clears previous slot
                const newDigits = [...digits];
                newDigits[index - 1] = '';
                onChange(newDigits.join(''));
                inputRefs.current[index - 1]?.focus();
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text/plain').trim();
        const numbersOnly = pasted.replace(/\D/g, '').slice(0, length);
        if (!numbersOnly) return;

        onChange(numbersOnly);

        // Focus the input corresponding to the pasted length or last slot
        const targetIndex = Math.min(numbersOnly.length, length - 1);
        inputRefs.current[targetIndex]?.focus();
    };

    return (
        <div className="flex items-center justify-between gap-2 sm:gap-3 w-full" onPaste={handlePaste}>
            {Array.from({ length }).map((_, i) => (
                <input
                    key={i}
                    ref={(el) => (inputRefs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={digits[i] || ''}
                    disabled={disabled}
                    onChange={(e) => handleChange(e, i)}
                    onKeyDown={(e) => handleKeyDown(e, i)}
                    className="w-11 h-13 sm:w-12 sm:h-14 text-center font-mono text-xl sm:text-2xl font-bold rounded-xl border transition-all duration-150 outline-none select-none disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                        backgroundColor: digits[i] ? '#161616' : '#111111',
                        borderColor: digits[i] ? 'var(--primary, #F97316)' : '#2A2A2A',
                        color: 'var(--text-main, #F5F5F5)',
                        boxShadow: digits[i] ? '0 0 10px rgba(249, 115, 22, 0.15)' : 'none',
                    }}
                />
            ))}
        </div>
    );
};

export default OtpInput;
