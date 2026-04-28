import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { Lock, Mail, ChevronRight } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/technicien');
    } catch (err) {
      setError('Identifiants invalides. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card-v2">
        <div className="login-header-v2">
          <img src="/logo.png" className="login-logo-v2" alt="Telintec" />
          <p>Gestion d'infrastructure</p>
        </div>

        {error && (
          <div className="login-error-v2">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="login-form-v2">
          <div className="input-group-v2">
            <Mail className="input-icon-v2" size={18} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Professionnel"
              required
            />
          </div>

          <div className="input-group-v2">
            <Lock className="input-icon-v2" size={18} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              required
            />
          </div>

          <button type="submit" className="login-btn-v2" disabled={loading}>
            {loading ? 'Connexion...' : 'ACCÉDER AU RÉSEAU'}
            {!loading && <ChevronRight size={20} />}
          </button>
        </form>

        <div className="login-footer-v2">
          <span>Telintec S.A. © 2026</span>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .login-wrapper {
          height: 100vh;
          width: 100vw;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #ffffff;
        }

        .login-card-v2 {
          width: 100%;
          max-width: 400px;
          padding: 40px;
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .login-header-v2 { margin-bottom: 20px; }
        .login-logo-v2 { height: 70px; margin-bottom: 20px; object-fit: contain; }
        .login-header-v2 h1 { display: none; }
        .login-header-v2 p { font-size: 14px; color: #666; font-weight: 500; }

        .login-form-v2 { display: flex; flex-direction: column; gap: 15px; }

        .input-group-v2 {
          position: relative;
          width: 100%;
        }

        .input-icon-v2 {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: #0052CC;
          opacity: 0.5;
        }

        .input-group-v2 input {
          width: 100%;
          background: #f4f5f7;
          border: 1px solid #e1e4e8;
          border-radius: 8px;
          padding: 14px 15px 14px 45px;
          color: #333;
          font-size: 15px;
          outline: none;
          transition: all 0.2s;
        }

        .input-group-v2 input:focus {
          background: #fff;
          border-color: #0052CC;
          box-shadow: 0 0 0 2px rgba(0, 82, 204, 0.1);
        }

        .login-btn-v2 {
          width: 100%;
          background: #0052CC;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 16px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.2s;
          margin-top: 10px;
        }

        .login-btn-v2:hover {
          background: #0043a4;
          box-shadow: 0 4px 12px rgba(0, 82, 204, 0.2);
        }

        .login-btn-v2:disabled { opacity: 0.7; cursor: not-allowed; }

        .login-error-v2 {
          background: #ffebe6;
          color: #bf2600;
          padding: 12px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          border: 1px solid #ffbdad;
        }

        .login-footer-v2 {
          margin-top: 20px;
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #999;
        }

        .login-footer-v2 a { color: #0052CC; text-decoration: none; }
      `}} />
    </div>
  );
}
