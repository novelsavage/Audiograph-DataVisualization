/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercelでは通常のNext.jsデプロイが推奨されます
  // output: 'export' は静的エクスポート用（GitHub Pagesなど）
  // Vercelではコメントアウトして通常のデプロイを使用
  // output: 'export',
  images: {
    unoptimized: true, // 静的エクスポートを使用する場合は必要
  },
  trailingSlash: true,
}

module.exports = nextConfig

