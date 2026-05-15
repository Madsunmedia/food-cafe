document.addEventListener("DOMContentLoaded", () => {
    // 1. Initialize Lenis Smooth Scrolling
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

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

    // --- Falling Coffee Beans Layer ---
    const beanTexture = new THREE.TextureLoader().load('assets/coffee_bean_texture.png');
    const beanGeometry = new THREE.SphereGeometry(1, 16, 16);
    beanGeometry.scale(1, 0.7, 0.5); // Squashed to look like a bean
    
    const beanMaterial = new THREE.MeshStandardMaterial({
        map: beanTexture,
        roughness: 0.4,
        metalness: 0.1,
        transparent: true,
        opacity: 0.9,
    });

    const fallingBeans = [];
    const beanCount = 60;
    const beanGroup = new THREE.Group();
    scene.add(beanGroup);

    for (let i = 0; i < beanCount; i++) {
        const bean = new THREE.Mesh(beanGeometry, beanMaterial);
        
        // Initial random positions
        bean.position.x = (Math.random() - 0.5) * 120;
        bean.position.y = Math.random() * 120 - 60; // Spread throughout the height
        bean.position.z = (Math.random() - 0.5) * 60; // Foreground and background
        
        // Random rotation
        bean.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        
        // Random scale
        const scale = Math.random() * 0.8 + 0.4;
        bean.scale.set(scale, scale, scale);

        beanGroup.add(bean);
        
        fallingBeans.push({
            mesh: bean,
            speed: Math.random() * 0.08 + 0.04,
            rotSpeedX: (Math.random() - 0.5) * 0.02,
            rotSpeedY: (Math.random() - 0.5) * 0.02,
            rotSpeedZ: (Math.random() - 0.5) * 0.02,
            initialX: bean.position.x
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

        // Animate Falling Coffee Beans
        fallingBeans.forEach(bean => {
            bean.mesh.position.y -= bean.speed;
            bean.mesh.rotation.x += bean.rotSpeedX;
            bean.mesh.rotation.y += bean.rotSpeedY;
            bean.mesh.rotation.z += bean.rotSpeedZ;
            
            // Subtle sway based on mouse
            bean.mesh.position.x = bean.initialX + (targetX * 20);

            // Reset bean to top when it falls below view
            if (bean.mesh.position.y < -60) {
                bean.mesh.position.y = 60;
                bean.mesh.position.x = (Math.random() - 0.5) * 120;
                bean.initialX = bean.mesh.position.x;
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

    // Hero Animations on Load
    const tl = gsap.timeline();
    
    tl.fromTo(".navbar", { y: -50, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: "power3.out" })
      .fromTo(".title-line", 
        { y: 100, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 1.2, stagger: 0.2, ease: "power4.out" },
        "-=0.5"
      )
      .fromTo(".hero-subtitle", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power2.out" }, "-=0.8")
      .fromTo(".hero-actions", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power2.out" }, "-=0.6")
      .fromTo(".floating-asset", { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 1.2, stagger: 0.2, ease: "back.out(1.5)" }, "-=0.8")
      .fromTo(".scroll-indicator", { opacity: 0 }, { opacity: 0.7, duration: 1 }, "-=0.5");

    // Parallax effect for Hero Elements
    gsap.to(".hero-ambient-glow", {
        yPercent: 30,
        ease: "none",
        scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "bottom top",
            scrub: true
        }
    });

    gsap.to(".hero-3d-assets", {
        yPercent: 15,
        ease: "none",
        scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "bottom top",
            scrub: true
        }
    });

    // Section Header Parallax
    gsap.utils.toArray(".section-header").forEach(header => {
        gsap.to(header, {
            y: 50,
            ease: "none",
            scrollTrigger: {
                trigger: header.parentElement,
                start: "top bottom",
                end: "bottom top",
                scrub: true
            }
        });
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

    // 5. Menu Filtering Logic
    const filterBtns = document.querySelectorAll('.filter-btn');
    const menuCards = document.querySelectorAll('.menu-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');

            const filterValue = btn.getAttribute('data-filter');

            let visibleCards = [];
            
            // Filter cards with GSAP animation for smooth transitions
            menuCards.forEach(card => {
                const category = card.getAttribute('data-category');
                
                if (filterValue === 'all' || filterValue === category) {
                    if (card.classList.contains('hidden')) {
                        card.classList.remove('hidden');
                        gsap.fromTo(card, 
                            { opacity: 0, scale: 0.8 }, 
                            { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.5)" }
                        );
                    }
                } else {
                    if (!card.classList.contains('hidden')) {
                        gsap.to(card, {
                            opacity: 0, 
                            scale: 0.8, 
                            duration: 0.3, 
                            ease: "power2.in",
                            onComplete: () => {
                                card.classList.add('hidden');
                                ScrollTrigger.refresh();
                            }
                        });
                    }
                }
            });
            
            // Refresh ScrollTrigger after adding elements
            setTimeout(() => {
                ScrollTrigger.refresh();
            }, 500);
        });
    });
});
