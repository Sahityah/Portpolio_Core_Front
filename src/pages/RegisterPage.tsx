// src/pages/RegisterPage.tsx

import React, { useState } from 'react';
import useAuthStore from '@/store/useAuthStore'; // Adjust this path if your useAuthStore is elsewhere
import { Button } from '@/components/ui/button'; // Example UI components (adjust paths as needed)
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const RegisterPage: React.FC = () => {
  // Correctly use the hook to get auth functions and state
  const { register, loginWithGoogle, isAuthenticated } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(name, email, password);
      // Optional: Redirect to dashboard or show success message on successful registration
      // navigate('/dashboard'); // If you're using useNavigate from react-router-dom
      console.log('Registration successful!');
    } catch (err: any) {
      console.error('Registration failed:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      // In a real application, you'd trigger the Google One Tap/OAuth flow here
      // and get the credential. For this example, we'll use a mock credential.
      await loginWithGoogle("mock_google_credential_from_ui");
      console.log('Google login successful!');
    } catch (err: any) {
      console.error('Google login failed:', err);
      setError(err.message || 'Google login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // If already authenticated, perhaps redirect or show different content
  if (isAuthenticated) {
    // return <p>You are already logged in!</p>; // Or redirect via navigate('/dashboard')
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6">Register</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              required
              className="mt-1 block w-full"
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="mt-1 block w-full"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="mt-1 block w-full"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t"></span>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">Or continue with</span>
          </div>
        </div>

        <Button
          className="w-full bg-blue-500 hover:bg-blue-600 text-white"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          {loading ? 'Signing in with Google...' : 'Sign in with Google'}
        </Button>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account? <a href="/login" className="text-blue-600 hover:underline">Login</a>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
