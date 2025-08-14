/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    // Add CloudFront domain when available
    // domains: ['localhost', 'your-cloudfront-domain.cloudfront.net'],
  },
  transpilePackages: ['@shared/types', '@shared/schemas'],
}

module.exports = nextConfig
