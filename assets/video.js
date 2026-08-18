if (!customElements.get('custom-video-media')) {
  customElements.define(
    'custom-video-media',
    class DeferredMedia extends HTMLElement {
      constructor() {
        super();

        this.$ = this.querySelector.bind(this);
        this.sectionID = this.dataset.sectionId;
        this.idVideo = this.dataset.idVideo;
        this.typeVideo = this.dataset.type;
        this.eleVideo = `DeferredVideo-${this.sectionID}-` + this.idVideo;

        this.trigger = this.$('.js-load-media-trigger');
        this.playPauseButton = this.$('.video-play-pause-button');


        this.onPlayerStateYTChange = this.onPlayerStateYTChange.bind(this);
        this.onPlayerPlay = this.onPlayerPlay.bind(this);

        this.trigger?.addEventListener('click', () => this.handleToggle());


      }

      connectedCallback() {
        if (Shopify && Shopify.designMode && this.getAttribute('data-autoplay') === 'true') {
          this.loadContent();
        } else if (this.getAttribute('data-autoplay') === 'true') {
          this.loadContent();
        }
      }

      /* ===============================
         TOGGLE
      =============================== */
      handleToggle() {
        this.classList.add('playing');
        this.loadContent();

        const video = this.$('.js-media-item-video') || this.$('.js-media-item-video-mobile');

        if (video) {
          if (video.paused || video.ended) {
            this.pauseAllVideo(video);
            video.play();
            this.setButtonState(true);
          } else {
            video.pause();
            this.setButtonState(false);
          }
        }

        if (this.player && typeof this.player.getPlayerState === 'function') {
          const state = this.player.getPlayerState();

          if (
            state === YT.PlayerState.PAUSED ||
            state === YT.PlayerState.ENDED
          ) {
            this.pauseAllVideo(this.player);
            this.player.playVideo();
            this.setButtonState(true);
          } else if (state === YT.PlayerState.PLAYING) {
            this.player.pauseVideo();
            this.setButtonState(false);
          }
        }
      }

      /* ===============================
         BUTTON STATE
      =============================== */
      setButtonState(isPlaying) {
        if (!this.playPauseButton) return;
        this.playPauseButton.dataset.playing = isPlaying ? 'true' : 'false';
      }

      /* ===============================
         YOUTUBE
      =============================== */
      onYouTubeIframeAPIReady() {
        if (typeof YT !== 'undefined' && YT.Player) {
          this.player = new YT.Player(this.eleVideo, {
            videoId: this.idVideo,
            playerVars: { playsinline: 1 },
            events: {
              onReady: this.onPlayerYTReady,
              onStateChange: this.onPlayerStateYTChange,
            },
          });
        } else {
          const script = document.createElement('script');
          script.src = 'https://www.youtube.com/iframe_api';
          script.onload = () => this.onYouTubeIframeAPIReady();
          document.head.appendChild(script);
        }
      }

      onPlayerYTReady = () => {
        this.pauseAllVideo(this.player);
        this.player.playVideo();
      };

      onPlayerStateYTChange(t) {
        if (t.data === YT.PlayerState.PLAYING) {
          this.onPlayerPlay();
          this.setButtonState(true);
        } else if (
          t.data === YT.PlayerState.PAUSED ||
          t.data === YT.PlayerState.ENDED
        ) {
          this.setButtonState(false);
        }
      }

      onPlayerPlay() {
        this.pauseAllVideo(this.player);
      }

      /* ===============================
         VIMEO
      =============================== */
      onVimeoIframeAPIReady() {
        if (typeof Vimeo !== 'undefined' && Vimeo.Player) {
          this.playerVimeo = new Vimeo.Player(this.eleVideo, {
            id: this.idVideo,
            autoplay: 1,
          });

          this.playerVimeo.on('play', () =>
            this.pauseAllVideo(this.playerVimeo)
          );
        } else {
          const script = document.createElement('script');
          script.src = 'https://player.vimeo.com/api/player.js';
          script.onload = () => this.onVimeoIframeAPIReady();
          document.head.appendChild(script);
        }
      }

      /* ===============================
         LOAD CONTENT
      =============================== */

      loadContent() {
        if (this.hasAttribute('loaded')) return;

        // 🔹 YOUTUBE / VIMEO → hide trigger only
        if (this.typeVideo === 'youtube' || this.typeVideo === 'vimeo') {
          this.trigger?.classList.add('d-none');
        }

        // 🔹 Load template if exists
        if (this.$('template')) {
          const node = this.$('template').content.firstElementChild.cloneNode(true);
          this.appendChild(node);

        } else {
          if (this.typeVideo === 'youtube') {
            this.onYouTubeIframeAPIReady();
            this.buttonWrapper?.classList.add('display-none');
          }

          if (this.typeVideo === 'vimeo') {
            this.onVimeoIframeAPIReady();
          }
        }


        // 🔹 Handle autoplay (lazy-load logic)
        if (this.getAttribute('data-autoplay') === 'true') {


          // HTML5 video
          const localVideo = this.$('video');


          if (localVideo) {
            const source = localVideo.querySelector('source');
            const src = source?.getAttribute('data-src');
            if (src) {
              source.setAttribute('src', src);
              localVideo.load();
              localVideo.muted = true
              localVideo.play().catch((err) => {
                console.warn("Autoplay failed:", err);
              });
            }
            else {
              console.warn("Missing data-src on local video source.");
            }
          }

          // iframe video (YouTube/Vimeo)
          const iframe = this.$('iframe');
          if (iframe) {
            const src = iframe.getAttribute('data-src');
            if (src) {
              iframe.setAttribute('src', src);

              iframe.addEventListener(
                'load',
                () => {
                  if (this.typeVideo === 'youtube') {
                    iframe.contentWindow.postMessage(
                      '{"event":"command","func":"playVideo","args":""}',
                      '*'
                    );
                  }

                  if (this.typeVideo === 'vimeo') {
                    iframe.contentWindow.postMessage('{"method":"play"}', '*');
                  }
                },
                { once: true }
              );
            }
          }
        }

        this.isLoaded(true);

        // 🔹 Trigger listeners remain
        const video = this.$('.js-media-item-video');
        if (video && !video.dataset.listenersAdded) {
          video.addEventListener('play', () => this.setButtonState(true));
          video.addEventListener('pause', () => this.setButtonState(false));
          video.addEventListener('ended', () => this.setButtonState(false));
          video.dataset.listenersAdded = 'true';
        }
      }

      /* ===============================
         PAUSE ALL
      =============================== */
      pauseAllVideo(current) {
        document
          .querySelectorAll(
            ".js-product-media-deferred-video:has([data-type='youtube'])"
          )
          .forEach((el) => {
            el.player && el.player !== current && el.player.pauseVideo();
          });

        document
          .querySelectorAll(
            ".js-product-media-deferred-video:has([data-type='vimeo'])"
          )
          .forEach((el) => {
            el.playerVimeo &&
              el.playerVimeo !== current &&
              el.playerVimeo.pause();
          });

        document
          .querySelectorAll('.js-media-item-video')
          .forEach((v) => v !== current && v.pause());
      }

      isLoaded(val) {
        val ? this.setAttribute('loaded', '') : this.removeAttribute('loaded');
      }
    }
  );
}