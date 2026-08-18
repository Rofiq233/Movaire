(function () {
  class LogoMarquee {
    constructor(section) {
      this.section = section;
      this.viewport = section.querySelector('[data-marquee-viewport]');
      this.track = section.querySelector('[data-marquee-track]');

      if (!this.viewport || !this.track) return;

      this.speed = parseFloat(section.dataset.speed) || 35;
      this.direction = section.dataset.direction || 'left';
      this.pauseOnHover = section.dataset.pauseHover === 'true';
      this.mobileEnable = section.dataset.mobileEnable !== 'false';

      this.position = 0;
      this.lastTime = null;
      this.paused = false;

      this.originalItems = Array.from(this.track.children);
      this.originalWidth = 0;

      if (!this.originalItems.length) return;

      this.init();
    }

    init() {
      this.setup();

      if (this.pauseOnHover) {
        this.viewport.addEventListener('mouseenter', () => {
          this.paused = true;
        });

        this.viewport.addEventListener('mouseleave', () => {
          this.paused = false;
        });
      }

      window.addEventListener(
        'resize',
        this.debounce(() => {
          this.setup();
        }, 200)
      );

      requestAnimationFrame((time) => {
        this.animate(time);
      });
    }

    setup() {
      /*
       * Remove old clones
       */
      const children = Array.from(this.track.children);

      children.forEach((item, index) => {
        if (index >= this.originalItems.length) {
          item.remove();
        }
      });

      /*
       * Mobile marquee disabled
       */
      if (
        window.innerWidth <= 749 &&
        !this.mobileEnable
      ) {
        this.track.style.transform = 'translate3d(0, 0, 0)';
        return;
      }

      /*
       * Wait until layout is ready
       */
      requestAnimationFrame(() => {
        this.originalWidth = this.getOriginalWidth();

        if (!this.originalWidth) return;

        /*
         * Clone enough logos to fill
         * at least 2x viewport width.
         */
        while (
          this.track.scrollWidth <
          this.viewport.offsetWidth * 2
        ) {
          this.originalItems.forEach((item) => {
            const clone = item.cloneNode(true);

            clone.removeAttribute('data-shopify-editor-block');

            this.track.appendChild(clone);
          });

          /*
           * Safety limit
           */
          if (this.track.children.length > 100) {
            break;
          }
        }
      });
    }

    getOriginalWidth() {
      if (!this.originalItems.length) {
        return 0;
      }

      let width = 0;

      this.originalItems.forEach((item) => {
        width += item.getBoundingClientRect().width;
      });

      const styles = window.getComputedStyle(this.track);

      const gap =
        parseFloat(styles.columnGap || styles.gap) || 0;

      width += gap * (this.originalItems.length - 1);

      return width;
    }

    animate(timestamp) {
      if (!this.lastTime) {
        this.lastTime = timestamp;
      }

      const delta = timestamp - this.lastTime;

      this.lastTime = timestamp;

      const isMobile = window.innerWidth <= 749;

      if (
        !(isMobile && !this.mobileEnable) &&
        !this.paused &&
        this.originalWidth > 0
      ) {
        const movement =
          (this.speed * delta) / 1000;

        if (this.direction === 'left') {
          this.position -= movement;

          if (
            Math.abs(this.position) >=
            this.originalWidth
          ) {
            this.position += this.originalWidth;
          }
        } else {
          this.position += movement;

          if (this.position >= 0) {
            this.position -= this.originalWidth;
          }
        }

        this.track.style.transform =
          `translate3d(${this.position}px, 0, 0)`;
      }

      requestAnimationFrame((time) => {
        this.animate(time);
      });
    }

    debounce(callback, delay) {
      let timeout;

      return (...args) => {
        clearTimeout(timeout);

        timeout = setTimeout(() => {
          callback(...args);
        }, delay);
      };
    }
  }

  function initLogoMarquee() {
    document
      .querySelectorAll('[data-logo-marquee]')
      .forEach((section) => {
        if (!section.logoMarqueeInstance) {
          section.logoMarqueeInstance =
            new LogoMarquee(section);
        }
      });
  }

  /*
   * Normal page load
   */
  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      initLogoMarquee
    );
  } else {
    initLogoMarquee();
  }

  /*
   * Shopify Theme Editor
   */
  document.addEventListener(
    'shopify:section:load',
    (event) => {
      const section =
        event.target.matches('[data-logo-marquee]')
          ? event.target
          : event.target.querySelector(
              '[data-logo-marquee]'
            );

      if (section) {
        section.logoMarqueeInstance =
          new LogoMarquee(section);
      }
    }
  );
})();