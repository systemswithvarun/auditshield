import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/onboard`);
  }

  const response = NextResponse.redirect(`${origin}/auth/confirm`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  console.log('CALLBACK DEBUG - exchange result:', {
    hasSession: !!data?.session,
    hasUser: !!data?.user,
    error: error?.message || null,
  });

  // Log what cookies were set on the response
  const setCookies = response.headers.getSetCookie();
  console.log('CALLBACK DEBUG - cookies being set:', setCookies.length, 'cookies');

  return response;
}