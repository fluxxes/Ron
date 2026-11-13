// Copyright (c) 2026 (RON). Developed by (fluxes) All rights reserved.

export async function onRequest(context: {
    request: Request;
    next: () => Promise<Response>;
  }): Promise<Response> {
    const response = await context.next();
    const headers = new Headers(response.headers);
  
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    headers.set('X-Frame-Options', 'DENY');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }