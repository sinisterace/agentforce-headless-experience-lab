/**
 * WebGL particle-field renderer, ported verbatim from the DF26 Lovable design
 * export. Presentation only — a GPU flow-field that reconstitutes an image as
 * drifting particles. Self-contained: the only external className is forwarded
 * to the wrapper, so it carries no styling opinions of its own. Uses
 * @react-three/fiber + three (already app dependencies).
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export interface ParticleImageProps {
  imageUrl: string;
  width?: string | number;
  height?: string | number;
  className?: string;
  children?: React.ReactNode;
  particleCount?: number;
  particleSize?: number;
  particleOpacity?: number;
  speed?: number;
  noiseScale?: number;
  noiseStrength?: number;
  damping?: number;
  lifespan?: number;
  showImage?: boolean;
  imageOpacity?: number;
  cursorInteraction?: boolean;
  cursorStrength?: number;
  cursorRadius?: number;
  imageFit?: number;
  dpr?: number | [number, number];
  paused?: boolean;
}

const GLSL_HASH = `
#define HASH_SCALE vec3(0.1031, 0.11369, 0.13787)

vec3 hash33(vec3 p) {
  p = fract(p * HASH_SCALE);
  p += dot(p, p.yxz + 19.19);
  return -1.0 + 2.0 * fract(vec3(
    (p.x + p.y) * p.z,
    (p.x + p.z) * p.y,
    (p.y + p.z) * p.x
  ));
}
`;

const GLSL_NOISE = `
float flowNoise(vec3 p) {
  const float K1 = 0.333333333;
  const float K2 = 0.166666667;

  vec3 cell = floor(p + (p.x + p.y + p.z) * K1);
  vec3 d0 = p - (cell - (cell.x + cell.y + cell.z) * K2);
  vec3 edge = step(vec3(0.0), d0 - d0.yzx);
  vec3 o1 = edge * (1.0 - edge.zxy);
  vec3 o2 = 1.0 - edge.zxy * (1.0 - edge);
  vec3 d1 = d0 - (o1 - K2);
  vec3 d2 = d0 - (o2 - 2.0 * K2);
  vec3 d3 = d0 - (1.0 - 3.0 * K2);

  vec4 falloff = max(0.6 - vec4(dot(d0, d0), dot(d1, d1), dot(d2, d2), dot(d3, d3)), 0.0);
  vec4 weights = falloff * falloff * falloff * falloff * vec4(
    dot(d0, hash33(cell)),
    dot(d1, hash33(cell + o1)),
    dot(d2, hash33(cell + o2)),
    dot(d3, hash33(cell + 1.0))
  );

  return dot(vec4(31.316), weights);
}
`;

const GLSL_COVER = `
vec2 coverUv(vec2 uv, float frameAspect, float imageAspect, float fit) {
  bool wide = imageAspect > frameAspect;
  float scale = wide ? frameAspect / imageAspect : imageAspect / frameAspect;
  vec2 axis = wide ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  return (uv - 0.5) * (axis * scale + (1.0 - axis)) / max(fit, 0.05) + 0.5;
}
`;

const QUAD_VERT = `precision highp float;

in vec3 position;
in vec2 uv;

out vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}`;

const SEED_FRAG = `precision highp float;

uniform vec2 uResolution;
uniform float uLifespan;

in vec2 vUv;

layout(location = 0) out vec4 outMotion;
layout(location = 1) out vec4 outLife;

${GLSL_HASH}

void main() {
  vec3 birth = hash33(vec3(vUv * 512.0, 1.0));
  vec3 jitter = hash33(vec3(vUv * 91.7, 7.3));

  vec2 origin = fract(birth.xy * 0.5 + 0.5);
  float span = uLifespan * (0.25 + 0.75 * fract(jitter.z * 0.5 + 0.5));

  outMotion = vec4(origin * uResolution, jitter.xy * 0.25);
  outLife = vec4(fract(birth.z * 0.5 + 0.5) * span, span, birth.xy);
}`;

const SIM_FRAG = `precision highp float;

uniform sampler2D tMotion;
uniform sampler2D tLife;
uniform vec2 uResolution;
uniform vec2 uPointer;
uniform vec2 uPointerVelocity;
uniform float uTime;
uniform float uNoiseScale;
uniform float uNoiseStrength;
uniform float uDamping;
uniform float uLifespan;
uniform float uPointerStrength;
uniform float uPointerFalloff;

in vec2 vUv;

layout(location = 0) out vec4 outMotion;
layout(location = 1) out vec4 outLife;

${GLSL_HASH}
${GLSL_NOISE}

void main() {
  vec4 motion = texture(tMotion, vUv);
  vec4 life = texture(tLife, vUv);

  vec2 pos = motion.xy;
  vec2 vel = motion.zw;
  float age = life.x + 1.0;
  float span = life.y;
  vec2 seed = life.zw;

  float angle = flowNoise(vec3(pos * uNoiseScale, uTime * 20.0 + age * 0.05)) * 6.2831853;
  vec2 flow = vec2(cos(angle), sin(angle)) * uNoiseStrength;

  vec2 offset = pos - uPointer;
  float proximity = uPointerFalloff / (dot(offset, offset) + uPointerFalloff);
  vec2 wake = uPointerVelocity * proximity * uPointerStrength;

  vel = vel * uDamping + flow + wake;
  pos += vel;

  bool spent = age >= span
    || pos.x < 0.0 || pos.x > uResolution.x
    || pos.y < 0.0 || pos.y > uResolution.y;

  if (spent) {
    vec3 rebirth = hash33(vec3(seed, uTime + age));
    float nextSpan = uLifespan * (0.25 + 0.75 * fract(rebirth.z * 0.5 + 0.5));
    outMotion = vec4(fract(rebirth.xy * 0.5 + 0.5) * uResolution, 0.0, 0.0);
    outLife = vec4(0.0, nextSpan, rebirth.xy);
  } else {
    outMotion = vec4(pos, vel);
    outLife = vec4(age, span, seed);
  }
}`;

const POINT_VERT = `precision highp float;

in vec3 position;

uniform sampler2D tMotion;
uniform sampler2D tLife;
uniform sampler2D uImage;
uniform vec2 uResolution;
uniform float uImageAspect;
uniform float uImageFit;
uniform float uPointSize;
uniform float uOpacity;

out vec3 vTint;
out float vAlpha;

${GLSL_COVER}

void main() {
  vec4 motion = texture(tMotion, position.xy);
  vec4 life = texture(tLife, position.xy);

  float ratio = life.x / max(life.y, 1.0);
  float fade = smoothstep(0.0, 0.05, ratio) * (1.0 - smoothstep(0.85, 1.0, ratio));
  vec2 birthUv = fract(life.zw * 0.5 + 0.5);

  vec4 sampled = texture(uImage, coverUv(birthUv, uResolution.x / uResolution.y, uImageAspect, uImageFit));
  vTint = sampled.rgb;
  vAlpha = fade * uOpacity * sampled.a;

  vec2 ndc = motion.xy / uResolution * 2.0 - 1.0;
  gl_Position = vec4(ndc.x, -ndc.y, 0.0, 1.0);
  gl_PointSize = smoothstep(1.0, 0.5, ratio) * uPointSize * fade;
}`;

const POINT_FRAG = `precision highp float;

in vec3 vTint;
in float vAlpha;

out vec4 fragColor;

void main() {
  float mask = 1.0 - smoothstep(0.3, 0.5, length(gl_PointCoord - 0.5));
  fragColor = vec4(vTint, vAlpha * mask);
}`;

const IMAGE_FRAG = `precision highp float;

uniform sampler2D uImage;
uniform float uFrameAspect;
uniform float uImageAspect;
uniform float uImageFit;
uniform float uOpacity;

in vec2 vUv;

out vec4 fragColor;

${GLSL_COVER}

void main() {
  vec2 uv = coverUv(vec2(vUv.x, 1.0 - vUv.y), uFrameAspect, uImageAspect, uImageFit);
  vec4 sampled = texture(uImage, uv);
  fragColor = vec4(sampled.rgb, sampled.a * uOpacity);
}`;

interface SourceImage {
  texture: THREE.Texture;
  aspect: number;
}

type Uniforms = Record<string, { value: any }>;

const OFFSCREEN = -100000;

function gridFor(count: number): number {
  return Math.min(1024, Math.max(64, Math.ceil(Math.sqrt(Math.max(count, 1)))));
}

function useSourceImage(imageUrl: string): SourceImage | null {
  const [source, setSource] = useState<SourceImage | null>(null);

  useEffect(() => {
    let active = true;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(imageUrl, (texture) => {
      if (!active) {
        texture.dispose();
        return;
      }
      const bitmap = texture.image as {
        width?: number;
        height?: number;
        naturalWidth?: number;
        naturalHeight?: number;
      };
      const w = bitmap.naturalWidth ?? bitmap.width ?? 1;
      const h = bitmap.naturalHeight ?? bitmap.height ?? 1;
      texture.flipY = false;
      texture.generateMipmaps = false;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.needsUpdate = true;
      setSource({ texture, aspect: w / Math.max(h, 1) });
    });
    return () => {
      active = false;
    };
  }, [imageUrl]);

  return source;
}

function useInView(ref: React.RefObject<HTMLDivElement | null>): boolean {
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => setInView(entries[0]?.isIntersecting ?? true),
      { threshold: 0.01 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return inView;
}

interface FieldProps {
  source: SourceImage;
  particleCount: number;
  particleSize: number;
  particleOpacity: number;
  speed: number;
  noiseScale: number;
  noiseStrength: number;
  damping: number;
  lifespan: number;
  showImage: boolean;
  imageOpacity: number;
  cursorInteraction: boolean;
  cursorStrength: number;
  cursorRadius: number;
  imageFit: number;
  paused: boolean;
}

function ParticleField({
  source,
  particleCount,
  particleSize,
  particleOpacity,
  speed,
  noiseScale,
  noiseStrength,
  damping,
  lifespan,
  showImage,
  imageOpacity,
  cursorInteraction,
  cursorStrength,
  cursorRadius,
  imageFit,
  paused,
}: FieldProps) {
  const { gl } = useThree();
  const grid = useMemo(() => gridFor(particleCount), [particleCount]);
  const simulation = useRef<{
    scene: THREE.Scene;
    camera: THREE.Camera;
    quad: THREE.Mesh;
    seedMaterial: THREE.RawShaderMaterial;
    stepMaterial: THREE.RawShaderMaterial;
    buffers: THREE.WebGLRenderTarget[];
    front: number;
    seeded: boolean;
    release: () => void;
  } | null>(null);
  const pointer = useRef({
    targetX: OFFSCREEN,
    targetY: OFFSCREEN,
    lastX: OFFSCREEN,
    lastY: OFFSCREEN,
    velocityX: 0,
    velocityY: 0,
    engaged: false,
  });
  const clock = useRef({ time: 0 });
  const frame = useRef(new THREE.Vector2(1, 1));

  const pointMaterial = useMemo(
    () =>
      new THREE.RawShaderMaterial({
        glslVersion: THREE.GLSL3,
        vertexShader: POINT_VERT,
        fragmentShader: POINT_FRAG,
        uniforms: {
          tMotion: { value: null },
          tLife: { value: null },
          uImage: { value: null },
          uResolution: { value: new THREE.Vector2(1, 1) },
          uImageAspect: { value: 1 },
          uImageFit: { value: 1 },
          uPointSize: { value: 4 },
          uOpacity: { value: 0.5 },
        },
        transparent: true,
        depthTest: false,
        depthWrite: false,
        blending: THREE.NormalBlending,
      }),
    [],
  );

  const backdropMaterial = useMemo(
    () =>
      new THREE.RawShaderMaterial({
        glslVersion: THREE.GLSL3,
        vertexShader: QUAD_VERT,
        fragmentShader: IMAGE_FRAG,
        uniforms: {
          uImage: { value: null },
          uFrameAspect: { value: 1 },
          uImageAspect: { value: 1 },
          uImageFit: { value: 1 },
          uOpacity: { value: 1 },
        },
        transparent: true,
        depthTest: false,
        depthWrite: false,
      }),
    [],
  );

  useEffect(() => {
    return () => {
      pointMaterial.dispose();
      backdropMaterial.dispose();
    };
  }, [pointMaterial, backdropMaterial]);

  const geometry = useMemo(() => {
    const total = grid * grid;
    const lookup = new Float32Array(total * 3);
    for (let i = 0; i < total; i++) {
      lookup[i * 3] = ((i % grid) + 0.5) / grid;
      lookup[i * 3 + 1] = (Math.floor(i / grid) + 0.5) / grid;
    }
    const buffer = new THREE.BufferGeometry();
    buffer.setAttribute("position", new THREE.BufferAttribute(lookup, 3));
    return buffer;
  }, [grid]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useEffect(() => {
    const context = gl.getContext();
    const floatCapable =
      (context as WebGL2RenderingContext).getExtension(
        "EXT_color_buffer_float",
      ) !== null;
    const dataType = floatCapable ? THREE.FloatType : THREE.HalfFloatType;

    const createBuffer = () =>
      new THREE.WebGLRenderTarget(grid, grid, {
        count: 2,
        type: dataType,
        format: THREE.RGBAFormat,
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        wrapS: THREE.ClampToEdgeWrapping,
        wrapT: THREE.ClampToEdgeWrapping,
        depthBuffer: false,
        stencilBuffer: false,
        generateMipmaps: false,
      });

    const buffers = [createBuffer(), createBuffer()];

    const seedMaterial = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: QUAD_VERT,
      fragmentShader: SEED_FRAG,
      uniforms: {
        uResolution: { value: new THREE.Vector2(1, 1) },
        uLifespan: { value: 400 },
      },
      depthTest: false,
      depthWrite: false,
    });

    const stepMaterial = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: QUAD_VERT,
      fragmentShader: SIM_FRAG,
      uniforms: {
        tMotion: { value: null },
        tLife: { value: null },
        uResolution: { value: new THREE.Vector2(1, 1) },
        uPointer: { value: new THREE.Vector2(OFFSCREEN, OFFSCREEN) },
        uPointerVelocity: { value: new THREE.Vector2(0, 0) },
        uTime: { value: 0 },
        uNoiseScale: { value: 0.004 },
        uNoiseStrength: { value: 0.04 },
        uDamping: { value: 0.98 },
        uLifespan: { value: 400 },
        uPointerStrength: { value: 0.08 },
        uPointerFalloff: { value: 1000 },
      },
      depthTest: false,
      depthWrite: false,
    });

    const plane = new THREE.PlaneGeometry(2, 2);
    const quad = new THREE.Mesh(plane, stepMaterial);
    quad.frustumCulled = false;

    const scene = new THREE.Scene();
    scene.add(quad);

    simulation.current = {
      scene,
      camera: new THREE.Camera(),
      quad,
      seedMaterial,
      stepMaterial,
      buffers,
      front: 0,
      seeded: false,
      release: () => {
        buffers.forEach((b) => b.dispose());
        seedMaterial.dispose();
        stepMaterial.dispose();
        plane.dispose();
      },
    };

    return () => {
      simulation.current?.release();
      simulation.current = null;
    };
  }, [gl, grid]);

  useEffect(() => {
    pointMaterial.uniforms.uPointSize.value = particleSize;
    pointMaterial.uniforms.uOpacity.value = particleOpacity;
    pointMaterial.uniforms.uImageFit.value = imageFit;
    pointMaterial.uniforms.uImageAspect.value = source.aspect;
    pointMaterial.uniforms.uImage.value = source.texture;

    backdropMaterial.uniforms.uImageAspect.value = source.aspect;
    backdropMaterial.uniforms.uImageFit.value = imageFit;
    backdropMaterial.uniforms.uImage.value = source.texture;
    backdropMaterial.uniforms.uOpacity.value = imageOpacity;

    if (simulation.current) {
      simulation.current.stepMaterial.uniforms.uNoiseScale.value = noiseScale;
      simulation.current.stepMaterial.uniforms.uNoiseStrength.value = noiseStrength;
      simulation.current.stepMaterial.uniforms.uDamping.value = damping;
      simulation.current.stepMaterial.uniforms.uLifespan.value = lifespan;
      simulation.current.stepMaterial.uniforms.uPointerStrength.value = cursorStrength;
      simulation.current.stepMaterial.uniforms.uPointerFalloff.value = cursorRadius * cursorRadius;
    }
  }, [
    particleSize,
    particleOpacity,
    imageFit,
    source,
    noiseScale,
    noiseStrength,
    damping,
    lifespan,
    cursorStrength,
    cursorRadius,
    pointMaterial.uniforms,
    backdropMaterial.uniforms,
  ]);

  // Cursor reactivity: translate pointer moves over the canvas into the
  // simulation's pixel space (0..resolution, y from top) and feed position +
  // velocity to the flow field so particles get pushed around the cursor. The
  // ported export declared the pointer ref but never wired an event source.
  useEffect(() => {
    const canvas = gl.domElement;
    const p = pointer.current;
    const apply = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const res = frame.current;
      const x = ((clientX - rect.left) / rect.width) * res.x;
      const y = ((clientY - rect.top) / rect.height) * res.y;
      if (!p.engaged) {
        p.lastX = x;
        p.lastY = y;
      }
      p.velocityX = x - p.lastX;
      p.velocityY = y - p.lastY;
      p.lastX = x;
      p.lastY = y;
      p.targetX = x;
      p.targetY = y;
      p.engaged = true;
    };
    const onMove = (e: PointerEvent) => apply(e.clientX, e.clientY);
    const onLeave = () => {
      p.engaged = false;
      p.targetX = OFFSCREEN;
      p.targetY = OFFSCREEN;
      p.velocityX = 0;
      p.velocityY = 0;
    };
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    return () => {
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
    };
  }, [gl]);

  useFrame((state) => {
    const sim = simulation.current;
    if (!sim) return;

    const size = state.size;
    const width = size.width * state.viewport.dpr;
    const height = size.height * state.viewport.dpr;
    frame.current.set(width, height);

    const pointUniforms = pointMaterial.uniforms as Uniforms;
    pointUniforms.uResolution.value.set(width, height);

    const stepUniforms = sim.stepMaterial.uniforms as Uniforms;
    stepUniforms.uResolution.value.set(width, height);

    const seedUniforms = sim.seedMaterial.uniforms as Uniforms;
    seedUniforms.uResolution.value.set(width, height);

    if (!sim.seeded) {
      gl.setRenderTarget(sim.buffers[0]);
      sim.quad.material = sim.seedMaterial;
      gl.render(sim.scene, sim.camera);
      gl.setRenderTarget(sim.buffers[1]);
      gl.render(sim.scene, sim.camera);
      sim.seeded = true;
    }

    if (!paused) {
      clock.current.time += state.clock.getDelta() * speed;
      stepUniforms.uTime.value = clock.current.time;

      const p = pointer.current;
      if (cursorInteraction && p.engaged) {
        stepUniforms.uPointer.value.set(p.targetX, p.targetY);
        stepUniforms.uPointerVelocity.value.set(p.velocityX, p.velocityY);
        // Decay the wake between moves so a stationary cursor stops shoving.
        p.velocityX *= 0.82;
        p.velocityY *= 0.82;
      } else {
        stepUniforms.uPointer.value.set(OFFSCREEN, OFFSCREEN);
        stepUniforms.uPointerVelocity.value.set(0, 0);
      }

      const back = sim.front;
      const front = 1 - sim.front;
      // MRT buffer: attachment 0 = motion (pos/vel), attachment 1 = life
      // (age/span/seed). Bind each sampler to its own attachment — binding
      // `.texture` (attachment 0) to both leaves tLife reading motion data,
      // which breaks the death/rebirth logic and makes particles streak.
      const backTextures = sim.buffers[back].textures;
      stepUniforms.tMotion.value = backTextures[0];
      stepUniforms.tLife.value = backTextures[1];
      gl.setRenderTarget(sim.buffers[front]);
      sim.quad.material = sim.stepMaterial;
      gl.render(sim.scene, sim.camera);
      sim.front = front;
    }

    const frontTextures = sim.buffers[sim.front].textures;
    pointUniforms.tMotion.value = frontTextures[0];
    pointUniforms.tLife.value = frontTextures[1];
    gl.setRenderTarget(null);
  });

  return (
    <>
      {showImage && (
        <mesh material={backdropMaterial}>
          <planeGeometry args={[2, 2]} />
        </mesh>
      )}
      <points geometry={geometry} material={pointMaterial} frustumCulled={false} />
    </>
  );
}

export function ParticleImage({
  imageUrl,
  width = "100%",
  height = "100%",
  className,
  children,
  particleCount = 140000,
  particleSize = 2,
  particleOpacity = 0.75,
  speed = 1,
  noiseScale = 0.0018,
  noiseStrength = 0.03,
  damping = 0.965,
  lifespan = 180,
  showImage = true,
  imageOpacity = 0.5,
  cursorInteraction = true,
  cursorStrength = 0.045,
  cursorRadius = 85,
  imageFit = 0.92,
  dpr = [1, 1.5],
  paused = false,
}: ParticleImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const source = useSourceImage(imageUrl);
  const inView = useInView(containerRef);

  if (!source) {
    return (
      <div
        ref={containerRef}
        className={className}
        style={{ width, height, opacity: 0 }}
      />
    );
  }

  return (
    <div ref={containerRef} className={className} style={{ width, height }}>
      <Canvas
        dpr={dpr}
        gl={{
          alpha: true,
          antialias: false,
          powerPreference: "high-performance",
          preserveDrawingBuffer: false,
        }}
        camera={{ position: [0, 0, 1] }}
        style={{ width: "100%", height: "100%" }}
      >
        <ParticleField
          source={source}
          particleCount={particleCount}
          particleSize={particleSize}
          particleOpacity={particleOpacity}
          speed={speed}
          noiseScale={noiseScale}
          noiseStrength={noiseStrength}
          damping={damping}
          lifespan={lifespan}
          showImage={showImage}
          imageOpacity={imageOpacity}
          cursorInteraction={cursorInteraction}
          cursorStrength={cursorStrength}
          cursorRadius={cursorRadius}
          imageFit={imageFit}
          paused={paused || !inView}
        />
      </Canvas>
      {children}
    </div>
  );
}

export default ParticleImage;
