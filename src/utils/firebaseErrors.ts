import { FirebaseError } from 'firebase/app';

/**
 * Maps Firebase Auth error codes to user-friendly error messages
 */
export const getFirebaseErrorMessage = (error: unknown): string => {
  if (!(error instanceof FirebaseError)) {
    return 'An unexpected error occurred. Please try again.';
  }

  const errorCode = error.code;

  switch (errorCode) {
    // Sign In Errors
    case 'auth/invalid-email':
      return 'Invalid email address format.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check your credentials.';

    // Sign Up Errors
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is not enabled. Please contact support.';

    // Password Reset Errors
    case 'auth/missing-email':
      return 'Please provide an email address.';
    case 'auth/expired-action-code':
      return 'This password reset link has expired. Please request a new one.';
    case 'auth/invalid-action-code':
      return 'Invalid or expired password reset link.';

    // Profile Update Errors
    case 'auth/requires-recent-login':
      return 'This action requires recent authentication. Please sign in again.';

    // Network Errors
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';

    // Token Errors
    case 'auth/invalid-id-token':
      return 'Your session has expired. Please sign in again.';
    case 'auth/id-token-expired':
      return 'Your session has expired. Please sign in again.';

    // SSO Errors
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email using a different sign-in method.';
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked. Please allow popups for this site.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled. Please try again.';
    case 'auth/cancelled-popup-request':
      return 'Only one sign-in popup is allowed at a time.';

    // Email Verification Errors
    case 'auth/invalid-verification-code':
      return 'Invalid verification code.';
    case 'auth/invalid-verification-id':
      return 'Invalid verification ID.';

    // Multi-factor Auth Errors
    case 'auth/missing-multi-factor-info':
      return 'Multi-factor authentication is required.';
    case 'auth/multi-factor-auth-required':
      return 'Please complete multi-factor authentication.';

    // Generic Errors
    case 'auth/internal-error':
      return 'An internal error occurred. Please try again.';
    case 'auth/invalid-api-key':
      return 'Invalid API key configuration. Please contact support.';
    case 'auth/app-deleted':
      return 'Firebase app has been deleted. Please contact support.';

    default:
      // Log unknown errors for debugging
      console.error('Unknown Firebase error:', errorCode, error.message);
      return 'An unexpected error occurred. Please try again.';
  }
};

/**
 * Type guard to check if an error is a Firebase error
 */
export const isFirebaseError = (error: unknown): error is FirebaseError => {
  return error instanceof FirebaseError;
};

/**
 * Extracts a user-friendly message from any error
 */
export const getErrorMessage = (error: unknown): string => {
  if (isFirebaseError(error)) {
    return getFirebaseErrorMessage(error);
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
};
