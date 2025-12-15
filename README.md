# Supabase Client-Side Authentication Template

A production-ready Next.js template with Supabase client-side authentication, featuring email/password authentication, OAuth (Google, GitHub, Facebook), Redux Toolkit state management, and XState form machines.

## 🚀 Features

- **Email/Password Authentication** - Registration and login with email confirmation
- **OAuth Providers** - Google, GitHub, and Facebook SSO integration
- **State Management** - Redux Toolkit for global auth state
- **Form Management** - XState machines for login and registration flows
- **Route Protection** - HOC component for protecting authenticated routes
- **Persistent Sessions** - User state persists across page refreshes via localStorage
- **User Profiles** - Automatic profile creation in `users-profile` table
- **Modern UI** - Tailwind CSS with dark mode support
- **TypeScript** - Fully typed for better developer experience

## 📋 Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Supabase account and project
- Environment variables configured

## 🛠️ Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd supabase-client-side-auth
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

### 3. Supabase Database Setup

Run the SQL in `RLS_POLICIES.sql` in your Supabase SQL Editor to:
- Create the `users-profile` table
- Set up Row Level Security (RLS) policies
- Enable proper permissions for user profile operations

### 4. Configure OAuth Providers (Optional)

In your Supabase Dashboard:
1. Go to Authentication → Providers
2. Enable and configure Google, GitHub, and/or Facebook
3. Add authorized redirect URLs: `http://localhost:3000/auth/callback` (development)
4. Add production URL when deploying

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 📁 Project Structure

```
├── app/
│   ├── (public)/              # Public route group (with Navigation)
│   │   ├── layout.tsx        # Public layout with Navigation
│   │   ├── page.tsx          # Home page
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/             # Protected dashboard routes
│   │   ├── layout.tsx        # Dashboard layout (protected)
│   │   └── page.tsx          # Dashboard page
│   ├── auth/
│   │   └── callback/         # OAuth callback route
│   ├── App.tsx               # Root app component (Redux Provider)
│   └── layout.tsx            # Root layout
├── components/
│   ├── Navigation.tsx        # Main navigation (public pages)
│   ├── SSOButtons.tsx        # OAuth provider buttons
│   └── withAuth.tsx          # HOC for route protection
├── machines/
│   ├── LoginMachine.tsx     # XState machine for login
│   └── RegisterMachine.tsx  # XState machine for registration
├── services/
│   ├── auth.service.ts      # Authentication services
│   └── user.service.ts       # User profile services
├── store/
│   ├── features/
│   │   └── AuthReducer.tsx   # Redux auth slice
│   └── store.ts              # Redux store configuration
└── types/
    └── index.ts              # TypeScript type definitions
```

## 🔐 Authentication Flow

### Registration Flow
1. User fills registration form
2. Account created in Supabase Auth
3. Confirmation email sent (if enabled)
4. User clicks confirmation link → redirected to `/auth/callback`
5. Profile created in `users-profile` table
6. User redirected to dashboard

### Login Flow
1. User enters credentials
2. Supabase authenticates user
3. User profile fetched from `users-profile` table
4. Profile stored in Redux and localStorage
5. User redirected to dashboard

### OAuth Flow (SSO)
1. User clicks OAuth provider button
2. Redirected to provider (Google/GitHub/Facebook)
3. User authorizes application
4. Redirected back to `/auth/callback`
5. Profile created/updated in `users-profile` table
6. User redirected to dashboard

## 🛡️ Route Protection

Use the `withAuth` HOC to protect routes that require authentication:

```tsx
import withAuth from '@/components/withAuth';

function MyProtectedPage() {
  return <div>Protected Content</div>;
}

export default withAuth(MyProtectedPage);
```

The HOC will:
- Check if user has a valid Supabase session
- Fetch user profile if not in Redux state
- Redirect to `/login` if not authenticated
- Show loading state while checking authentication

### Protecting Layouts

```tsx
// app/dashboard/layout.tsx
import withAuth from '@/components/withAuth';

function DashboardLayoutContent({ children }) {
  // Your layout code
}

export default withAuth(DashboardLayoutContent);
```

## 📦 Key Dependencies

- **Next.js 16** - React framework
- **Supabase** - Authentication and database
- **Redux Toolkit** - State management
- **XState** - State machines for forms
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 📝 Database Schema

### `users-profile` Table

```sql
CREATE TABLE public."users-profile" (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  username TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);
```

## 🔒 Security Features

- Row Level Security (RLS) policies on `users-profile` table
- Server-side session validation
- Client-side route protection
- Secure token storage
- CSRF protection via Supabase

## 🎨 Customization

### Adding New OAuth Providers

1. Enable provider in Supabase Dashboard
2. Add provider button in `components/SSOButtons.tsx`
3. Add service function in `services/auth.service.ts`

### Styling

- Modify `app/globals.css` for global styles
- Update Tailwind config for theme customization
- Dark mode is enabled by default

## 🐛 Troubleshooting

### RLS Policy Errors

If you see "row-level security policy" errors:
1. Run the SQL in `RLS_POLICIES.sql` in Supabase SQL Editor
2. Ensure policies are created correctly
3. Check that `auth.uid()` matches the user's ID

### OAuth Redirect Issues

- Ensure redirect URLs are whitelisted in Supabase Dashboard
- Check that `/auth/callback` route is accessible
- Verify environment variables are set correctly

### Profile Not Created

- Check browser console for errors
- Verify RLS policies allow INSERT operations
- Ensure `users-profile` table exists
- Check Supabase logs for detailed error messages

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [XState Documentation](https://xstate.js.org/docs/)

## 📄 License

This template is provided as-is for use in your projects.

## 🤝 Contributing

This is a template project. Feel free to fork and customize for your needs.

---

**Note:** This template uses client-side authentication. For production applications with sensitive data, consider implementing additional server-side validation and security measures.
