import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const { register, oauth42 } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      await register(username, email, password);
      navigate('/dashboard');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        alert(err.response?.data?.message ?? 'Registration failed');
      } else {
        alert('An unexpected error occurred');
      }
    }
  };

  return (
    <main className="auth-shell">
      <section className="panel auth-panel">
        <p className="eyebrow">Create account</p>
        <h1>Register</h1>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            <span>Username</span>
            <input
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>

          <label>
            <span>Email</span>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <button type="submit" className="primary-button">
            Create account
          </button>
        </form>

        <button type="button" className="secondary-button" onClick={oauth42}>
          Continue with 42
        </button>

        <p className="switch-link">
          Already a member? <Link to="/login">Sign in</Link>
        </p>
      </section>
    </main>
  );
};

export default Register;
