/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  turbopack: {},
  webpack: (config, { isServer }) => {
    // Handle WASM files
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    })

    config.output.webassemblyModuleFilename = 'static/wasm/[modulehash].wasm'
    config.experiments = { ...config.experiments, asyncWebAssembly: true }

    // Don't bundle WASM on server
    if (isServer) {
      config.externals = [...(config.externals || []), '@lightprotocol/hasher.rs', 'privacycash']
    }

    return config
  },
}

export default nextConfig
