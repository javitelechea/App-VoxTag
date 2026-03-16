class VideoPlayer {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.player = null;
        this.type = null;
        this.isPlaying = false;
    }

    async loadVideo(videoData) {
        if (this.container) this.container.innerHTML = '';
        
        if (videoData.type === 'youtube') {
            this.type = 'youtube';
            return new Promise((resolve) => {
                const initYT = () => {
                    const el = document.createElement('div');
                    el.id = 'yt-player-target';
                    this.container.appendChild(el);

                    this.player = new YT.Player('yt-player-target', {
                        videoId: videoData.id,
                        playerVars: { 'autoplay': 1, 'controls': 1 },
                        events: {
                            'onReady': () => resolve(),
                            'onStateChange': (event) => {
                                this.isPlaying = (event.data === YT.PlayerState.PLAYING);
                            }
                        }
                    });
                };

                if (window.YT && window.YT.Player) {
                    initYT();
                } else {
                    window.onYouTubeIframeAPIReady = initYT;
                    if (!document.getElementById('yt-script')) {
                        const tag = document.createElement('script');
                        tag.id = 'yt-script';
                        tag.src = 'https://www.youtube.com/iframe_api';
                        document.head.appendChild(tag);
                    }
                }
            });
        }
    }

    play() { if (this.type === 'youtube' && this.player) this.player.playVideo(); }
    pause() { if (this.type === 'youtube' && this.player) this.player.pauseVideo(); }
    seekTo(s) { if (this.type === 'youtube' && this.player) this.player.seekTo(s, true); }
    getCurrentTime() { return (this.type === 'youtube' && this.player) ? this.player.getCurrentTime() : 0; }
    getDuration() { return (this.type === 'youtube' && this.player) ? this.player.getDuration() : 0; }
}

window.VideoPlayer = VideoPlayer;
