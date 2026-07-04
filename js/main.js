/* ============================================================
   main.js — nav, cursor, scramble text, skills filter,
   certificate lightbox, contact form (Cloudflare Worker)
   ============================================================ */

/* ------------------------------------------------------------
   Contact backend — a Cloudflare Worker that relays the form
   to Resend. No keys or secrets live in this file; the Worker
   URL is public by design. One-time setup: worker/README.md
   ------------------------------------------------------------ */
var CONTACT_ENDPOINT = 'https://portfolio-contact.msharan-hnp.workers.dev/';

(function () {
    'use strict';

    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- Hash-free smooth anchor scrolling ---------- */

    // internal links scroll smoothly but never append #section to the URL
    document.addEventListener('click', function (e) {
        var link = e.target.closest('a[href^="#"]');
        if (!link) return;
        var target = document.querySelector(link.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
    });

    // if the page was opened with a #hash (e.g. a shared link), honor the
    // scroll position but clean the hash out of the address bar
    if (window.location.hash) {
        try {
            history.replaceState(null, '',
                window.location.pathname + window.location.search);
        } catch (e) { /* sandboxed context */ }
    }

    /* ---------- Mobile nav ---------- */

    var burger = document.getElementById('nav-burger');
    var navLinks = document.getElementById('nav-links');

    burger.addEventListener('click', function () {
        var open = navLinks.classList.toggle('open');
        burger.setAttribute('aria-expanded', String(open));
        burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });

    navLinks.addEventListener('click', function (e) {
        if (e.target.closest('a')) {
            navLinks.classList.remove('open');
            burger.setAttribute('aria-expanded', 'false');
        }
    });

    /* ---------- Active nav link on scroll ---------- */

    var sections = Array.prototype.slice.call(document.querySelectorAll('main section[id]'));
    var linkById = {};
    document.querySelectorAll('.nav-link').forEach(function (a) {
        linkById[a.getAttribute('href').slice(1)] = a;
    });

    var sectionObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            var link = linkById[entry.target.id];
            if (!link) return;
            if (entry.isIntersecting) {
                document.querySelectorAll('.nav-link.active').forEach(function (l) {
                    l.classList.remove('active');
                });
                link.classList.add('active');
            }
        });
    }, { rootMargin: '-40% 0px -55% 0px' });

    sections.forEach(function (s) { sectionObserver.observe(s); });

    /* ---------- Back to top ---------- */

    var backToTop = document.getElementById('back-to-top');

    window.addEventListener('scroll', function () {
        backToTop.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });

    backToTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    });

    /* ---------- Scramble/decode text (hero) ---------- */

    var typeEl = document.querySelector('.typewrite');

    if (typeEl && !reducedMotion) {
        var phrases = JSON.parse(typeEl.getAttribute('data-type'));
        var holdMs = parseInt(typeEl.getAttribute('data-period'), 10) || 2000;
        var wrap = typeEl.querySelector('.wrap');
        var GLYPHS_LOWER = 'abcdefghijklmnopqrstuvwxyz';
        var GLYPHS_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        var phraseIndex = 0;
        var scrambleQueue = [];
        var scrambleFrame = 0;
        var scrambleRaf = null;

        function scrambleTo(next) {
            var prev = wrap.textContent;
            var len = Math.max(prev.length, next.length);
            scrambleQueue = [];
            for (var i = 0; i < len; i++) {
                // chars resolve roughly left-to-right with some jitter
                var to = next[i] || '';
                var start = Math.floor(i * 1.4) + Math.floor(Math.random() * 8);
                scrambleQueue.push({
                    from: prev[i] || '',
                    to: to,
                    start: start,
                    // spaces/punctuation snap into place without scrambling
                    end: /[a-zA-Z]/.test(to)
                        ? start + 14 + Math.floor(Math.random() * 12)
                        : start,
                    glyph: ''
                });
            }
            scrambleFrame = 0;
            cancelAnimationFrame(scrambleRaf);
            scrambleStep();
        }

        function scrambleStep() {
            var out = '';
            var done = 0;
            for (var i = 0; i < scrambleQueue.length; i++) {
                var q = scrambleQueue[i];
                if (scrambleFrame >= q.end) {
                    done++;
                    out += q.to;
                } else if (scrambleFrame >= q.start) {
                    if (!q.glyph || Math.random() < 0.28) {
                        // glyph case follows the target char: caps scramble in
                        // caps, everything else in lowercase
                        var pool = /[A-Z]/.test(q.to) ? GLYPHS_UPPER : GLYPHS_LOWER;
                        q.glyph = pool[Math.floor(Math.random() * pool.length)];
                    }
                    out += '<span class="scramble-char">' + q.glyph + '</span>';
                } else {
                    out += q.from;
                }
            }
            wrap.innerHTML = out;
            if (done === scrambleQueue.length) {
                setTimeout(function () {
                    phraseIndex = (phraseIndex + 1) % phrases.length;
                    scrambleTo(phrases[phraseIndex]);
                }, holdMs);
            } else {
                scrambleFrame++;
                scrambleRaf = requestAnimationFrame(scrambleStep);
            }
        }

        scrambleTo(phrases[0]);
    } else if (typeEl) {
        // reduced motion: show all roles statically, no loop
        typeEl.querySelector('.wrap').textContent =
            JSON.parse(typeEl.getAttribute('data-type')).join(' ');
    }

    /* ---------- Skills filter ---------- */

    var filterButtons = document.querySelectorAll('.skill-filter');
    var skillChips = document.querySelectorAll('.skill-chip');

    function applyFilter(category) {
        skillChips.forEach(function (chip) {
            chip.classList.toggle('show',
                category === 'all' || chip.classList.contains(category));
        });
    }

    filterButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
            document.querySelector('.skill-filter.active').classList.remove('active');
            btn.classList.add('active');
            applyFilter(btn.getAttribute('data-filter'));
        });
    });

    applyFilter('all');

    /* ---------- Certificate lightbox ---------- */

    var lightbox = document.getElementById('lightbox');
    var lightboxImg = document.getElementById('lightbox-img');
    var lightboxClose = document.getElementById('lightbox-close');
    var lastFocused = null;

    function openLightbox(src, alt) {
        lastFocused = document.activeElement;
        lightboxImg.src = src;
        lightboxImg.alt = alt || 'Certificate';
        lightbox.hidden = false;
        document.body.style.overflow = 'hidden';
        lightboxClose.focus();
    }

    function closeLightbox() {
        lightbox.hidden = true;
        lightboxImg.src = '';
        document.body.style.overflow = '';
        if (lastFocused) lastFocused.focus();
    }

    document.querySelectorAll('[data-lightbox]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            openLightbox(btn.getAttribute('data-lightbox'),
                btn.getAttribute('data-lightbox-alt'));
        });
    });

    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function (e) {
        if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !lightbox.hidden) closeLightbox();
    });

    /* ---------- Figma-style custom cursor (fine pointers only) ---------- */

    var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    if (fine && !reducedMotion) {
        var cursorEl = document.getElementById('cursor');
        var cursorLabel = document.getElementById('cursor-label');
        var mouseX = -100, mouseY = -100;
        var labelX = -100, labelY = -100;
        var started = false;

        function labelFor(el) {
            var override = el.closest('[data-cursor]');
            if (override) return override.getAttribute('data-cursor');
            var link = el.closest('a');
            if (link) {
                if (link.hasAttribute('download')) return 'download';
                if (link.getAttribute('target') === '_blank') return 'open ↗';
                return 'go';
            }
            var btn = el.closest('button');
            if (btn) {
                if (btn.id === 'submit') return 'send';
                if (btn.id === 'nav-burger') return 'menu';
                if (btn.classList.contains('skill-filter')) return 'filter';
                return 'select';
            }
            return null;
        }

        document.addEventListener('mousemove', function (e) {
            mouseX = e.clientX;
            mouseY = e.clientY;
            if (!started) {
                started = true;
                labelX = mouseX;
                labelY = mouseY;
                document.body.classList.add('cursor-active');
                requestAnimationFrame(renderCursor);
            }
        });

        var TEXT_SELECTOR =
            'p, h1, h2, h3, li, label, blockquote, pre, input, textarea';

        document.addEventListener('mouseover', function (e) {
            var text = labelFor(e.target);
            if (text) {
                cursorLabel.textContent = text;
                cursorLabel.classList.add('visible');
            } else {
                cursorLabel.classList.remove('visible');
            }

            // terminal block caret over text content; arrow elsewhere
            // (interactive elements keep the arrow + label)
            var overText = !text && !!e.target.closest(TEXT_SELECTOR);
            document.body.classList.toggle('cursor-text', overText);
        });

        document.addEventListener('mouseleave', function () {
            cursorLabel.classList.remove('visible');
        });

        function renderCursor() {
            // arrow tracks the pointer precisely; label trails slightly
            cursorEl.style.transform =
                'translate(' + mouseX + 'px,' + mouseY + 'px)';
            labelX += (mouseX - labelX) * 0.35;
            labelY += (mouseY - labelY) * 0.35;
            cursorLabel.style.transform =
                'translate(' + (labelX + 17) + 'px,' + (labelY + 19) + 'px)';
            requestAnimationFrame(renderCursor);
        }
    }

    /* ---------- Contact terminal ---------- */

    var termTyped = document.getElementById('term-typed');
    var termOutput = document.getElementById('term-output');

    if (termTyped && !reducedMotion) {
        var termCommand = termTyped.textContent;
        termTyped.textContent = '';
        var termStarted = false;

        var termObserver = new IntersectionObserver(function (entries) {
            if (!entries[0].isIntersecting || termStarted) return;
            termStarted = true;
            termObserver.disconnect();
            var i = 0;
            (function typeChar() {
                termTyped.textContent = termCommand.slice(0, ++i);
                if (i < termCommand.length) setTimeout(typeChar, 45);
            })();
        }, { threshold: 0.4 });

        termObserver.observe(document.getElementById('contact-terminal'));
    }

    function termPrint(text, cls) {
        if (!termOutput) return;
        termOutput.textContent = text;
        termOutput.className = 'term-line term-output' + (cls ? ' ' + cls : '');
    }

    /* ---------- Contact form (Cloudflare Worker relay) ---------- */

    var form = document.getElementById('contact-form');
    var status = document.getElementById('form-status');
    var submitBtn = document.getElementById('submit');
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function fieldError(id, message) {
        var input = document.getElementById(id);
        var error = document.getElementById(id + '-error');
        input.classList.toggle('invalid', !!message);
        error.textContent = message || '';
        return !message;
    }

    function validate() {
        var ok = true;
        var name = form.name.value.trim();
        var email = form.email.value.trim();
        var message = form.message.value.trim();

        ok = fieldError('name', name ? '' : 'name is required') && ok;
        ok = fieldError('email',
            !email ? 'email is required'
                : !EMAIL_RE.test(email) ? 'enter a valid email address' : '') && ok;
        ok = fieldError('message', message ? '' : 'message is required') && ok;
        return ok;
    }

    ['name', 'email', 'message'].forEach(function (id) {
        document.getElementById(id).addEventListener('input', function () {
            fieldError(id, '');
            status.textContent = '';
            status.className = 'form-status mono';
        });
    });

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!validate()) return;

        status.className = 'form-status mono';

        if (!CONTACT_ENDPOINT) {
            status.textContent = 'form is not configured yet — email me directly at msharan.hnp@gmail.com';
            status.classList.add('err');
            termPrint('✗ transport not configured — falling back to mailto', 'err');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending…';
        termPrint('… sending message');

        function sendFailed() {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send';
            status.textContent = 'something went wrong — please retry or email msharan.hnp@gmail.com';
            status.classList.add('err');
            termPrint('✗ delivery failed — retry', 'err');
        }

        fetch(CONTACT_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: form.name.value.trim(),
                email: form.email.value.trim(),
                message: form.message.value.trim(),
                // honeypot — empty for humans, bots fill it
                website: form.website ? form.website.value : ''
            })
        }).then(function (res) {
            return res.json().then(function (data) {
                if (!res.ok || !data.ok) throw new Error('send failed');
                submitBtn.textContent = 'Sent ✓';
                status.textContent = 'message sent — I will get back to you soon.';
                status.classList.add('ok');
                termPrint('✓ message delivered', 'ok');
                form.reset();
                setTimeout(function () {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Send';
                }, 3000);
            });
        }).catch(sendFailed);
    });
})();
