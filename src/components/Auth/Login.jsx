import { useState } from 'react';
import { Mail, Lock, LogIn, UserPlus, User, WifiOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';


export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginOffline } = useAuth();
  const navigate = useNavigate();

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email);
      if (resetErr) throw resetErr;
      setSuccessMsg('Password reset email sent! Check your inbox.');
    } catch (err) {
      setError(err.message || 'Failed to send password reset email.');
    } finally {
      setLoading(false);
    }
  };

  const handleOfflineMode = () => {
    loginOffline({
      email: email || 'offline@user.local',
      displayName: name || email.split('@')[0] || 'Local User',
    });
    navigate('/');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (!navigator.onLine || !isSupabaseConfigured) {
        handleOfflineMode();
        return;
      }

      if (isRegistering) {
        const { data, error: signUpErr } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
          },
        });

        if (signUpErr) throw signUpErr;

        if (data?.session?.user) {
          const u = {
            uid: data.session.user.id,
            email: data.session.user.email,
            displayName: name,
          };
          localStorage.setItem('finance_user', JSON.stringify(u));
          navigate('/');
        } else if (data?.user) {
          setSuccessMsg(
            'Account registered successfully! Check your inbox to verify your email, then log in.'
          );
          setIsRegistering(false);
        }
      } else {
        const { data, error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInErr) {
          if (signInErr.message?.toLowerCase().includes('email not confirmed')) {
            throw new Error(
              'Email not confirmed yet. Please check your inbox and verify your email first.'
            );
          }
          throw signInErr;
        }

        if (data?.user) {
          const u = {
            uid: data.user.id,
            email: data.user.email,
            displayName: data.user.user_metadata?.full_name || '',
          };
          localStorage.setItem('finance_user', JSON.stringify(u));
          navigate('/');
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed. Please check your credentials.');
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
              ? 'Sign up to track & sync your personal finances.'
              : 'Log in to access your offline & cloud financial dashboard.'}
          </p>
        </div>


        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="bg-[var(--status-red)]/10 text-[var(--status-red)] p-3.5 rounded-xl text-sm font-medium border border-[var(--status-red)]/20 animate-[popIn_200ms_ease-out] flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle size={18} className="shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={handleOfflineMode}
                className="mt-1 text-xs font-bold underline hover:opacity-80 self-start text-[var(--text-main)]"
              >
                Or Continue in Offline Mode →
              </button>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-500/10 text-emerald-500 p-3.5 rounded-xl text-sm font-medium border border-emerald-500/20 animate-[popIn_200ms_ease-out] flex items-center gap-2">
              <CheckCircle2 size={18} className="shrink-0" />
              <span>{successMsg}</span>
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
                className="text-xs text-[var(--accent-violet)] font-bold self-end hover:underline mt-1 cursor-pointer"
              >
                Forgot Password?
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full py-3.5 rounded-xl bg-[var(--accent-violet)] text-white font-bold flex justify-center items-center gap-2 shadow-lg shadow-[var(--accent-glow)] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
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

        <div className="flex flex-col gap-3 items-center text-center mt-1">
          <button
            type="button"
            onClick={handleOfflineMode}
            className="w-full py-2.5 rounded-xl bg-[var(--bg-surface-lit)] text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <WifiOff size={14} /> Continue in Offline Mode
          </button>

          <div className="text-sm text-[var(--text-muted)] mt-1">
            {isRegistering ? 'Already have an account? ' : "Don't have an account? "}
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
                setSuccessMsg('');
              }}
              className="text-[var(--accent-violet)] font-bold hover:underline cursor-pointer"
            >
              {isRegistering ? 'Log In' : 'Sign Up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
