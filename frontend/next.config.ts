const BACKEND = process.env.BACKEND_URL;

export default {
  async rewrites() {
    return [
      {
        source: "/api/:path*", destination: `${BACKEND}/:path*`
      },
    ];
  },
};
