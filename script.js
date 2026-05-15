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

    // Global scroll velocity for particles
    let scrollVelocity = 0;
    lenis.on('scroll', (e) => {
        scrollVelocity = Math.abs(e.velocity);
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

    // 3. Three.js Rich Cafe-Themed Background
    const canvas = document.getElementById('bg-canvas');
    const scene = new THREE.Scene();
    
    // Add Fog for depth and cinematic feel
    scene.fog = new THREE.FogExp2(0x0a0807, 0.015);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 40;

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Lighting (Cinematic)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const warmLight = new THREE.PointLight(0xd4a373, 2, 100);
    warmLight.position.set(20, 20, 20);
    scene.add(warmLight);

    const coolLight = new THREE.PointLight(0xfaedcd, 1, 100);
    coolLight.position.set(-20, -20, 20);
    scene.add(coolLight);

    // Group for all floating objects
    const floatGroup = new THREE.Group();
    scene.add(floatGroup);

    // Abstract Food Shapes
    const geometries = [
        new THREE.TorusGeometry(1.5, 0.6, 16, 32), // Donut/Bagel shape
        new THREE.CylinderGeometry(1, 0.8, 2, 32), // Coffee cup shape
        new THREE.SphereGeometry(1, 32, 32), // Bubbles/Drops
        new THREE.IcosahedronGeometry(1.2, 0) // Modern abstract shape
    ];

    // Premium frosted glass material
    const material = new THREE.MeshPhysicalMaterial({
        color: 0xd4a373,
        metalness: 0.2,
        roughness: 0.2,
        transparent: true,
        opacity: 0.6,
        transmission: 0.8, // Glass-like effect
        thickness: 0.5,
    });

    const shapes = [];
    for (let i = 0; i < 45; i++) {
        const geo = geometries[Math.floor(Math.random() * geometries.length)];
        const mesh = new THREE.Mesh(geo, material);
        
        // Random positioning across a wide volume
        mesh.position.x = (Math.random() - 0.5) * 100;
        mesh.position.y = (Math.random() - 0.5) * 100;
        mesh.position.z = (Math.random() - 0.5) * 80 - 10;
        
        // Random rotation
        mesh.rotation.x = Math.random() * Math.PI;
        mesh.rotation.y = Math.random() * Math.PI;
        
        // Random scale
        const scale = Math.random() * 0.6 + 0.4;
        mesh.scale.set(scale, scale, scale);

        floatGroup.add(mesh);
        shapes.push({
            mesh: mesh,
            rotSpeedX: (Math.random() - 0.5) * 0.015,
            rotSpeedY: (Math.random() - 0.5) * 0.015,
            floatSpeed: Math.random() * 0.02 + 0.01
        });
    }

    // Glowing Bokeh Lights
    // Create soft circular texture programmatically
    const createBokehTexture = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0, 'rgba(250, 237, 205, 1)');
        gradient.addColorStop(0.2, 'rgba(212, 163, 115, 0.8)');
        gradient.addColorStop(0.5, 'rgba(212, 163, 115, 0.2)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 128, 128);
        return new THREE.CanvasTexture(canvas);
    };

    const bokehGeometry = new THREE.BufferGeometry();
    const bokehCount = 200;
    const bokehPos = new Float32Array(bokehCount * 3);

    for(let i = 0; i < bokehCount * 3; i++) {
        bokehPos[i] = (Math.random() - 0.5) * 120;
    }

    bokehGeometry.setAttribute('position', new THREE.BufferAttribute(bokehPos, 3));

    const bokehMaterial = new THREE.PointsMaterial({
        size: 4,
        map: createBokehTexture(),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0.8
    });

    const bokehParticles = new THREE.Points(bokehGeometry, bokehMaterial);
    floatGroup.add(bokehParticles);

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

    // Mouse interaction
    let targetX = 0;
    let targetY = 0;
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    document.addEventListener('mousemove', (event) => {
        targetX = (event.clientX - windowHalfX) * 0.001;
        targetY = (event.clientY - windowHalfY) * 0.001;
    });

    // Animation Loop
    const clock = new THREE.Clock();

    const tick = () => {
        const elapsedTime = clock.getElapsedTime();

        // Decay scroll velocity over time for smooth slowing down
        scrollVelocity *= 0.95;

        // Animate Shapes (subtle floating)
        shapes.forEach(shape => {
            shape.mesh.rotation.x += shape.rotSpeedX;
            shape.mesh.rotation.y += shape.rotSpeedY;
            shape.mesh.position.y += Math.sin(elapsedTime * shape.floatSpeed) * 0.01;
        });

        // Smooth camera movement for depth and parallax
        camera.position.x += (targetX * 10 - camera.position.x) * 0.02;
        camera.position.y += (-targetY * 10 - camera.position.y) * 0.02;
        camera.lookAt(scene.position);

        // Slowly rotate entire group
        floatGroup.rotation.y = elapsedTime * 0.03;

        // ── Realistic Falling Coffee Beans ─────────────────
        fallingBeans.forEach((bean, i) => {
            // Gravity: accelerate toward terminal velocity
            bean.velocity = Math.min(
                bean.velocity + bean.gravity + scrollVelocity * 0.003,
                bean.terminalVelocity + scrollVelocity * 0.06
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

    // ── CINEMATIC HERO ENTRANCE ──────────────────────────────────────
    // Set initial hidden states (no flash of content)
    gsap.set(".navbar",          { y: -80, opacity: 0 });
    gsap.set(".title-line",      { y: 80, opacity: 0, clipPath: "inset(100% 0% 0% 0%)" });
    gsap.set(".hero-subtitle",   { y: 30, opacity: 0 });
    gsap.set(".hero-actions",    { y: 25, opacity: 0 });
    gsap.set(".scroll-indicator",{ opacity: 0 });
    gsap.set(".hero-3d-assets",  { y: -60, opacity: 0, scale: 0.92 });
    gsap.set(".hero-bg-video",   { scale: 1.08, opacity: 0 });

    // Master timeline — cinematic sequenced entrance
    const heroTL = gsap.timeline({ delay: 0.2, defaults: { ease: "expo.out" } });

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

    // Features Section Reveal
    gsap.from(".feature-card", {
        scrollTrigger: {
            trigger: ".features-section",
            start: "top 75%",
        },
        y: 60,
        opacity: 0,
        duration: 1,
        stagger: 0.15,
        ease: "back.out(1.2)"
    });

    // Menu Cards Reveal
    gsap.from(".menu-card", {
        scrollTrigger: {
            trigger: ".menu-showcase",
            start: "top 70%",
        },
        y: 50,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: "power3.out"
    });

    // Story Section Reveal
    const storyTimeline = gsap.timeline({
        scrollTrigger: {
            trigger: ".story-section",
            start: "top 70%",
        }
    });

    storyTimeline
        .from(".story-content > *", {
            y: 50,
            opacity: 0,
            duration: 1.5,
            stagger: 0.2,
            ease: "power4.out"
        })
        .from(".story-visual", {
            y: -120, // Drop in from above
            opacity: 0,
            scale: 0.95,
            duration: 2.2,
            ease: "power3.out"
        }, "-=1"); // Stagger so it feels balanced

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

    // Testimonials Reveal
    gsap.from(".testimonial-card", {
        scrollTrigger: {
            trigger: ".testimonials-section",
            start: "top 75%",
        },
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: "power3.out"
    });

    // Footer Reveal
    gsap.from(".footer-column", {
        scrollTrigger: {
            trigger: ".footer",
            start: "top 85%",
        },
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.15,
        ease: "power3.out"
    });

    // 5. Menu Categories — Scroll Reveal
    gsap.from(".menu-category", {
        scrollTrigger: {
            trigger: ".menu-categories",
            start: "top 80%",
        },
        y: 40,
        opacity: 0,
        duration: 0.9,
        stagger: 0.15,
        ease: "power3.out"
    });

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
