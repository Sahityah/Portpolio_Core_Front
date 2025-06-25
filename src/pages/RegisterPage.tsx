// src/pages/RegisterPage.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for redirection
import useAuthStore from '@/store/useAuthStore'; // Adjust this path if your useAuthStore is elsewhere
import { Button } from '@/components/ui/button'; // Example UI components (adjust paths as needed)
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react'; // For show/hide password icon

// Define your Google OAuth constants
// !!! IMPORTANT: Replace these with your actual Client ID and Redirect URI from Google Cloud Console !!!
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID; // Your actual Google Client ID
const GOOGLE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI ; // Your backend endpoint to handle Google redirect
const GOOGLE_SCOPE = 'email profile'; // Scopes you are requesting
const GOOGLE_RESPONSE_TYPE = 'code'; // Requesting an authorization code (PKCE flow)

// For generating unique state parameter (recommended for CSRF protection)
// You might need to install 'uuid': npm install uuid
import { v4 as uuidv4 } from 'uuid';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate(); // Initialize navigate hook
  const { register, isAuthenticated } = useAuthStore(); // Removed loginWithGoogle from destructuring as it's not directly called here for initiation

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false); // State for password visibility

  // State for client-side validation errors
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Client-side validation logic
  const validateForm = () => {
    let isValid = true;
    setNameError(null);
    setEmailError(null);
    setPasswordError(null);

    if (!name.trim()) {
      setNameError('Name is required.');
      isValid = false;
    }

    if (!email.trim()) {
      setEmailError('Email is required.');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) { // Basic email regex
      setEmailError('Invalid email format.');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Password is required.');
      isValid = false;
    } else if (password.length < 6) { // Minimum password length
      setPasswordError('Password must be at least 6 characters long.');
      isValid = false;
    }

    return isValid;
  };

  const getPasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length > 5) strength++;
    if (pwd.length > 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++; // Special characters

    if (strength < 3) return { text: 'Weak', color: 'text-red-500' };
    if (strength < 5) return { text: 'Medium', color: 'text-yellow-500' };
    return { text: 'Strong', color: 'text-green-500' };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return; // Stop if client-side validation fails
    }

    setError(null);
    setLoading(true);
    try {
      await register(name, email, password);
      console.log('Registration successful!');
      navigate('/dashboard'); // Redirect to dashboard on successful registration
    } catch (err: any) {
      console.error('Registration failed:', err);
      // More specific error handling if backend sends distinct error codes/messages
      const errorMessage = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setError(null);
    // Setting loading state here is debatable as the browser is redirecting away,
    // but it can provide immediate visual feedback before redirect.
    setLoading(true);

    // Generate a random state parameter for CSRF protection
    const state = uuidv4();
    // Store the state in local storage to verify it upon return from Google
    localStorage.setItem('oauth_state', state);

    const params = new URLSearchParams({
      response_type: GOOGLE_RESPONSE_TYPE,
      client_id: GOOGLE_CLIENT_ID,
      scope: GOOGLE_SCOPE,
      redirect_uri: GOOGLE_REDIRECT_URI,
      state: state,
      // Optional: 'prompt=select_account' can be added to force account selection
      // Optional: 'access_type=offline' for obtaining a refresh token (requires proper backend handling)
    });

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    // Redirect the user's browser to Google's authentication page
    window.location.href = googleAuthUrl;

    // Note: The execution of JavaScript on this page stops after window.location.href,
    // as the browser navigates away. The authentication flow continues on your backend.
  };

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 font-inter">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-xl border border-gray-200">
        <h2 className="text-3xl font-extrabold text-center text-gray-800 mb-8">Create Your Account</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative mb-4 text-sm" role="alert">
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setNameError(null); }}
              placeholder="Your Name"
              required
              className={`mt-1 block w-full rounded-md border ${nameError ? 'border-red-500' : 'border-gray-300'} focus:ring-blue-500 focus:border-blue-500 shadow-sm p-2`}
            />
            {nameError && <p className="text-red-500 text-xs mt-1">{nameError}</p>}
          </div>
          <div>
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailError(null); }}
              placeholder="you@example.com"
              required
              className={`mt-1 block w-full rounded-md border ${emailError ? 'border-red-500' : 'border-gray-300'} focus:ring-blue-500 focus:border-blue-500 shadow-sm p-2`}
            />
            {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
          </div>
          <div>
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
            <div className="relative mt-1">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPasswordError(null); }}
                placeholder="Password"
                required
                className={`block w-full rounded-md border ${passwordError ? 'border-red-500' : 'border-gray-300'} focus:ring-blue-500 focus:border-blue-500 shadow-sm pr-10 p-2`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {passwordError && <p className="text-red-500 text-xs mt-1">{passwordError}</p>}
            {password && !passwordError && ( // Show strength only if password is typed and no error
              <p className={`text-xs mt-1 ${passwordStrength.color}`}>
                Password Strength: {passwordStrength.text}
              </p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow-md transition duration-300 ease-in-out transform hover:-translate-y-0.5"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register Account'}
          </Button>
        </form>

        <div className="relative my-7">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-300"></span>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">Or continue with</span>
          </div>
        </div>

        <Button
          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md shadow-md transition duration-300 ease-in-out transform hover:-translate-y-0.5 flex items-center justify-center"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Signing in with Google...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.75 1.22 9.24 3.23l6.53-6.53C34.62 3.82 29.38 1.5 24 1.5 15.5 1.5 8.24 6.94 4.5 14.5l6.51 5.02C12.16 13.91 17.5 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.7 24.5c0-1.57-.15-3.09-.43-4.59H24v8.58h12.43c-.77 4.09-3.08 7.45-6.19 9.68l6.19 4.79c3.67-3.4 6.13-8.52 6.13-14.71z"></path>
                <path fill="#FBBC04" d="M12.16 32.74c-.67-2.09-1.07-4.39-1.07-6.74s.4-4.65 1.07-6.74l-6.51-5.02C4.3 18.06 1.5 20.81 1.5 24.5s2.8 6.44 6.09 9.92l6.57-5.04z"></path>
                <path fill="#34A853" d="M24 47.5c6.54 0 12.06-2.14 16.08-5.83l-6.19-4.79c-2.92 1.93-6.69 3.12-9.89 3.12-6.5 0-11.84-4.41-14.5-10.91l-6.57 5.04c3.76 7.57 11.02 13.01 19.57 13.01z"></path>
              </svg>
              Sign in with Google
            </>
          )}
        </Button>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account? <a href="/login" className="text-blue-600 hover:underline font-medium">Login</a>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
