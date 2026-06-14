import { useState } from 'react';
import { Mail, Lock, LogIn, UserPlus, User } from 'lucide-react';
import { auth } from '../../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  setPersistence,
  browserSessionPersistence,
  browserLocalPersistence,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
      setError('');
      alert('Password reset email sent! Check your inbox.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);

      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-space)] p-4">
      <div className="surface-card w-full max-w-md p-8 flex flex-col gap-6 animate-[slideUp_180ms_ease-out]">
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-br from-[var(--accent-violet)] to-[var(--text-main)] text-transparent bg-clip-text">
            {isRegistering ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-2">
            {isRegistering
              ? 'Sign up to start tracking your finances securely.'
              : 'Log in to access your personal dashboard.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          {error && (
            <div className="bg-[var(--status-red)]/10 text-[var(--status-red)] p-3 rounded-xl text-sm font-medium border border-[var(--status-red)]/20 animate-[popIn_200ms_ease-out]">
              {error}
            </div>
          )}

          {isRegistering && (
            <div className="flex flex-col gap-1.5 relative">
              <label className="text-xs text-[var(--text-muted)] font-medium ml-1">Full Name</label>
              <div className="relative flex items-center">
                <User
                  className="absolute left-4 text-[var(--text-muted)] pointer-events-none"
                  size={18}
                />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-[var(--bg-surface-lit)] border border-transparent focus:border-[var(--accent-violet)] rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5 relative">
            <label className="text-xs text-[var(--text-muted)] font-medium ml-1">
              Email Address
            </label>
            <div className="relative flex items-center">
              <Mail
                className="absolute left-4 text-[var(--text-muted)] pointer-events-none"
                size={18}
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-[var(--bg-surface-lit)] border border-transparent focus:border-[var(--accent-violet)] rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 relative">
            <label className="text-xs text-[var(--text-muted)] font-medium ml-1">Password</label>
            <div className="relative flex items-center">
              <Lock
                className="absolute left-4 text-[var(--text-muted)] pointer-events-none"
                size={18}
              />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[var(--bg-surface-lit)] border border-transparent focus:border-[var(--accent-violet)] rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none transition-colors"
              />
            </div>
            {!isRegistering && (
              <button
                type="button"
                onClick={handleResetPassword}
                className="text-xs text-[var(--accent-violet)] font-bold self-end hover:underline mt-1"
              >
                Forgot Password?
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1 px-1">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-[var(--accent-violet)] focus:ring-[var(--accent-violet)] cursor-pointer"
            />
            <label htmlFor="rememberMe" className="text-sm text-[var(--text-muted)] cursor-pointer">
              Remember me
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full py-3.5 rounded-xl bg-[var(--accent-violet)] text-white font-bold flex justify-center items-center gap-2 shadow-lg shadow-[var(--accent-glow)] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : isRegistering ? (
              <>
                <UserPlus size={18} /> Sign Up
              </>
            ) : (
              <>
                <LogIn size={18} /> Log In
              </>
            )}
          </button>
        </form>

        <div className="text-center text-sm text-[var(--text-muted)] mt-2">
          {isRegistering ? 'Already have an account? ' : "Don't have an account? "}
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
            }}
            className="text-[var(--accent-violet)] font-bold hover:underline"
          >
            {isRegistering ? 'Log In' : 'Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
}
