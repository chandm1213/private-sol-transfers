const fs = require('fs');
const path = require('path');

// Copy WASM files to correct location
const srcDir = path.join(__dirname, '../node_modules/@lightprotocol/hasher.rs/dist');
const destDir = path.join(__dirname, '../node_modules/@lightprotocol/hasher.rs/dist/browser-fat/es');

try {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const wasmFiles = ['hasher_wasm_simd_bg.wasm', 'light_wasm_hasher_bg.wasm'];
  
  wasmFiles.forEach(file => {
    const src = path.join(srcDir, file);
    const dest = path.join(destDir, file);
    
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`[v0] Copied ${file} to browser-fat/es/`);
    }
  });
} catch (error) {
  console.warn('[v0] WASM setup warning:', error.message);
}
