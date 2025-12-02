import React from 'react';
import { User, UserRole } from '../types';
import { LogOut, Home, Calendar, User as UserIcon, Settings, Menu, Shield, Briefcase, AlertCircle } from 'lucide-react';

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
}
export const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'md', className = '', ...props }) => {
  const baseStyle = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-brand-600 text-white hover:bg-brand-700 focus:ring-brand-500",
    secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-brand-500",
    outline: "bg-transparent text-brand-600 border border-brand-600 hover:bg-brand-50 focus:ring-brand-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500",
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />
  );
};

// --- Form Components ---

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', id, ...props }) => {
  const inputId = id || props.name;
  return (
    <div className="w-full">
      {label && <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <div className="relative">
        <input
          id={inputId}
          className={`block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none transition-colors sm:text-sm ${
            error
              ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 placeholder-gray-500 text-gray-900 focus:ring-brand-500 focus:border-brand-500'
          } ${className}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {error && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600 animate-pulse" id={`${inputId}-error`}>
          {error}
        </p>
      )}
    </div>
  );
};

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, error, className = '', id, ...props }) => {
  const inputId = id || props.name;
  return (
    <div className="w-full">
      {label && <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <div className="relative">
        <textarea
          id={inputId}
          className={`block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none transition-colors sm:text-sm ${
            error
              ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 placeholder-gray-500 text-gray-900 focus:ring-brand-500 focus:border-brand-500'
          } ${className}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {error && (
            <div className="absolute top-2 right-2 pointer-events-none">
                <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600" id={`${inputId}-error`}>
          {error}
        </p>
      )}
    </div>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select: React.FC<SelectProps> = ({ label, error, className = '', children, id, ...props }) => {
  const inputId = id || props.name;
  return (
    <div className="w-full">
      {label && <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <div className="relative">
        <select
          id={inputId}
          className={`block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none transition-colors sm:text-sm ${
            error
              ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 text-gray-900 focus:ring-brand-500 focus:border-brand-500'
          } ${className}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        >
          {children}
        </select>
        {error && (
          <div className="absolute inset-y-0 right-8 pr-3 flex items-center pointer-events-none">
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600" id={`${inputId}-error`}>
          {error}
        </p>
      )}
    </div>
  );
};


// --- Navbar ---
interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onNavigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout, onNavigate }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center cursor-pointer" onClick={() => onNavigate('/')}>
            <Home className="h-8 w-8 text-brand-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">HomeBook</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            <button onClick={() => onNavigate('/services')} className="text-gray-600 hover:text-brand-600 px-3 py-2 rounded-md text-sm font-medium">Services</button>
            {user ? (
              <div className="flex items-center space-x-4 ml-4">
                <span className="text-sm text-gray-700">Hi, {user.name}</span>
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-brand-100 text-brand-700 uppercase">{user.role.replace('_', ' ')}</span>
                
                {user.role === UserRole.Customer && (
                  <Button size="sm" onClick={() => onNavigate('/dashboard')}>My Dashboard</Button>
                )}
                {user.role === UserRole.ServiceProvider && (
                   <Button size="sm" onClick={() => onNavigate('/provider')}>Provider Portal</Button>
                )}
                {user.role === UserRole.Admin && (
                   <Button size="sm" onClick={() => onNavigate('/admin')}>Admin Panel</Button>
                )}

                <Button variant="outline" size="sm" onClick={() => onNavigate('/profile')}>Profile</Button>

                <Button variant="secondary" size="sm" onClick={onLogout}>
                  <LogOut className="h-4 w-4 mr-1" /> Logout
                </Button>
              </div>
            ) : (
              <div className="flex space-x-2">
                <Button variant="secondary" onClick={() => onNavigate('/login')}>Log in</Button>
                <Button onClick={() => onNavigate('/register')}>Sign up</Button>
              </div>
            )}
          </div>
          
          <div className="flex items-center md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-500 hover:text-gray-700">
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-2 pt-2 pb-3 space-y-1">
             <button onClick={() => onNavigate('/services')} className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50">Services</button>
             {user ? (
                <>
                   <button onClick={() => onNavigate(user.role === UserRole.Admin ? '/admin' : user.role === UserRole.ServiceProvider ? '/provider' : '/dashboard')} className="block w-full text-left px-3 py-2 text-base font-medium text-brand-600 hover:bg-gray-50">Dashboard</button>
                   <button onClick={() => onNavigate('/profile')} className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50">My Profile</button>
                   <button onClick={onLogout} className="block w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:bg-gray-50">Logout</button>
                </>
             ) : (
                <>
                  <button onClick={() => onNavigate('/login')} className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50">Login</button>
                </>
             )}
          </div>
        </div>
      )}
    </nav>
  );
};

// --- Status Badge ---
export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-indigo-100 text-indigo-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    paid: 'bg-green-100 text-green-800',
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    suspended: 'bg-red-100 text-red-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

// --- Page Wrapper ---
export const PageContainer: React.FC<{ children: React.ReactNode, title?: string }> = ({ children, title }) => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {title && <h1 className="text-2xl font-bold text-gray-900 mb-6">{title}</h1>}
    {children}
  </div>
);