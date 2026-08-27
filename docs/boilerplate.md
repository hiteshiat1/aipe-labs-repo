---

### Part 2: The Modern Next.js AI Boilerplate

This is the standard 2026 stack optimized for solo founders and vibe coders: **Next.js (App Router), Supabase (Auth + DB), Tailwind CSS, shadcn/ui, and Vercel AI SDK.**

**1. The Directory Structure**
Have your students document this baseline architecture. It keeps frontend, backend API routes, and AI logic clearly separated.

```text
my-saas-app/
├── app/                      # Next.js App Router (Pages & Layouts)
│   ├── (auth)/               # Login, Register, Forgot Password
│   ├── (dashboard)/          # Protected user application area
│   │   ├── layout.tsx        # Dashboard shell (sidebar, nav)
│   │   └── page.tsx          # Main user dashboard
│   ├── api/                  # Backend Route Handlers
│   │   ├── ai/               # Claude/Gemini API endpoints
│   │   ├── stripe/           # Webhooks for payments
│   │   └── webhooks/         # General webhooks
│   ├── globals.css           # Global Tailwind styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Landing page
├── components/               # React Components
│   ├── ui/                   # shadcn/ui base components (buttons, inputs)
│   ├── marketing/            # Hero, Pricing, FAQ components
│   └── shared/               # Reusable app components
├── lib/                      # Utility functions & configs
│   ├── supabase/             # Database client & auth helpers
│   ├── stripe.ts             # Stripe client initialization
│   └── utils.ts              # Generic utilities (Tailwind merges, etc.)
├── types/                    # TypeScript interfaces
├── .env.local                # Local secrets (API keys, Supabase URLs)
├── components.json           # shadcn/ui configuration
├── next.config.mjs           # Next.js configuration
└── tailwind.config.ts        # Tailwind configuration

```

**2. The Setup Commands**
Students can run this sequence in their terminal to generate the exact boilerplate structure above:

1. **Initialize Next.js:**
`npx create-next-app@latest my-saas-app --typescript --tailwind --eslint --app`
2. **Add UI Components:**
`npx shadcn-ui@latest init`
3. **Add Database & Auth:**
`npm install @supabase/supabase-js @supabase/ssr`
4. **Add Payments & AI:**
`npm install stripe ai @ai-sdk/openai @ai-sdk/anthropic`


Here is the exact, step-by-step implementation for Supabase Authentication using the modern Next.js App Router and the `@supabase/ssr` package. This implementation uses HTTP-only cookies, Server Actions, and guarantees secure server-side verification.

1. **Install the Required Packages:** Uses the modern SSR library.
Run this in your terminal to install the Supabase JavaScript client and the Server-Side Rendering (SSR) helper package:

```bash
npm install @supabase/supabase-js @supabase/ssr

```


2. **Create the Client and Server Utilities:** Handles cookie management for both environments.
Create a `src/utils/supabase` folder (or `src/lib/supabase`). You need two distinct client initialization files.

**1. Create `src/utils/supabase/client.ts`:**

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

```

**2. Create `src/utils/supabase/server.ts`:**

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  )
}

```


3. **Set up Session Middleware:** Refreshes expired tokens automatically.
Middleware intercepts requests to keep the user's session alive and sync cookies before they hit your Server Components.

**1. Create `src/utils/supabase/middleware.ts`:**

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired
  await supabase.auth.getUser()

  return supabaseResponse
}

```

**2. Create `middleware.ts` in the root (same level as `src` or inside `src` depending on your setup):**

```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

```


4. **Create Auth Server Actions:** Handles form submissions securely.
Create `src/app/(auth)/login/actions.ts`. This uses Server Actions to process login, signup, and logout without requiring a dedicated API route.

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/login?message=Could not authenticate user')
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    redirect('/login?message=Could not authenticate user')
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard') // Or redirect to a "check your email" page
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

```


5. **Build the Login UI:** Calls the Server Actions.
Create `src/app/(auth)/login/page.tsx`. This is a standard Server Component wrapping a basic HTML form. If you are using Shadcn UI, you can easily swap out these native inputs for your styled components.

```tsx
import { login, signup } from './actions'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { message: string }
}) {
  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2">
      <form className="animate-in flex-1 flex flex-col w-full justify-center gap-2 text-foreground">
        <label className="text-md" htmlFor="email">
          Email
        </label>
        <input
          className="rounded-md px-4 py-2 bg-inherit border mb-6"
          name="email"
          placeholder="you@example.com"
          required
        />
        <label className="text-md" htmlFor="password">
          Password
        </label>
        <input
          className="rounded-md px-4 py-2 bg-inherit border mb-6"
          type="password"
          name="password"
          placeholder="••••••••"
          required
        />
        <button
          formAction={login}
          className="bg-green-700 rounded-md px-4 py-2 text-white mb-2"
        >
          Sign In
        </button>
        <button
          formAction={signup}
          className="border border-foreground/20 rounded-md px-4 py-2 text-foreground mb-2"
        >
          Sign Up
        </button>
        {searchParams?.message && (
          <p className="mt-4 p-4 bg-foreground/10 text-foreground text-center">
            {searchParams.message}
          </p>
        )}
      </form>
    </div>
  )
}

```


6. **Set Up the Callback Route:** Required for OAuth and Email Confirmations.
Create `src/app/auth/callback/route.ts`. When a user clicks a magic link or confirms their email, Supabase sends them back here with a token hash.

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // return the user to an error page with some instructions
  return NextResponse.redirect(`${origin}/login?message=Could not verify session`)
}

```

*(Note: To use email confirmation, you must go to your Supabase Dashboard Auth settings and update your email templates to point to `{{ .SiteURL }}/auth/callback?code={{ .TokenHash }}`)*


7. **Protect Your Application Routes:** Using getUser() for secure server verification.
Create a protected dashboard page at `src/app/(dashboard)/dashboard/page.tsx`. We rely on `getUser()` on the server to securely fetch the token and redirect unauthorized users, rather than checking client state.

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { signOut } from '@/app/(auth)/login/actions'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  // getUser() guarantees the session is verified with the Supabase API
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p className="mb-4">Welcome back, {user.email}</p>
      
      <form action={signOut}>
        <button className="bg-red-500 text-white px-4 py-2 rounded-md">
          Sign Out
        </button>
      </form>
    </div>
  )
}

```