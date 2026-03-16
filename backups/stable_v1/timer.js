/* ═══════════════════════════════════════════
   VoxTag — Live Mode Timer
   ═══════════════════════════════════════════ */

const VoxTimer = (() => {
    let startTime = null;
    let accumulatedTime = 0;
    let timerInterval = null;
    let isRunning = false;

    function start() {
        if (isRunning) return;
        isRunning = true;
        startTime = Date.now();
        timerInterval = setInterval(() => {
            window.dispatchEvent(new CustomEvent('timer_tick', { detail: getTime() }));
        }, 1000);
    }

    function stop() {
        if (!isRunning) return;
        isRunning = false;
        accumulatedTime += (Date.now() - startTime) / 1000;
        clearInterval(timerInterval);
    }

    function reset() {
        stop();
        accumulatedTime = 0;
        window.dispatchEvent(new CustomEvent('timer_tick', { detail: 0 }));
    }

    function getTime() {
        if (!isRunning) return accumulatedTime;
        return accumulatedTime + (Date.now() - startTime) / 1000;
    }

    function formatTime(seconds) {
        const s = Math.floor(seconds);
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    }

    return {
        start, stop, reset, getTime, formatTime, 
        get isRunning() { return isRunning; }
    };
})();
