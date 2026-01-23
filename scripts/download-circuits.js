const fs = require('fs');
const path = require('path');
const https = require('https');

const circuitDir = path.join(__dirname, '../public/circuit2');

// Create circuit2 directory if it doesn't exist
if (!fs.existsSync(circuitDir)) {
  fs.mkdirSync(circuitDir, { recursive: true });
}

const files = [
  {
    name: 'circuit2.wasm',
    url: 'https://raw.githubusercontent.com/Privacy-Cash/privacy-cash-sdk/main/circuit2/circuit2.wasm',
  },
  {
    name: 'circuit2.zkey',
    url: 'https://raw.githubusercontent.com/Privacy-Cash/privacy-cash-sdk/main/circuit2/circuit2.zkey',
  },
];

async function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https
      .get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          downloadFile(response.headers.location, filepath).then(resolve).catch(reject);
        } else if (response.statusCode !== 200) {
          reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        } else {
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve();
          });
        }
      })
      .on('error', (err) => {
        fs.unlink(filepath, () => {});
        reject(err);
      });
  });
}

async function main() {
  console.log('Downloading Privacy Cash circuit files...');
  
  for (const file of files) {
    const filepath = path.join(circuitDir, file.name);
    
    // Skip if file already exists and has size
    if (fs.existsSync(filepath) && fs.statSync(filepath).size > 1000) {
      console.log(`✓ ${file.name} already exists`);
      continue;
    }
    
    try {
      console.log(`Downloading ${file.name}...`);
      await downloadFile(file.url, filepath);
      console.log(`✓ Downloaded ${file.name}`);
    } catch (error) {
      console.warn(`⚠ Warning: Could not download ${file.name}:`, error.message);
      console.warn('Note: Circuit files can be downloaded manually from:');
      console.warn('https://github.com/Privacy-Cash/privacy-cash-sdk/tree/main/circuit2');
      // Don't exit with error - allow build to continue
      // The circuit files will be loaded at runtime if available
    }
  }
  
  console.log('✓ Circuit file check complete');
}

main();
