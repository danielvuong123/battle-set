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

    if (mode === 'signup') {
      const { error: err } = await authClient.signUp.email({ name, email, password });
      if (err) { setError(err.message ?? 'Sign up failed'); setLoading(false); return; }
    } else {
      const { error: err } = await authClient.signIn.email({ email, password });
      if (err) { setError(err.message ?? 'Sign in failed'); setLoading(false); return; }
    }

    setLoading(false);
    onAuth();
  }

  async function handleGoogle() {
    await authClient.signIn.social({ provider: 'google', callbackURL: window.location.href });
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
      </div>
    </div>
  );
}
