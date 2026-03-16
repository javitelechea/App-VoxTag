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
        
        // Clean up previous instance if any
        if (this.player && this.player.destroy) {
            try { this.player.destroy(); } catch(e) {}
            this.player = null;
        }

        if (videoData.type === 'youtube') {
            this.type = 'youtube';
            return new Promise((resolve, reject) => {
                const initYT = () => {
                    const el = document.createElement('div');
                    el.id = 'yt-player-target';
                    this.container.appendChild(el);

                    // Error 153 fix: explicitly passing origin
                    const origin = window.location.origin;

                    this.player = new YT.Player('yt-player-target', {
                        videoId: videoData.id,
                        playerVars: { 
                            'autoplay': 1, 
                            'controls': 1,
                            'rel': 0,
                            'origin': origin,
                            'enablejsapi': 1
                        },
                        events: {
                            'onReady': () => {
                                console.log('YouTube: Player Ready');
                                resolve();
                            },
                            'onStateChange': (event) => {
                                this.isPlaying = (event.data === YT.PlayerState.PLAYING);
                            },
                            'onError': (event) => {
                                console.error('YouTube Error Code:', event.data);
                                // Error 153 is often "embedded player not allowed" or domain mismatch
                                reject(event.data);
                            }
                        }
                    });
                };

                if (window.YT && window.YT.Player) {
                    initYT();
                } else {
                    // Global callback for the first load
                    if (!window.onYouTubeIframeAPIReady) {
                        window.onYouTubeIframeAPIReady = () => {
                            console.log('YouTube API: Ready');
                            const pending = window._yt_pending_inits || [];
                            pending.forEach(cb => cb());
                            window._yt_pending_inits = [];
                        };
                    }

                    if (!document.getElementById('yt-script')) {
                        console.log('YouTube API: Loading script...');
                        window._yt_pending_inits = [initYT];
                        const tag = document.createElement('script');
                        tag.id = 'yt-script';
                        tag.src = 'https://www.youtube.com/iframe_api';
                        document.head.appendChild(tag);
                    } else {
                        // Script is loading, push to queue
                        window._yt_pending_inits = window._yt_pending_inits || [];
                        window._yt_pending_inits.push(initYT);
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
