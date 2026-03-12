# Firebase Authentication Token Persistence Fix

## Problem
- Authentication token was not being sent to the backend
- Token was lost on page refresh
- API calls failed with 401 Unauthorized errors

## Root Causes
1. **No Auth Persistence**: Firebase auth wasn't configured to persist across page refreshes
2. **Race Condition**: Axios interceptor tried to get token before Firebase auth state was ready
3. **No Token Refresh**: Token wasn't being force-refreshed to ensure validity

## Solutions Implemented

### 1. Firebase Auth Persistence (`app/config/firebase.ts`)
```typescript
import { setPersistence, browserLocalPersistence } from "firebase/auth";

// Set persistence to LOCAL so auth state persists across page refreshes
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error('Error setting auth persistence:', error);
  });
}
```

**What this does:**
- Saves authentication state to browser's localStorage
- Auth persists even after closing browser tab
- User stays logged in across page refreshes

### 2. Wait for Auth State Ready (`lib/axios.ts`)
```typescript
import { onAuthStateChanged } from 'firebase/auth';

let authStateReady = false;
let authReadyPromise: Promise<void> | null = null;

const waitForAuthReady = () => {
  if (authStateReady) {
    return Promise.resolve();
  }
  
  if (!authReadyPromise) {
    authReadyPromise = new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, () => {
        authStateReady = true;
        unsubscribe();
        resolve();
      });
    });
  }
  
  return authReadyPromise;
};

// In request interceptor
axiosInstance.interceptors.request.use(
  async (config) => {
    // Wait for auth state to be ready
    await waitForAuthReady();
    
    const user = auth.currentUser;
    if (user) {
      // Force refresh token to ensure it's valid
      const token = await user.getIdToken(true);
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }
);
```

**What this does:**
- Waits for Firebase to fully initialize auth state before making requests
- Prevents race condition where axios tries to get token before user is loaded
- Force refreshes token to ensure it's valid and not expired

### 3. Enhanced Login Flow (`app/(auth)/login/page.tsx`)
```typescript
const handleLogin = async (values, { setSubmitting, setStatus }) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
    
    // Wait for Firebase to set the token and ensure it's available
    const user = userCredential.user;
    await user.getIdToken(true); // Force token refresh
    
    // Small delay to ensure token is properly set in axios interceptor
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Now make API calls - token will be included
    const response = await axiosInstance.get('/profiles', {
      params: { email: values.email }
    });
    
    // ... rest of the code
  } catch (err) {
    setStatus({ error: "Invalid credentials. Please try again." });
  }
};
```

**What this does:**
- Gets token immediately after login
- Waits for token to be set in axios interceptor
- Ensures first API call after login has the token

### 4. Custom Auth Hook (`hooks/use-auth.ts`)
```typescript
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading, isAuthenticated: !!user };
};
```

**What this does:**
- Provides a reusable hook to check auth state in components
- Returns loading state to prevent rendering before auth is ready
- Can be used to protect routes and show loading states

## How to Use

### In Components
```typescript
import { useAuth } from '@/hooks/use-auth';

function MyComponent() {
  const { user, loading, isAuthenticated } = useAuth();
  
  if (loading) {
    return <SpinnerComponent />;
  }
  
  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }
  
  // Component code - API calls will now include token
  return <div>...</div>;
}
```

### Making API Calls
```typescript
import axiosInstance from '@/lib/axios';

// Token is automatically added to all requests
const response = await axiosInstance.get('/profiles');
const data = await axiosInstance.post('/roles', roleData);
```

## Testing the Fix

1. **Login Test**
   - Login to the application
   - Check browser console - should see "Token added to request"
   - Check Network tab - Authorization header should have "Bearer [token]"

2. **Refresh Test**
   - After logging in, refresh the page
   - Should remain logged in
   - API calls should still work with token

3. **Token Expiry Test**
   - Token auto-refreshes on each request
   - If token expires, user sees "session expired" message
   - Can be configured to auto-refresh or redirect to login

## Debugging

### Check if token is being sent:
```typescript
// In browser console after making API call
// Check Network tab → Headers → Authorization
// Should see: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Check Firebase auth state:
```typescript
import { auth } from '@/app/config/firebase';

// In browser console
console.log('Current user:', auth.currentUser);
console.log('Email:', auth.currentUser?.email);
auth.currentUser?.getIdToken().then(token => console.log('Token:', token));
```

### Common Issues

1. **Still getting 401 errors**
   - Check if Firebase is initialized: `console.log(auth.currentUser)`
   - Verify API_URL environment variable is set
   - Check backend is validating Firebase tokens correctly

2. **Token not persisting**
   - Check localStorage has Firebase auth data
   - Verify `setPersistence` is called before signIn
   - Check browser allows localStorage (not in incognito with restrictions)

3. **Race condition still occurring**
   - Increase delay in login flow: `setTimeout(resolve, 1000)`
   - Add loading state to components using useAuth hook
   - Check Network tab to see request order

## Environment Variables Required

```env
NEXT_PUBLIC_API_URL=https://your-backend-api.com/api
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...
```

## Summary

✅ Auth state now persists across page refreshes
✅ Token is automatically added to all axios requests
✅ Token is force-refreshed to ensure validity
✅ Race conditions are prevented by waiting for auth ready
✅ Better error handling and logging for debugging
