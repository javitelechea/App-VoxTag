/* ═══════════════════════════════════════════
   VoxTag — Web Speech API Module
   ═══════════════════════════════════════════ */

const VoxVoice = (() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;
    let isContinuous = false;
    let isActive = false;
    let isListening = false;
    let persistentStream = null;
    let currentSessionId = 0;

    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.lang = 'es-AR';
        recognition.interimResults = true;
        recognition.continuous = true;
        
        recognition.onresult = (event) => {
            if (!isActive || !isListening) return;

            const result = event.results[event.results.length - 1];
            const transcript = result[0].transcript;
            
            if (result.isFinal) {
                console.log('VoxVoice: Command detected:', transcript.trim());
                window.dispatchEvent(new CustomEvent('vox_command', { detail: transcript.trim() }));
            } else {
                window.dispatchEvent(new CustomEvent('vox_interim', { detail: transcript.trim() }));
            }
        };

        recognition.onend = () => {
            // Only restart if we are in continuous mode and still active
            if (isActive && isContinuous) {
                setTimeout(() => {
                    if (isActive && isContinuous) {
                        try { recognition.start(); } catch(e) {}
                    }
                }, 100);
            } else if (!isActive) {
                window.dispatchEvent(new CustomEvent('vox_state_change', { detail: 'inactive' }));
            }
        };

        recognition.onerror = (event) => {
            if (event.error !== 'no-speech') {
                console.error('VoxVoice error:', event.error);
                if (event.error === 'aborted') isActive = false;
            }
        };
    }

    async function primePermission() {
        if (persistentStream) return;
        try {
            persistentStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log('Mic permission primed');
        } catch (e) {
            console.warn('Mic prime failed', e);
        }
    }

    function start() {
        if (!recognition || isActive) return;
        isActive = true;
        isListening = true; 
        try {
            recognition.start();
            window.dispatchEvent(new CustomEvent('vox_state_change', { detail: 'active' }));
        } catch(e) {
            isActive = false;
        }
    }

    function stop() {
        if (!recognition || !isActive) return;
        isActive = false;
        isListening = false;
        recognition.stop();
        window.dispatchEvent(new CustomEvent('vox_state_change', { detail: 'inactive' }));
    }

    function setMode(continuous) {
        isContinuous = continuous;
    }

    // PTT Specific
    function startListening() {
        if (isContinuous) return;
        // Reset everything to ensure we don't have old audio
        isActive = true;
        isListening = true;
        try {
            recognition.start();
            window.dispatchEvent(new CustomEvent('vox_state_change', { detail: 'active' }));
        } catch(e) {
            console.error('PTT Start failed', e);
        }
    }

    function stopListening() {
        if (isContinuous) return;
        // Stop the engine IMMEDIATELY to stop recording/buffering
        setTimeout(() => {
            isActive = false;
            isListening = false;
            recognition.stop();
            window.dispatchEvent(new CustomEvent('vox_state_change', { detail: 'inactive' }));
        }, 300); // Short grace period for final processing
    }

    return {
        start, stop, setMode, primePermission,
        startListening, stopListening,
        get isActive() { return isActive; },
        isSupported: !!SpeechRecognition
    };
})();

window.VoxVoice = VoxVoice;
