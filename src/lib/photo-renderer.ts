import * as THREE from "three";
import {
  ALBUMS,
  accentColor,
  coverPhotoOf,
  fullSrc,
  thumbSrc,
} from "./data.ts";
import type { Engine } from "./engine.ts";
import type { Rect } from "./layout.ts";

// shortcut: colors stay in raw sRGB end to end so shader mixing matches CSS compositing
THREE.ColorManagement.enabled = false;

const MAX_FULL_LOADS = 2;
const LIST_RADIUS = 4;
const GRID_RADIUS = 2;
const COVER_SATURATION = 0.4;
const COVER_TINT = 0.4;
const HOVER_SCALE = 0.02;

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D map;
  uniform vec2 size;
  uniform vec2 uvScale;
  uniform vec3 tint;
  uniform float tintAmount;
  uniform float saturation;
  uniform float radius;
  uniform float opacity;
  uniform float loaded;
  varying vec2 vUv;

  void main() {
    vec2 uv = (vUv - 0.5) * uvScale + 0.5;
    vec3 color = texture2D(map, vec2(uv.x, 1.0 - uv.y)).rgb;
    float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
    color = mix(vec3(luminance), color, saturation);
    color = mix(vec3(0.96), color, loaded);
    color = mix(color, tint, tintAmount);

    vec2 corner = abs(vUv - 0.5) * size - (size * 0.5 - radius);
    float distance = length(max(corner, 0.0)) + min(max(corner.x, corner.y), 0.0) - radius;
    float alpha = 1.0 - smoothstep(-0.5, 0.5, distance);
    gl_FragColor = vec4(color, alpha * opacity);
  }
`;

interface PhotoEntry {
  filename: string;
  aspect: number;
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  thumb: THREE.Texture | null;
  full: THREE.Texture | null;
  loadingFull: boolean;
  wantedByCover: boolean;
  loaded: number;
}

interface CoverEntry {
  photo: PhotoEntry;
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
}

function createMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthTest: false,
    uniforms: {
      map: { value: null },
      size: { value: new THREE.Vector2(1, 1) },
      uvScale: { value: new THREE.Vector2(1, 1) },
      tint: { value: new THREE.Color() },
      tintAmount: { value: 0 },
      saturation: { value: 1 },
      radius: { value: 0 },
      opacity: { value: 1 },
      loaded: { value: 0 },
    },
  });
}

export class PhotoRenderer {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(0, 1, 0, -1, -1, 1);
  private geometry = new THREE.PlaneGeometry(1, 1);
  private loader = new THREE.ImageBitmapLoader();
  private photos = new Map<string, PhotoEntry>();
  private covers: CoverEntry[] = [];
  private coverAlbums: unknown = null;
  private fullLoads = 0;
  private size = { W: 0, H: 0 };
  private rect: Rect = { x: 0, y: 0, w: 0, h: 0 };
  private disposed = false;

  constructor(
    private canvas: HTMLCanvasElement,
    private engine: Engine,
  ) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    canvas.addEventListener("webglcontextlost", this.preventContextLossDefault);
    canvas.addEventListener("webglcontextrestored", this.invalidateEngine);

    for (const photo of ALBUMS.flatMap((album) => album.photos)) {
      const mesh = new THREE.Mesh(this.geometry, createMaterial());
      mesh.renderOrder = 1;
      this.scene.add(mesh);
      const entry: PhotoEntry = {
        filename: photo.filename,
        aspect: photo.width / photo.height,
        mesh,
        thumb: null,
        full: null,
        loadingFull: false,
        wantedByCover: false,
        loaded: 0,
      };
      this.photos.set(photo.filename, entry);
      this.loadTexture(thumbSrc(photo.filename), (texture) => {
        entry.thumb = texture;
      });
    }
  }

  dispose() {
    this.disposed = true;
    this.canvas.removeEventListener(
      "webglcontextlost",
      this.preventContextLossDefault,
    );
    this.canvas.removeEventListener(
      "webglcontextrestored",
      this.invalidateEngine,
    );
    for (const entry of this.photos.values()) {
      this.disposeTexture(entry.thumb);
      this.disposeTexture(entry.full);
      entry.mesh.material.dispose();
    }
    for (const cover of this.covers) cover.mesh.material.dispose();
    this.geometry.dispose();
    this.renderer.dispose();
  }

  render = (engine: Engine, dt: number) => {
    this.resizeIfNeeded(engine);
    this.rebuildCoversIfNeeded(engine);

    const { W } = engine;
    const p = engine.morph.x;
    const rect = this.rect;

    for (const entry of this.photos.values()) entry.wantedByCover = false;

    this.covers.forEach((cover, albumIndex) => {
      const album = engine.layout.list.albums[albumIndex];
      const x = album.cover.x - engine.listX;
      const visible = p > 0.001 && x < W && x + album.cover.w > 0;
      cover.mesh.visible = visible;
      if (!visible) return;

      cover.photo.wantedByCover = true;
      const uniforms = cover.mesh.material.uniforms;
      const panelAspect = album.cover.w / album.cover.h;
      const imageAspect = cover.photo.aspect;
      uniforms.uvScale.value.set(
        Math.min(1, panelAspect / imageAspect),
        Math.min(1, imageAspect / panelAspect),
      );
      uniforms.map.value = cover.photo.full ?? cover.photo.thumb;
      uniforms.loaded.value = cover.photo.loaded;
      uniforms.opacity.value = p;
      this.place(cover.mesh, x, album.cover.y, album.cover.w, album.cover.h, 1);
    });

    for (const entry of this.photos.values()) {
      const opacity = engine.photoRect(entry.filename, rect);
      const list = engine.layout.list.photos.get(entry.filename);
      if (!list) {
        entry.mesh.visible = false;
        continue;
      }
      const listLeft = list.x - engine.listX;
      const listRight = listLeft + list.w;
      const travels = engine.travelsBetweenViews(entry.filename);

      if (entry.thumb && entry.loaded < 1) {
        entry.loaded = Math.min(1, entry.loaded + dt * 5);
        engine.invalidate();
      }

      const nearScreen = listLeft < W * 2 && listRight > -W;
      const farFromScreen = listLeft > W * 4 || listRight < -W * 3;
      const wantsFull = entry.wantedByCover || (p > 0.5 && nearScreen);
      if (wantsFull) this.loadFull(entry);
      else if (entry.full && (p < 0.01 || farFromScreen))
        this.releaseFull(entry);

      entry.mesh.visible = opacity > 0;
      entry.mesh.renderOrder =
        entry.filename === engine.topPhoto ? 3 : travels ? 2 : 1;
      const uniforms = entry.mesh.material.uniforms;
      uniforms.map.value = entry.full ?? entry.thumb;
      uniforms.loaded.value = entry.loaded;
      uniforms.opacity.value = opacity;
      uniforms.radius.value = GRID_RADIUS + (LIST_RADIUS - GRID_RADIUS) * p;
      const hover = engine.hover.get(entry.filename)?.x ?? 0;
      this.place(
        entry.mesh,
        rect.x,
        rect.y,
        rect.w,
        rect.h,
        1 + hover * HOVER_SCALE,
      );
    }

    this.renderer.render(this.scene, this.camera);
  };

  private place(
    mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>,
    x: number,
    y: number,
    w: number,
    h: number,
    scale: number,
  ) {
    mesh.position.set(x + w / 2, -(y + h / 2), 0);
    mesh.scale.set(w * scale, h * scale, 1);
    mesh.material.uniforms.size.value.set(w * scale, h * scale);
  }

  private resizeIfNeeded(engine: Engine) {
    if (this.size.W === engine.W && this.size.H === engine.H) return;
    this.size = { W: engine.W, H: engine.H };
    this.renderer.setSize(engine.W, engine.H, false);
    this.camera.right = engine.W;
    this.camera.bottom = -engine.H;
    this.camera.updateProjectionMatrix();
  }

  private rebuildCoversIfNeeded(engine: Engine) {
    if (this.coverAlbums === engine.albums) return;
    this.coverAlbums = engine.albums;

    for (const cover of this.covers) {
      this.scene.remove(cover.mesh);
      cover.mesh.material.dispose();
    }

    this.covers = engine.albums.flatMap((album, albumIndex) => {
      const photo = this.photos.get(coverPhotoOf(album).filename);
      if (!photo) return [];
      const mesh = new THREE.Mesh(this.geometry, createMaterial());
      mesh.renderOrder = 0;
      const uniforms = mesh.material.uniforms;
      uniforms.tint.value.set(accentColor(albumIndex));
      uniforms.tintAmount.value = COVER_TINT;
      uniforms.saturation.value = COVER_SATURATION;
      uniforms.radius.value = LIST_RADIUS;
      this.scene.add(mesh);
      return [{ photo, mesh }];
    });
  }

  private loadTexture(
    src: string,
    onLoad: (texture: THREE.Texture) => void,
    onError?: () => void,
  ) {
    const handleBitmap = (bitmap: ImageBitmap) => {
      if (this.disposed) {
        bitmap.close();
        return;
      }
      const texture = new THREE.Texture(bitmap);
      texture.flipY = false;
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.anisotropy = Math.min(
        4,
        this.renderer.capabilities.getMaxAnisotropy(),
      );
      texture.needsUpdate = true;
      onLoad(texture);
      this.engine.invalidate();
    };
    this.loader.load(src, handleBitmap, undefined, onError);
  }

  private loadFull(entry: PhotoEntry) {
    if (entry.full || entry.loadingFull || this.fullLoads >= MAX_FULL_LOADS) {
      return;
    }
    entry.loadingFull = true;
    this.fullLoads += 1;
    const finish = (texture: THREE.Texture) => {
      entry.full = texture;
      entry.loadingFull = false;
      this.fullLoads -= 1;
    };
    this.loadTexture(fullSrc(entry.filename), finish, () => {
      this.fullLoads -= 1;
    });
  }

  private releaseFull(entry: PhotoEntry) {
    this.disposeTexture(entry.full);
    entry.full = null;
  }

  private disposeTexture(texture: THREE.Texture | null) {
    if (!texture) return;
    (texture.image as ImageBitmap | null)?.close?.();
    texture.dispose();
  }

  private preventContextLossDefault = (event: Event) => event.preventDefault();
  private invalidateEngine = () => {
    for (const entry of this.photos.values()) {
      if (entry.thumb) entry.thumb.needsUpdate = true;
      if (entry.full) entry.full.needsUpdate = true;
    }
    this.engine.invalidate();
  };
}
