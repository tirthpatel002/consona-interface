/// <reference path="../webgpu.d.ts" />

import { styleFlowIndexes, type OrbParams } from "./presets";
import {
  createOrbTransitionController,
  type OrbRenderTarget,
} from "./orb-states";
import { orbUniformFloatCount, writeOrbUniforms } from "./orb-uniforms";
import { orbShaderSource } from "./shader-source";

export type OrbRendererOptions = {
  canvas: HTMLCanvasElement;
  getTarget: () => OrbRenderTarget;
  onError: (error: Error) => void;
  onReady: () => void;
};

export function createOrbRenderer({
  canvas,
  getTarget,
  onError,
  onReady,
}: OrbRendererOptions): () => void {
  let disposed = false;
  let animationFrame = 0;
  let device: GPUDevice | null = null;
  let readyNotified = false;
  let failed = false;
  let lastFrameAt: number | null = null;
  let motionPhase = 0;

  function fail(error: Error): void {
    if (disposed || failed) return;
    failed = true;
    cancelAnimationFrame(animationFrame);
    device?.destroy();
    onError?.(error);
  }

  async function start(): Promise<() => void> {
    if (!navigator.gpu) {
      throw new Error("WebGPU is not supported in this browser. Please enable WebGPU in chrome://flags or use a compatible browser.");
    }

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      throw new Error("No available WebGPU adapter found.");
    }

    device = await adapter.requestDevice();
    if (disposed) {
      device.destroy();
      return () => {};
    }

    const context = canvas.getContext("webgpu");
    if (!context) {
      throw new Error("Failed to acquire WebGPU canvas context.");
    }
    const gpuContext: GPUCanvasContext = context;

    const format = navigator.gpu.getPreferredCanvasFormat();
    gpuContext.configure({ device, format, alphaMode: "premultiplied" });

    const shader = device.createShaderModule({
      label: "consona-orb-glass-liquid",
      code: orbShaderSource,
    });
    const compilation = await shader.getCompilationInfo();
    const errors = compilation.messages.filter((m) => m.type === "error");
    if (errors.length > 0) {
      const details = errors
        .map((m) => `[line ${m.lineNum}, col ${m.linePos}] ${m.message}`)
        .join("; ");
      throw new Error(`WGSL compile errors: ${details}`);
    }

    const pipeline = device.createRenderPipeline({
      label: "consona-orb-pipeline",
      layout: "auto",
      vertex: {
        module: shader,
        entryPoint: "vs_main",
      },
      fragment: {
        module: shader,
        entryPoint: "fs_main",
        targets: [{
          format,
          blend: {
            color: {
              srcFactor: "one",
              dstFactor: "one-minus-src-alpha",
              operation: "add",
            },
            alpha: {
              srcFactor: "one",
              dstFactor: "one-minus-src-alpha",
              operation: "add",
            },
          },
        }],
      },
      primitive: { topology: "triangle-list" },
    });

    const values = new Float32Array(orbUniformFloatCount);
    const uniformBuffer = device.createBuffer({
      size: values.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    const bindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
    });

    const transition = createOrbTransitionController(getTarget());

    device.lost?.then?.((info: any) => {
      fail(new Error(`WebGPU device lost: ${info?.message || info?.reason || "unknown reason"}`));
    });
    device.addEventListener?.("uncapturederror", (event: any) => {
      event?.preventDefault?.();
      fail(new Error(`WebGPU error: ${event?.error?.message || "uncaptured"}`));
    });

    let isVisible = true;
    let isIntersecting = true;

    const resizeObserver = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver((entries) => {
          if (disposed) return;
          for (const entry of entries) {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const cr = entry.contentRect;
            const w = Math.max(1, Math.floor(cr.width * dpr));
            const h = Math.max(1, Math.floor(cr.height * dpr));
            if (canvas.width !== w || canvas.height !== h) {
              canvas.width = w;
              canvas.height = h;
            }
          }
        })
      : null;

    if (resizeObserver) {
      resizeObserver.observe(canvas);
    } else {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      canvas.height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
    }

    const intersectionObserver = typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver((entries) => {
          if (disposed) return;
          for (const entry of entries) {
            isIntersecting = entry.isIntersecting;
          }
        }, { threshold: 0.01 })
      : null;

    if (intersectionObserver) {
      intersectionObserver.observe(canvas);
    }

    const onVisibilityChange = () => {
      isVisible = typeof document !== "undefined" ? document.visibilityState === "visible" : true;
      if (isVisible && isIntersecting && !disposed && !failed && device) {
        lastFrameAt = performance.now();
      }
    };
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", onVisibilityChange);
    }

    function frame(now: number): void {
      if (disposed || failed || !device) return;

      // Always request next frame to keep ticking smoothly
      animationFrame = requestAnimationFrame(frame);

      // Skip GPU render pass if offscreen or tab hidden, but keep time delta coherent
      if (!isVisible || !isIntersecting || canvas.width <= 1 || canvas.height <= 1) {
        lastFrameAt = now;
        return;
      }

      try {
        const params = transition.sample(getTarget(), now);
        const deltaSec = lastFrameAt === null ? 0 : Math.min(0.1, Math.max(0, (now - lastFrameAt) / 1000));
        lastFrameAt = now;
        motionPhase += deltaSec * Math.max(params.speed, 0);
        const shaderTime = motionPhase / Math.max(params.speed, 0.001);

        writeOrbUniforms(
          values,
          canvas.width,
          canvas.height,
          shaderTime,
          params,
        );
        device.queue.writeBuffer(uniformBuffer, 0, values);

        const encoder = device.createCommandEncoder();
        const pass = encoder.beginRenderPass({
          colorAttachments: [{
            view: gpuContext.getCurrentTexture().createView(),
            clearValue: { r: 0, g: 0, b: 0, a: 0 },
            loadOp: "clear",
            storeOp: "store",
          }],
        });
        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bindGroup);
        pass.draw(3, 1, 0, 0);
        pass.end();
        device.queue.submit([encoder.finish()]);
        if (!readyNotified) {
          readyNotified = true;
          onReady?.();
        }
      } catch (error) {
        fail(error instanceof Error ? error : new Error(String(error)));
      }
    }

    animationFrame = requestAnimationFrame(frame);

    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisibilityChange);
      }
      try {
        uniformBuffer?.destroy();
      } catch {}
      device?.destroy();
    };
  }

  let stopRenderer: (() => void) | null = null;
  start()
    .then((stop) => {
      stopRenderer = stop;
    })
    .catch((error) => {
      fail(error instanceof Error ? error : new Error(String(error)));
    });

  return () => {
    disposed = true;
    cancelAnimationFrame(animationFrame);
    stopRenderer?.();
    device?.destroy();
  };
}
