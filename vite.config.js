import { defineConfig } from 'vite';

// base: './' so the built bundle works from any subpath (GitHub Pages project sites,
// Vercel, S3, a plain folder). No absolute asset paths, no server assumptions.
export default defineConfig({
  base: './',
  server: {
    host: '0.0.0.0',
    port: 5173,
    // The Arena preview proxies the dev server from a *.e2b.app origin, so the
    // host allowlist must not reject it.
    allowedHosts: true
    // NB: no `hmr.clientPort` override here. Pinning it to 443 breaks plain
    // http://localhost and any proxy that forwards on a different port. Vite's
    // default (derive from location) is correct for both the preview and local.
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    assetsInlineLimit: 8192
  }
});
