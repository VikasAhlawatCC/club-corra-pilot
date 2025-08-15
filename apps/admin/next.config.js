/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    // Add CloudFront domain when available
    // domains: ['localhost', 'your-cloudfront-domain.cloudfront.net'],
  },
}

module.exports = nextConfig
