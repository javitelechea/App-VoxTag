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
    const btnExport = getEl('btn-export');

    const tagButtonsA = getEl('tag-buttons-a');
    const tagButtonsB = getEl('tag-buttons-b');
    const eventCount = getEl('event-count');
    const eventList = getEl('event-list');

    const tagEditor = getEl('tag-editor-inline');
    const editLabel = getEl('edit-tag-label');
    const editPre = getEl('edit-tag-pre');
    const editPost = getEl('edit-tag-post');
    const editRow = getEl('edit-tag-row');
    const editAliases = getEl('edit-tag-aliases');
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
        
        const tagTypes = VoxStore.getTagTypes();
        const topKeys = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'];
        const bottomKeys = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'];
        
        let topIdx = 0;
        let bottomIdx = 0;

        tagTypes.forEach(tag => {
            const btn = document.createElement('button');
            const isRival = tag.row === 'bottom';
            const isSync = tag.id === 'sync-start';
            let key = '';
            
            if (!tagEditMode && !isSync) {
                if (!isRival && topIdx < topKeys.length) key = topKeys[topIdx++];
                else if (isRival && bottomIdx < bottomKeys.length) key = bottomKeys[bottomIdx++];
            }

            // Start should NOT have tag-btn-rival class to avoid red border
            const extraClass = isSync ? ' tag-btn-sync' : (isRival ? ' tag-btn-rival' : '');
            btn.className = 'tag-btn' + extraClass + (editingTagId === tag.id ? ' active' : '');
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
                    const isRunning = (currentMode === 'video') ? YTPlayer.isPlaying : VoxTimer.isRunning;
                    if (!isRunning) {
                        return toast('El tiempo no está corriendo', 'error');
                    }
                    const time = (currentMode === 'video') ? YTPlayer.getCurrentTime() : VoxTimer.getTime();
                    VoxStore.addEvent(tag.id, time);
                    btn.classList.add('tag-flash');
                    setTimeout(() => btn.classList.remove('tag-flash'), 500);
                    toast(`Evento: ${tag.label}`);
                }
            };

            if (isRival || isSync) tagButtonsB.appendChild(btn);
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
            editAliases.value = (tag.aliases || []).join(', ');
            getEl('btn-delete-tag').style.display = 'inline-block';
        } else {
            editLabel.value = '';
            editPre.value = 5;
            editPost.value = 10;
            editRow.value = 'top';
            editAliases.value = '';
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
            aliases: editAliases.value.split(',').map(a => a.trim()).filter(a => a)
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
                <div class="event-item-content">
                    <div style="font-weight:800; color:var(--text-primary); text-transform: uppercase; font-size: 0.85rem;">${e.label}</div>
                    <div style="font-size:0.7rem; color:var(--text-secondary); margin-top:4px; font-family: monospace;">
                        T: ${VoxTimer.formatTime(e.timestamp)} [${VoxTimer.formatTime(e.start_sec)} - ${VoxTimer.formatTime(e.end_sec)}]
                    </div>
                </div>
                <button class="btn-delete-event" onclick="VoxStore.deleteEvent(${e.id})" title="Eliminar">
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            </div>
        `).join('');
    });

    // Modals
    btnNew.onclick = () => { modalNew.style.display = 'flex'; modalNew.classList.remove('hidden'); };
    btnCancel.onclick = () => { modalNew.style.display = 'none'; modalNew.classList.add('hidden'); };
    
    btnSave.onclick = () => {
        const url = inputYT.value.trim();
        const modeSelected = document.querySelector('input[name="project-mode"]:checked').value;
        
        if (modeSelected === 'video' && !url) return toast('Falta link de YouTube', 'error');

        // Clear project data for new game
        VoxStore.resetEvents();
        VoxTimer.stop();
        VoxTimer.reset(); 
        timerText.textContent = '00:00';
        btnTimerToggle.textContent = 'Iniciar Partido';
        btnTimerToggle.classList.remove('active');

        // Set system mode
        currentMode = modeSelected;
        if (currentMode === 'video') {
            const id = url.split('v=')[1]?.split('&')[0] || url.split('youtu.be/')[1]?.split('?')[0] || url;
            YTPlayer.loadVideo(id);
            playerWrap.style.display = 'flex';
            liveWrap.style.display = 'none';
        } else {
            playerWrap.style.display = 'none';
            liveWrap.style.display = 'flex';
        }

        // Lock mode switcher (just hide it as instructed to prevent change)
        document.querySelector('.switcher').style.display = 'none';

        modalNew.style.display = 'none';
        modalNew.classList.add('hidden');
        if (noGameOverlay) noGameOverlay.style.display = 'none';
        toast(`Proyecto ${currentMode === 'video' ? 'Video' : 'Live'} iniciado`);
    };

    // Modal Mode Logic
    const isMobile = window.innerWidth <= 1024;
    if (isMobile) {
        const liveRadio = document.querySelector('input[name="project-mode"][value="live"]');
        if (liveRadio) liveRadio.checked = true;
        const ytGroup = getEl('yt-input-group');
        if (ytGroup) ytGroup.style.display = 'none';
    }

    document.querySelectorAll('input[name="project-mode"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const ytGroup = getEl('yt-input-group');
            if (ytGroup) {
                if (e.target.value === 'live') ytGroup.style.display = 'none';
                else ytGroup.style.display = 'block';
            }
        });
    });

    // Modes
    btnVideo.onclick = () => {
        currentMode = 'video';
        btnVideo.classList.add('active');
        btnLive.classList.remove('active');
        playerWrap.style.display = 'flex';
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
        if (noGameOverlay && noGameOverlay.style.display !== 'none') {
            return toast('Primero crea un proyecto', 'error');
        }
        
        if (VoxTimer.isRunning) {
            VoxTimer.stop();
            const display = getEl('live-timer-display');
            if (display) display.classList.add('timer-blink');
            
            const hasStarted = VoxTimer.getTime() > 0;
            btnTimerToggle.textContent = hasStarted ? 'Reanudar Partido' : 'Iniciar Partido';
            btnTimerToggle.classList.remove('btn-danger', 'btn-warning');
            btnTimerToggle.classList.add('btn-primary');
            toast('Partido pausado');
        } else {
            VoxTimer.start();
            const display = getEl('live-timer-display');
            if (display) display.classList.remove('timer-blink');
            
            btnTimerToggle.textContent = 'Pausar Partido';
            btnTimerToggle.classList.remove('btn-primary');
            btnTimerToggle.classList.add('btn-warning');
            toast('Partido iniciado');
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

    // Export
    btnExport.onclick = () => {
        const events = VoxStore.getEvents();
        if (events.length === 0) return toast('No hay eventos para exportar', 'error');

        const xml = VoxExport.generateXML(events);
        const filename = `VoxTag_Export_${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.xml`;
        VoxExport.download(xml, filename);
        toast('XML exportado con éxito');
    };

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
        // Guard: Only process if "time is running"
        const isRunning = (currentMode === 'video') ? YTPlayer.isPlaying : VoxTimer.isRunning;
        if (!isRunning) {
            toast('Tiempo pausado: comando ignorado', 'error');
            return;
        }

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
