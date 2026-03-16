const YTPlayer = (() => {
    let _vp = null;
    let _ready = false;

    function init() {
        _vp = new VideoPlayer('video-player-container');
        _ready = true;
        return Promise.resolve();
    }

    function loadVideo(id) { if (_ready) _vp.loadVideo({ type: 'youtube', id }); }
    function play() { if (_ready) _vp.play(); }
    function pause() { if (_ready) _vp.pause(); }
    function togglePlay() { if (_ready) _vp.isPlaying ? _vp.pause() : _vp.play(); }
    function getCurrentTime() { return _ready ? _vp.getCurrentTime() : 0; }
    function seekTo(s) { if (_ready) _vp.seekTo(s); }

    return { init, loadVideo, play, pause, togglePlay, getCurrentTime, seekTo };
})();
