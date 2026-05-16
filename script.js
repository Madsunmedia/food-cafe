document.addEventListener("DOMContentLoaded", () => {
    // 1. Initialize Lenis Smooth Scrolling — Cinematic Premium Config
    const lenis = new Lenis({
        duration: 1.6,                                          // Longer = more cinematic inertia
        easing: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),// Exponential ease-out for luxury decel
        lerp: 0.07,                                             // Low lerp = silky smooth catch-up
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        smoothTouch: false,                                     // Native touch on mobile
        touchMultiplier: 1.8,
        wheelMultiplier: 0.9,                                   // Slightly slower wheel = more control
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
    // Each bean gets its own geometry instance for unique shape variation
    const beanTexture = new THREE.TextureLoader().load('assets/coffee_bean_texture.png');
    const beanGroup = new THREE.Group();
    scene.add(beanGroup);
    const fallingBeans = [];
    const beanCount = 80; // More beans for richer effect

    // Warm cafe lighting for beans
    const beanLight = new THREE.PointLight(0xd4a373, 1.5, 200);
    beanLight.position.set(0, 30, 30);
    scene.add(beanLight);

    for (let i = 0; i < beanCount; i++) {
        // Unique squashed sphere per bean — varied proportions
        const rx = 0.8 + Math.random() * 0.5;
        const ry = 0.5 + Math.random() * 0.4;
        const rz = 0.3 + Math.random() * 0.3;
        const geo = new THREE.SphereGeometry(1, 14, 10);
        geo.scale(rx, ry, rz);

        // Depth layer: 0 = far background, 1 = close foreground
        const depth = Math.random(); // 0..1
        const zPos = -40 + depth * 80; // z from -40 (far) to +40 (close)

        // Depth-based size: closer beans appear larger
        const baseScale = 0.3 + depth * 1.0;

        // Depth-based material: closer = more opaque + richer colour
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

        // Stagger starting Y so they don't all enter at once
        bean.position.x = (Math.random() - 0.5) * 130;
        bean.position.y = 70 + Math.random() * 200;  // All above viewport, staggered
        bean.position.z = zPos;

        bean.rotation.set(
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2
        );
        bean.scale.setScalar(baseScale);

        beanGroup.add(bean);

        fallingBeans.push({
            mesh: bean,
            // Gravity: start slow, accelerate to terminal velocity
            velocity: 0.04 + Math.random() * 0.06,   // initial fall speed
            gravity: 0.0008 + Math.random() * 0.0006, // acceleration per frame
            terminalVelocity: 0.18 + Math.random() * 0.12,
            // Per-axis rotation — tumbling motion
            rotX: (Math.random() - 0.5) * 0.018,
            rotY: (Math.random() - 0.5) * 0.022,
            rotZ: (Math.random() - 0.5) * 0.015,
            // Gentle pendulum-style X sway
            swayAmplitude: 0.04 + Math.random() * 0.08,
            swayFrequency: 0.4 + Math.random() * 0.6,
            swayPhase: Math.random() * Math.PI * 2,
            originX: bean.position.x,
            depth,
            baseScale,
        });
    }

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
            // Base gravity + scroll boost
            const totalGravity = bean.gravity + scrollSpeed * 0.5;
            bean.velocity = Math.min(
                bean.velocity + totalGravity,
                bean.terminalVelocity + scrollSpeed
            );

            // Fall downward
            bean.mesh.position.y -= bean.velocity;

            // Pendulum sway on X axis — sinusoidal drift
            const swayOffset = Math.sin(elapsedTime * bean.swayFrequency + bean.swayPhase) * bean.swayAmplitude;
            bean.mesh.position.x = bean.originX + swayOffset * 18;

            // Tumbling rotation on all axes
            bean.mesh.rotation.x += bean.rotX;
            bean.mesh.rotation.y += bean.rotY;
            bean.mesh.rotation.z += bean.rotZ;

            // Depth-based parallax: closer beans shift more with mouse
            bean.mesh.position.x += targetX * 12 * bean.depth;

            // Subtle scale breath for 3D living feel
            const breathe = 1 + Math.sin(elapsedTime * 0.8 + i) * 0.015;
            bean.mesh.scale.setScalar(bean.baseScale * breathe);

            // Reset to top when bean exits bottom of scene
            if (bean.mesh.position.y < -70) {
                bean.mesh.position.y = 70 + Math.random() * 60; // Re-enter from top
                bean.mesh.position.x = (Math.random() - 0.5) * 130;
                bean.originX = bean.mesh.position.x;
                bean.velocity = 0.04 + Math.random() * 0.04; // Reset to slow entry
            }
        });

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
    gsap.set(".title-line",      { y: 80, opacity: 0, clipPath: "inset(100% 0% 0% 0%)" });
    gsap.set(".hero-subtitle",   { y: 30, opacity: 0 });
    gsap.set(".hero-actions",    { y: 25, opacity: 0 });
    gsap.set(".scroll-indicator",{ opacity: 0 });
    gsap.set(".hero-3d-assets",  { y: -60, opacity: 0, scale: 0.92 });
    gsap.set(".hero-bg-video",   { scale: 1.08, opacity: 0 });

    // This timeline handles the hero entrance and is triggered by the loader
    const heroTL = gsap.timeline({ 
        paused: true, 
        delay: 0.2, 
        defaults: { ease: "expo.out" } 
    });

    window.masterReveal = () => {
        heroTL.play();
    };

    heroTL
        // 1. Navbar glides in from top
        .to(".navbar", {
            y: 0, opacity: 1, duration: 1.1, ease: "power3.out"
        })
        // 2. Background video fades and subtly de-zooms into place
        .to(".hero-bg-video", {
            scale: 1, opacity: 1, duration: 2.2, ease: "power2.out"
        }, "-=0.8")
        // 3. Title lines clip-path reveal + slide up — staggered per word
        .to(".title-line", {
            y: 0,
            opacity: 1,
            clipPath: "inset(0% 0% 0% 0%)",
            duration: 1.3,
            stagger: { each: 0.18, ease: "power2.out" },
            ease: "expo.out"
        }, "-=1.6")
        // 4. Subtitle fades up softly
        .to(".hero-subtitle", {
            y: 0, opacity: 1, duration: 1.0, ease: "power3.out"
        }, "-=0.7")
        // 5. CTA buttons emerge with a gentle scale+fade
        .fromTo(".hero-actions .primary-btn, .hero-actions .secondary-btn",
            { y: 20, opacity: 0, scale: 0.96 },
            { y: 0, opacity: 1, scale: 1, duration: 0.9, stagger: 0.12, ease: "back.out(1.4)" },
            "-=0.6"
        )
        // 6. Coffee cup / 3D assets drop gracefully from above
        .to(".hero-3d-assets", {
            y: 0, opacity: 1, scale: 1, duration: 1.8, ease: "expo.out"
        }, "-=1.0")
        // 7. Scroll indicator fades in last, subtly
        .to(".scroll-indicator", {
            opacity: 0.6, duration: 1.2, ease: "power2.out"
        }, "-=0.6");

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
});

// Accordion toggle — global function (called inline from HTML)
function toggleCategory(headerEl) {
    const category = headerEl.closest('.menu-category');
    const isOpen = category.classList.contains('open');

    // Close all others first for single-open accordion feel
    document.querySelectorAll('.menu-category.open').forEach(c => {
        if (c !== category) c.classList.remove('open');
    });

    category.classList.toggle('open', !isOpen);
}
