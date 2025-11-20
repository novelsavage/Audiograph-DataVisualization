/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // For static export (GitHub Pages)
  images: {
    unoptimized: true, // Required for static export
  },
  trailingSlash: true,
}

module.exports = nextConfig

