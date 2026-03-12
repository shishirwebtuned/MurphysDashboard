// Firebase configuration has been removed.
// The application now uses backend authentication with JWT tokens.
// Tokens are stored in localStorage and sent via axios interceptors.

// All authentication is handled by:
// - Backend API at /auth endpoints
// - axios interceptor (lib/axios.ts) for token management
// - localStorage for token persistence

export default null;
