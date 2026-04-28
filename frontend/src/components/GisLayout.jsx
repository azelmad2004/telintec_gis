import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Map as MapIcon, LayoutDashboard, LogOut } from 'lucide-react';

export default function GisLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <>
      {/* GIS TOP TOOLBAR - WHITE */}
      <header className="gis-toolbar">
        <div className="toolbar-section" style={{ borderRight: 'none', paddingLeft: 0 }}>
          <img src="/logo.png" style={{ height: '55px', marginRight: '20px' }} alt="Logo" />
        </div>

        <div className="toolbar-section">
          <Link to="/technicien" className={`toolbar-item ${location.pathname === '/technicien' ? 'active' : ''}`}>
            <MapIcon size={24} />
            <span className="toolbar-label">Carte</span>
          </Link>
          {user.role === 'admin' && (
            <Link to="/planning" className={`toolbar-item ${location.pathname === '/planning' ? 'active' : ''}`}>
              <LayoutDashboard size={24} />
              <span className="toolbar-label">Dashboard</span>
            </Link>
          )}
        </div>

        <div className="toolbar-section" style={{ marginLeft: 'auto', borderRight: 'none' }}>
           <div style={{ textAlign: 'right', marginRight: '15px' }} className="user-info-header">
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#333' }}>{user?.name || 'Utilisateur'}</div>
              <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase' }}>{user?.role || ''}</div>
           </div>
           <button className="toolbar-item" onClick={handleLogout} style={{ background: 'transparent', border: 'none' }}>
              <LogOut size={24} color="#FF5630" />
              <span className="toolbar-label" style={{ color: '#FF5630' }}>Quitter</span>
           </button>
        </div>
      </header>
      
      {children}
    </>
  );
}
