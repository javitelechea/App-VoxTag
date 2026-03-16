/* ═══════════════════════════════════════════
   VoxTag — Web Speech API Module
   ═══════════════════════════════════════════ */

const VoxVoice = (() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;
    let isContinuous = false;
    let isPTT = false;
    let isActive = false;
    let isListening = false; // Internal flag for processing results
    let persistentStream = null;

    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.lang = 'es-AR';
        recognition.interimResults = true;
        recognition.continuous = true;
        
        recognition.onresult = (event) => {
            // Only process if we are in continuous mode OR if we are specifically "listening" for a PTT command
            if (!isActive || (!isContinuous && !isListening)) return;

            const result = event.results[event.results.length - 1];
            const transcript = result[0].transcript;
            
            if (result.isFinal) {
                window.dispatchEvent(new CustomEvent('vox_command', { detail: transcript.trim() }));
            } else {
                window.dispatchEvent(new CustomEvent('vox_interim', { detail: transcript.trim() }));
            }
        };

        recognition.onend = () => {
            if (isActive) {
                // Keep it alive as long as VoxVoice is "on"
                setTimeout(() => {
                    if (isActive) {
                        try { recognition.start(); } catch(e) {}
                    }
                }, 100);
            } else {
                window.dispatchEvent(new CustomEvent('vox_state_change', { detail: 'inactive' }));
            }
        };

        recognition.onerror = (event) => {
            if (event.error !== 'no-speech') {
                console.error('VoxVoice error:', event.error);
            }
        };
    }

    async function primePermission() {
        if (persistentStream) return;
        try {
            // Keeping the stream alive prevents Chrome from revoking the "active" permission state
            // especially when starting/stopping SpeechRecognition frequently (PTT)
            persistentStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log('Mic permission primed and kept alive');
        } catch (e) {
            console.warn('Mic prime failed', e);
        }
    }

    function start() {
        if (!recognition || isActive) return;
        isActive = true;
        try {
            recognition.start();
        } catch(e) {
            isActive = false;
        }
        window.dispatchEvent(new CustomEvent('vox_state_change', { detail: 'active' }));
    }

    function stop() {
        if (!recognition || !isActive) return;
        isActive = false;
        recognition.stop();
        window.dispatchEvent(new CustomEvent('vox_state_change', { detail: 'inactive' }));
    }

    function setMode(continuous) {
        isContinuous = continuous;
        // If we are switching, we might want to reset the listening state
    }

    // PTT Specific: Start/Stop listening without stopping the engine
    function startListening() {
        isListening = true;
        window.dispatchEvent(new CustomEvent('vox_state_change', { detail: 'active' }));
    }

    function stopListening() {
        // Delay setting isListening to false to allow the final SpeechRecognition result to arrive
        setTimeout(() => {
            isListening = false;
            if (!isContinuous) {
                window.dispatchEvent(new CustomEvent('vox_state_change', { detail: 'inactive' }));
            }
        }, 800); // 800ms window for final result
    }

    return {
        start, stop, setMode, primePermission,
        startListening, stopListening,
        get isActive() { return isActive; },
        isSupported: !!SpeechRecognition
    };
})();

window.VoxVoice = VoxVoice;
