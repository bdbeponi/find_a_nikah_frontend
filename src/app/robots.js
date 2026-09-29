// Nothing here is for the public: the whole site is a staff tool. A blanket
// disallow is the honest robots.txt for it, and there is no sitemap to point at.
export default function robots() {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
