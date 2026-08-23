// @xenova/transformers (used for local RAG embeddings, see lib/embeddings.ts) picks its
// ONNX backend by unconditionally importing both onnxruntime-node and onnxruntime-web,
// then selecting onnxruntime-node whenever `process.release.name === 'node'` — true on
// Vercel's serverless Node.js runtime. onnxruntime-node ships a prebuilt native binary
// (libonnxruntime.so) that Vercel's deployed function can't load ("cannot open shared
// object file"), crashing every /api/chat request. Aliasing onnxruntime-node to
// onnxruntime-web makes every environment (including Vercel) use the pure WASM backend
// instead, which has no native binary dependency and needs no bundler-tracing support.
const ONNX_ALIAS = { 'onnxruntime-node': 'onnxruntime-web' };

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    resolveAlias: ONNX_ALIAS,
  },
  webpack: (config) => {
    config.resolve.alias = { ...config.resolve.alias, ...ONNX_ALIAS };
    return config;
  },
};

export default nextConfig;
