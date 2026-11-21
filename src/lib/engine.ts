import type { Album } from "./data.ts";
import { GRID, type Layout, type Rect, computeLayout } from "./layout.ts";

export type View = "grid" | "list";

interface Spring {
  x: number;
  v: number;
}

const MORPH_OMEGA = 16;
const REDUCED_MORPH_OMEGA = 30;
const HOVER_OMEGA = 21;
const SCROLL_TIME_CONSTANT = 0.06;
const IDLE_AFTER_MS = 600;
const SNAP_DELAY_MS = 150;
const SNAP_TOLERANCE = 2;
const REVEAL_SCALE = 1.4;
const REVEAL_SPREAD = 1;
const REVEAL_STAGGER = 0.5;
const REVEAL_FADE = 2.5;
const REVEAL_EXIT_FADE = 3;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

function stepCriticallyDampedSpring(
  spring: Spring,
  target: number,
  omega: number,
  dt: number,
) {
  const distance = spring.x - target;
  const decay = Math.exp(-omega * dt);
  const drift = spring.v + omega * distance;
  spring.x = target + (distance + drift * dt) * decay;
  spring.v = (spring.v - omega * drift * dt) * decay;

  if (Math.abs(spring.x - target) < 0.0005 && Math.abs(spring.v) < 0.0005) {
    spring.x = target;
    spring.v = 0;
  }
  return spring.x !== target;
}

export class Engine {
  W = window.innerWidth;
  H = window.innerHeight;
  albums: Album[];
  layout: Layout;
  view: View = "grid";
  reducedMotion = false;
  dark = false;
  topPhoto: string | null = null;
  hoveredPhoto: string | null = null;
  scrollDirection: 1 | -1 = 1;

  morph: Spring = { x: 0, v: 0 };
  regroup: Spring = { x: 1, v: 0 };
  scroll = { grid: { target: 0, current: 0 }, list: { target: 0, current: 0 } };
  hover = new Map<string, Spring>();

  private previousGrid: Map<string, Rect> | null = null;
  private travellers = new Set<string>();
  private frameListeners = new Set<(engine: Engine, dt: number) => void>();
  private stateListeners = new Set<() => void>();
  private rafId = 0;
  private lastTime = 0;
  private lastScrollInput = 0;
  private pointerDown = false;
  private activeUntil = 0;
  private abort = new AbortController();

  constructor(albums: Album[]) {
    this.albums = albums;
    this.layout = computeLayout(albums, this.W, this.H);
  }

  start() {
    this.abort = new AbortController();
    const { signal } = this.abort;
    window.addEventListener("resize", () => this.resize(), { signal });
    window.addEventListener("scroll", () => this.invalidate(), {
      signal,
      passive: true,
    });
    const setPointerDown = (down: boolean) => () => {
      this.pointerDown = down;
      this.invalidate();
    };
    window.addEventListener("pointerdown", setPointerDown(true), { signal });
    window.addEventListener("pointerup", setPointerDown(false), { signal });
    window.addEventListener("pointercancel", setPointerDown(false), { signal });
    window.addEventListener(
      "wheel",
      (event) => {
        if (
          this.view === "list" &&
          Math.abs(event.deltaX) > Math.abs(event.deltaY)
        ) {
          window.scrollBy(0, event.deltaX);
        }
      },
      { signal, passive: true },
    );

    this.applyBodyHeight();
    this.invalidate();
    this.rafId = requestAnimationFrame(this.frame);
  }

  stop() {
    this.abort.abort();
    cancelAnimationFrame(this.rafId);
    document.body.style.height = "";
  }

  onFrame(listener: (engine: Engine, dt: number) => void) {
    this.frameListeners.add(listener);
    this.invalidate();
    return () => {
      this.frameListeners.delete(listener);
    };
  }

  onStateChange(listener: () => void) {
    this.stateListeners.add(listener);
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  invalidate() {
    this.activeUntil = performance.now() + IDLE_AFTER_MS;
  }

  get listX() {
    return this.scroll.list.current;
  }

  get gridY() {
    return this.scroll.grid.current;
  }

  maxScroll(view: View) {
    return view === "list"
      ? Math.max(0, this.layout.list.width - this.W)
      : Math.max(0, this.layout.grid.height - this.H);
  }

  travelsBetweenViews(filename: string) {
    const morphing = this.morph.x > 0 && this.morph.x < 1;
    return morphing
      ? this.travellers.has(filename)
      : this.isOnScreenInList(filename);
  }

  private isOnScreenInList(filename: string) {
    const list = this.layout.list.photos.get(filename);
    if (!list) return false;
    const x = list.x - this.listX;
    return x < this.W && x + list.w > 0;
  }

  photoRect(filename: string, out: Rect) {
    const list = this.layout.list.photos.get(filename);
    const grid = this.layout.grid.photos.get(filename);
    if (!list || !grid) return 0;

    const from = this.previousGrid?.get(filename) ?? grid;
    const q = this.regroup.x;
    const p = this.morph.x;
    const gridX = mix(from.x, grid.x, q);
    const gridTop = mix(from.y, grid.y, q) - this.gridY;
    const gridW = mix(from.w, grid.w, q);

    if (this.travelsBetweenViews(filename)) {
      out.x = mix(gridX, list.x - this.listX, p);
      out.y = mix(gridTop, list.y, p);
      out.w = mix(gridW, list.w, p);
      out.h = mix(grid.h, list.h, p);
      return 1;
    }

    const offsetX = gridX + gridW / 2 - this.W / 2;
    const offsetY = gridTop + grid.h / 2 - this.H / 2;
    const distanceFromCenter = Math.min(
      1,
      Math.hypot(offsetX, offsetY) / Math.hypot(this.W / 2, this.H / 2),
    );
    const arrival = clamp(
      (1 - p) * (1 + REVEAL_STAGGER) - REVEAL_STAGGER * distanceFromCenter,
      0,
      1,
    );
    const settle = (1 - arrival) ** 2;
    const spread = 1 + REVEAL_SPREAD * settle;
    const scale = mix(1, REVEAL_SCALE, settle);
    out.w = gridW * scale;
    out.h = grid.h * scale;
    out.x = this.W / 2 + offsetX * spread - out.w / 2;
    out.y = this.H / 2 + offsetY * spread - out.h / 2;
    const opacity = Math.min(1, arrival * REVEAL_FADE);
    return this.view === "list"
      ? Math.min(opacity, clamp(1 - p * REVEAL_EXIT_FADE, 0, 1))
      : opacity;
  }

  setView(view: View, position?: number) {
    if (view === this.view) return;

    this.view = view;
    this.hoveredPhoto = null;
    const scroll = this.scroll[view];
    if (position !== undefined) {
      scroll.target = this.nearestSnap(view, position);
    }
    scroll.current = scroll.target;
    this.travellers = new Set(
      [...this.layout.list.photos.keys()].filter((filename) =>
        this.isOnScreenInList(filename),
      ),
    );
    this.applyBodyHeight();
    window.scrollTo(0, this.toWindowScroll(view, scroll.target));
    this.invalidate();
    this.emitState();
  }

  showPhotoInList(filename: string) {
    const rect = this.layout.list.photos.get(filename);
    if (!rect) return;
    this.topPhoto = filename;
    this.setView("list", rect.x + rect.w / 2 - this.W / 2);
  }

  showPhotoInGrid(filename: string) {
    const rect = this.layout.grid.photos.get(filename);
    if (!rect) return;
    this.topPhoto = filename;
    this.setView("grid", rect.y + rect.h / 2 - this.H / 2);
  }

  showAlbumInList(albumIndex: number) {
    this.topPhoto = null;
    this.setView("list", this.layout.list.albums[albumIndex]?.x ?? 0);
  }

  showAlbumInGrid(albumIndex: number) {
    this.topPhoto = null;
    const row = this.layout.grid.rows[albumIndex];
    this.setView("grid", (row?.y ?? 0) - GRID.paddingY);
  }

  toggleView() {
    const filename = this.photoNearestScreenCenter();
    if (!filename) {
      this.topPhoto = null;
      this.setView(this.view === "grid" ? "list" : "grid");
    } else if (this.view === "grid") {
      this.showPhotoInList(filename);
    } else {
      this.showPhotoInGrid(filename);
    }
  }

  private photoNearestScreenCenter() {
    const inList = this.view === "list";
    const centerX = inList ? this.listX + this.W / 2 : this.W / 2;
    const centerY = this.gridY + this.H / 2;
    let nearest: string | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const [filename, rect] of this.layout[this.view].photos) {
      const distance = Math.hypot(
        rect.x + rect.w / 2 - centerX,
        inList ? 0 : rect.y + rect.h / 2 - centerY,
      );
      if (distance < nearestDistance) {
        nearest = filename;
        nearestDistance = distance;
      }
    }
    return nearest;
  }

  scrollTo(position: number, instant = false) {
    const scroll = this.scroll[this.view];
    scroll.target = clamp(position, 0, this.maxScroll(this.view));
    if (instant) scroll.current = scroll.target;
    window.scrollTo(0, this.toWindowScroll(this.view, scroll.target));
    this.invalidate();
  }

  setAlbums(albums: Album[]) {
    if (albums === this.albums) return;

    if (!this.reducedMotion) {
      const snapshot = new Map<string, Rect>();
      for (const [filename, rect] of this.layout.grid.photos) {
        const from = this.previousGrid?.get(filename) ?? rect;
        const q = this.regroup.x;
        snapshot.set(filename, {
          x: mix(from.x, rect.x, q),
          y: mix(from.y, rect.y, q) - this.gridY,
          w: mix(from.w, rect.w, q),
          h: rect.h,
        });
      }
      this.previousGrid = snapshot;
      this.regroup = { x: 0, v: 0 };
    }

    this.albums = albums;
    this.layout = computeLayout(albums, this.W, this.H);
    this.scroll.grid = { target: 0, current: 0 };
    this.scroll.list = { target: 0, current: 0 };
    this.applyBodyHeight();
    window.scrollTo(0, 0);
    this.invalidate();
    this.emitState();
  }

  private resize() {
    const progress = {
      grid: this.scroll.grid.current / (this.maxScroll("grid") || 1),
      list: this.scroll.list.current / (this.maxScroll("list") || 1),
    };

    this.W = window.innerWidth;
    this.H = window.innerHeight;
    this.layout = computeLayout(this.albums, this.W, this.H);
    this.previousGrid = null;

    for (const view of ["grid", "list"] as const) {
      const position = progress[view] * this.maxScroll(view);
      this.scroll[view] = { target: position, current: position };
    }

    this.applyBodyHeight();
    window.scrollTo(
      0,
      this.toWindowScroll(this.view, this.scroll[this.view].target),
    );
    this.invalidate();
    this.emitState();
  }

  stepToNextSnap(direction: 1 | -1) {
    const current = this.scroll[this.view].target;
    const ahead = this.snapPositions(this.view).filter((snap) =>
      direction > 0
        ? snap > current + SNAP_TOLERANCE
        : snap < current - SNAP_TOLERANCE,
    );
    if (ahead.length === 0) return;
    this.scrollTo(direction > 0 ? Math.min(...ahead) : Math.max(...ahead));
  }

  private snapPositions(view: View) {
    const { list, grid } = this.layout;
    const max = this.maxScroll(view);
    const positions =
      view === "list"
        ? [
            ...list.albums.map((album) => album.x),
            ...[...list.photos.values()].map(
              (rect) => rect.x + rect.w / 2 - this.W / 2,
            ),
          ]
        : [...grid.photos.values()].map((rect) => rect.y - GRID.paddingY);
    return positions.map((position) => clamp(position, 0, max));
  }

  private nearestSnap(view: View, position: number) {
    let nearest = position;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const snap of this.snapPositions(view)) {
      const distance = Math.abs(snap - position);
      if (distance < nearestDistance) {
        nearest = snap;
        nearestDistance = distance;
      }
    }
    return nearest;
  }

  private snapToNearest() {
    const target = this.scroll[this.view].target;
    const snap = this.nearestSnap(this.view, target);
    if (Math.abs(snap - target) > SNAP_TOLERANCE) this.scrollTo(snap);
  }

  private toWindowScroll(view: View, position: number) {
    return view === "list" ? (position * this.H) / this.W : position;
  }

  private applyBodyHeight() {
    const height =
      this.view === "list"
        ? (this.H * this.layout.list.width) / this.W
        : this.layout.grid.height;
    document.body.style.height = `${height}px`;
  }

  private emitState() {
    for (const listener of this.stateListeners) listener();
  }

  private updateDarkMode() {
    const center = this.listX + this.W / 2;
    const albumIndex = this.layout.list.albums.findIndex(
      (album) => center >= album.x && center < album.x + album.width,
    );
    const dark = this.view === "list" && Boolean(this.albums[albumIndex]?.dark);

    if (dark !== this.dark) {
      this.dark = dark;
      this.emitState();
    }
  }

  private frame = (time: number) => {
    this.rafId = requestAnimationFrame(this.frame);
    const dt = Math.min(time - this.lastTime, 50) / 1000;
    this.lastTime = time;

    const scroll = this.scroll[this.view];
    const windowPosition =
      this.view === "list"
        ? (window.scrollY * this.W) / this.H
        : window.scrollY;
    const target = clamp(windowPosition, 0, this.maxScroll(this.view));

    if (target !== scroll.target) {
      this.scrollDirection = target > scroll.target ? 1 : -1;
      scroll.target = target;
      this.lastScrollInput = time;
      this.invalidate();
    }

    if (!this.pointerDown && time - this.lastScrollInput > SNAP_DELAY_MS) {
      this.snapToNearest();
    }

    if (time > this.activeUntil) return;

    let moving = false;

    if (scroll.current !== scroll.target) {
      const remaining = scroll.target - scroll.current;
      const settled = this.reducedMotion || Math.abs(remaining) < 0.1;
      scroll.current = settled
        ? scroll.target
        : scroll.current +
          remaining * (1 - Math.exp(-dt / SCROLL_TIME_CONSTANT));
      moving = true;
    }

    const morphOmega = this.reducedMotion ? REDUCED_MORPH_OMEGA : MORPH_OMEGA;
    const morphTarget = this.view === "list" ? 1 : 0;
    if (stepCriticallyDampedSpring(this.morph, morphTarget, morphOmega, dt)) {
      moving = true;
    }

    if (stepCriticallyDampedSpring(this.regroup, 1, MORPH_OMEGA, dt)) {
      moving = true;
    } else {
      this.previousGrid = null;
    }

    for (const [filename, spring] of this.hover) {
      const hoverTarget = filename === this.hoveredPhoto ? 1 : 0;
      if (stepCriticallyDampedSpring(spring, hoverTarget, HOVER_OMEGA, dt)) {
        moving = true;
      } else if (hoverTarget === 0) {
        this.hover.delete(filename);
      }
    }

    this.updateDarkMode();
    if (moving) this.invalidate();
    for (const listener of this.frameListeners) listener(this, dt);
  };

  setHoveredPhoto(filename: string | null) {
    this.hoveredPhoto = filename;
    if (filename && !this.hover.has(filename)) {
      this.hover.set(filename, { x: 0, v: 0 });
    }
    this.invalidate();
  }
}
