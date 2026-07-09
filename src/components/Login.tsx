import { useState } from 'react';
import { authClient } from '../lib/auth';
import './Login.css';

type Props = {
  onAuth: () => void;
};

export default function Login({ onAuth }: Props) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error: err } = await authClient.signUp.email({ name, email, password });
        if (err) {
          console.error('[signup error]', err);
          setError(err.message ?? 'Failed to create account');
          setLoading(false);
          return;
        }
      } else {
        const { error: err } = await authClient.signIn.email({ email, password });
        if (err) {
          console.error('[signin error]', err);
          setError(err.message ?? 'Incorrect email or password');
          setLoading(false);
          return;
        }
      }

      setLoading(false);
      onAuth();
    } catch (err) {
      console.error('[auth error]', err);
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
      setError(msg);
      setLoading(false);
    }
  }

  async function handleGoogle() {
    try {
      setError('');
      setLoading(true);
      await authClient.signIn.social({ provider: 'google', callbackURL: window.location.href });
    } catch (err) {
      console.error('[google signin error]', err);
      setError('Google login is not configured. Please use email/password or guest login.');
      setLoading(false);
    }
  }

  async function handleGuest() {
    setError('');
    setLoading(true);
    try {
      const guestName = `Guest_${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      const guestEmail = `guest_${Date.now()}@battleset.local`;
      const guestPassword = Math.random().toString(36).substring(2, 15);

      const { error: err } = await authClient.signUp.email({
        name: guestName,
        email: guestEmail,
        password: guestPassword,
      });
      if (err) {
        console.error('[guest signup error]', err);
        setError(err.message ?? 'Failed to create guest account');
        setLoading(false);
        return;
      }
      setLoading(false);
      onAuth();
    } catch (err) {
      console.error('[guest login error]', err);
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
      setError(msg);
      setLoading(false);
    }
  }

  return (
    <div className="login">
      <div className="login-card">
        <h1>Battle Set</h1>

        <button className="login-google" onClick={handleGoogle} disabled={loading}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" />
          Continue with Google
        </button>

        <div className="login-divider">or</div>

        <div className="login-tabs">
          <button
            className={mode === 'login' ? 'active' : ''}
            onClick={() => { setMode('login'); setError(''); }}
          >Sign in</button>
          <button
            className={mode === 'signup' ? 'active' : ''}
            onClick={() => { setMode('signup'); setError(''); }}
          >Create account</button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <input
              type="text"
              placeholder="Display name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              disabled={loading}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            disabled={loading}
          />
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div className="login-divider">or</div>

        <button className="login-guest" onClick={handleGuest} disabled={loading}>
          Play as Guest
        </button>
      </div>
    </div>
  );
}
