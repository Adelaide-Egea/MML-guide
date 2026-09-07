import type { NextConfig } from 'next';

const config: NextConfig = {
  // @mml/core ships TypeScript source rather than a build artifact. There is one
  // copy of the domain model and it is the one the tests run against.
  transpilePackages: ['@mml/core'],
  outputFileTracingRoot: `${import.meta.dirname}/../..`,
  eslint: { ignoreDuringBuilds: true },
};

export default config;
