/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // `shared/` lives outside this app's directory and is imported via the
  // `@shared/*` tsconfig path alias (see tsconfig.json) rather than as an
  // installed package — Next just bundles it like any other source file,
  // no extra config needed.
};

export default nextConfig;
