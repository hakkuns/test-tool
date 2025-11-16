import { build } from 'esbuild'

await build({
  entryPoints: ['src/server.ts'],
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  outfile: 'dist/server.js',
  packages: 'external',
  sourcemap: true,
  minify: false,
})

console.log('✅ Build completed successfully')
