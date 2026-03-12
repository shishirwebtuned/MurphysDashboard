// Firebase Firestore operations have been removed.
// User data is now managed through the backend API.
// All user operations should be done via axiosInstance calls to the backend.

export interface NewUser {
  email: string;
  createdAt?: Date;
}

// This file is deprecated - use backend API directly instead
export async function createUserInFirestore(user: NewUser) {
  throw new Error(
    "Firebase Firestore is no longer used. Use backend API instead.",
  );
}
