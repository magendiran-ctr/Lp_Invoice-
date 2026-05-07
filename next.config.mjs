// next.config.mjs (CORRECTED)

/** @type {import('next').NextConfig} */
const nextConfig = {
    // 1. Output Mode: Essential for Vercel/serverless deployments involving native modules.
    output: 'standalone', 

    // 2. NEW Configuration: CRITICAL for listing large external packages, moved out of 'experimental'.
    serverExternalPackages: [ // <-- CORRECTED PROPERTY NAME
        '@sparticuz/chromium', 
        'puppeteer-core', 
        'jszip',
        'xlsx',
    ],
};

// Use ES Module export syntax
export default nextConfig;