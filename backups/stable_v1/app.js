document.addEventListener('DOMContentLoaded', () => {
    console.log('VoxTag: Premium Initializing...');
    
    const getEl = id => {
        const el = document.getElementById(id);
        if (!el) console.warn('Missing element:', id);
        return el;
    };

    const btnVideo = getEl('mode-video');
    const btnLive = getEl('mode-live');
    const playerWrap = getEl('player-container');
    const liveWrap = getEl('live-display');
    const noGameOverlay = getEl('no-game-overlay');

    const btnNew = getEl('btn-new-game');
    const modalNew = getEl('modal-new-game');
    const btnSave = getEl('btn-save-game');
    const btnCancel = getEl('btn-cancel-game');
    const inputTitle = getEl('input-game-title');
    const inputYT = getEl('input-youtube-id');

    const tagButtonsA = getEl('tag-buttons-a');
    const tagButtonsB = getEl('tag-buttons-b');
    const eventCount = getEl('event-count');
    const eventList = getEl('event-list');

    const tagEditor = getEl('tag-editor-inline');
    const editLabel = getEl('edit-tag-label');
    const editPre = getEl('edit-tag-pre');
    const editPost = getEl('edit-tag-post');
    const editRow = getEl('edit-tag-row');
    const btnToggleEditor = getEl('btn-toggle-tag-editor');

    const btnTimerToggle = getEl('btn-timer-toggle');
    const timerText = getEl('live-timer-display');

    const btnVoiceConstant = getEl('btn-voice-constant');
    const btnVoicePTT = getEl('btn-voice-ptt');
    const voiceIndicator = getEl('voice-indicator');
    const recognizedOutput = getEl('recognized-output');

    let currentMode = 'video';
    let voiceMode = 'none';
    let tagEditMode = false;
    let editingTagId = null;

    // Init
    YTPlayer.init();
    renderTagButtons();

    function renderTagButtons() {
        if (!tagButtonsA || !tagButtonsB) return;
        tagButtonsA.innerHTML = '';
        tagButtonsB.innerHTML = '';
        
        const tags = VoxStore.getTagTypes();
        const topKeys = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'];
        const bottomKeys = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'];
        
        let topIdx = 0, bottomIdx = 0;

        tags.forEach(tag => {
            const btn = document.createElement('button');
            const isRival = tag.row === 'bottom';
            let key = '';
            
            if (!tagEditMode) {
                if (!isRival && topIdx < topKeys.length) key = topKeys[topIdx++];
                else if (isRival && bottomIdx < bottomKeys.length) key = bottomKeys[bottomIdx++];
            }

            btn.className = 'tag-btn' + (isRival ? ' tag-btn-rival' : '') + (editingTagId === tag.id ? ' active' : '');
            if (key) {
                btn.innerHTML = `<span>${tag.label}</span> <span class="hotkey-label">${key}</span>`;
                btn.dataset.hotkey = key.toLowerCase();
            } else {
                btn.textContent = tag.label;
            }

            btn.onclick = () => {
                if (tagEditMode) {
                    openTagEditor(tag);
                } else {
                    const time = (currentMode === 'video') ? YTPlayer.getCurrentTime() : VoxTimer.getTime();
                    VoxStore.addEvent(tag.id, time);
                    btn.classList.add('tag-flash');
                    setTimeout(() => btn.classList.remove('tag-flash'), 500);
                    toast(`Evento: ${tag.label}`);
                }
            };

            if (isRival) tagButtonsB.appendChild(btn);
            else tagButtonsA.appendChild(btn);
        });

        if (tagEditMode) {
            const addBtn = document.createElement('button');
            addBtn.className = 'tag-btn';
            addBtn.textContent = '+';
            addBtn.onclick = () => openTagEditor(null);
            tagButtonsA.appendChild(addBtn);
        }
    }

    function openTagEditor(tag) {
        editingTagId = tag ? tag.id : null;
        tagEditor.style.display = 'block';
        if (tag) {
            editLabel.value = tag.label;
            editPre.value = tag.pre_sec;
            editPost.value = tag.post_sec;
            editRow.value = tag.row;
            getEl('btn-delete-tag').style.display = 'inline-block';
        } else {
            editLabel.value = '';
            editPre.value = 5;
            editPost.value = 10;
            editRow.value = 'top';
            getEl('btn-delete-tag').style.display = 'none';
        }
        renderTagButtons();
    }

    btnToggleEditor.onclick = () => {
        tagEditMode = !tagEditMode;
        editingTagId = null;
        tagEditor.style.display = 'none';
        btnToggleEditor.classList.toggle('active', tagEditMode);
        renderTagButtons();
    };

    getEl('btn-save-tag').onclick = () => {
        const data = {
            label: editLabel.value.trim(),
            pre_sec: parseInt(editPre.value) || 0,
            post_sec: parseInt(editPost.value) || 0,
            row: editRow.value,
            aliases: []
        };
        if (!data.label) return toast('Ingresá un nombre', 'error');

        if (editingTagId) {
            VoxStore.updateTagType(editingTagId, data);
        } else {
            data.id = 'tag-' + Date.now();
            data.aliases = [data.label.toLowerCase()];
            VoxStore.addTagType(data);
        }
        tagEditor.style.display = 'none';
        editingTagId = null;
        renderTagButtons();
    };

    getEl('btn-delete-tag').onclick = () => {
        if (editingTagId && confirm('¿Eliminar?')) {
            VoxStore.deleteTagType(editingTagId);
            tagEditor.style.display = 'none';
            editingTagId = null;
            renderTagButtons();
        }
    };

    getEl('btn-cancel-tag-edit').onclick = () => {
        tagEditor.style.display = 'none';
        editingTagId = null;
        renderTagButtons();
    };

    VoxStore.on('eventsUpdated', (evts) => {
        eventCount.textContent = `${evts.length} eventos`;
        eventList.innerHTML = evts.map(e => `
            <div class="event-item ${e.row === 'bottom' ? 'event-item-rival' : ''}">
                <div style="font-weight:800; color:var(--text-primary);">${e.label}</div>
                <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:4px;">
                    Time: ${Math.floor(e.timestamp)}s [${Math.floor(e.start_sec)} - ${Math.floor(e.end_sec)}]
                </div>
            </div>
        `).join('');
    });

    // Modals
    btnNew.onclick = () => { modalNew.style.display = 'flex'; modalNew.classList.remove('hidden'); };
    btnCancel.onclick = () => { modalNew.style.display = 'none'; modalNew.classList.add('hidden'); };
    
    btnSave.onclick = () => {
        const url = inputYT.value.trim();
        if (!url) return toast('Falta link', 'error');
        const id = url.split('v=')[1]?.split('&')[0] || url.split('youtu.be/')[1]?.split('?')[0] || url;
        YTPlayer.loadVideo(id);
        modalNew.style.display = 'none';
        modalNew.classList.add('hidden');
        if (noGameOverlay) noGameOverlay.style.display = 'none';
        toast('Video cargado');
    };

    // Modes
    btnVideo.onclick = () => {
        currentMode = 'video';
        btnVideo.classList.add('active');
        btnLive.classList.remove('active');
        playerWrap.style.display = 'block';
        liveWrap.style.display = 'none';
    };

    btnLive.onclick = () => {
        currentMode = 'live';
        btnLive.classList.add('active');
        btnVideo.classList.remove('active');
        playerWrap.style.display = 'none';
        liveWrap.style.display = 'flex';
    };

    // Timer
    btnTimerToggle.onclick = () => {
        if (VoxTimer.isRunning) {
            VoxTimer.stop();
            btnTimerToggle.textContent = 'Iniciar Partido';
            btnTimerToggle.classList.remove('active');
        } else {
            VoxTimer.start();
            btnTimerToggle.textContent = 'Pausar Partido';
            btnTimerToggle.classList.add('active');
        }
    };

    window.addEventListener('timer_tick', (e) => {
        timerText.textContent = VoxTimer.formatTime(e.detail);
    });

    function toast(m, type = 'success') {
        const c = getEl('toast-container');
        const t = document.createElement('div');
        t.className = `toast ${type}`;
        t.textContent = m;
        c.appendChild(t);
        setTimeout(() => t.remove(), 3000);
    }

    // Voice Controls
    btnVoiceConstant.onclick = () => {
        VoxVoice.primePermission();
        if (voiceMode === 'constant') {
            VoxVoice.stop();
            voiceMode = 'none';
        } else {
            VoxVoice.setMode(true);
            VoxVoice.start();
            voiceMode = 'constant';
        }
        updateVoiceIcons();
    };

    btnVoicePTT.onmousedown = btnVoicePTT.ontouchstart = (e) => {
        if (e && e.type === 'touchstart') e.preventDefault();
        VoxVoice.primePermission();
        if (voiceMode === 'constant') return;
        VoxVoice.setMode(false);
        VoxVoice.start();
        VoxVoice.startListening();
        voiceMode = 'ptt';
        updateVoiceIcons();
    };

    btnVoicePTT.onmouseup = btnVoicePTT.onmouseleave = btnVoicePTT.ontouchend = () => {
        if (voiceMode !== 'ptt') return;
        VoxVoice.stopListening();
        voiceMode = 'none';
        updateVoiceIcons();
    };

    function updateVoiceIcons() {
        btnVoiceConstant.classList.toggle('active', voiceMode === 'constant');
        btnVoicePTT.classList.toggle('active', voiceMode === 'ptt');
    }

    window.addEventListener('vox_state_change', (e) => {
        const state = e.detail;
        voiceIndicator.classList.toggle('listening', state === 'active');
        if (state === 'inactive') {
            recognizedOutput.textContent = 'Silencio';
        }
    });

    window.addEventListener('vox_command', (e) => {
        const text = e.detail;
        recognizedOutput.textContent = text;
        const tagId = VoxStore.matchVoiceToTag(text);
        if (tagId) {
            const time = (currentMode === 'video') ? YTPlayer.getCurrentTime() : VoxTimer.getTime();
            VoxStore.addEvent(tagId, time);
            toast(`Voz detectada: ${text}`);
            recognizedOutput.innerHTML = `<span style="color:var(--success); font-weight:800;">${text}</span>`;
        }
    });

    window.addEventListener('vox_interim', (e) => {
        recognizedOutput.textContent = e.detail + '...';
    });

    // Keyboard
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT') return;
        const key = e.key.toLowerCase();
        const btn = document.querySelector(`.tag-btn[data-hotkey="${key}"]`);
        if (btn) { e.preventDefault(); btn.click(); }
        if (e.key === ' ') { e.preventDefault(); YTPlayer.togglePlay(); }
    });

    VoxStore.on('tagTypesUpdated', () => renderTagButtons());
});
