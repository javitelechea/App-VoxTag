const VoxStore = (() => {
    let events = [];
    let listeners = {};

    let tagTypes = [
        { id: 'salida-propia', label: 'Salida', aliases: ['salida', 'inicio', 'salida propia'], pre_sec: 3, post_sec: 10, row: 'top' },
        { id: 'salida-rival', label: 'Bloqueo', aliases: ['bloqueo', 'salida rival', 'salida en contra'], pre_sec: 3, post_sec: 10, row: 'bottom' },
        { id: 'ataque-propio', label: 'Ataque', aliases: ['ataque', 'ofensiva'], pre_sec: 3, post_sec: 10, row: 'top' },
        { id: 'ataque-rival', label: 'Defensa', aliases: ['defensa', 'ataque rival'], pre_sec: 3, post_sec: 10, row: 'bottom' },
        { id: 'area-ataque', label: 'Area', aliases: ['attack area', 'ingreso al área', 'área'], pre_sec: 5, post_sec: 5, row: 'top' },
        { id: 'area-defensa', label: 'Area EC', aliases: ['area en contra', 'área en contra', 'área rival'], pre_sec: 5, post_sec: 5, row: 'bottom' },
        { id: 'cc-ataque', label: 'CC', aliases: ['corto', 'corner corto', 'cc ataque', 'ataque corner', 'ccat', 'córner corto ataque'], pre_sec: 2, post_sec: 6, row: 'top' },
        { id: 'cc-defensa', label: 'CC DEF', aliases: ['corto en contra', 'cc defensa', 'defensa corner', 'ccdef', 'córner corto defensa'], pre_sec: 2, post_sec: 6, row: 'bottom' },
        { id: 'contragolpe', label: 'Contragolpe', aliases: ['counter attack', 'contra'], pre_sec: 5, post_sec: 7, row: 'top' },
        { id: 'contragolpe-contra', label: 'Contragolpe EC', aliases: ['contragolpe en contra', 'counter attack against', 'contra en contra'], pre_sec: 5, post_sec: 7, row: 'bottom' },
        { id: 'gol-propio', label: 'Gol', aliases: ['goal', 'gol', 'gol propio'], pre_sec: 10, post_sec: 3, row: 'top' },
        { id: 'gol-rival', label: 'Gol EC', aliases: ['gol en contra', 'rival goal', 'gol rival'], pre_sec: 10, post_sec: 3, row: 'bottom' }
    ];

    function on(ev, cb) { if (!listeners[ev]) listeners[ev] = []; listeners[ev].push(cb); }
    function emit(ev, data) { (listeners[ev] || []).forEach(cb => cb(data)); }

    function saveTags() {
        localStorage.setItem('voxtag_tags', JSON.stringify(tagTypes));
        emit('tagTypesUpdated', tagTypes);
    }

    function loadTags() {
        const saved = localStorage.getItem('voxtag_tags');
        if (saved) {
            try { 
                const p = JSON.parse(saved); 
                if (Array.isArray(p) && p.length > 0) {
                    const existingMap = new Map(p.map(t => [t.id, t]));
                    tagTypes = tagTypes.map(def => {
                        if (existingMap.has(def.id)) {
                            const s = existingMap.get(def.id);
                            // Prioritize NEW labels, aliases AND times from our defaults
                            return { ...s, label: def.label, aliases: def.aliases, pre_sec: def.pre_sec, post_sec: def.post_sec };
                        }
                        return def;
                    });
                }
            } catch(e) { console.error('VoxStore: Error loading tags', e); }
        }
    }

    loadTags();

    function getTagTypes() { return tagTypes; }
    function addTagType(t) { tagTypes.push(t); saveTags(); }
    function updateTagType(id, d) {
        const idx = tagTypes.findIndex(t => t.id === id);
        if (idx !== -1) { tagTypes[idx] = { ...tagTypes[idx], ...d }; saveTags(); }
    }
    function deleteTagType(id) { tagTypes = tagTypes.filter(t => t.id !== id); saveTags(); }

    function getEvents() { return events; }

    function addEvent(tagId, time) {
        const tag = tagTypes.find(t => t.id === tagId);
        if (!tag) return;
        const evt = {
            id: Date.now(),
            label: tag.label,
            timestamp: time,
            start_sec: Math.max(0, time - (tag.pre_sec || 5)),
            end_sec: time + (tag.post_sec || 10),
            row: tag.row
        };
        events.unshift(evt);
        emit('eventsUpdated', events);
    }

    function matchVoiceToTag(transcript) {
        const t = transcript.toLowerCase();
        let best = null;
        let maxL = 0;
        tagTypes.forEach(tag => {
            if (t.includes(tag.label.toLowerCase()) && tag.label.length > maxL) {
                maxL = tag.label.length;
                best = tag.id;
            }
            tag.aliases.forEach(a => {
                if (t.includes(a.toLowerCase()) && a.length > maxL) {
                    maxL = a.length;
                    best = tag.id;
                }
            });
        });
        return best;
    }

    return { on, getTagTypes, getEvents, addEvent, matchVoiceToTag, addTagType, updateTagType, deleteTagType };
})();

window.VoxStore = VoxStore;
