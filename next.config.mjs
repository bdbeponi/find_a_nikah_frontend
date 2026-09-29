/** @type {import('next').NextConfig} */
const nextConfig = {
  // Lets a production build go somewhere other than .next, so building never
  // pulls the rug out from under a dev server running in another terminal.
  distDir: process.env.NEXT_DIST_DIR || ".next",

  images: {
    // An upload never changes under its name - every one gets a fresh uuid -
    // so an optimised copy can be kept for a month instead of the default
    // minute. Saves re-encoding the same picture all day and lets browsers and
    // any CDN in front hold on to it.
    minimumCacheTTL: 2678400,

    // Next 16 will only serve the qualities listed here.
    qualities: [75, 80],

    remotePatterns: [
      {
        // Any port: the backend moves around in development and a mismatch
        // here fails the whole page, not just the image.
        protocol: "http",
        hostname: "localhost",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "backend.findanikah.com",
        pathname: "/**",
      },
      // The image bucket, when one is configured. next/image refuses to
      // optimise a host it has not been told about.
      ...(process.env.NEXT_PUBLIC_IMAGE_HOST
        ? [
            {
              protocol: "https",
              hostname: process.env.NEXT_PUBLIC_IMAGE_HOST,
              pathname: "/**",
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
