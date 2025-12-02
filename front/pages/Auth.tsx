import React, { useState, useEffect } from 'react';
import { Button, Input, Select, TextArea } from '../components/Shared';
import RealApi from '../services/realApi';
import { User, UserRole, Service, ServiceCategory } from '../types';
import { Mail, CheckCircle, ArrowRight, X, CheckSquare, Square } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
  onNavigate: (path: string) => void;
}

export const LoginPage: React.FC<AuthProps> = ({ onLogin, onNavigate }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!username.trim()) newErrors.username = 'Username is required';
    if (!password) newErrors.password = 'Password is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    
    if (!validate()) return;

    setIsLoading(true);
    
        try {
            const user = await RealApi.login(username, password);
            if (user) {
                onLogin(user); // Router will handle redirect based on role
            } else {
                setGeneralError('Invalid username or password.');
            }
        } catch (err: any) {
            setGeneralError(err.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Sign in to HomeBook</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Need an account?{' '}
            <button onClick={() => onNavigate('/register')} className="font-medium text-brand-600 hover:text-brand-500">
              Create one now
            </button>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
             <Input 
                id="username" 
                name="username"
                label="Username"
                type="text" 
                placeholder="Username"
                autoComplete="username"
                value={username} 
                onChange={e => {
                  setUsername(e.target.value);
                  if (errors.username) setErrors({...errors, username: ''});
                }}
                error={errors.username}
              />
             <Input 
                id="password" 
                name="password"
                label="Password"
                type="password" 
                placeholder="Password"
                autoComplete="current-password"
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({...errors, password: ''});
                }}
                error={errors.password}
              />
          </div>

          {generalError && <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-200">{generalError}</div>}

          <div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const RegisterPage: React.FC<AuthProps> = ({ onNavigate }) => {
    const [step, setStep] = useState<'register' | 'verify'>('register');
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [generalError, setGeneralError] = useState('');
    
    // Register Form State
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        role: UserRole.Customer,
        password: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    // Provider-specific state
    const [introduction, setIntroduction] = useState('');
    const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [categories, setCategories] = useState<ServiceCategory[]>([]);
    const [loadingServices, setLoadingServices] = useState(false);
    
    // Terms State
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);

    // Verify Form State
    const [verificationCode, setVerificationCode] = useState('');

    // Load services and categories when role changes to service provider
    useEffect(() => {
        if (formData.role === UserRole.ServiceProvider) {
            loadServicesAndCategories();
        }
    }, [formData.role]);

    const loadServicesAndCategories = async () => {
        setLoadingServices(true);
        try {
            const [servicesData, categoriesData] = await Promise.all([
                RealApi.getServices(),
                RealApi.getCategories()
            ]);
            setServices(servicesData);
            setCategories(categoriesData);
        } catch (err) {
            console.error('Failed to load services:', err);
        } finally {
            setLoadingServices(false);
        }
    };

    const toggleServiceSelection = (serviceId: number) => {
        setSelectedServiceIds(prev => 
            prev.includes(serviceId)
                ? prev.filter(id => id !== serviceId)
                : [...prev, serviceId]
        );
    };

    const getPasswordStrength = (pass: string) => {
        if (!pass) return { width: '0%', color: 'bg-gray-200', label: '' };
        
        let score = 0;
        if (pass.length >= 6) score += 1;
        if (pass.length >= 8) score += 1;
        if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;
        if (/[0-9]/.test(pass) && /[^A-Za-z0-9]/.test(pass)) score += 1;

        if (pass.length > 0 && pass.length < 6) {
             return { width: '25%', color: 'bg-red-500', label: 'Too short' };
        }

        switch (score) {
            case 1: return { width: '25%', color: 'bg-red-500', label: 'Weak' };
            case 2: return { width: '50%', color: 'bg-yellow-500', label: 'Fair' };
            case 3: return { width: '75%', color: 'bg-blue-500', label: 'Good' };
            case 4: 
            default:
                return { width: '100%', color: 'bg-green-500', label: 'Strong' };
        }
    };

    const strength = getPasswordStrength(formData.password);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        
        if (!formData.name.trim()) newErrors.name = 'Full Name is required';
        if (!formData.username.trim()) newErrors.username = 'Username is required';
        else if (formData.username.length < 3) newErrors.username = 'Username must be at least 3 characters';
        
        if (!formData.email.trim()) newErrors.email = 'Email Address is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Please enter a valid email address';
        
        if (!formData.password) newErrors.password = 'Password is required';
        else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
        
        // Provider-specific validation
        if (formData.role === UserRole.ServiceProvider) {
            if (selectedServiceIds.length === 0) {
                newErrors.services = 'Please select at least one service you can provide';
            }
        }
        
        if (!termsAccepted) newErrors.terms = 'You must accept the Terms and Conditions';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error for this field if it exists
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setGeneralError('');
        
        if (!validateForm()) return;

        setIsLoading(true);

        try {
            await RealApi.sendEmailVerificationCode(formData.email);
            alert('Verification code sent to your email. Please check your inbox.');
            setStep('verify');
        } catch (err: any) {
            setGeneralError(err.message || 'Failed to send verification code');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setGeneralError('');
        
        if (verificationCode.length !== 6) {
            setGeneralError('Please enter a 6-digit code');
            return;
        }

        setIsLoading(true);
        try {
            const isValid = await RealApi.verifyEmail(formData.email, verificationCode);
            if (!isValid) {
                setGeneralError('Invalid verification code. Please try again.');
                return;
            }
            const registerData: any = {
                name: formData.name,
                username: formData.username,
                email: formData.email,
                role: formData.role,
                phone: '', // Optional
                password: formData.password
            };

            // Add provider-specific fields
            if (formData.role === UserRole.ServiceProvider) {
                if (introduction.trim()) {
                    registerData.introduction = introduction.trim();
                }
                if (selectedServiceIds.length > 0) {
                    registerData.serviceIds = selectedServiceIds;
                }
            }

            const result = await RealApi.register(registerData);
            
            if (result.success) {
                alert('Registration successful! You can now log in.');
                onNavigate('/login');
            }
        } catch (err: any) {
            setGeneralError(err.message || 'Verification failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (!formData.email) {
            setGeneralError('Please enter your email first');
            return;
        }
        setIsResending(true);
        try {
            await RealApi.sendEmailVerificationCode(formData.email);
            alert('A new verification code has been sent.');
        } catch (err: any) {
            setGeneralError(err.message || 'Failed to resend verification code');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 text-center">
                        {step === 'register' ? 'Create Account' : 'Verify Email'}
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        {step === 'register' 
                            ? 'Join HomeBook today' 
                            : `We sent a code to ${formData.email}`}
                    </p>
                </div>

                {generalError && <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-200">{generalError}</div>}

                {step === 'register' ? (
                    <form className="space-y-4" onSubmit={handleRegister}>
                        <Input 
                            name="name"
                            label="Full Name"
                            placeholder="John Doe"
                            autoComplete="name"
                            value={formData.name}
                            onChange={e => handleInputChange('name', e.target.value)}
                            error={errors.name}
                        />
                        <Input 
                            name="username"
                            label="Username"
                            placeholder="johndoe"
                            autoComplete="username"
                            value={formData.username}
                            onChange={e => handleInputChange('username', e.target.value)}
                            error={errors.username}
                        />
                        <Input 
                            name="email"
                            type="email"
                            label="Email Address"
                            placeholder="john@example.com"
                            autoComplete="email"
                            value={formData.email}
                            onChange={e => handleInputChange('email', e.target.value)}
                            error={errors.email}
                        />
                        <Select
                            label="I want to..."
                            value={formData.role}
                            onChange={e => handleInputChange('role', e.target.value)}
                            error={errors.role}
                        >
                            <option value={UserRole.Customer}>Book Services (Customer)</option>
                            <option value={UserRole.ServiceProvider}>Offer Services (Provider)</option>
                        </Select>

                        {/* Provider-specific fields */}
                        {formData.role === UserRole.ServiceProvider && (
                            <>
                                <TextArea
                                    name="introduction"
                                    label="Introduction (Optional)"
                                    placeholder="Tell customers about your experience and skills..."
                                    value={introduction}
                                    onChange={e => setIntroduction(e.target.value)}
                                    rows={3}
                                />

                                <div className="w-full">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Services I Can Provide <span className="text-red-500">*</span>
                                    </label>
                                    {loadingServices ? (
                                        <div className="text-sm text-gray-500 py-4">Loading services...</div>
                                    ) : (
                                        <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto">
                                            {categories.map(category => {
                                                const categoryServices = services.filter(s => s.categoryId === category.id);
                                                if (categoryServices.length === 0) return null;
                                                return (
                                                    <div key={category.id} className="mb-4 last:mb-0">
                                                        <h4 className="font-medium text-gray-900 mb-2">{category.name}</h4>
                                                        <div className="space-y-2">
                                                            {categoryServices.map(service => {
                                                                const isSelected = selectedServiceIds.includes(service.id);
                                                                return (
                                                                    <label
                                                                        key={service.id}
                                                                        className="flex items-center p-2 rounded hover:bg-gray-50 cursor-pointer"
                                                                    >
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => toggleServiceSelection(service.id)}
                                                                            className="mr-3 focus:outline-none"
                                                                        >
                                                                            {isSelected ? (
                                                                                <CheckSquare className="h-5 w-5 text-brand-600" />
                                                                            ) : (
                                                                                <Square className="h-5 w-5 text-gray-400" />
                                                                            )}
                                                                        </button>
                                                                        <div className="flex-1">
                                                                            <div className="text-sm font-medium text-gray-900">{service.name}</div>
                                                                            {service.description && (
                                                                                <div className="text-xs text-gray-500">{service.description}</div>
                                                                            )}
                                                                        </div>
                                                                        <div className="text-sm font-medium text-brand-600">
                                                                            ¥{service.price}/{service.priceUnit}
                                                                        </div>
                                                                    </label>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                    {errors.services && (
                                        <p className="mt-1 text-sm text-red-600">{errors.services}</p>
                                    )}
                                </div>
                            </>
                        )}

                        <div>
                            <Input 
                                name="password"
                                type="password"
                                label="Password"
                                placeholder="Min. 6 characters"
                                autoComplete="new-password"
                                value={formData.password}
                                onChange={e => handleInputChange('password', e.target.value)}
                                error={errors.password}
                            />
                            {formData.password && (
                                <div className="mt-2">
                                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full ${strength.color} transition-all duration-300 ease-out`} 
                                            style={{ width: strength.width }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 text-right font-medium">{strength.label}</p>
                                </div>
                            )}
                        </div>

                        {/* Terms and Conditions Checkbox */}
                        <div className="flex items-start">
                             <div className="flex items-center h-5">
                                <input
                                    id="terms"
                                    name="terms"
                                    type="checkbox"
                                    checked={termsAccepted}
                                    onChange={(e) => {
                                        setTermsAccepted(e.target.checked);
                                        if (errors.terms) {
                                            setErrors(prev => {
                                                const newErrors = { ...prev };
                                                delete newErrors.terms;
                                                return newErrors;
                                            });
                                        }
                                    }}
                                    className="focus:ring-brand-500 h-4 w-4 text-brand-600 border-gray-300 rounded cursor-pointer"
                                />
                             </div>
                             <div className="ml-3 text-sm">
                                <label htmlFor="terms" className="font-medium text-gray-700">
                                    I agree to the <button type="button" onClick={() => setShowTermsModal(true)} className="text-brand-600 hover:text-brand-500 underline focus:outline-none">Terms and Conditions</button>
                                </label>
                                {errors.terms && <p className="text-red-600 mt-1 text-xs">{errors.terms}</p>}
                             </div>
                        </div>

                        <Button type="submit" className="w-full flex justify-center mt-6" disabled={isLoading}>
                            {isLoading ? 'Sending...' : 'Send Verification Code'}
                        </Button>
                        <div className="text-center mt-4">
                            <button type="button" onClick={() => onNavigate('/login')} className="text-sm text-brand-600 hover:text-brand-500">
                                Already have an account? Sign in
                            </button>
                        </div>
                    </form>
                ) : (
                    <form className="space-y-6" onSubmit={handleVerify}>
                        <div className="flex flex-col items-center justify-center mb-6">
                            <div className="bg-brand-100 p-3 rounded-full mb-4">
                                <Mail className="h-8 w-8 text-brand-600" />
                            </div>
                            <p className="text-sm text-gray-500 text-center">
                                Please check your email (or the alert popup) for the 6-digit verification code.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="verification-code" className="sr-only">Verification Code</label>
                            <input 
                                id="verification-code"
                                type="text" 
                                required 
                                maxLength={6}
                                className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 text-center text-2xl tracking-widest focus:outline-none focus:ring-brand-500 focus:border-brand-500" 
                                placeholder="123456"
                                value={verificationCode}
                                onChange={e => setVerificationCode(e.target.value)}
                            />
                            <button
                                type="button"
                                className="text-sm text-brand-600 hover:text-brand-500"
                                onClick={handleResendCode}
                                disabled={isResending}
                            >
                                {isResending ? 'Sending...' : 'Resend code'}
                            </button>
                        </div>

                        <Button type="submit" className="w-full flex justify-center" disabled={isLoading}>
                            {isLoading ? 'Verifying...' : 'Verify Email'}
                        </Button>
                        
                        <div className="text-center">
                            <button type="button" onClick={() => setStep('register')} className="text-sm text-gray-500 hover:text-gray-700">
                                Back to registration
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* Terms Modal */}
            {showTermsModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowTermsModal(false)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="flex justify-between items-center border-b pb-3 mb-3">
                                    <h3 className="text-lg leading-6 font-bold text-gray-900" id="modal-title">Terms and Conditions</h3>
                                    <button onClick={() => setShowTermsModal(false)} className="text-gray-400 hover:text-gray-500 focus:outline-none">
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>
                                <div className="mt-2 max-h-60 overflow-y-auto text-sm text-gray-600 space-y-3">
                                    <p><strong>1. Introduction</strong><br/>Welcome to HomeBook. By accessing or using our platform, you agree to comply with and be bound by these Terms and Conditions.</p>
                                    <p><strong>2. User Accounts</strong><br/>You must create an account to use certain features. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
                                    <p><strong>3. Service Provision</strong><br/>HomeBook acts as an intermediary connecting customers with service providers. We screen providers but are not liable for their conduct or the quality of their services beyond our guarantee policy.</p>
                                    <p><strong>4. Booking and Cancellation</strong><br/>Appointments can be booked subject to provider availability. Cancellations made within 24 hours of the scheduled time may be subject to a cancellation fee.</p>
                                    <p><strong>5. Payments</strong><br/>All payments are securely processed. You agree to pay all charges associated with your bookings. Prices are subject to change.</p>
                                    <p><strong>6. Privacy Policy</strong><br/>Your personal information is collected and used in accordance with our Privacy Policy. We value your privacy and data security.</p>
                                    <p><strong>7. Limitation of Liability</strong><br/>HomeBook shall not be liable for any indirect, incidental, or consequential damages arising from the use of our services.</p>
                                    <p><strong>8. Updates to Terms</strong><br/>We reserve the right to modify these terms at any time. Continued use of the platform constitutes acceptance of the new terms.</p>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <Button onClick={() => setShowTermsModal(false)}>Close</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
