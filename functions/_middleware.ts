export const onRequest: PagesFunction[] = [
  async (context) => {
    const { request, next } = context;
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      return handleApiRequest(context);
    }

    return next();
  },
];

async function handleApiRequest(context: any) {
  const { request } = context;
  const url = new URL(request.url);

  if (url.pathname === '/api/health') {
    return new Response(
      JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  if (url.pathname === '/api/config') {
    return new Response(
      JSON.stringify({
        environment: context.env.ENVIRONMENT || 'production',
        version: '1.0.0',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  return new Response('Not Found', { status: 404 });
}
