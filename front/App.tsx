import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types';
import { Navbar } from './components/Shared';
import { LandingPage, ServicesPage, BookingPage, ServiceDetailsPage, ProviderProfilePage } from './pages/PublicPages';
import { LoginPage, RegisterPage } from './pages/Auth.tsx';
import { CustomerDashboard, ProviderDashboard, AdminDashboard } from './pages/Dashboards';
import { ProfilePage } from './pages/ProfilePage';

// Simple Router implementation based on hash for SPA behavior without backend
const App: React.FC = () => {
  // Load user from localStorage on mount
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        return JSON.parse(savedUser);
      }
    } catch (error) {
      console.error('Failed to load user from localStorage:', error);
    }
    return null;
  });
  const [currentPath, setCurrentPath] = useState(window.location.hash.slice(1) || '/');

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(window.location.hash.slice(1) || '/');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (path: string) => {
    window.location.hash = path;
  };

  // Wrapper to sync user state with localStorage
  const updateUser = (newUser: User | null) => {
    setUser(newUser);
    if (newUser) {
      try {
        localStorage.setItem('user', JSON.stringify(newUser));
      } catch (error) {
        console.error('Failed to save user to localStorage:', error);
      }
    } else {
      localStorage.removeItem('user');
    }
  };

  const handleLogout = () => {
    updateUser(null);
    navigate('/');
  };

  const handleLogin = (loggedInUser: User) => {
    updateUser(loggedInUser);
    // Redirect based on role
    if (loggedInUser.role === UserRole.Admin) navigate('/admin');
    else if (loggedInUser.role === UserRole.ServiceProvider) navigate('/provider');
    else navigate('/dashboard');
  };

  // Route matching
  let Component: React.ReactNode = null;

  if (currentPath === '/' || currentPath === '') {
    Component = <LandingPage onNavigate={navigate} />;
  } else if (currentPath === '/services') {
    Component = <ServicesPage onNavigate={navigate} />;
  } else if (currentPath === '/login') {
    Component = <LoginPage onLogin={handleLogin} onNavigate={navigate} />;
  } else if (currentPath === '/register') {
    Component = <RegisterPage onLogin={handleLogin} onNavigate={navigate} />;
  } else if (currentPath.startsWith('/book/')) {
    const serviceId = currentPath.split('/')[2];
    Component = user ? <BookingPage onNavigate={navigate} serviceId={serviceId} user={user} /> : <LoginPage onLogin={(u) => { handleLogin(u); navigate(currentPath); }} onNavigate={navigate} />;
  } else if (currentPath.startsWith('/service/')) {
    const serviceId = currentPath.split('/')[2];
    Component = <ServiceDetailsPage onNavigate={navigate} serviceId={serviceId} />;
  } else if (currentPath.startsWith('/provider-profile/')) {
    const providerId = currentPath.split('/')[2];
    Component = <ProviderProfilePage onNavigate={navigate} providerId={providerId} />;
  } else if (currentPath === '/dashboard') {
    Component = user && user.role === UserRole.Customer ? <CustomerDashboard user={user} /> : (user ? <div className="p-8 text-center text-red-600">Access Denied</div> : <LoginPage onLogin={handleLogin} onNavigate={navigate} />);
  } else if (currentPath === '/provider') {
    Component = user && user.role === UserRole.ServiceProvider ? <ProviderDashboard user={user} /> : (user ? <div className="p-8 text-center text-red-600">Access Denied</div> : <LoginPage onLogin={handleLogin} onNavigate={navigate} />);
  } else if (currentPath === '/admin') {
    Component = user && user.role === UserRole.Admin ? <AdminDashboard user={user} /> : (user ? <div className="p-8 text-center text-red-600">Access Denied</div> : <LoginPage onLogin={handleLogin} onNavigate={navigate} />);
  } else if (currentPath === '/profile') {
    Component = user ? <ProfilePage user={user} onUserUpdate={updateUser} /> : <LoginPage onLogin={(u) => { handleLogin(u); navigate(currentPath); }} onNavigate={navigate} />;
  } else {
    Component = <div className="p-12 text-center text-2xl text-gray-400">404: Page Not Found</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Navbar user={user} onLogout={handleLogout} onNavigate={navigate} />
      <main>
        {Component}
      </main>
      
      {/* Simple Footer */}
      <footer className="bg-white border-t mt-auto py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          &copy; 2025 HomeBook Inc. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default App;