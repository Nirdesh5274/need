import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiHome, FiPackage, FiShoppingCart, FiDollarSign, FiBarChart2, FiLogOut } from 'react-icons/fi';
import './Layout.css';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', icon: <FiHome />, label: 'Dashboard' },
    { path: '/inventory', icon: <FiPackage />, label: 'Inventory' },
    { path: '/sales', icon: <FiShoppingCart />, label: 'Sales' },
    { path: '/sales/new', icon: <FiShoppingCart />, label: 'New Sale' },
    { path: '/expenses', icon: <FiDollarSign />, label: 'Expenses' },
    { path: '/reports', icon: <FiBarChart2 />, label: 'Reports' },
  ];

  return (
    <div className="layout">
      <header className="top-header">
        <div className="header-left">
          <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            ☰
          </button>
          <div className="company-info">
            <div className="company-icon">🏪</div>
            <h1>Bireena Saleshi</h1>
          </div>
        </div>
        <div className="header-right">
          <div className="user-dropdown">
            <span className="user-icon">👤</span>
            <span className="username">{user?.username || 'admin'}</span>
            <span className="dropdown-arrow">▼</span>
          </div>
        </div>
      </header>
      
      <div className="layout-content">
        <nav className={`side-nav ${menuOpen ? 'open' : ''}`}>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path || location.pathname.startsWith(item.path + '/') ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
          <button onClick={handleLogout} className="logout-btn">
            <FiLogOut /> Logout
          </button>
        </nav>
        
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
