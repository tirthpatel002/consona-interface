declare module "*?raw" {
  const content: string;
  export default content;
}

declare module "*.wgsl" {
  const content: string;
  export default content;
}

// Minimal ambient WebGPU interface declarations
declare global {
  interface NavigatorGPU {
    readonly gpu?: GPU;
  }

  interface Navigator extends NavigatorGPU {}

  interface GPU {
    requestAdapter(options?: GPURequestAdapterOptions): Promise<GPUAdapter | null>;
    getPreferredCanvasFormat(): GPUTextureFormat;
  }

  interface GPURequestAdapterOptions {
    powerPreference?: "low-power" | "high-performance";
    forceFallbackAdapter?: boolean;
  }

  interface GPUAdapter {
    requestDevice(descriptor?: GPUDeviceDescriptor): Promise<GPUDevice>;
  }

  interface GPUDeviceDescriptor {
    label?: string;
    requiredFeatures?: GPUFeatureName[];
    requiredLimits?: Record<string, number>;
  }

  type GPUFeatureName = string;
  type GPUTextureFormat = string;

  interface GPUDevice extends EventTarget {
    readonly queue: GPUQueue;
    readonly lost: Promise<{ reason?: string; message?: string }>;
    createShaderModule(descriptor: { label?: string; code: string }): GPUShaderModule;
    createRenderPipeline(descriptor: any): GPURenderPipeline;
    createBuffer(descriptor: {
      label?: string;
      size: number;
      usage: number;
      mappedAtCreation?: boolean;
    }): GPUBuffer;
    createBindGroup(descriptor: any): GPUBindGroup;
    createTexture(descriptor: any): GPUTexture;
    createSampler(descriptor?: any): GPUSampler;
    createCommandEncoder(descriptor?: { label?: string }): GPUCommandEncoder;
    destroy(): void;
  }

  interface GPUQueue {
    writeBuffer(
      buffer: GPUBuffer,
      bufferOffset: number,
      data: BufferSource | SharedArrayBuffer,
      dataOffset?: number,
      size?: number,
    ): void;
    submit(commandBuffers: GPUCommandBuffer[]): void;
  }

  interface GPUShaderModule {
    getCompilationInfo(): Promise<GPUCompilationInfo>;
  }

  interface GPUCompilationInfo {
    readonly messages: readonly GPUCompilationMessage[];
  }

  interface GPUCompilationMessage {
    readonly message: string;
    readonly type: "error" | "warning" | "info";
    readonly lineNum: number;
    readonly linePos: number;
  }

  interface GPUBuffer {
    destroy(): void;
  }

  interface GPUTexture {
    createView(descriptor?: any): GPUTextureView;
    destroy(): void;
  }

  interface GPUTextureView {}
  interface GPUSampler {}
  interface GPUBindGroup {}
  interface GPURenderPipeline {
    getBindGroupLayout(index: number): GPUBindGroupLayout;
  }
  interface GPUBindGroupLayout {}
  interface GPUCommandBuffer {}

  interface GPUCommandEncoder {
    beginRenderPass(descriptor: any): GPURenderPassEncoder;
    finish(descriptor?: any): GPUCommandBuffer;
  }

  interface GPURenderPassEncoder {
    setPipeline(pipeline: GPURenderPipeline): void;
    setBindGroup(index: number, bindGroup: GPUBindGroup): void;
    draw(vertexCount: number, instanceCount?: number, firstVertex?: number, firstInstance?: number): void;
    end(): void;
  }

  interface GPUCanvasContext {
    configure(configuration: {
      device: GPUDevice;
      format: GPUTextureFormat;
      usage?: number;
      viewFormats?: GPUTextureFormat[];
      colorSpace?: "srgb" | "display-p3";
      alphaMode?: "opaque" | "premultiplied";
    }): void;
    unconfigure(): void;
    getCurrentTexture(): GPUTexture;
  }

  interface HTMLCanvasElement {
    getContext(contextId: "webgpu"): GPUCanvasContext | null;
  }

  const GPUBufferUsage: {
    readonly MAP_READ: number;
    readonly MAP_WRITE: number;
    readonly COPY_SRC: number;
    readonly COPY_DST: number;
    readonly INDEX: number;
    readonly VERTEX: number;
    readonly UNIFORM: number;
    readonly STORAGE: number;
    readonly INDIRECT: number;
    readonly QUERY_RESOLVE: number;
  };

  const GPUTextureUsage: {
    readonly COPY_SRC: number;
    readonly COPY_DST: number;
    readonly TEXTURE_BINDING: number;
    readonly STORAGE_BINDING: number;
    readonly RENDER_ATTACHMENT: number;
  };
}

export {};
