"use client";

import React, {
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useReducedMotion } from 'framer-motion';
import { gsap } from 'gsap';

export interface StaggeredMenuItem {
  label: string;
  ariaLabel: string;
  link: string;
}
export interface StaggeredMenuSocialItem {
  label: string;
  link: string;
}
export interface StaggeredMenuProps {
  position?: 'left' | 'right';
  colors?: string[];
  items?: StaggeredMenuItem[];
  socialItems?: StaggeredMenuSocialItem[];
  displaySocials?: boolean;
  displayItemNumbering?: boolean;
  className?: string;
  logoUrl?: string;
  logoText?: string;
  logoHref?: string;
  headerActions?: ReactNode;
  panelVisual?: ReactNode;
  panelFooter?: ReactNode;
  closeSignal?: string | number;
  menuButtonColor?: string;
  openMenuButtonColor?: string;
  accentColor?: string;
  isFixed: boolean;
  changeMenuColorOnOpen?: boolean;
  closeOnClickAway?: boolean;
  onMenuOpen?: () => void;
  onMenuClose?: () => void;
}

type StaggeredMenuStyles = React.CSSProperties & {
  '--sm-accent'?: string;
};

export const StaggeredMenu: React.FC<StaggeredMenuProps> = ({
  position = 'right',
  colors = ['var(--brass)', 'var(--primary)'],
  items = [],
  socialItems = [],
  displaySocials = true,
  displayItemNumbering = true,
  className,
  logoUrl,
  logoText = 'Atelier',
  logoHref = '/',
  headerActions,
  panelVisual,
  panelFooter,
  closeSignal,
  menuButtonColor = 'var(--foreground)',
  openMenuButtonColor = 'var(--foreground)',
  changeMenuColorOnOpen = true,
  accentColor = 'var(--brass)',
  isFixed = false,
  closeOnClickAway = true,
  onMenuOpen,
  onMenuClose
}: StaggeredMenuProps) => {
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const openRef = useRef(false);
  const closeSignalRef = useRef(closeSignal);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const preLayersRef = useRef<HTMLDivElement | null>(null);
  const preLayerElsRef = useRef<HTMLElement[]>([]);

  const topLineRef = useRef<HTMLSpanElement | null>(null);
  const middleLineRef = useRef<HTMLSpanElement | null>(null);
  const bottomLineRef = useRef<HTMLSpanElement | null>(null);

  const openTlRef = useRef<gsap.core.Timeline | null>(null);
  const closeTweenRef = useRef<gsap.core.Tween | null>(null);
  const spinTweenRef = useRef<gsap.core.Timeline | null>(null);
  const colorTweenRef = useRef<gsap.core.Tween | null>(null);

  const toggleBtnRef = useRef<HTMLButtonElement | null>(null);
  const busyRef = useRef(false);

  const itemEntranceTweenRef = useRef<gsap.core.Tween | null>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const panel = panelRef.current;
      const preContainer = preLayersRef.current;

      const topLine = topLineRef.current;
      const middleLine = middleLineRef.current;
      const bottomLine = bottomLineRef.current;

      if (!panel || !topLine || !middleLine || !bottomLine) return;

      let preLayers: HTMLElement[] = [];
      if (preContainer) {
        preLayers = Array.from(preContainer.querySelectorAll('.sm-prelayer')) as HTMLElement[];
      }
      preLayerElsRef.current = preLayers;

      const offscreen = position === 'left' ? -100 : 100;
      gsap.set([panel, ...preLayers], { xPercent: offscreen, opacity: 1 });
      if (preContainer) {
        gsap.set(preContainer, { xPercent: 0, opacity: 1 });
      }

      gsap.set([topLine, middleLine, bottomLine], {
        transformOrigin: '50% 50%',
      });
      gsap.set(topLine, { y: 0, rotate: 0 });
      gsap.set(middleLine, { scaleX: 1, opacity: 1 });
      gsap.set(bottomLine, { y: 0, rotate: 0 });

      if (toggleBtnRef.current) gsap.set(toggleBtnRef.current, { color: menuButtonColor });
    });
    return () => ctx.revert();
  }, [menuButtonColor, position]);

  const buildOpenTimeline = useCallback(() => {
    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel) return null;

    openTlRef.current?.kill();
    if (closeTweenRef.current) {
      closeTweenRef.current.kill();
      closeTweenRef.current = null;
    }
    itemEntranceTweenRef.current?.kill();

    const itemEls = Array.from(panel.querySelectorAll('.sm-panel-itemLabel')) as HTMLElement[];
    const numberEls = Array.from(
      panel.querySelectorAll('.sm-panel-list[data-numbering] .sm-panel-item')
    ) as HTMLElement[];
    const socialTitle = panel.querySelector('.sm-socials-title') as HTMLElement | null;
    const socialLinks = Array.from(panel.querySelectorAll('.sm-socials-link')) as HTMLElement[];

    const offscreen = position === 'left' ? -100 : 100;
    const layerStates = layers.map(el => ({ el, start: offscreen }));
    const panelStart = offscreen;

    if (itemEls.length) gsap.set(itemEls, { yPercent: 140, rotate: 10 });
    if (numberEls.length) gsap.set(numberEls, { '--sm-num-opacity': 0 });
    if (socialTitle) gsap.set(socialTitle, { opacity: 0 });
    if (socialLinks.length) gsap.set(socialLinks, { y: 25, opacity: 0 });

    const tl = gsap.timeline({ paused: true });

    layerStates.forEach((ls, i) => {
      tl.fromTo(ls.el, { xPercent: ls.start }, { xPercent: 0, duration: 0.5, ease: 'power4.out' }, i * 0.07);
    });

    const lastTime = layerStates.length ? (layerStates.length - 1) * 0.07 : 0;
    const panelInsertTime = lastTime + (layerStates.length ? 0.08 : 0);
    const panelDuration = 0.65;

    tl.fromTo(
      panel,
      { xPercent: panelStart },
      { xPercent: 0, duration: panelDuration, ease: 'power4.out' },
      panelInsertTime
    );

    if (itemEls.length) {
      const itemsStartRatio = 0.15;
      const itemsStart = panelInsertTime + panelDuration * itemsStartRatio;

      tl.to(
        itemEls,
        { yPercent: 0, rotate: 0, duration: 1, ease: 'power4.out', stagger: { each: 0.1, from: 'start' } },
        itemsStart
      );

      if (numberEls.length) {
        tl.to(
          numberEls,
          { duration: 0.6, ease: 'power2.out', '--sm-num-opacity': 1, stagger: { each: 0.08, from: 'start' } },
          itemsStart + 0.1
        );
      }
    }

    if (socialTitle || socialLinks.length) {
      const socialsStart = panelInsertTime + panelDuration * 0.4;

      if (socialTitle) tl.to(socialTitle, { opacity: 1, duration: 0.5, ease: 'power2.out' }, socialsStart);
      if (socialLinks.length) {
        tl.to(
          socialLinks,
          {
            y: 0,
            opacity: 1,
            duration: 0.55,
            ease: 'power3.out',
            stagger: { each: 0.08, from: 'start' },
            onComplete: () => {
              gsap.set(socialLinks, { clearProps: 'opacity' });
            }
          },
          socialsStart + 0.04
        );
      }
    }

    openTlRef.current = tl;
    return tl;
  }, [position]);

  const playOpen = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;
    if (reduceMotion) {
      const panel = panelRef.current;
      if (panel) {
        gsap.set([panel, ...preLayerElsRef.current], { xPercent: 0 });
        gsap.set(panel.querySelectorAll('.sm-panel-itemLabel'), {
          yPercent: 0,
          rotate: 0,
        });
        gsap.set(
          panel.querySelectorAll(
            '.sm-panel-item, .sm-socials-title, .sm-socials-link',
          ),
          { opacity: 1, y: 0 },
        );
      }
      busyRef.current = false;
      return;
    }
    const tl = buildOpenTimeline();
    if (tl) {
      tl.eventCallback('onComplete', () => {
        busyRef.current = false;
      });
      tl.play(0);
    } else {
      busyRef.current = false;
    }
  }, [buildOpenTimeline, reduceMotion]);

  const playClose = useCallback(() => {
    openTlRef.current?.kill();
    openTlRef.current = null;
    itemEntranceTweenRef.current?.kill();

    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel) return;

    const all: HTMLElement[] = [...layers, panel];
    closeTweenRef.current?.kill();

    const offscreen = position === 'left' ? -100 : 100;

    if (reduceMotion) {
      gsap.set(all, { xPercent: offscreen });
      busyRef.current = false;
      return;
    }

    closeTweenRef.current = gsap.to(all, {
      xPercent: offscreen,
      duration: 0.32,
      ease: 'power3.in',
      overwrite: 'auto',
      onComplete: () => {
        const itemEls = Array.from(panel.querySelectorAll('.sm-panel-itemLabel')) as HTMLElement[];
        if (itemEls.length) gsap.set(itemEls, { yPercent: 140, rotate: 10 });

        const numberEls = Array.from(
          panel.querySelectorAll('.sm-panel-list[data-numbering] .sm-panel-item')
        ) as HTMLElement[];
        if (numberEls.length) gsap.set(numberEls, { '--sm-num-opacity': 0 });

        const socialTitle = panel.querySelector('.sm-socials-title') as HTMLElement | null;
        const socialLinks = Array.from(panel.querySelectorAll('.sm-socials-link')) as HTMLElement[];
        if (socialTitle) gsap.set(socialTitle, { opacity: 0 });
        if (socialLinks.length) gsap.set(socialLinks, { y: 25, opacity: 0 });

        busyRef.current = false;
      }
    });
  }, [position, reduceMotion]);

  const animateIcon = useCallback((opening: boolean) => {
    const topLine = topLineRef.current;
    const middleLine = middleLineRef.current;
    const bottomLine = bottomLineRef.current;
    if (!topLine || !middleLine || !bottomLine) return;

    spinTweenRef.current?.kill();

    if (reduceMotion) {
      gsap.set(topLine, { y: opening ? 8 : 0, rotate: opening ? 45 : 0 });
      gsap.set(middleLine, { scaleX: opening ? 0 : 1, opacity: opening ? 0 : 1 });
      gsap.set(bottomLine, { y: opening ? -8 : 0, rotate: opening ? -45 : 0 });
      return;
    }

    spinTweenRef.current = gsap
      .timeline({
        defaults: {
          duration: opening ? 0.45 : 0.35,
          ease: opening ? 'power4.out' : 'power3.inOut',
        },
      })
      .to(topLine, { y: opening ? 8 : 0, rotate: opening ? 45 : 0 }, 0)
      .to(
        middleLine,
        { scaleX: opening ? 0 : 1, opacity: opening ? 0 : 1 },
        0,
      )
      .to(
        bottomLine,
        { y: opening ? -8 : 0, rotate: opening ? -45 : 0 },
        0,
      );
  }, [reduceMotion]);

  const animateColor = useCallback(
    (opening: boolean) => {
      const btn = toggleBtnRef.current;
      if (!btn) return;
      colorTweenRef.current?.kill();
      if (reduceMotion) {
        gsap.set(btn, {
          color:
            opening && changeMenuColorOnOpen
              ? openMenuButtonColor
              : menuButtonColor,
        });
        return;
      }
      if (changeMenuColorOnOpen) {
        const targetColor = opening ? openMenuButtonColor : menuButtonColor;
        colorTweenRef.current = gsap.to(btn, { color: targetColor, delay: 0.18, duration: 0.3, ease: 'power2.out' });
      } else {
        gsap.set(btn, { color: menuButtonColor });
      }
    },
    [
      openMenuButtonColor,
      menuButtonColor,
      changeMenuColorOnOpen,
      reduceMotion,
    ]
  );

  useEffect(() => {
    if (toggleBtnRef.current) {
      if (changeMenuColorOnOpen) {
        const targetColor = openRef.current ? openMenuButtonColor : menuButtonColor;
        gsap.set(toggleBtnRef.current, { color: targetColor });
      } else {
        gsap.set(toggleBtnRef.current, { color: menuButtonColor });
      }
    }
  }, [changeMenuColorOnOpen, menuButtonColor, openMenuButtonColor]);

  const toggleMenu = useCallback(() => {
    const target = !openRef.current;
    openRef.current = target;
    setOpen(target);

    if (target) {
      onMenuOpen?.();
      playOpen();
    } else {
      onMenuClose?.();
      playClose();
    }

    animateIcon(target);
    animateColor(target);
  }, [playOpen, playClose, animateIcon, animateColor, onMenuOpen, onMenuClose]);

  const closeMenu = useCallback(() => {
    if (openRef.current) {
      openRef.current = false;
      setOpen(false);
      onMenuClose?.();
      playClose();
      animateIcon(false);
      animateColor(false);
    }
  }, [playClose, animateIcon, animateColor, onMenuClose]);

  useEffect(() => {
    if (!closeOnClickAway || !open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        toggleBtnRef.current &&
        !toggleBtnRef.current.contains(event.target as Node)
      ) {
        closeMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [closeOnClickAway, open, closeMenu]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenu();
        toggleBtnRef.current?.focus();
      }
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeMenu, open]);

  useEffect(() => {
    if (closeSignalRef.current === closeSignal) return;
    closeSignalRef.current = closeSignal;
    closeMenu();
  }, [closeMenu, closeSignal]);

  useEffect(
    () => () => {
      openTlRef.current?.kill();
      closeTweenRef.current?.kill();
      spinTweenRef.current?.kill();
      colorTweenRef.current?.kill();
      itemEntranceTweenRef.current?.kill();
    },
    [],
  );

  return (
    <div
      className={`sm-scope pointer-events-none z-50 ${isFixed ? 'fixed inset-0 h-dvh w-full max-w-full overflow-hidden' : 'h-full w-full'}`}
    >
      <div
        className={
          (className ? className + ' ' : '') + 'staggered-menu-wrapper pointer-events-none relative w-full h-full z-40'
        }
        style={
          accentColor
            ? ({ '--sm-accent': accentColor } as StaggeredMenuStyles)
            : undefined
        }
        data-position={position}
        data-open={open || undefined}
      >
        <div
          ref={preLayersRef}
          className="sm-prelayers pointer-events-none absolute top-0 right-0 bottom-0 z-5"
          aria-hidden="true"
        >
          {(() => {
            const raw = colors && colors.length ? colors.slice(0, 4) : ['#1e1e22', '#35353c'];
            const arr = [...raw];
            if (arr.length >= 3) {
              const mid = Math.floor(arr.length / 2);
              arr.splice(mid, 1);
            }
            return arr.map((c, i) => (
              <div
                key={i}
                className="sm-prelayer absolute top-0 right-0 h-full w-full translate-x-0"
                style={{ background: c }}
              />
            ));
          })()}
        </div>

        <header
          className="staggered-menu-header absolute top-0 left-0 w-full flex items-center justify-between p-[2em] bg-transparent pointer-events-none z-20"
          aria-label="Main navigation header"
        >
          <Link
            href={logoHref}
            className="sm-logo pointer-events-auto flex items-center gap-2 select-none"
            aria-label={`${logoText} home`}
            onClick={closeMenu}
          >
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt=""
                className="sm-logo-img block h-8 w-auto object-contain"
                draggable={false}
                width={110}
                height={32}
              />
            ) : (
              <>
                <span className="size-1.5 rotate-45 bg-brass" aria-hidden />
                <span className="font-display text-lg tracking-tight">
                  {logoText}
                </span>
              </>
            )}
          </Link>

          <div className="pointer-events-auto ml-auto flex items-center gap-1.5">
            {headerActions}
          </div>

          <button
            ref={toggleBtnRef}
            className="sm-toggle pointer-events-auto relative inline-flex size-10 cursor-pointer items-center justify-center overflow-visible rounded-md border-0 bg-transparent leading-none"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="staggered-menu-panel"
            onClick={toggleMenu}
            type="button"
          >
            <span
              className="sm-icon relative inline-flex shrink-0 items-center justify-center"
              aria-hidden="true"
            >
              <span
                ref={topLineRef}
                className="sm-icon-line sm-icon-line-top"
              />
              <span
                ref={middleLineRef}
                className="sm-icon-line sm-icon-line-middle"
              />
              <span
                ref={bottomLineRef}
                className="sm-icon-line sm-icon-line-bottom"
              />
            </span>
          </button>
        </header>

        <aside
          id="staggered-menu-panel"
          ref={panelRef}
          className="staggered-menu-panel pointer-events-auto absolute top-0 right-0 z-10 flex h-full flex-col overflow-y-auto bg-background p-[6em_2em_2em_2em] backdrop-blur-md"
          style={{ WebkitBackdropFilter: 'blur(12px)' }}
          aria-hidden={!open}
          inert={!open}
        >
          <div className="sm-panel-inner flex-1 flex flex-col gap-5">
            <ul
              className="sm-panel-list list-none m-0 p-0 flex flex-col gap-2"
              role="list"
              data-numbering={displayItemNumbering || undefined}
            >
              {items && items.length ? (
                items.map((it, idx) => (
                  <li className="sm-panel-itemWrap relative overflow-hidden leading-none" key={it.label + idx}>
                    <Link
                      className="sm-panel-item relative inline-block cursor-pointer pr-[1.4em] font-semibold leading-none tracking-tighter no-underline uppercase transition-colors duration-150"
                      href={it.link}
                      aria-label={it.ariaLabel}
                      data-index={idx + 1}
                      onClick={closeMenu}
                      tabIndex={open ? 0 : -1}
                    >
                      <span className="sm-panel-itemLabel inline-block origin-[50%_100%] will-change-transform">
                        {it.label}
                      </span>
                    </Link>
                  </li>
                ))
              ) : (
                <li className="sm-panel-itemWrap relative overflow-hidden leading-none" aria-hidden="true">
                  <span className="sm-panel-item relative inline-block cursor-pointer pr-[1.4em] font-semibold leading-none no-underline uppercase transition-colors duration-150">
                    <span className="sm-panel-itemLabel inline-block origin-[50%_100%] will-change-transform">
                      No items
                    </span>
                  </span>
                </li>
              )}
            </ul>

            {panelVisual ? (
              <div className="sm-panel-visual" aria-hidden="true">
                {panelVisual}
              </div>
            ) : null}

            {displaySocials && socialItems && socialItems.length > 0 && (
              <div className="sm-socials mt-auto pt-8 flex flex-col gap-3" aria-label="Social links">
                <h3 className="sm-socials-title m-0 text-base font-medium text-(--sm-accent)">Socials</h3>
                <ul
                  className="sm-socials-list list-none m-0 p-0 flex flex-row items-center gap-4 flex-wrap"
                  role="list"
                >
                  {socialItems.map((s, i) => (
                    <li key={s.label + i} className="sm-socials-item">
                      <a
                        href={s.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="sm-socials-link relative inline-block py-0.5 text-[1.2rem] font-medium text-foreground no-underline transition-[color,opacity] duration-300 ease-linear"
                        tabIndex={open ? 0 : -1}
                      >
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {panelFooter ? (
              <div className="sm-panel-footer mt-auto pt-4">{panelFooter}</div>
            ) : null}
          </div>
        </aside>
      </div>

      <style>{`
.sm-scope .staggered-menu-wrapper { position: relative; width: 100%; height: 100%; z-index: 40; pointer-events: none; }
.sm-scope .staggered-menu-header { position: absolute; top: 0; left: 0; width: 100%; height: 4rem; display: flex; align-items: center; gap: .5rem; padding: 0 1rem; background: color-mix(in srgb, var(--background) 86%, transparent); border-bottom: 1px solid color-mix(in srgb, var(--border) 80%, transparent); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); pointer-events: none; z-index: 20; }
.sm-scope .staggered-menu-header > * { pointer-events: auto; }
.sm-scope .sm-logo { display: flex; align-items: center; color: var(--foreground); text-decoration: none; user-select: none; }
.sm-scope .sm-logo-img { display: block; height: 32px; width: auto; object-fit: contain; }
.sm-scope .sm-toggle { position: relative; display: inline-flex; align-items: center; justify-content: center; width: 2.5rem; height: 2.5rem; padding: 0; background: transparent; border: none; cursor: pointer; color: var(--foreground); line-height: 1; overflow: visible; }
.sm-scope .sm-toggle:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; border-radius: .375rem; }
.sm-scope .sm-icon { position: relative; width: 24px; height: 18px; flex: 0 0 24px; display: inline-flex; align-items: center; justify-content: center; }
.sm-scope .sm-panel-itemWrap { position: relative; overflow: hidden; line-height: 1; }
.sm-scope .sm-icon-line { position: absolute; left: 0; width: 100%; height: 2.5px; background: currentColor; border-radius: 999px; will-change: transform, opacity; }
.sm-scope .sm-icon-line-top { top: 0; }
.sm-scope .sm-icon-line-middle { top: 8px; }
.sm-scope .sm-icon-line-bottom { top: 16px; }
.sm-scope .staggered-menu-panel { position: absolute; top: 0; right: 0; width: clamp(360px, 44vw, 560px); height: 100%; background: color-mix(in srgb, var(--background) 96%, var(--muted)); color: var(--foreground); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); display: flex; flex-direction: column; padding: 6rem 2rem 2rem; overflow-x: hidden; overflow-y: auto; overscroll-behavior: contain; z-index: 10; }
.sm-scope [data-position='left'] .staggered-menu-panel { right: auto; left: 0; }
.sm-scope .sm-prelayers { position: absolute; top: 0; right: 0; bottom: 0; width: clamp(360px, 44vw, 560px); pointer-events: none; z-index: 5; }
.sm-scope [data-position='left'] .sm-prelayers { right: auto; left: 0; }
.sm-scope .sm-prelayer { position: absolute; top: 0; right: 0; height: 100%; width: 100%; transform: translateX(0); }
.sm-scope .sm-panel-inner { flex: 1; display: flex; flex-direction: column; gap: 1.25rem; }
.sm-scope .sm-socials { margin-top: auto; padding-top: 2rem; display: flex; flex-direction: column; gap: .75rem; }
.sm-scope .sm-socials-title { margin: 0; font-size: 1rem; font-weight: 500; color: var(--sm-accent, var(--brass)); }
.sm-scope .sm-socials-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: row; align-items: center; gap: 1rem; flex-wrap: wrap; }
.sm-scope .sm-socials-list .sm-socials-link { opacity: 1; transition: opacity .3s ease; }
.sm-scope .sm-socials-list:hover .sm-socials-link:not(:hover) { opacity: .35; }
.sm-scope .sm-socials-list:focus-within .sm-socials-link:not(:focus-visible) { opacity: .35; }
.sm-scope .sm-socials-list .sm-socials-link:hover,
.sm-scope .sm-socials-list .sm-socials-link:focus-visible { opacity: 1; }
.sm-scope .sm-socials-link:focus-visible { outline: 2px solid var(--sm-accent, var(--brass)); outline-offset: 3px; }
.sm-scope .sm-socials-link { position: relative; display: inline-block; padding: 2px 0; color: var(--foreground); font-size: 1.2rem; font-weight: 500; text-decoration: none; transition: color .3s ease, opacity .3s ease; }
.sm-scope .sm-socials-link:hover { color: var(--sm-accent, var(--brass)); }
.sm-scope .sm-panel-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: .5rem; }
.sm-scope .sm-panel-item { position: relative; display: inline-block; padding-right: 1.4em; color: var(--foreground); font-size: clamp(2.35rem, 7vw, 4rem); font-weight: 600; line-height: .95; letter-spacing: -.05em; text-decoration: none; text-transform: uppercase; transition: color .25s; }
.sm-scope .sm-panel-itemLabel { display: inline-block; will-change: transform; transform-origin: 50% 100%; }
.sm-scope .sm-panel-item:hover { color: var(--sm-accent, var(--brass)); }
.sm-scope .sm-panel-list[data-numbering] { counter-reset: smItem; }
.sm-scope .sm-panel-list[data-numbering] .sm-panel-item::after { counter-increment: smItem; content: counter(smItem, decimal-leading-zero); position: absolute; top: .05em; right: .2em; color: var(--sm-accent, var(--brass)); font-size: .8rem; font-weight: 500; letter-spacing: 0; pointer-events: none; user-select: none; opacity: var(--sm-num-opacity, 0); }
@media (max-width: 1024px) { .sm-scope .staggered-menu-panel, .sm-scope .sm-prelayers { width: 100%; left: 0; right: 0; } }
@media (max-width: 640px) { .sm-scope .staggered-menu-panel { padding: 5.5rem 1rem 1.25rem; } .sm-scope .sm-panel-list { gap: .65rem; } }
@media (prefers-reduced-motion: reduce) { .sm-scope *, .sm-scope *::before, .sm-scope *::after { scroll-behavior: auto !important; transition-duration: .01ms !important; animation-duration: .01ms !important; animation-iteration-count: 1 !important; } }
      `}</style>
    </div>
  );
};

export default StaggeredMenu;


// how to use

// install gsap "npm install gsap"

//usage

// import StaggeredMenu from './StaggeredMenu';

// const menuItems = [
//   { label: 'Home', ariaLabel: 'Go to home page', link: '/' },
//   { label: 'About', ariaLabel: 'Learn about us', link: '/about' },
//   { label: 'Services', ariaLabel: 'View our services', link: '/services' },
//   { label: 'Contact', ariaLabel: 'Get in touch', link: '/contact' }
// ];

// const socialItems = [
//   { label: 'Twitter', link: 'https://twitter.com' },
//   { label: 'GitHub', link: 'https://github.com' },
//   { label: 'LinkedIn', link: 'https://linkedin.com' }
// ];

// <div style={{ height: '100vh', background: '#1a1a1a' }}>
//   <StaggeredMenu
//     position="right"
//     items={menuItems}
//     socialItems={socialItems}
//     displaySocials
//     displayItemNumbering={true}
//     menuButtonColor="#ffffff"
//     openMenuButtonColor="#fff"
//     changeMenuColorOnOpen={true}
//     colors={['#B497CF', '#5227FF']}
//     logoUrl="/path-to-your-logo.svg"
//     accentColor="#5227FF"
//     onMenuOpen={() => console.log('Menu opened')}
//     onMenuClose={() => console.log('Menu closed')}
//   />
// </div>

// props

// Props
// 15 properties
// Component properties
// Property	Type	Default	Description
// position	"left" | "right"	"right"	Anchor position for the menu panel (left or right side).
// colors	string[]	["#B497CF", "#5227FF"]	Colors used for staggered underlay layers.
// items	StaggeredMenuItem[]	[]	Menu items rendered inside the panel.
// socialItems	StaggeredMenuSocialItem[]	[]	Social links displayed in the menu panel.
// displaySocials	boolean	false	Whether to display the social links section.
// displayItemNumbering	boolean	true	Whether to show numbering for menu items.
// className	string	undefined	Optional extra class names.
// logoUrl	string	—	Path to the logo image.
// menuButtonColor	string	"#fff"	Color of the menu toggle button when closed.
// openMenuButtonColor	string	"#fff"	Color of the menu toggle button when open.
// accentColor	string	undefined	Hover accent color for menu items.
// changeMenuColorOnOpen	boolean	true	Whether to animate the button color when opening/closing.
// onMenuOpen	() => void	undefined	Callback function called when menu opens.
// onMenuClose	() => void	undefined	Callback function called when menu closes.
// closeOnClickAway	boolean	true	Whether to close the menu when clicking outside.