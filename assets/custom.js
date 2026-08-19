class BeforeAfterSlider extends HTMLElement {

  constructor() {
    super();

    this.position = 0;
    this.isDragging = false;

    this.handlePointerDown =
      this.handlePointerDown.bind(this);

    this.handlePointerMove =
      this.handlePointerMove.bind(this);

    this.handlePointerUp =
      this.handlePointerUp.bind(this);
  }


  connectedCallback() {

    this.viewport =
      this.querySelector(
        ".before-after-slider__viewport"
      );

    this.afterLayer =
      this.querySelector(
        ".before-after-slider__after"
      );

    this.divider =
      this.querySelector(
        ".before-after-slider__divider"
      );

    this.handle =
      this.querySelector(
        ".before-after-slider__handle"
      );


    if (
      !this.viewport ||
      !this.afterLayer ||
      !this.divider ||
      !this.handle
    ) {
      return;
    }


    this.position =
      Number(
        this.dataset.startPosition || 50
      );


    /*
      Start at 0
    */
    this.setPosition(0);


    /*
      Intro animation only when section
      comes into viewport
    */
    this.setupIntersectionObserver();


    /*
      Drag events
    */
    this.handle.addEventListener(
      "pointerdown",
      this.handlePointerDown
    );

  }


  disconnectedCallback() {

    this.handle?.removeEventListener(
      "pointerdown",
      this.handlePointerDown
    );

    window.removeEventListener(
      "pointermove",
      this.handlePointerMove
    );

    window.removeEventListener(
      "pointerup",
      this.handlePointerUp
    );

  }


  /*
    ========================================
    INTERSECTION OBSERVER
    ========================================
  */

  setupIntersectionObserver() {

    if (!("IntersectionObserver" in window)) {

      this.animateIntro();

      return;

    }


    this.observer =
      new IntersectionObserver(
        (entries) => {

          entries.forEach((entry) => {

            if (!entry.isIntersecting) {
              return;
            }


            this.animateIntro();


            /*
              Only once
            */
            this.observer.unobserve(
              this
            );

          });

        },
        {
          threshold: 0.25
        }
      );


    this.observer.observe(this);

  }


  /*
    ========================================
    INTRO ANIMATION
    ========================================
  */

  animateIntro() {

    /*
      Make transition active
    */
    this.classList.add(
      "is-intro"
    );


    /*
      Browser needs one frame before
      changing from 0 -> 50
    */
    requestAnimationFrame(() => {

      requestAnimationFrame(() => {

        const target =
          Number(
            this.dataset.startPosition || 50
          );

        this.setPosition(target);

      });

    });


    /*
      Remove transition after animation
    */
    setTimeout(() => {

      this.classList.remove(
        "is-intro"
      );

    }, 1600);

  }


  /*
    ========================================
    SET POSITION
    ========================================
  */

  setPosition(value) {

    this.position =
      Math.max(
        0,
        Math.min(
          100,
          value
        )
      );


    const position =
      `${this.position}%`;


    this.style.setProperty(
      "--ba-position",
      position
    );

  }


  /*
    ========================================
    POINTER DOWN
    ========================================
  */

  handlePointerDown(event) {

    event.preventDefault();

    this.isDragging = true;


    /*
      Remove intro transition
    */
    this.classList.remove(
      "is-intro"
    );


    /*
      Capture pointer
    */
    this.handle.setPointerCapture?.(
      event.pointerId
    );


    window.addEventListener(
      "pointermove",
      this.handlePointerMove
    );


    window.addEventListener(
      "pointerup",
      this.handlePointerUp
    );


    /*
      Immediately update position
    */
    this.updateFromPointer(
      event
    );

  }


  /*
    ========================================
    POINTER MOVE
    ========================================
  */

  handlePointerMove(event) {

    if (!this.isDragging) {
      return;
    }


    this.updateFromPointer(
      event
    );

  }


  /*
    ========================================
    POINTER UP
    ========================================
  */

  handlePointerUp() {

    this.isDragging = false;


    window.removeEventListener(
      "pointermove",
      this.handlePointerMove
    );


    window.removeEventListener(
      "pointerup",
      this.handlePointerUp
    );

  }


  /*
    ========================================
    CALCULATE POSITION
    ========================================
  */

  updateFromPointer(event) {

    const rect =
      this.viewport.getBoundingClientRect();


    const x =
      event.clientX -
      rect.left;


    let percentage =
      (x / rect.width) * 100;


    percentage =
      Math.max(
        0,
        Math.min(
          100,
          percentage
        )
      );


    /*
      Use RAF for smooth dragging
    */
    requestAnimationFrame(() => {

      this.setPosition(
        percentage
      );

    });

  }

}


if (
  !customElements.get(
    "before-after-slider"
  )
) {

  customElements.define(
    "before-after-slider",
    BeforeAfterSlider
  );

}