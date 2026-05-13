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

    // 3. Three.js Background Particles (Soft embers/smoke)
    const canvas = document.getElementById('bg-canvas');
    const scene = new THREE.Scene();
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Create Particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 700;
    const posArray = new Float32Array(particlesCount * 3);

    for(let i = 0; i < particlesCount * 3; i++) {
        // Spread particles across the screen
        posArray[i] = (Math.random() - 0.5) * 100;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    // Particle material (warm amber glow)
    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.15,
        color: 0xd4a373,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // Mouse interaction for particles
    let mouseX = 0;
    let mouseY = 0;

    document.addEventListener('mousemove', (event) => {
        mouseX = event.clientX / window.innerWidth - 0.5;
        mouseY = event.clientY / window.innerHeight - 0.5;
    });

    // Three.js Animation Loop
    const clock = new THREE.Clock();

    const tick = () => {
        const elapsedTime = clock.getElapsedTime();

        // Slowly rotate the particle system
        particlesMesh.rotation.y = elapsedTime * 0.05;
        particlesMesh.rotation.x = elapsedTime * 0.02;

        // Subtle mouse interaction
        particlesMesh.position.x += (mouseX * 5 - particlesMesh.position.x) * 0.05;
        particlesMesh.position.y += (-mouseY * 5 - particlesMesh.position.y) * 0.05;

        // Render
        renderer.render(scene, camera);

        // Call tick again on the next frame
        window.requestAnimationFrame(tick);
    }

    tick();

    // Handle Window Resize
    window.addEventListener('resize', () => {
        // Update camera
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        // Update renderer
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
    gsap.from(".story-content > *", {
        scrollTrigger: {
            trigger: ".story-section",
            start: "top 75%",
        },
        y: 30,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: "power3.out"
    });

    gsap.from(".story-visual", {
        scrollTrigger: {
            trigger: ".story-section",
            start: "top 75%",
        },
        x: 50,
        opacity: 0,
        duration: 1.2,
        ease: "power3.out"
    });
});
