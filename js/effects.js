/* ============================================================
   effects.js — tool-UI decorations & scroll motion
   (frame corner brackets, ruler numerals, marquee-select,
   GSAP + ScrollTrigger reveals, horizontal projects scroll,
   multi-layer parallax, mouse parallax, card tilt)

   Content never depends on this file: reveal classes are only
   added here, so if it fails to load the page is fully visible.
   ============================================================ */

(function () {
    'use strict';

    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var horizontalProjects = !reducedMotion && finePointer &&
        window.matchMedia('(min-width: 1121px)').matches;

    /* ---------- Corner selection-brackets on every frame ---------- */

    document.querySelectorAll('.frame').forEach(function (frame) {
        ['tl', 'tr', 'bl', 'br'].forEach(function (pos) {
            var corner = document.createElement('span');
            corner.className = 'frame-corner ' + pos;
            corner.setAttribute('aria-hidden', 'true');
            frame.appendChild(corner);
        });
    });

    var frameObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            entry.target.classList.toggle('in-view', entry.isIntersecting);
        });
    }, { threshold: 0.12 });

    document.querySelectorAll('.frame').forEach(function (f) {
        frameObserver.observe(f);
    });

    /* ---------- Ruler numerals (desktop only) ---------- */

    var rulerX = document.getElementById('ruler-x');
    var rulerY = document.getElementById('ruler-y');

    function buildRulerNumbers() {
        if (!window.matchMedia('(min-width: 1121px)').matches) return;
        rulerX.innerHTML = '';
        rulerY.innerHTML = '';
        var i, n;
        for (i = 0; i < window.innerWidth; i += 200) {
            n = document.createElement('span');
            n.className = 'ruler-num';
            n.style.left = i + 'px';
            n.textContent = i;
            rulerX.appendChild(n);
        }
        for (i = 0; i < window.innerHeight; i += 200) {
            n = document.createElement('span');
            n.className = 'ruler-num';
            n.style.top = i + 'px';
            n.textContent = i;
            rulerY.appendChild(n);
        }
    }

    var rulerTimer;
    window.addEventListener('resize', function () {
        clearTimeout(rulerTimer);
        rulerTimer = setTimeout(buildRulerNumbers, 200);
    });
    buildRulerNumbers();

    /* ---------- Marquee-select rectangle on project cards ---------- */

    var SVG_NS = 'http://www.w3.org/2000/svg';

    document.querySelectorAll('.project-card').forEach(function (card) {
        var svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('class', 'marquee');
        svg.setAttribute('aria-hidden', 'true');
        var rect = document.createElementNS(SVG_NS, 'rect');
        rect.setAttribute('pathLength', '100');
        rect.setAttribute('rx', '7');
        rect.style.x = '1px';
        rect.style.y = '1px';
        rect.style.width = 'calc(100% - 2px)';
        rect.style.height = 'calc(100% - 2px)';
        svg.appendChild(rect);
        card.appendChild(svg);
    });

    /* ---------- Parallax decor layer (mono glyphs per frame) ---------- */

    var DECOR_SPECS = [
        { cls: 'decor-cross', text: '+', top: '9%', right: '6%', depth: 22 },
        { cls: 'decor-coord', text: '', bottom: '7%', left: '4%', depth: 12 },
        { cls: 'decor-guide', text: '', top: '48%', right: '3%', depth: 30 }
    ];

    var decorEls = [];

    document.querySelectorAll('main .frame').forEach(function (frame, fi) {
        DECOR_SPECS.forEach(function (spec, si) {
            var el = document.createElement('span');
            el.className = 'frame-decor ' + spec.cls;
            el.setAttribute('aria-hidden', 'true');
            el.textContent = spec.cls === 'decor-coord'
                ? 'x:' + (128 + fi * 96) + ' y:' + (fi + 1) * 640
                : spec.text;
            ['top', 'right', 'bottom', 'left'].forEach(function (side) {
                if (spec[side]) el.style[side] = spec[side];
            });
            // vary depth per frame so layers never move in lockstep
            el.dataset.depth = spec.depth + ((fi + si) % 3) * 6;
            frame.appendChild(el);
            decorEls.push(el);
        });
    });

    /* ---------- Card tilt (desktop, fine pointer) ---------- */

    if (finePointer && !reducedMotion) {
        document.querySelectorAll('.project-card, .award-card, .cert-card')
            .forEach(function (card) {
                card.classList.add('tilt-enabled');

                card.addEventListener('pointermove', function (e) {
                    var r = card.getBoundingClientRect();
                    var px = (e.clientX - r.left) / r.width - 0.5;
                    var py = (e.clientY - r.top) / r.height - 0.5;
                    card.style.transform =
                        'perspective(800px) rotateX(' + (-py * 8).toFixed(2) +
                        'deg) rotateY(' + (px * 8).toFixed(2) +
                        'deg) translateY(-4px)';
                });

                card.addEventListener('pointerleave', function () {
                    card.style.transform = '';
                });
            });
    }

    /* ---------- Mouse parallax ([data-mouse-depth], beyond hero) ---------- */

    if (finePointer && !reducedMotion) {
        var mpTargets = Array.prototype.slice.call(
            document.querySelectorAll('[data-mouse-depth]'));

        if (mpTargets.length) {
            var mpX = 0, mpY = 0, mpCx = 0, mpCy = 0, mpRunning = false;

            document.addEventListener('mousemove', function (e) {
                mpX = e.clientX / window.innerWidth - 0.5;
                mpY = e.clientY / window.innerHeight - 0.5;
                if (!mpRunning) {
                    mpRunning = true;
                    requestAnimationFrame(mpRender);
                }
            });

            var mpRender = function () {
                mpCx += (mpX - mpCx) * 0.06;
                mpCy += (mpY - mpCy) * 0.06;
                mpTargets.forEach(function (el) {
                    var d = parseFloat(el.dataset.mouseDepth) || 0;
                    el.style.translate =
                        (-mpCx * d).toFixed(2) + 'px ' + (-mpCy * d).toFixed(2) + 'px';
                });
                requestAnimationFrame(mpRender);
            };
        }
    }

    /* ---------- Scroll motion (GSAP + ScrollTrigger) ---------- */

    if (reducedMotion || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    /* -- horizontal scroll-jack for Projects (desktop wheel/scroll only) -- */

    if (horizontalProjects) {
        var mm = gsap.matchMedia();
        mm.add('(min-width: 1121px)', function () {
            var section = document.getElementById('projects');
            var grid = section.querySelector('.project-grid');
            var progress = document.getElementById('projects-progress');
            var progressCount = document.getElementById('projects-progress-count');
            var progressFill = document.getElementById('projects-progress-fill');
            var cardCount = grid.children.length;

            section.classList.add('is-horizontal-section');
            grid.classList.add('is-horizontal');
            progress.hidden = false;

            // cards live inside the horizontal track: always visible there
            grid.querySelectorAll('.project-card').forEach(function (c) {
                c.classList.add('revealed');
            });

            var distance = function () {
                return grid.scrollWidth - grid.clientWidth;
            };

            gsap.to(grid, {
                x: function () { return -distance(); },
                ease: 'none',
                scrollTrigger: {
                    trigger: section,
                    start: 'top 96px',
                    end: function () { return '+=' + distance(); },
                    pin: true,
                    scrub: 0.5,
                    anticipatePin: 1,
                    invalidateOnRefresh: true,
                    // refreshed after the hero pin (priority 2) so its spacer
                    // is always accounted for in this pin's measurements
                    refreshPriority: 1,
                    onUpdate: function (self) {
                        var n = 1 + Math.round(self.progress * (cardCount - 1));
                        progressCount.textContent =
                            (n < 10 ? '0' + n : n) + ' / ' + cardCount;
                        progressFill.style.width = (self.progress * 100) + '%';
                    }
                }
            });

            return function () {
                section.classList.remove('is-horizontal-section');
                grid.classList.remove('is-horizontal');
                progress.hidden = true;
                gsap.set(grid, { clearProps: 'x' });
            };
        });
    }

    /* -- scroll reveals: dashed selection outline flash, then settle -- */

    var revealSelector =
        '.section-head, .about-card, .code-panel, .xp-card, .edu-card,' +
        '.cert-card, .award-card, .skill-filters, .skill-grid,' +
        '.terminal, .contact-form' +
        (horizontalProjects ? '' : ', .project-card');

    document.querySelectorAll(revealSelector).forEach(function (el) {
        el.classList.add('reveal-item');
    });

    ScrollTrigger.batch('.reveal-item', {
        // fire once the element is meaningfully in view (not just peeking
        // in at the very bottom) so the selection flash is on-screen when
        // the reader actually reaches it
        start: 'top 80%',
        once: true,
        onEnter: function (batch) {
            batch.forEach(function (el, i) {
                setTimeout(function () {
                    el.classList.add('revealed', 'selecting');
                    // hold the dashed selection long enough to be seen,
                    // then let it fade out (CSS transition on outline-color)
                    setTimeout(function () {
                        el.classList.remove('selecting');
                    }, 1500);
                }, i * 90);
            });
        }
    });

    /* -- multi-layer scroll parallax -- */

    // layer 1: canvas grid drifts slowest
    gsap.to('#canvas-grid', {
        yPercent: -5,
        ease: 'none',
        scrollTrigger: {
            trigger: document.body,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.6
        }
    });

    // layer 2: per-frame decor glyphs, each at its own depth
    decorEls.forEach(function (el) {
        var depth = parseFloat(el.dataset.depth) || 16;
        gsap.fromTo(el, { y: depth }, {
            y: -depth,
            ease: 'none',
            scrollTrigger: {
                trigger: el.parentElement,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 0.8
            }
        });
    });

    // layer 3: section index numerals drift slightly faster than content
    document.querySelectorAll('.section-index').forEach(function (el) {
        gsap.fromTo(el, { y: 10 }, {
            y: -14,
            ease: 'none',
            scrollTrigger: {
                trigger: el.closest('.frame'),
                start: 'top bottom',
                end: 'bottom top',
                scrub: 0.8
            }
        });
    });

    // (hero-stage scroll parallax removed — the hero is now pinned and
    // scroll-scrubbed by the 3D cinematic in hero3d.js)

    // footer signature rises as it fades in
    gsap.fromTo('.footer-signature', { yPercent: 30 }, {
        yPercent: 0,
        ease: 'none',
        scrollTrigger: {
            trigger: '.site-footer',
            start: 'top bottom',
            end: 'bottom bottom',
            scrub: 0.6
        }
    });

    // re-measure pins once webfonts/images have settled — icon fonts
    // (Devicon/Bootstrap Icons) can finish after `load` and shift layout
    window.addEventListener('load', function () {
        ScrollTrigger.refresh();
    });
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () {
            ScrollTrigger.refresh();
        });
    }
})();
