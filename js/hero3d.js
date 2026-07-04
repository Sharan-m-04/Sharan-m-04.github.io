/* ============================================================
   hero3d.js — persistent 3D layer (Three.js)

   Fixed full-viewport transparent canvas behind the content:

   - HERO: a low-poly man working at a laptop (skin/shirt/hair
     colors, chair, legs — facing the viewer, lid back toward
     the camera). On scroll the hero pins and the scene rotates
     and zooms around behind him into the screen. The REAL
     #about-me section is transform-mapped onto the projected
     screen rectangle, then released into normal document flow
     as you keep scrolling — the site literally continues from
     inside his laptop.
   - Sparse distant wireframe artboards drift past at different
     parallax speeds across the whole scroll depth.

   Runs only when: viewport > 768px, no prefers-reduced-motion,
   Three.js + WebGL available. Otherwise the static CSS fallback
   (.hero-fallback) is shown and no canvas is created. The
   cinematic additionally requires GSAP ScrollTrigger.
   ============================================================ */

(function () {
    'use strict';

    var stage = document.querySelector('.hero-stage');
    var fallback = document.getElementById('hero-fallback');
    if (!stage || !fallback) return;

    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    function webglAvailable() {
        try {
            var canvas = document.createElement('canvas');
            return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
        } catch (e) {
            return false;
        }
    }

    // touch devices never get the pinned scroll cinematic, and the 3D
    // world layout assumes the two-column hero (collapses at 900px)
    if (reducedMotion || !finePointer || window.innerWidth <= 900 ||
        typeof THREE === 'undefined' || !webglAvailable()) {
        fallback.classList.add('visible');
        return;
    }

    /* ---------- Colors ---------- */

    var ACCENT = new THREE.Color('#0D99FF');

    function cssColor(name) {
        return new THREE.Color(
            getComputedStyle(document.documentElement).getPropertyValue(name).trim());
    }

    // fixed, natural palette for the figure (not theme-derived)
    var COL = {
        skin: 0xE3B08A,
        hair: 0x2B211A,
        shirt: 0x2E6FC4,
        pants: 0x23262E,
        shoes: 0x17181C,
        chair: 0x17181C,
        laptop: 0x1A1C22,
        screen: 0x0F1218
    };

    /* ---------- Scene / camera / renderer (fixed, full viewport) ---------- */

    var CAM_Z = 7;
    var FOV = 35;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 60);
    camera.position.z = CAM_Z;

    var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.className = 'webgl-canvas';
    document.body.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x3a3a48, 1.0));
    var keyLight = new THREE.DirectionalLight(0xfff2e0, 0.85);
    keyLight.position.set(2.5, 4, 5);
    scene.add(keyLight);

    var visH = 2 * Math.tan(FOV * Math.PI / 360) * CAM_Z;
    var visW = visH;
    var worldPerPx = visH / window.innerHeight;

    /* ---------- The man at his laptop ---------- */

    var manGroup = new THREE.Group();
    scene.add(manGroup);

    var deskMat = new THREE.MeshLambertMaterial();
    var laptopMat = new THREE.MeshLambertMaterial({ color: COL.laptop });
    var skinMat = new THREE.MeshLambertMaterial({ color: COL.skin });
    var hairMat = new THREE.MeshLambertMaterial({ color: COL.hair });
    var shirtMat = new THREE.MeshLambertMaterial({ color: COL.shirt });
    var pantsMat = new THREE.MeshLambertMaterial({ color: COL.pants });
    var shoeMat = new THREE.MeshLambertMaterial({ color: COL.shoes });
    var chairMat = new THREE.MeshLambertMaterial({ color: COL.chair });
    var accentLineMat = new THREE.LineBasicMaterial({
        color: ACCENT, transparent: true, opacity: 0.5
    });

    function addBox(w, h, d, mat, x, y, z, edges) {
        var mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        mesh.position.set(x, y, z);
        manGroup.add(mesh);
        if (edges) {
            var line = new THREE.LineSegments(
                new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)),
                accentLineMat);
            line.position.set(x, y, z);
            manGroup.add(line);
        }
        return mesh;
    }

    function addCapsule(fromV, toV, r, mat) {
        var dir = new THREE.Vector3().subVectors(toV, fromV);
        var dist = dir.length();
        var geo = new THREE.CapsuleGeometry(r, Math.max(0.01, dist - r * 2), 4, 10);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(fromV).addScaledVector(dir, 0.5);
        mesh.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 1, 0), dir.clone().normalize());
        manGroup.add(mesh);
        return mesh;
    }

    function addSphere(r, mat, x, y, z, scaleY) {
        var mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 22, 16), mat);
        mesh.position.set(x, y, z);
        if (scaleY) mesh.scale.y = scaleY;
        manGroup.add(mesh);
        return mesh;
    }

    function addCylinder(rt, rb, h, mat, x, y, z) {
        var mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 18), mat);
        mesh.position.set(x, y, z);
        manGroup.add(mesh);
        return mesh;
    }

    // desk (top surface at y = 0)
    addBox(2.6, 0.08, 1.25, deskMat, 0, -0.04, 0.12, true);
    addBox(0.07, 0.9, 0.07, deskMat, -1.2, -0.53, 0.55);
    addBox(0.07, 0.9, 0.07, deskMat, 1.2, -0.53, 0.55);
    addBox(0.07, 0.9, 0.07, deskMat, -1.2, -0.53, -0.3);
    addBox(0.07, 0.9, 0.07, deskMat, 1.2, -0.53, -0.3);

    // office chair: base disc, column, seat, tilted backrest
    addCylinder(0.34, 0.38, 0.05, chairMat, 0, -0.92, -0.8);
    addCylinder(0.05, 0.05, 0.52, chairMat, 0, -0.65, -0.8);
    addBox(0.62, 0.09, 0.58, chairMat, 0, -0.38, -0.8);
    var backrest = addBox(0.56, 0.7, 0.1, chairMat, 0, 0.12, -1.1);
    backrest.rotation.x = -0.08;

    // hips + legs (seated: thighs forward under the desk, shins down)
    addBox(0.5, 0.18, 0.42, pantsMat, 0, -0.26, -0.78);
    addCapsule(new THREE.Vector3(-0.14, -0.28, -0.8),
        new THREE.Vector3(-0.16, -0.3, -0.28), 0.09, pantsMat);
    addCapsule(new THREE.Vector3(0.14, -0.28, -0.8),
        new THREE.Vector3(0.16, -0.3, -0.28), 0.09, pantsMat);
    addCapsule(new THREE.Vector3(-0.16, -0.32, -0.28),
        new THREE.Vector3(-0.16, -0.82, -0.24), 0.075, pantsMat);
    addCapsule(new THREE.Vector3(0.16, -0.32, -0.28),
        new THREE.Vector3(0.16, -0.82, -0.24), 0.075, pantsMat);
    addBox(0.15, 0.09, 0.28, shoeMat, -0.16, -0.9, -0.14);
    addBox(0.15, 0.09, 0.28, shoeMat, 0.16, -0.9, -0.14);

    // torso, shoulders, neck, head, hair (sits tall so his face and chest
    // stay visible above the laptop lid) — torso flattened front-to-back
    // so the chest/stomach reads as a body, not a ball
    var torso = addCapsule(new THREE.Vector3(0, -0.08, -0.78),
        new THREE.Vector3(0, 0.42, -0.78), 0.19, shirtMat);
    torso.scale.z = 0.6;
    var shoulders = addCapsule(new THREE.Vector3(-0.26, 0.48, -0.78),
        new THREE.Vector3(0.26, 0.48, -0.78), 0.09, shirtMat);
    shoulders.scale.z = 0.8;
    addCylinder(0.055, 0.06, 0.14, skinMat, 0, 0.62, -0.78);
    addSphere(0.17, skinMat, 0, 0.82, -0.78);
    addSphere(0.19, hairMat, 0, 0.89, -0.8, 0.75);

    // arms: shirt upper arms bent at the elbow, skin forearms + hands
    addCapsule(new THREE.Vector3(-0.3, 0.5, -0.78),
        new THREE.Vector3(-0.36, 0.06, -0.5), 0.07, shirtMat);
    addCapsule(new THREE.Vector3(0.3, 0.5, -0.78),
        new THREE.Vector3(0.36, 0.06, -0.5), 0.07, shirtMat);
    addCapsule(new THREE.Vector3(-0.36, 0.06, -0.5),
        new THREE.Vector3(-0.22, 0.06, 0.0), 0.06, skinMat);
    addCapsule(new THREE.Vector3(0.36, 0.06, -0.5),
        new THREE.Vector3(0.22, 0.06, 0.0), 0.06, skinMat);
    var handL = addSphere(0.07, skinMat, -0.22, 0.06, 0.04);
    var handR = addSphere(0.07, skinMat, 0.22, 0.06, 0.04);

    // laptop — base + lid; the lid's BACK faces the camera at rest
    addBox(0.9, 0.035, 0.58, laptopMat, 0, 0.02, 0.28, true);

    var lidGroup = new THREE.Group();
    lidGroup.position.set(0, 0.02, 0.57);
    lidGroup.rotation.x = 0.3;
    manGroup.add(lidGroup);

    var lid = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.52, 0.03), laptopMat);
    lid.position.y = 0.26;
    lidGroup.add(lid);
    var lidLine = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(0.9, 0.52, 0.03)),
        accentLineMat);
    lidLine.position.y = 0.26;
    lidGroup.add(lidLine);

    // dark bezel screen — the REAL About DOM is projected on top of it
    var screenMat = new THREE.MeshBasicMaterial({ color: COL.screen });
    var screen = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 0.44), screenMat);
    screen.position.set(0, 0.26, -0.018);
    screen.rotation.y = Math.PI;
    lidGroup.add(screen);

    // soft scattered screen light: radial-gradient sprite, additive blend
    var glowCanvas = document.createElement('canvas');
    glowCanvas.width = glowCanvas.height = 256;
    var gctx = glowCanvas.getContext('2d');
    var glowGrad = gctx.createRadialGradient(128, 128, 8, 128, 128, 128);
    glowGrad.addColorStop(0, 'rgba(13, 153, 255, 0.7)');
    glowGrad.addColorStop(0.35, 'rgba(13, 153, 255, 0.22)');
    glowGrad.addColorStop(1, 'rgba(13, 153, 255, 0)');
    gctx.fillStyle = glowGrad;
    gctx.fillRect(0, 0, 256, 256);

    var glowMat = new THREE.MeshBasicMaterial({
        map: new THREE.CanvasTexture(glowCanvas),
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    var glow = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.4), glowMat);
    glow.position.set(0, 0.28, -0.06);
    glow.rotation.y = Math.PI;
    lidGroup.add(glow);

    /* ---------- Distant drifting artboards (persistent presence) ---------- */

    var bgGroup = new THREE.Group();
    scene.add(bgGroup);

    var edgeMaterials = [];
    var BG_COUNT = 8;
    var bgBoards = [];

    for (var i = 0; i < BG_COUNT; i++) {
        var w = 1.2 + (i % 3) * 0.7;
        var h = w * 0.66;
        var board = new THREE.Group();

        var edgeMat = new THREE.LineBasicMaterial({
            color: 0xffffff, transparent: true, opacity: 0.16
        });
        edgeMaterials.push(edgeMat);
        board.add(new THREE.LineSegments(
            new THREE.EdgesGeometry(new THREE.PlaneGeometry(w, h)), edgeMat));

        if (i % 3 === 0) {
            var handleMat = new THREE.MeshBasicMaterial({
                color: ACCENT, transparent: true, opacity: 0.22
            });
            var handleGeo = new THREE.PlaneGeometry(0.11, 0.11);
            [[-w / 2, h / 2], [w / 2, h / 2], [-w / 2, -h / 2], [w / 2, -h / 2]]
                .forEach(function (p) {
                    var hm = new THREE.Mesh(handleGeo, handleMat);
                    hm.position.set(p[0], p[1], 0.01);
                    board.add(hm);
                });
        }

        board.position.z = -3 - (i % 4) * 1.6;
        board.rotation.z = (i % 2 ? 1 : -1) * (0.05 + (i % 3) * 0.04);
        board.userData.speed = 0.45 + (i % 4) * 0.22;
        board.userData.xFrac = ((i * 0.37) % 1) - 0.5;
        board.userData.baseY = 0;
        board.userData.spin = (i % 2 ? 1 : -1) * 0.0004;
        bgGroup.add(board);
        bgBoards.push(board);
    }

    function layoutBg() {
        var docSpan = Math.max(
            document.documentElement.scrollHeight - window.innerHeight, 1);
        bgBoards.forEach(function (board, idx) {
            var frac = (idx + 1.2) / (BG_COUNT + 1);
            board.userData.baseY =
                -(frac * docSpan * worldPerPx * board.userData.speed);
            board.position.x = board.userData.xFrac * visW * 0.9;
        });
    }

    /* ---------- Colors from the design tokens (dark-only site) ---------- */

    deskMat.color.copy(cssColor('--bg-elev'));
    edgeMaterials.forEach(function (m) {
        m.color.copy(cssColor('--text-3'));
    });

    /* ---------- Sizing ---------- */

    function resize() {
        var w = window.innerWidth;
        var h = window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        visW = visH * camera.aspect;
        worldPerPx = visH / h;
        layoutBg();
    }

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('load', layoutBg);

    /* ---------- Cinematic pin ---------- */

    var cinematicP = 0;
    var hasCinematic = false;
    var heroCopy = document.querySelector('.hero-copy');

    function smoothstep(a, b, x) {
        var t = Math.min(Math.max((x - a) / (b - a), 0), 1);
        return t * t * (3 - 2 * t);
    }

    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
        hasCinematic = true;

        ScrollTrigger.create({
            trigger: '#home',
            start: 'top 96px',
            end: '+=150%',
            pin: true,
            scrub: 0.5,
            anticipatePin: 1,
            refreshPriority: 2,
            onUpdate: function (self) {
                cinematicP = self.progress;
                var fade = 1 - smoothstep(0.4, 0.75, cinematicP);
                heroCopy.style.opacity = fade;
                heroCopy.style.pointerEvents = fade < 0.4 ? 'none' : '';
            }
        });

        // the projects pin (created earlier in effects.js) must re-measure
        // now that this pin's spacer exists — don't wait for `load`
        ScrollTrigger.sort();
        ScrollTrigger.refresh();
    }

    /* ---------- About-in-screen DOM projection ---------- */

    var about = document.getElementById('about-me');
    var aboutSpacer = null;
    var aboutW = 0;
    var inScreen = false;

    function enterInScreen() {
        if (inScreen) return;
        inScreen = true;
        aboutW = about.offsetWidth;
        aboutSpacer = document.createElement('div');
        aboutSpacer.style.height = about.offsetHeight + 'px';
        aboutSpacer.style.marginBottom = getComputedStyle(about).marginBottom;
        about.parentNode.insertBefore(aboutSpacer, about);
        about.classList.add('in-screen');
        about.style.width = aboutW + 'px';
        // content must be visible inside the laptop even though the section
        // never scrolled into view normally
        about.querySelectorAll('.reveal-item').forEach(function (el) {
            el.classList.add('revealed');
        });
    }

    function exitInScreen() {
        if (!inScreen) return;
        inScreen = false;
        about.classList.remove('in-screen');
        about.style.transform = '';
        about.style.opacity = '';
        about.style.clipPath = '';
        about.style.width = '';
        if (aboutSpacer) {
            aboutSpacer.remove();
            aboutSpacer = null;
        }
    }

    // projected pixel rect of the screen plane
    var cornerV = new THREE.Vector3();
    var SCREEN_W = 0.82;
    var SCREEN_H = 0.44;

    function screenRectPx() {
        var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        var corners = [
            [-SCREEN_W / 2, SCREEN_H / 2], [SCREEN_W / 2, SCREEN_H / 2],
            [-SCREEN_W / 2, -SCREEN_H / 2], [SCREEN_W / 2, -SCREEN_H / 2]
        ];
        for (var i = 0; i < 4; i++) {
            cornerV.set(corners[i][0], corners[i][1], 0);
            screen.localToWorld(cornerV);
            cornerV.project(camera);
            var px = (cornerV.x + 1) / 2 * window.innerWidth;
            var py = (1 - cornerV.y) / 2 * window.innerHeight;
            if (px < minX) minX = px;
            if (px > maxX) maxX = px;
            if (py < minY) minY = py;
            if (py > maxY) maxY = py;
        }
        return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    }

    /* ---------- Animation ---------- */

    var targetRotX = 0;
    var targetRotY = 0;
    var MAX_TILT = 0.09;

    document.addEventListener('mousemove', function (e) {
        targetRotY = ((e.clientX / window.innerWidth) - 0.5) * 2 * MAX_TILT;
        targetRotX = ((e.clientY / window.innerHeight) - 0.5) * 2 * MAX_TILT;
    });

    var tiltX = 0;
    var tiltY = 0;
    var canvasOp = 1;
    var canvasOpTarget = 1;
    var Z_END = 3.0;        // screen world-z at pin end
    var TARGET_TOP = 100;   // where the screen's top edge should land (px)
    var rafId = null;
    var start = performance.now();
    var screenOffset = new THREE.Vector3();
    var SCREEN_LOCAL = new THREE.Vector3(0, 0.28, 0.55);

    function animate(now) {
        rafId = requestAnimationFrame(animate);
        var t = (now - start) / 1000;
        var scrollY = window.scrollY;
        var p = hasCinematic ? smoothstep(0, 1, cinematicP) : 0;

        // anchor the scene to the hero stage element
        var rect = stage.getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;
        var anchorX = (cx / window.innerWidth - 0.5) * visW;
        var anchorY = -(cy / window.innerHeight - 0.5) * visH;
        var anchorScale = Math.max(rect.width / window.innerWidth, 0.001) * visW / 3.1;

        // END state solved so the projected screen EXACTLY matches the
        // About section's natural width at scale 1 — the zoom stops there
        var slotRect = (aboutSpacer || about).getBoundingClientRect();
        var aw = inScreen ? aboutW : about.offsetWidth;
        var dEnd = CAM_Z - Z_END;
        var visWEnd = 2 * Math.tan(FOV * Math.PI / 360) * dEnd * camera.aspect;
        var visHEnd = visWEnd / camera.aspect;
        var pxPerWorld = window.innerWidth / visWEnd;
        var scaleEnd = (aw / pxPerWorld) / SCREEN_W;
        // world x/y so the screen lands on the About column at TARGET_TOP px
        var rectHpx = aw * SCREEN_H / SCREEN_W;
        var pyCenter = TARGET_TOP + rectHpx / 2;
        var wyCenter = (0.5 - pyCenter / window.innerHeight) * visHEnd;
        var wxCenter = ((slotRect.left + aw / 2) / window.innerWidth - 0.5) * visWEnd;

        var scale = anchorScale + (scaleEnd - anchorScale) * p;
        manGroup.scale.setScalar(scale);
        // orbit completes by p = 0.85 so the About fade-in (p ≥ 0.86)
        // happens against a perfectly fronto-parallel screen
        var rotY = Math.PI * smoothstep(0, 0.85, p);
        manGroup.rotation.y = rotY;

        // lid straightens early so the screen is flat-on before About appears
        lidGroup.rotation.x = 0.3 * (1 - smoothstep(0.3, 0.6, p));

        // where the screen center sits after rotation + scale
        screenOffset.copy(SCREEN_LOCAL)
            .applyEuler(new THREE.Euler(0, rotY, 0))
            .multiplyScalar(scale);
        var endX = wxCenter - screenOffset.x;
        var endY = wyCenter - screenOffset.y;
        var endZ = Z_END - screenOffset.z;

        manGroup.position.x = anchorX + (endX - anchorX) * p;
        manGroup.position.y = anchorY + (endY - anchorY) * p +
            Math.sin(t * 0.8) * 0.03 * (1 - p);
        manGroup.position.z = endZ * p;

        // cursor tilt, fully damped by mid-cinematic so no perspective skew
        var tiltAmt = 1 - smoothstep(0.2, 0.5, p);
        tiltY += (targetRotY * tiltAmt - tiltY) * 0.05;
        tiltX += (targetRotX * tiltAmt - tiltX) * 0.05;
        manGroup.rotation.y += tiltY;
        manGroup.rotation.x = tiltX;

        // idle typing + screen glow
        handL.position.y = 0.06 + Math.max(0, Math.sin(t * 9)) * 0.03;
        handR.position.y = 0.06 + Math.max(0, Math.sin(t * 9 + Math.PI)) * 0.03;
        glowMat.opacity = 0.3 + p * 0.2 + Math.sin(t * 3.1) * 0.04;

        // distant boards ride the scroll at their own parallax speeds
        bgBoards.forEach(function (board) {
            board.position.y = board.userData.baseY +
                scrollY * worldPerPx * board.userData.speed;
            board.rotation.z += board.userData.spin;
        });

        scene.updateMatrixWorld();

        /* -- map the real About section onto the projected screen rect --
           It only appears once the screen is fronto-parallel (p ≥ ~0.86),
           sits at scale ≈ 1 when the pin ends (no over-zoom), waits inside
           the laptop frame while the flow slot scrolls up to meet it, then
           releases into normal document flow with zero jump. */

        if (hasCinematic && p > 0.8) {
            var sr = screenRectPx();

            if (slotRect.top > sr.y + 2) {
                enterInScreen();
                var s = sr.w / aboutW;
                about.style.transform =
                    'translate(' + sr.x.toFixed(2) + 'px,' + sr.y.toFixed(2) +
                    'px) scale(' + s.toFixed(4) + ')';
                about.style.opacity = smoothstep(0.86, 0.97, p).toFixed(3);
                var clipBottom = Math.max(0, about.offsetHeight - sr.h / s);
                about.style.clipPath = clipBottom > 1
                    ? 'inset(0 0 ' + clipBottom.toFixed(1) + 'px 0)'
                    : '';

                // seamless handoff: the 3D scene (laptop bezel + man) fades
                // away as the flow slot closes in, so the release is a
                // dissolve rather than a cut
                canvasOpTarget = 1 - smoothstep(320, 30, slotRect.top - sr.y);
            } else {
                // the flow slot has reached the screen position — release
                exitInScreen();
                canvasOpTarget = 1;
            }
        } else {
            exitInScreen();
            canvasOpTarget = 1;
        }

        // eased so the faint background boards return gently after release
        canvasOp += (canvasOpTarget - canvasOp) * 0.12;
        renderer.domElement.style.opacity = canvasOp.toFixed(3);

        // after release the page has "entered the screen" — hide the scene
        // (it comes back as soon as the user scrolls up past the release)
        manGroup.visible = !(hasCinematic && p >= 0.999 && !inScreen);

        renderer.render(scene, camera);
    }

    rafId = requestAnimationFrame(animate);

    // pause rendering while the tab is hidden
    document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
        } else if (rafId === null) {
            start = performance.now();
            rafId = requestAnimationFrame(animate);
        }
    });
})();
