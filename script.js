document.addEventListener("DOMContentLoaded", () => {
    // 1. Initialize Lenis Smooth Scrolling — Cinematic Premium Config
    const lenis = new Lenis({
        duration: 1.8,                                          // More inertia
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Smoother exponential
        lerp: 0.05,                                             // Silky smooth catch-up
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        smoothTouch: false,
        touchMultiplier: 1.5,
        wheelMultiplier: 0.8,                                   // Slower wheel = more cinematic
        infinite: false,
        autoResize: true,
    });

    // Sync Lenis with GSAP ScrollTrigger for correct scrub animations
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Disable scrolling initially for loader
    lenis.stop();

    // Safety Fallback: Hide loader after 5s no matter what
    setTimeout(() => {
        const loader = document.getElementById('loader');
        if (loader && loader.style.display !== 'none') {
            gsap.to(loader, { 
                opacity: 0, 
                duration: 0.8, 
                onComplete: () => {
                    loader.style.display = 'none';
                    lenis.start();
                    if (typeof masterReveal === "function") masterReveal();
                } 
            });
        }
    }, 5000);

    // ── MASTER LOADER SEQUENCE ──────────────────────────────────────
    const loaderTL = gsap.timeline({
        onComplete: () => {
            // Once loader is done, enable scrolling and start page reveal
            lenis.start();
            if (typeof refreshTriggers === "function") refreshTriggers();
            if (typeof masterReveal === "function") masterReveal();
        }
    });

    // Initial states for loader elements
    gsap.set(".bean-bit", { y: 20, opacity: 0 });
    gsap.set(".loader-steam span", { y: 20, opacity: 0 });
    gsap.set(".loader-logo", { opacity: 0, y: 10 });

    loaderTL
        // 1. Beans assembly
        .to(".bean-bit", {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.2,
            ease: "power2.out"
        })
        // 2. Steam drifts up
        .to(".loader-steam span", {
            opacity: 1,
            y: -30,
            duration: 2,
            stagger: 0.3,
            ease: "sine.inOut",
            repeat: 1,
            yoyo: true
        }, "-=0.5")
        // 3. Progress bar fills smoothly
        .to(".status-bar", {
            width: "100%",
            duration: 2.8,
            ease: "power1.inOut"
        }, 0.5)
        // 4. Logo elegantly fades and expands
        .to(".loader-logo", {
            opacity: 1,
            y: 0,
            letterSpacing: "0.45em",
            duration: 1.5,
            ease: "expo.out"
        }, "-=1.8")
        // 5. Final exit — fade out full loader
        .to("#loader", {
            opacity: 0,
            duration: 1,
            ease: "power2.inOut",
            onComplete: () => {
                document.getElementById('loader').style.display = 'none';
            }
        }, "+=0.2");

    // Helper to refresh all triggers
    window.refreshTriggers = () => {
        ScrollTrigger.refresh();
    };

    // Global scroll speed for bean physics — ramps up on scroll, decays smoothly
    let scrollVelocity = 0;
    let scrollSpeed = 0;         // current additional fall speed from scroll
    const maxScrollBoost = 0.25; // maximum extra fall speed

    lenis.on('scroll', (e) => {
        scrollVelocity = Math.abs(e.velocity);
        // Ramp scroll boost — direct push each scroll event
        scrollSpeed = Math.min(scrollVelocity * 0.04, maxScrollBoost);
    });

    // 2. Navbar Scroll Effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // 3. Three.js Background — Falling Coffee Beans ONLY
    const canvas = document.getElementById('bg-canvas');
    const scene = new THREE.Scene();
    
    // Minimal fog for depth
    scene.fog = new THREE.FogExp2(0x0a0807, 0.012);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 40;

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Warm cinematic lighting for beans
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const warmLight = new THREE.PointLight(0xd4a373, 2.5, 150);
    warmLight.position.set(15, 30, 30);
    scene.add(warmLight);

    const fillLight = new THREE.PointLight(0xfaedcd, 0.8, 120);
    fillLight.position.set(-25, -15, 20);
    scene.add(fillLight);

    // ── Realistic Falling Coffee Beans ─────────────────────────────
    // ... (existing bean logic)
    const beanTexture = new THREE.TextureLoader().load('assets/coffee_bean_texture.png');
    const beanGroup = new THREE.Group();
    scene.add(beanGroup);
    const fallingBeans = [];
    const beanCount = 80;

    for (let i = 0; i < beanCount; i++) {
        const rx = 0.8 + Math.random() * 0.5;
        const ry = 0.5 + Math.random() * 0.4;
        const rz = 0.3 + Math.random() * 0.3;
        const geo = new THREE.SphereGeometry(1, 14, 10);
        geo.scale(rx, ry, rz);
        const depth = Math.random();
        const zPos = -40 + depth * 80;
        const baseScale = 0.3 + depth * 1.0;
        const opacity = 0.3 + depth * 0.65;
        const beanMat = new THREE.MeshStandardMaterial({
            map: beanTexture,
            roughness: 0.55,
            metalness: 0.05,
            transparent: true,
            opacity,
            color: new THREE.Color().setHSL(0.07, 0.6 + depth * 0.3, 0.25 + depth * 0.25),
        });
        const bean = new THREE.Mesh(geo, beanMat);
        bean.position.x = (Math.random() - 0.5) * 130;
        bean.position.y = 70 + Math.random() * 200;
        bean.position.z = zPos;
        bean.rotation.set(Math.random()*Math.PI*2, Math.random()*Math.PI*2, Math.random()*Math.PI*2);
        bean.scale.setScalar(baseScale);
        beanGroup.add(bean);
        fallingBeans.push({
            mesh: bean,
            velocity: 0.04 + Math.random() * 0.06,
            gravity: 0.0008 + Math.random() * 0.0006,
            terminalVelocity: 0.18 + Math.random() * 0.12,
            rotX: (Math.random() - 0.5) * 0.018,
            rotY: (Math.random() - 0.5) * 0.022,
            rotZ: (Math.random() - 0.5) * 0.015,
            swayAmplitude: 0.04 + Math.random() * 0.08,
            swayFrequency: 0.4 + Math.random() * 0.6,
            swayPhase: Math.random() * Math.PI * 2,
            originX: bean.position.x,
            depth,
            baseScale,
        });
    }

    // ── Cinematic Bokeh Lights ─────────────────────────────────────
    const bokehGroup = new THREE.Group();
    scene.add(bokehGroup);
    const bokehLights = [];
    const bokehCount = 15;
    const bokehGeo = new THREE.SphereGeometry(4, 16, 16);

    for(let i=0; i < bokehCount; i++) {
        const bokehMat = new THREE.MeshBasicMaterial({
            color: 0xd4a373,
            transparent: true,
            opacity: 0.05 + Math.random() * 0.08,
            blending: THREE.AdditiveBlending
        });
        const mesh = new THREE.Mesh(bokehGeo, bokehMat);
        mesh.position.set((Math.random()-0.5)*150, (Math.random()-0.5)*100, -50 + Math.random()*40);
        mesh.scale.setScalar(1 + Math.random() * 3);
        bokehGroup.add(mesh);
        bokehLights.push({
            mesh,
            speed: 0.02 + Math.random() * 0.03,
            offset: Math.random() * Math.PI * 2
        });
    }

    // ── Floating Dust Motes (Particles) ───────────────────────────
    const dustCount = 200;
    const dustGeo = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    for(let i=0; i < dustCount * 3; i++) dustPositions[i] = (Math.random()-0.5) * 150;
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({
        color: 0xfaedcd,
        size: 0.25,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending
    });
    const dustParticles = new THREE.Points(dustGeo, dustMat);
    scene.add(dustParticles);

    // Dynamic Orbiting Light for Atmosphere
    const orbitLight = new THREE.PointLight(0xd4a373, 2, 150);
    scene.add(orbitLight);

    // Mouse interaction — subtle parallax
    let targetX = 0;
    const windowHalfX = window.innerWidth / 2;

    document.addEventListener('mousemove', (event) => {
        targetX = (event.clientX - windowHalfX) * 0.001;
    });

    // Animation Loop
    const clock = new THREE.Clock();

    const tick = () => {
        const elapsedTime = clock.getElapsedTime();

        // Decay scroll velocity and scroll speed each frame
        scrollVelocity *= 0.92;
        scrollSpeed *= 0.90; // Smooth deceleration when scroll stops

        // ── Falling Coffee Beans ────────────────────────────
        fallingBeans.forEach((bean, i) => {
            const totalGravity = bean.gravity + scrollSpeed * 0.5;
            bean.velocity = Math.min(bean.velocity + totalGravity, bean.terminalVelocity + scrollSpeed);
            bean.mesh.position.y -= bean.velocity;
            const swayOffset = Math.sin(elapsedTime * bean.swayFrequency + bean.swayPhase) * bean.swayAmplitude;
            bean.mesh.position.x = bean.originX + swayOffset * 18 + targetX * 12 * bean.depth;
            bean.mesh.rotation.x += bean.rotX;
            bean.mesh.rotation.y += bean.rotY;
            bean.mesh.rotation.z += bean.rotZ;
            const breathe = 1 + Math.sin(elapsedTime * 0.8 + i) * 0.015;
            bean.mesh.scale.setScalar(bean.baseScale * breathe);
            if (bean.mesh.position.y < -70) {
                bean.mesh.position.y = 70 + Math.random() * 60;
                bean.mesh.position.x = (Math.random() - 0.5) * 130;
                bean.originX = bean.mesh.position.x;
                bean.velocity = 0.04 + Math.random() * 0.04;
            }
        });

        // ── Bokeh Lights Animation ───────────────────────────
        bokehLights.forEach(light => {
            light.mesh.position.y += light.speed;
            light.mesh.position.x += Math.sin(elapsedTime * 0.5 + light.offset) * 0.05;
            if (light.mesh.position.y > 60) light.mesh.position.y = -60;
        });

        // ── Dust Particles Animation ─────────────────────────
        const positions = dustParticles.geometry.attributes.position.array;
        for (let i = 0; i < dustCount; i++) {
            const i3 = i * 3;
            positions[i3 + 1] += 0.02 + Math.sin(elapsedTime * 0.2 + i) * 0.01;
            positions[i3] += Math.cos(elapsedTime * 0.3 + i) * 0.015;
            if (positions[i3 + 1] > 75) positions[i3 + 1] = -75;
        }
        dustParticles.geometry.attributes.position.needsUpdate = true;

        // ── Orbit Light Animation ────────────────────────────
        orbitLight.position.x = Math.sin(elapsedTime * 0.4) * 40;
        orbitLight.position.z = Math.cos(elapsedTime * 0.4) * 30 + 10;
        orbitLight.position.y = Math.cos(elapsedTime * 0.2) * 20;

        // Subtle camera drift with mouse
        camera.position.x += (targetX * 6 - camera.position.x) * 0.02;
        camera.lookAt(scene.position);

        // Render
        renderer.render(scene, camera);
        window.requestAnimationFrame(tick);
    }

    tick();

    // Handle Window Resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });

    // 4. GSAP Animations
    gsap.registerPlugin(ScrollTrigger);

    // ── MASTER REVEAL SYSTEM ──────────────────────────────────────────
    // Set initial hidden states (no flash of content)
    gsap.set(".navbar",          { y: -80, opacity: 0 });
    gsap.set(".title-line",      { y: 80, opacity: 0, clipPath: "inset(100% 0% 0% 0%)", letterSpacing: "-0.05em" });
    gsap.set(".hero-subtitle",   { y: 30, opacity: 0 });
    gsap.set(".hero-actions",    { y: 25, opacity: 0 });
    gsap.set(".scroll-indicator",{ opacity: 0 });
    gsap.set(".hero-3d-assets",  { y: 40, opacity: 0, scale: 0.9, filter: "blur(10px)" });
    gsap.set(".hero-bg-video",   { scale: 1.15, opacity: 0 });

    // This timeline handles the hero entrance and is triggered by the loader
    const heroTL = gsap.timeline({ 
        paused: true, 
        delay: 0.4, 
        defaults: { ease: "expo.out" } 
    });

    window.masterReveal = () => {
        heroTL.play();
        startHeroParallax();
    };

    heroTL
        // 1. Background video fades and subtly de-zooms into place
        .to(".hero-bg-video", {
            scale: 1.05, opacity: 0.7, duration: 2.5, ease: "power2.inOut"
        })
        // 2. Navbar glides in from top
        .to(".navbar", {
            y: 0, opacity: 1, duration: 1.2, ease: "expo.out"
        }, "-=1.8")
        // 3. Title lines clip-path reveal + slide up
        .to(".title-line", {
            y: 0,
            opacity: 1,
            clipPath: "inset(0% 0% 0% 0%)",
            letterSpacing: "0.02em",
            duration: 1.8,
            stagger: 0.2,
            ease: "expo.out"
        }, "-=1.5")
        // 4. Subtitle fades up softly
        .to(".hero-subtitle", {
            y: 0, opacity: 1, duration: 1.2, ease: "power3.out"
        }, "-=1.2")
        // 5. CTA buttons emerge with a gentle scale+fade
        .fromTo(".hero-actions .primary-btn, .hero-actions .secondary-btn",
            { y: 20, opacity: 0, scale: 0.96 },
            { y: 0, opacity: 1, scale: 1, duration: 1.1, stagger: 0.15, ease: "back.out(1.2)" },
            "-=1.0"
        )
        // 6. Coffee cup / 3D assets reveal with a blur-to-sharp transition
        .to(".hero-3d-assets", {
            y: 0, opacity: 1, scale: 1, filter: "blur(0px)", duration: 2.2, ease: "expo.out"
        }, "-=1.5")
        // 7. Scroll indicator fades in last
        .to(".scroll-indicator", {
            opacity: 0.6, duration: 1.5, ease: "power2.out"
        }, "-=1.2");

    // Cinematic Mouse Parallax for Hero Depth
    function startHeroParallax() {
        const hero = document.querySelector('.hero');
        const cup = document.querySelector('.main-cup');
        const content = document.querySelector('.hero-content');
        const glow = document.querySelector('.hero-ambient-glow');

        if (!hero) return;

        hero.addEventListener('mousemove', (e) => {
            const { width, height } = hero.getBoundingClientRect();
            const xVal = (e.clientX - width / 2) / (width / 2);
            const yVal = (e.clientY - height / 2) / (height / 2);

            // Move elements at different speeds for depth
            gsap.to(cup, {
                x: xVal * 30,
                y: yVal * 20,
                rotationY: xVal * 10,
                rotationX: -yVal * 5,
                duration: 1.2,
                ease: "power2.out"
            });

            gsap.to(content, {
                x: xVal * -15,
                y: yVal * -10,
                duration: 1.2,
                ease: "power2.out"
            });

            gsap.to(glow, {
                x: xVal * 50,
                y: yVal * 40,
                duration: 1.5,
                ease: "power2.out"
            });
        });
    }

    // ── FULL-SITE PARALLAX DEPTH SYSTEM ───────────────────────────────
    // All scrub values are high (2–4) so motion is buttery slow

    // HERO — 3 independent layers moving at different rates
    // Layer 1: background video drifts slowest (almost stationary)
    gsap.to(".hero-bg-container", {
        yPercent: 20,
        ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 2 }
    });

    // Layer 2: ambient glow drifts slightly faster
    gsap.to(".hero-ambient-glow", {
        yPercent: 35,
        ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 2.5 }
    });

    // Layer 3: hero text content scrolls away fastest (natural reading flow)
    gsap.to(".hero-content", {
        yPercent: 18,
        ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 3 }
    });

    // Layer 4: 3D cup floats at its own rate (between bg and text)
    gsap.to(".hero-3d-assets", {
        yPercent: 25,
        ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 2.2 }
    });

    // SECTION HEADERS — all drift upward gently as user scrolls into them
    gsap.utils.toArray(".section-header").forEach(header => {
        gsap.fromTo(header,
            { y: 30 },
            {
                y: -20,
                ease: "none",
                scrollTrigger: {
                    trigger: header.parentElement,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: 3
                }
            }
        );
    });

    // FEATURES SECTION — cards float at slightly different depths
    gsap.utils.toArray(".feature-card").forEach((card, i) => {
        // Alternate cards move at slightly different rates for depth
        const depth = i % 2 === 0 ? -22 : -14;
        gsap.to(card, {
            y: depth,
            ease: "none",
            scrollTrigger: {
                trigger: ".features-section",
                start: "top bottom",
                end: "bottom top",
                scrub: 3
            }
        });
    });

    // MENU SECTION — category cards rise at staggered depths
    gsap.utils.toArray(".menu-category").forEach((cat, i) => {
        gsap.to(cat, {
            y: -10 - (i % 3) * 8,
            ease: "none",
            scrollTrigger: {
                trigger: ".menu-showcase",
                start: "top bottom",
                end: "bottom top",
                scrub: 3.5
            }
        });
    });

    // TESTIMONIALS SECTION — cards with subtle float depth
    gsap.utils.toArray(".testimonial-card").forEach((card, i) => {
        const yMove = i % 2 === 0 ? -18 : -10;
        gsap.to(card, {
            y: yMove,
            ease: "none",
            scrollTrigger: {
                trigger: ".testimonials-section",
                start: "top bottom",
                end: "bottom top",
                scrub: 3
            }
        });
    });

    // FOOTER — background glow drifts up slowly as footer enters view
    gsap.to(".footer-bg-glow", {
        yPercent: -40,
        ease: "none",
        scrollTrigger: {
            trigger: ".footer",
            start: "top bottom",
            end: "top top",
            scrub: 2.5
        }
    });

    // FOOTER COLUMNS — subtle staggered rise
    gsap.utils.toArray(".footer-column").forEach((col, i) => {
        gsap.to(col, {
            y: -8 - i * 4,
            ease: "none",
            scrollTrigger: {
                trigger: ".footer",
                start: "top bottom",
                end: "bottom bottom",
                scrub: 4
            }
        });
    });

    // BEAN HEAP — parallax drift on the end-of-page video
    gsap.to(".bean-heap-video-wrap", {
        yPercent: -12,
        ease: "none",
        scrollTrigger: {
            trigger: ".bean-heap-section",
            start: "top bottom",
            end: "bottom top",
            scrub: 2
        }
    });

    // ── FEATURES SECTION REVEAL ──────────────────────────────────────
    gsap.fromTo(".features-section .section-title", 
        { y: 40, opacity: 0 },
        {
            scrollTrigger: { trigger: ".features-section", start: "top 85%" },
            y: 0, opacity: 1, duration: 1.2, ease: "expo.out"
        }
    );

    gsap.fromTo(".features-section .section-subtitle", 
        { y: 20, opacity: 0 },
        {
            scrollTrigger: { trigger: ".features-section", start: "top 85%" },
            y: 0, opacity: 1, duration: 1, delay: 0.2, ease: "expo.out"
        }
    );

    gsap.fromTo(".feature-card", 
        { y: 50, opacity: 0, scale: 0.95 },
        {
            scrollTrigger: {
                trigger: ".features-grid",
                start: "top 80%",
            },
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 1.1,
            stagger: 0.12,
            ease: "power3.out"
        }
    );

    // ── MENU CATEGORIES — Cinematic Per-Card Stagger ─────────────────
    // Each card gets its own ScrollTrigger so they trigger individually
    // as the user scrolls — not all at once
    const menuCats = gsap.utils.toArray('.menu-category');

    // Set initial state
    gsap.set(menuCats, { y: 55, opacity: 0, clipPath: 'inset(20% 0% 0% 0%)' });

    menuCats.forEach((cat, i) => {
        gsap.to(cat, {
            y: 0,
            opacity: 1,
            clipPath: 'inset(0% 0% 0% 0%)',
            duration: 1.1,
            delay: i * 0.08,           // gentle cascade offset
            ease: 'expo.out',
            scrollTrigger: {
                trigger: cat,
                start: 'top 88%',
                toggleActions: 'play none none none',
            }
        });

        // GSAP hover: 3D tilt + golden glow reveal
        const header = cat.querySelector('.category-header');
        if (!header) return;

        header.addEventListener('mouseenter', () => {
            gsap.to(cat, {
                y: -6,
                scale: 1.012,
                boxShadow: '0 16px 48px rgba(0,0,0,0.5), 0 0 28px rgba(212,163,115,0.18)',
                duration: 0.45,
                ease: 'power3.out',
                overwrite: 'auto'
            });
            gsap.to(header.querySelector('.cat-chevron'), {
                color: '#d4a373',
                scale: 1.2,
                duration: 0.3,
                ease: 'power2.out'
            });
        });

        header.addEventListener('mouseleave', () => {
            gsap.to(cat, {
                y: 0,
                scale: 1,
                boxShadow: 'none',
                duration: 0.6,
                ease: 'power3.out',
                overwrite: 'auto'
            });
            gsap.to(header.querySelector('.cat-chevron'), {
                color: '',
                scale: 1,
                duration: 0.4,
                ease: 'power2.out'
            });
        });
    });

    // ── FILTER BUTTONS — staggered entrance on scroll ─────────────────
    gsap.fromTo('.filter-btn', 
        { y: 20, opacity: 0, scale: 0.92 },
        {
            scrollTrigger: {
                trigger: '.menu-filters',
                start: 'top 90%',
            },
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.7,
            stagger: 0.07,
            ease: 'back.out(1.6)'
        }
    );

    // ── MENU SECTION TITLE — dramatic slide-up ────────────────────────
    gsap.fromTo('.menu-showcase .section-title', 
        { y: 40, opacity: 0 },
        {
            scrollTrigger: {
                trigger: '.menu-showcase',
                start: 'top 85%',
            },
            y: 0,
            opacity: 1,
            duration: 1.2,
            ease: 'expo.out'
        }
    );

    gsap.fromTo('.menu-showcase .section-subtitle', 
        { y: 25, opacity: 0 },
        {
            scrollTrigger: {
                trigger: '.menu-showcase',
                start: 'top 85%',
            },
            y: 0,
            opacity: 1,
            duration: 1,
            delay: 0.2,
            ease: 'expo.out'
        }
    );

    // ── STORY SECTION REVEAL ─────────────────────────────────────────
    const storyRevealTL = gsap.timeline({
        scrollTrigger: {
            trigger: ".story-section",
            start: "top 75%",
        }
    });

    storyRevealTL
        .fromTo(".story-content .section-title", 
            { y: 45, opacity: 0 },
            { y: 0, opacity: 1, duration: 1.2, ease: "expo.out" }
        )
        .fromTo(".story-content p", 
            { y: 25, opacity: 0 },
            { y: 0, opacity: 1, duration: 1, stagger: 0.2, ease: "power2.out" }, 
            "-=0.8"
        )
        .fromTo(".story-content .primary-btn", 
            { y: 20, opacity: 0, scale: 0.95 },
            { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: "back.out(1.5)" }, 
            "-=0.6"
        )
        .fromTo(".story-visual", 
            { x: 60, opacity: 0, scale: 0.9 },
            { x: 0, opacity: 1, scale: 1, duration: 1.5, ease: "expo.out" }, 
            "-=1.2"
        );

    // Parallax Depth scrubbing for Story Section (Subtle movement)
    gsap.to(".story-visual", {
        y: 40, // Move slightly as user scrolls past
        ease: "none",
        scrollTrigger: {
            trigger: ".story-section",
            start: "top bottom",
            end: "bottom top",
            scrub: 1.5
        }
    });

    gsap.to(".story-content", {
        y: -40,
        ease: "none",
        scrollTrigger: {
            trigger: ".story-section",
            start: "top bottom",
            end: "bottom top",
            scrub: 1.5
        }
    });

    // Story Visual Interactive Tilt and Light Reflection
    const storyVisual = document.querySelector('.story-visual');
    const lightReflection = document.querySelector('.light-reflection');
    
    if (storyVisual) {
        storyVisual.addEventListener('mousemove', (e) => {
            const { left, top, width, height } = storyVisual.getBoundingClientRect();
            const x = (e.clientX - left) / width;
            const y = (e.clientY - top) / height;
            
            const rotateY = (x - 0.5) * 15;
            const rotateX = (y - 0.5) * -15;
            
            gsap.to(storyVisual, {
                rotationY: rotateY,
                rotationX: rotateX,
                duration: 0.6,
                ease: "power2.out"
            });
            
            if (lightReflection) {
                gsap.to(lightReflection, {
                    background: `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(250, 237, 205, 0.2), transparent 60%)`,
                    duration: 0.1
                });
            }
        });
        
        storyVisual.addEventListener('mouseleave', () => {
            gsap.to(storyVisual, {
                rotationY: 0,
                rotationX: 0,
                duration: 1,
                ease: "elastic.out(1, 0.5)"
            });
        });
    }

    // Slow zoom-in on scroll for the image/video
    gsap.to(".story-img, .story-video", {
        scale: 1.1,
        ease: "none",
        scrollTrigger: {
            trigger: ".story-section",
            start: "top bottom",
            end: "bottom top",
            scrub: true
        }
    });

    // ── TESTIMONIALS SECTION REVEAL ──────────────────────────────────
    gsap.fromTo(".testimonials-section .section-title", 
        { y: 40, opacity: 0 },
        {
            scrollTrigger: { trigger: ".testimonials-section", start: "top 85%" },
            y: 0, opacity: 1, duration: 1.2, ease: "expo.out"
        }
    );

    gsap.fromTo(".testimonials-section .section-subtitle", 
        { y: 20, opacity: 0 },
        {
            scrollTrigger: { trigger: ".testimonials-section", start: "top 85%" },
            y: 0, opacity: 1, duration: 1, delay: 0.2, ease: "expo.out"
        }
    );

    gsap.fromTo(".testimonial-card", 
        { y: 50, opacity: 0, scale: 0.96 },
        {
            scrollTrigger: {
                trigger: ".testimonials-grid",
                start: "top 80%",
            },
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 1.1,
            stagger: 0.15,
            ease: "power3.out"
        }
    );

    // ── FOOTER REVEAL ────────────────────────────────────────────────
    gsap.fromTo(".footer-column", 
        { y: 35, opacity: 0 },
        {
            scrollTrigger: {
                trigger: ".footer",
                start: "top 90%",
            },
            y: 0,
            opacity: 1,
            duration: 1.2,
            stagger: 0.12,
            ease: "expo.out"
        }
    );

    gsap.fromTo(".footer-bottom", 
        { opacity: 0 },
        {
            scrollTrigger: {
                trigger: ".footer-bottom",
                start: "top 95%",
            },
            opacity: 1,
            duration: 1.5,
            delay: 0.5,
            ease: "power2.out"
        }
    );

    // (Menu category reveal now handled per-card above with individual ScrollTriggers)

    // 6. Category Filter (shows/hides full category blocks)
    const filterBtns = document.querySelectorAll('.filter-btn');
    const menuCategories = document.querySelectorAll('.menu-category');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filterValue = btn.getAttribute('data-filter');

            menuCategories.forEach(cat => {
                const cat_type = cat.getAttribute('data-category');
                if (filterValue === 'all' || filterValue === cat_type) {
                    gsap.to(cat, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.2)', clearProps: 'display' });
                    cat.style.display = '';
                } else {
                    gsap.to(cat, {
                        opacity: 0, scale: 0.95, duration: 0.3, ease: 'power2.in',
                        onComplete: () => { cat.style.display = 'none'; ScrollTrigger.refresh(); }
                    });
                }
            });
            setTimeout(() => ScrollTrigger.refresh(), 400);
        });
    });

    // Accordion toggle — global function (called inline from HTML)
    window.toggleCategory = (headerEl) => {
        const category = headerEl.closest('.menu-category');
        const isOpen = category.classList.contains('open');

        // Close all others first for single-open accordion feel
        document.querySelectorAll('.menu-category.open').forEach(c => {
            if (c !== category) c.classList.remove('open');
        });

        category.classList.toggle('open', !isOpen);
    };

    // ══════════════════════════════════════════════════════════════════
    // NEW FEATURES — Interactive Logic
    // ══════════════════════════════════════════════════════════════════

    // ── MAGNETIC BUTTONS ──────────────────────────────────────────────
    // Buttons subtly pull toward the mouse for a high-end tactile feel
    const magneticBtns = document.querySelectorAll('.primary-btn, .secondary-btn, .cta-btn, .filter-btn, .gold-btn');
    
    magneticBtns.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const { left, top, width, height } = btn.getBoundingClientRect();
            const x = e.clientX - (left + width / 2);
            const y = e.clientY - (top + height / 2);
            
            // Subtle pull (max 8px)
            gsap.to(btn, {
                x: x * 0.15,
                y: y * 0.15,
                duration: 0.4,
                ease: "power2.out"
            });
        });
        
        btn.addEventListener('mouseleave', () => {
            // Smoothly reset position
            gsap.to(btn, {
                x: 0,
                y: 0,
                duration: 0.6,
                ease: "elastic.out(1, 0.5)"
            });
        });
    });

    // ── RESERVATION MODAL ──────────────────────────────────────────
    const modal = document.getElementById('reservation-modal');
    const modalClose = document.getElementById('modal-close');
    const modalBackdrop = document.getElementById('modal-backdrop');
    const reserveForm = document.getElementById('reservation-form');
    const formSuccess = document.getElementById('form-success');

    function openModal() {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Staggered reveal for form elements
        gsap.fromTo('.modal-container > *', 
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, stagger: 0.08, ease: 'expo.out', delay: 0.2 }
        );
    }
    function closeModal() {
        gsap.to('.modal-container', { 
            y: 40, opacity: 0, scale: 0.95, duration: 0.4, ease: 'power2.in',
            onComplete: () => {
                modal.classList.remove('active');
                document.body.style.overflow = '';
                // Reset form state if needed
                setTimeout(() => {
                    reserveForm.style.display = 'flex';
                    formSuccess.style.display = 'none';
                    gsap.set('.modal-container', { clearProps: 'all' });
                }, 400);
            }
        });
    }

    // All reservation trigger buttons
    document.getElementById('nav-reserve-btn')?.addEventListener('click', openModal);
    document.getElementById('mobile-reserve-btn')?.addEventListener('click', () => {
        document.getElementById('mobile-menu').classList.remove('active');
        openModal();
    });
    document.getElementById('floating-cta')?.addEventListener('click', openModal);
    modalClose?.addEventListener('click', closeModal);
    modalBackdrop?.addEventListener('click', closeModal);

    // Form submission
    reserveForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const submitBtn = reserveForm.querySelector('.submit-btn');
        submitBtn.innerHTML = '<span class="loading-dots">...</span>';
        
        const formData = new FormData(reserveForm);
        fetch(reserveForm.action, {
            method: 'POST',
            body: formData,
            headers: { 'Accept': 'application/json' }
        }).then(res => {
            if (res.ok) {
                gsap.to(reserveForm, { opacity: 0, y: -20, duration: 0.4, onComplete: () => {
                    reserveForm.style.display = 'none';
                    formSuccess.style.display = 'block';
                    gsap.fromTo(formSuccess, 
                        { scale: 0.8, opacity: 0 },
                        { scale: 1, opacity: 1, duration: 1, ease: 'elastic.out(1, 0.75)' }
                    );
                }});
            }
        }).catch(() => {
            // Still show success for demo
            reserveForm.style.display = 'none';
            formSuccess.style.display = 'block';
            gsap.fromTo(formSuccess, 
                { scale: 0.8, opacity: 0 },
                { scale: 1, opacity: 1, duration: 1, ease: 'elastic.out(1, 0.75)' }
            );
        });
    });

    // ── MOBILE MENU ────────────────────────────────────────────────
    const mobileMenu = document.getElementById('mobile-menu');
    const hamburger = document.getElementById('hamburger-btn');
    const mobileCloseBtn = document.getElementById('mobile-close-btn');

    hamburger?.addEventListener('click', () => mobileMenu.classList.add('active'));
    mobileCloseBtn?.addEventListener('click', () => mobileMenu.classList.remove('active'));

    // Close mobile menu on link click
    document.querySelectorAll('.mobile-link').forEach(link => {
        link.addEventListener('click', () => mobileMenu.classList.remove('active'));
    });

    // ── STATS COUNTER ANIMATION ────────────────────────────────────
    const statNumbers = document.querySelectorAll('.stat-number');
    
    if (statNumbers.length) {
        ScrollTrigger.create({
            trigger: '.stats-section',
            start: 'top 80%',
            once: true,
            onEnter: () => {
                statNumbers.forEach(num => {
                    const target = parseFloat(num.getAttribute('data-target'));
                    const isDecimal = target % 1 !== 0;
                    gsap.to(num, {
                        textContent: target,
                        duration: 2,
                        ease: 'power2.out',
                        snap: { textContent: isDecimal ? 0.1 : 1 },
                        onUpdate: function() {
                            num.textContent = isDecimal
                                ? parseFloat(num.textContent).toFixed(1)
                                : Math.round(parseFloat(num.textContent));
                        }
                    });
                });
            }
        });
    }

    // ── FLOATING CTA — show after scrolling past hero ──────────────
    const floatingCta = document.getElementById('floating-cta');
    const scrollTopBtn = document.getElementById('scroll-top');
    const footer = document.querySelector('.footer');

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        const footerTop = footer?.getBoundingClientRect().top + scrollY - window.innerHeight;

        // Show floating CTA after hero
        if (floatingCta) {
            if (scrollY > 600 && scrollY < footerTop) {
                floatingCta.classList.add('visible');
            } else {
                floatingCta.classList.remove('visible');
            }
        }

        // Show scroll-to-top after 400px
        if (scrollTopBtn) {
            if (scrollY > 400) {
                scrollTopBtn.classList.add('visible');
            } else {
                scrollTopBtn.classList.remove('visible');
            }
        }
    });

    // Scroll to top with Lenis
    scrollTopBtn?.addEventListener('click', () => {
        lenis.scrollTo(0, { duration: 1.5 });
    });

    // ── SCROLL REVEALS — New Sections ──────────────────────────────
    // Promo banner
    gsap.fromTo('.promo-banner',
        { y: 20, opacity: 0 },
        { scrollTrigger: { trigger: '.promo-banner', start: 'top 90%' },
          y: 0, opacity: 1, duration: 1, ease: 'expo.out' }
    );

    // Stats
    gsap.fromTo('.stat-item',
        { y: 40, opacity: 0, scale: 0.95 },
        { scrollTrigger: { trigger: '.stats-section', start: 'top 85%' },
          y: 0, opacity: 1, scale: 1, duration: 1, stagger: 0.1, ease: 'power3.out' }
    );

    // Chef's Picks
    gsap.fromTo('.chefs-picks-section .section-title',
        { y: 40, opacity: 0 },
        { scrollTrigger: { trigger: '.chefs-picks-section', start: 'top 85%' },
          y: 0, opacity: 1, duration: 1.2, ease: 'expo.out' }
    );
    gsap.fromTo('.chefs-picks-section .section-subtitle',
        { y: 20, opacity: 0 },
        { scrollTrigger: { trigger: '.chefs-picks-section', start: 'top 85%' },
          y: 0, opacity: 1, duration: 1, delay: 0.2, ease: 'expo.out' }
    );
    gsap.fromTo('.pick-card',
        { y: 50, opacity: 0, scale: 0.95 },
        { scrollTrigger: { trigger: '.picks-grid', start: 'top 80%' },
          y: 0, opacity: 1, scale: 1, duration: 1.1, stagger: 0.15, ease: 'power3.out' }
    );

    // Gallery
    gsap.fromTo('.gallery-section .section-title',
        { y: 40, opacity: 0 },
        { scrollTrigger: { trigger: '.gallery-section', start: 'top 85%' },
          y: 0, opacity: 1, duration: 1.2, ease: 'expo.out' }
    );
    gsap.fromTo('.gallery-section .section-subtitle',
        { y: 20, opacity: 0 },
        { scrollTrigger: { trigger: '.gallery-section', start: 'top 85%' },
          y: 0, opacity: 1, duration: 1, delay: 0.2, ease: 'expo.out' }
    );
    gsap.fromTo('.gallery-item',
        { y: 40, opacity: 0 },
        { scrollTrigger: { trigger: '.gallery-grid', start: 'top 80%' },
          y: 0, opacity: 1, duration: 1, stagger: 0.1, ease: 'power3.out' }
    );

    // Contact
    gsap.fromTo('.contact-section .section-title',
        { y: 40, opacity: 0 },
        { scrollTrigger: { trigger: '.contact-section', start: 'top 85%' },
          y: 0, opacity: 1, duration: 1.2, ease: 'expo.out' }
    );
    gsap.fromTo('.contact-section .section-subtitle',
        { y: 20, opacity: 0 },
        { scrollTrigger: { trigger: '.contact-section', start: 'top 85%' },
          y: 0, opacity: 1, duration: 1, delay: 0.2, ease: 'expo.out' }
    );
    gsap.fromTo('.contact-info-block',
        { x: -40, opacity: 0 },
        { scrollTrigger: { trigger: '.contact-grid', start: 'top 80%' },
          x: 0, opacity: 1, duration: 1.2, ease: 'expo.out' }
    );
    gsap.fromTo('.contact-form',
        { x: 40, opacity: 0 },
        { scrollTrigger: { trigger: '.contact-grid', start: 'top 80%' },
          x: 0, opacity: 1, duration: 1.2, delay: 0.2, ease: 'expo.out' }
    );

    // Signature Section Reveals
    gsap.fromTo('.signature-label', 
        { y: 20, opacity: 0 },
        { scrollTrigger: { trigger: '.signature-section', start: 'top 80%' },
          y: 0, opacity: 1, duration: 1, ease: 'power2.out' }
    );
    gsap.fromTo('.signature-title', 
        { y: 40, opacity: 0 },
        { scrollTrigger: { trigger: '.signature-section', start: 'top 75%' },
          y: 0, opacity: 1, duration: 1.2, delay: 0.2, ease: 'expo.out' }
    );
    gsap.fromTo('.signature-description', 
        { y: 30, opacity: 0 },
        { scrollTrigger: { trigger: '.signature-section', start: 'top 75%' },
          y: 0, opacity: 1, duration: 1, delay: 0.4, ease: 'power3.out' }
    );
    gsap.fromTo('.signature-visual', 
        { scale: 0.95, opacity: 0 },
        { scrollTrigger: { trigger: '.signature-section', start: 'top 70%' },
          scale: 1, opacity: 1, duration: 1.5, delay: 0.3, ease: 'expo.out' }
    );

    // Testimonials Reveal
    gsap.fromTo('.experience-card',
        { y: 50, opacity: 0 },
        { scrollTrigger: { trigger: '.experience-grid', start: 'top 85%' },
          y: 0, opacity: 1, duration: 1.2, stagger: 0.2, ease: 'expo.out' }
    );

    // ── GLOBAL CINEMATIC PARALLAX ─────────────────────────────────
    // Subtle movement for background elements or images
    document.querySelectorAll('[data-parallax]').forEach(el => {
        const speed = el.getAttribute('data-parallax') || 0.1;
        gsap.to(el, {
            y: (i, target) => -ScrollTrigger.maxScroll(window) * speed,
            ease: 'none',
            scrollTrigger: {
                trigger: el,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true
            }
        });
    });

    // ── GLOBAL SECTION STAGGER REVEAL ──────────────────────────────
    // Catch-all for any content blocks not explicitly animated
    const revealItems = document.querySelectorAll('section:not(.hero) .glass, section:not(.hero) .section-header');
    revealItems.forEach(item => {
        if (gsap.getProperty(item, "opacity") === 0) { // Only if not already handled
            gsap.fromTo(item, 
                { y: 30, opacity: 0 },
                { 
                    scrollTrigger: {
                        trigger: item,
                        start: 'top 90%',
                    },
                    y: 0, 
                    opacity: 1, 
                    duration: 1.2, 
                    ease: 'expo.out' 
                }
            );
        }
    });

    // Link signature button to modal
    document.getElementById('signature-reserve-btn')?.addEventListener('click', openModal);

    // ── PREMIUM IMAGE TILT SYSTEM ──────────────────────────────────
    const tiltElements = document.querySelectorAll('.pick-card, .gallery-item, .signature-img-wrapper, .cat-thumb-wrapper');
    
    tiltElements.forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const { left, top, width, height } = el.getBoundingClientRect();
            const x = (e.clientX - left) / width - 0.5;
            const y = (e.clientY - top) / height - 0.5;
            
            // Apply slight 3D tilt
            gsap.to(el.querySelector('img'), {
                rotateY: x * 10,
                rotateX: -y * 10,
                scale: 1.05,
                duration: 0.6,
                ease: "power2.out"
            });
        });
        
        el.addEventListener('mouseleave', () => {
            gsap.to(el.querySelector('img'), {
                rotateY: 0,
                rotateX: 0,
                scale: 1,
                duration: 0.8,
                ease: "power3.out"
            });
        });
    });
});
