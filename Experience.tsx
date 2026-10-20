import {useCallback, useEffect, useRef, useState} from 'react';
import {Link} from 'react-router';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

export interface ExperienceProduct {
  id: string;
  title: string;
  handle: string;
  price: string;
}

type Phase = 'gate' | 'loading' | 'ready';

const ASSET = 'https://assets.codepen.io/7558';
// Tip: download these into /public/audio and swap the URLs to self-host.
const SFX = {
  click: `${ASSET}/preloader-2s-001.mp3`,
  preloader: `${ASSET}/preloader-5s-001.mp3`,
  scroll: `${ASSET}/glitch-fx-001.mp3`,
  hover: `${ASSET}/preloader-2s-001.mp3`,
  music: `${ASSET}/lxstnght-night-angel.mp3`,
};

const AWARENESS: [number, string, string, string][] = [
  [0.1, 'SILENCE', 'VOID', 'DORMANT'],
  [0.25, 'STIRRING', 'EMERGING', 'AWAKENING'],
  [0.5, 'FLOWING', 'EXPANDING', 'BUILDING'],
  [0.75, 'ASCENDING', 'DISSOLVING', 'RADIATING'],
  [0.9, 'TRANSCENDING', 'INFINITE', 'OVERFLOWING'],
  [Infinity, 'UNITY', 'ETERNAL', 'PURE'],
];

const NAV = [
  {label: 'CREATIVE JOURNEY', to: '/', active: true},
  {label: 'ABOUT', to: '/pages/about'},
  {label: 'SOUND', to: '/collections/all'},
];

export function Experience({products}: {products: ExperienceProduct[]}) {
  const [phase, setPhase] = useState<Phase>('gate');
  const [counter, setCounter] = useState(0);
  const [preloaderGone, setPreloaderGone] = useState(false);

  const clickRef = useRef<HTMLAudioElement>(null);
  const preloaderRef = useRef<HTMLAudioElement>(null);
  const scroll1 = useRef<HTMLAudioElement>(null);
  const scroll2 = useRef<HTMLAudioElement>(null);
  const scroll3 = useRef<HTMLAudioElement>(null);
  const hoverRef = useRef<HTMLAudioElement>(null);
  const musicRef = useRef<HTMLAudioElement>(null);

  const bgRef = useRef<HTMLDivElement>(null);
  const line1 = useRef<SVGTextElement>(null);
  const line2 = useRef<SVGTextElement>(null);
  const line3 = useRef<SVGTextElement>(null);
  const line4 = useRef<SVGTextElement>(null);

  // body scoping class (CSS is scoped to body.experience-body)
  useEffect(() => {
    document.body.classList.add('experience-body');
    return () => {
      document.body.classList.remove('experience-body', 'loading-active');
    };
  }, []);

  // START click: must play audio inside the user gesture
  const handleStart = useCallback(() => {
    document.body.classList.add('loading-active');
    clickRef.current?.play().catch(() => {});
    preloaderRef.current?.play().catch(() => {});
    setTimeout(() => {
      const m = musicRef.current;
      if (m) {
        m.volume = 0.5;
        m.play().catch(() => {});
      }
    }, 500);
    setPhase('loading');
  }, []);

  // preloader counter 0 -> 100
  useEffect(() => {
    if (phase !== 'loading') return;
    let count = 0;
    let done: ReturnType<typeof setTimeout> | undefined;
    const timer = setInterval(() => {
      count++;
      setCounter(count);
      if (count >= 100) {
        clearInterval(timer);
        done = setTimeout(() => {
          const p = preloaderRef.current;
          if (p) {
            p.pause();
            p.currentTime = 0;
          }
          document.body.classList.remove('loading-active');
          setPhase('ready');
        }, 500);
      }
    }, 50);
    return () => {
      clearInterval(timer);
      if (done) clearTimeout(done);
    };
  }, [phase]);

  // scroll-triggered glitch sounds per section
  useEffect(() => {
    if (phase !== 'ready') return;
    const sounds = [scroll1.current, scroll2.current, scroll3.current];
    let current = 1;
    let timeout: ReturnType<typeof setTimeout>;

    const getSection = () => {
      const h = window.innerHeight * 2;
      return window.scrollY < h ? 1 : window.scrollY < h * 2 ? 2 : 3;
    };
    const stopAll = () =>
      sounds.forEach((s) => {
        if (s && !s.paused) {
          s.pause();
          s.currentTime = 0;
        }
      });

    const onScroll = () => {
      const next = getSection();
      if (next !== current) {
        stopAll();
        current = next;
      }
      const s = sounds[current - 1];
      if (s && s.paused) {
        s.currentTime = 0;
        s.play().catch(() => {});
      }
      clearTimeout(timeout);
      timeout = setTimeout(stopAll, 150);
    };

    window.addEventListener('scroll', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      clearTimeout(timeout);
      stopAll();
    };
  }, [phase]);

  // gsap + lenis + scroll-driven text
  useEffect(() => {
    if (phase !== 'ready') return;
    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      wheelMultiplier: 1,
      syncTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const ctx = gsap.context(() => {
      gsap.to('.gradient-reveal', {
        y: '-500vh',
        duration: 2,
        ease: 'power2.inOut',
        delay: 0.25,
      });
      gsap.to('.preloader', {
        y: -50,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.inOut',
        delay: 1.0,
        onComplete: () => setPreloaderGone(true),
      });
      gsap.utils.toArray<HTMLElement>('.section').forEach((section) => {
        gsap.to(section, {
          backgroundPositionY: '50%',
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1,
          },
        });
      });
    });

    let frame = 0;
    const update = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      const progress = Math.min(scrollY / maxScroll, 1);

      const footer = document.querySelector<HTMLElement>('.site-footer');
      const footerStart = (footer?.offsetTop ?? 0) - window.innerHeight;
      const footerProgress = Math.max(
        0,
        (scrollY - footerStart) / (window.innerHeight * 0.5),
      );
      const textOpacity = Math.max(0, 1 - footerProgress * 2);
      bgRef.current
        ?.querySelectorAll<SVGTextElement>('.geometric-text')
        .forEach((t) => (t.style.opacity = String(textOpacity)));

      const freq1 = (432 + progress * 108).toFixed(1);
      const freq2 = (528 - progress * 156).toFixed(1);
      const energy = (progress * 99.9).toFixed(1);
      const presence = ((1 - progress) * 100).toFixed(1);

      const row = AWARENESS.find(([max]) => progress <= max)!;
      const intensity = Math.max(0, 1 - progress);
      const presenceWord =
        intensity > 0.8
          ? 'SOLID'
          : intensity > 0.6
            ? 'SOFTENING'
            : intensity > 0.4
              ? 'TRANSLUCENT'
              : intensity > 0.2
                ? 'ETHEREAL'
                : 'VOID';

      const gridOpacity = Math.max(0, 0.3 * (1 - progress * 1.5));
      bgRef.current
        ?.querySelectorAll('.grid-line')
        .forEach((l) => l.setAttribute('stroke-opacity', String(gridOpacity)));

      if (line1.current)
        line1.current.textContent = `[${freq1}] AWARENESS: ${row[1]}`;
      if (line2.current) line2.current.textContent = `.${freq2} STATE: ${row[2]}`;
      if (line3.current)
        line3.current.textContent = `{${energy}} ENERGY: ${row[3]}`;
      if (line4.current)
        line4.current.textContent = `.${presence} PRESENCE: ${presenceWord}`;
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll);
    update();

    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
      ctx.revert();
      ScrollTrigger.getAll().forEach((t) => t.kill());
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, [phase]);

  const onNavEnter = (e: React.MouseEvent<HTMLLIElement>) => {
    const square = e.currentTarget.querySelector('.nav-hover-square');
    gsap.to(square, {scaleX: 1, duration: 0.3, ease: 'power2.out'});
    const h = hoverRef.current;
    if (h) {
      h.currentTime = 0;
      h.volume = 0.3;
      h.play().catch(() => {});
    }
  };
  const onNavLeave = (e: React.MouseEvent<HTMLLIElement>) => {
    const square = e.currentTarget.querySelector('.nav-hover-square');
    gsap.to(square, {scaleX: 0, duration: 0.2, ease: 'power2.in'});
  };

  const third = Math.ceil(products.length / 3) || 1;
  const chunks = [0, 1, 2].map((i) =>
    products.slice(i * third, (i + 1) * third),
  );

  return (
    <>
      <header className="site-header">
        <div className="header-container">
          <div className="logo-container">
            <div className="logo-circles">
              <div className="circle circle-1" />
              <div className="circle circle-2" />
            </div>
          </div>

          <nav className="main-nav">
            <ul>
              {NAV.map((n) => (
                <li key={n.label} onMouseEnter={onNavEnter} onMouseLeave={onNavLeave}>
                  <Link to={n.to} className={n.active ? 'active' : undefined}>
                    {n.label}
                  </Link>
                  <div className="nav-hover-square" />
                </li>
              ))}
            </ul>
          </nav>

          <div className="contact-link">
            <a href="https://x.com/filipz">+CONNECT</a>
          </div>
        </div>
      </header>

      <div className="gradient-reveal" />

      {phase === 'gate' && (
        <div className="audio-enable">
          <p>
            ENTER EXPERIENCE
            <br />
            WITH AUDIO
          </p>
          <button className="enable-button" id="enableBtn" onClick={handleStart}>
            START
          </button>
        </div>
      )}

      {phase !== 'gate' && !preloaderGone && (
        <div className="preloader" id="preloader" style={{display: 'flex'}}>
          <span id="counter">[{String(counter).padStart(3, '0')}]</span>
        </div>
      )}

      <div className="geometric-background" ref={bgRef}>
        <svg className="geometric-svg" viewBox="0 0 1920 1080">
          <g id="grid-lines">
            {phase === 'ready' &&
              Array.from({length: 41}, (_, i) => (
                <g key={i}>
                  <line className="grid-line" x1={i * 48} y1={0} x2={i * 48} y2={1080} />
                  {i <= 22 && (
                    <line className="grid-line" x1={0} y1={i * 48} x2={1920} y2={i * 48} />
                  )}
                </g>
              ))}
          </g>
          <g id="circles-outline" />
          <g id="circles-filled">
            <clipPath id="right-half">
              <rect x="960" y="0" width="960" height="1080" />
            </clipPath>
            <g clipPath="url(#right-half)" />
          </g>

          <text className="geometric-text" x="100" y="100">THE CREATIVE</text>
          <text className="geometric-text" x="100" y="115">PROCESS</text>
          <text className="geometric-text" x="1720" y="100">THE ESSENCE</text>
          <text className="geometric-text" x="1720" y="115">OF SOUND</text>

          <text className="geometric-text" x="100" y="980" ref={line1}>AWARENESS: SILENCE</text>
          <text className="geometric-text" x="100" y="995" ref={line2}>STATE: VOID</text>
          <text className="geometric-text" x="100" y="1010" ref={line3}>ENERGY: DORMANT</text>
          <text className="geometric-text" x="100" y="1025" ref={line4}>PRESENCE: SOLID</text>

          <text className="geometric-text" x="1620" y="980">BETWEEN THE</text>
          <text className="geometric-text" x="1620" y="995">HEARTBEATS</text>
        </svg>
      </div>

      <audio ref={clickRef} src={SFX.click} preload="auto" />
      <audio ref={preloaderRef} src={SFX.preloader} preload="auto" />
      <audio ref={scroll1} src={SFX.scroll} loop preload="auto" />
      <audio ref={scroll2} src={SFX.scroll} loop preload="auto" />
      <audio ref={scroll3} src={SFX.scroll} loop preload="auto" />
      <audio ref={hoverRef} src={SFX.hover} preload="auto" />
      <audio ref={musicRef} src={SFX.music} loop preload="auto" />

      <div className="center-circle">
        <div className="circle-container">
          <div className="glowing-circle" id="glowCircle" />
        </div>
      </div>

      {chunks.map((items, i) => (
        <section key={i} className={`section section-${i + 1}`}>
          <div className="section-content">
            <div className="product-list">
              {items.map((p) => (
                <Link key={p.id} to={`/products/${p.handle}`}>
                  {p.title}
                  <span>{p.price}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ))}

      <footer className="site-footer">
        <div className="footer-content-section">
          <div className="footer-content">
            <div className="footer-left">
              <p>THE DARKNESS</p>
              <p>IS WHERE</p>
              <p>LIGHT IS BORN</p>
              <p>EMPTINESS</p>
              <p>CREATES SPACE</p>
              <p>FOR HEALING</p>
            </div>
            <div className="footer-right">
              <p>CREATIVITY FLOWS THROUGH</p>
              <p>INFINITE PATHWAYS</p>
              <p>CONSCIOUSNESS EXPANDS</p>
              <p>INTO BOUNDLESS REALMS</p>
              <p>OF LIGHT AND POSSIBILITY</p>
              <p>WHERE HEALING BECOMES ART</p>
            </div>
          </div>
          <div className="footer-credits">
            <p>
              Sound Design &amp; Music by{' '}
              <a
                href="https://open.spotify.com/artist/6YXgRMajnjib8j6Cxzcryp?si=iiLnt59BRp6QgKGizkG5Zg"
                target="_blank"
                rel="noreferrer"
              >
                @LXSTNGHT
              </a>
            </p>
          </div>
        </div>
        <div className="footer-svg-section">
          <img className="footer-svg" src={`${ASSET}/arrival-text.svg`} alt="" />
        </div>
      </footer>
    </>
  );
}
