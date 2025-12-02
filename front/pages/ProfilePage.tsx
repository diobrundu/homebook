import React, { useState, useRef } from 'react';
import { User } from '../types';
import RealApi from '../services/realApi';
import { Button, PageContainer, Input } from '../components/Shared';
import { User as UserIcon, Mail, Phone, Save, X, Edit2, Camera, Bell } from 'lucide-react';

interface ProfilePageProps {
  user: User;
  onUserUpdate: (user: User) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, onUserUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Phone mask utility
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length === 0) return '';
    
    // US Format logic for <= 10 digits
    if (numbers.length <= 10) {
        if (numbers.length <= 3) return numbers;
        if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
        return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6)}`;
    }
    
    // 11 Digit (China Mobile style / Generic Intl)
    return `${numbers.slice(0, 3)} ${numbers.slice(3, 7)} ${numbers.slice(7, 11)}`;
  };

  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email || '',
    phone: formatPhoneNumber(user.phone || ''),
    emailNotifications: user.notificationPreferences?.email ?? true,
    pushNotifications: user.notificationPreferences?.push ?? true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateField = (name: string, value: string) => {
    let error = '';
    
    switch (name) {
        case 'name':
            if (!value.trim()) error = 'Full name is required';
            break;
        case 'email':
            if (!value.trim()) error = 'Email is required';
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Invalid email format';
            break;
        case 'phone':
            const rawPhone = value.replace(/\D/g, '');
            if (rawPhone.length > 0 && rawPhone.length < 10) error = 'Phone number must be at least 10 digits';
            break;
    }
    return error;
  };

  const handleChange = (name: keyof typeof formData, value: any) => {
    let finalValue = value;
    
    // Apply mask for phone
    if (name === 'phone' && typeof value === 'string') {
        const raw = value.replace(/\D/g, '');
        // Prevent excessively long numbers
        if (raw.length > 11) return; 
        finalValue = formatPhoneNumber(raw);
    }

    setFormData(prev => ({ ...prev, [name]: finalValue }));

    // Real-time validation for string fields
    if (typeof finalValue === 'string') {
        const error = validateField(name, finalValue);
        setErrors(prev => {
            const newErrors = { ...prev };
            if (error) newErrors[name] = error;
            else delete newErrors[name];
            return newErrors;
        });
    }
  };

  const validateAll = () => {
      const newErrors: Record<string, string> = {};
      const nameError = validateField('name', formData.name);
      if (nameError) newErrors.name = nameError;
      
      const emailError = validateField('email', formData.email);
      if (emailError) newErrors.email = emailError;
      
      const phoneError = validateField('phone', formData.phone);
      if (phoneError) newErrors.phone = phoneError;

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateAll()) return;

    setIsLoading(true);
    try {
      const updatedUser = await RealApi.updateUserProfile(user.id, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone.replace(/\D/g, ''), // Save raw digits
          notificationPreferences: {
              email: formData.emailNotifications,
              push: formData.pushNotifications
          }
      });
      onUserUpdate(updatedUser);
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      alert('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user.name,
      email: user.email || '',
      phone: formatPhoneNumber(user.phone || ''),
      emailNotifications: user.notificationPreferences?.email ?? true,
      pushNotifications: user.notificationPreferences?.push ?? true
    });
    setErrors({});
    setIsEditing(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert('Please upload an image file.');
        return;
    }

    setIsLoading(true);
    try {
        const newPhotoUrl = await RealApi.uploadUserProfilePicture(user.id, file);
        onUserUpdate({ ...user, profilePicture: newPhotoUrl });
        alert('Profile picture updated!');
    } catch (error) {
        alert('Failed to upload profile picture.');
    } finally {
        setIsLoading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <PageContainer title="My Profile">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border overflow-hidden">
        {/* Header */}
        <div className="bg-brand-600 px-6 py-8 text-white text-center">
          <div className="relative inline-block group">
              <div className="h-24 w-24 bg-white rounded-full mx-auto flex items-center justify-center text-brand-600 text-3xl font-bold border-4 border-brand-200 mb-4 shadow-lg overflow-hidden">
                {user.profilePicture ? (
                    <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                    user.name.charAt(0)
                )}
              </div>
              <button 
                onClick={triggerFileInput}
                disabled={isLoading}
                className="absolute bottom-4 right-0 bg-white text-gray-700 p-2 rounded-full shadow-md hover:bg-gray-100 focus:outline-none transition-colors"
                title="Change Profile Picture"
              >
                  <Camera className="h-4 w-4" />
              </button>
              <input 
                 type="file" 
                 ref={fileInputRef} 
                 className="hidden" 
                 accept="image/*"
                 onChange={handleFileChange}
              />
          </div>
          <h2 className="text-2xl font-bold">{user.name}</h2>
          <p className="text-brand-100 font-medium">@{user.username} • {user.role.replace('_', ' ')}</p>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">Personal Information</h3>
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit2 className="h-4 w-4 mr-2" /> Edit Profile
              </Button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-8">
              <div className="space-y-4">
                  <Input 
                    label="Full Name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    error={errors.name}
                    disabled={isLoading}
                  />
                  <Input 
                    type="email"
                    label="Email Address"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    error={errors.email}
                    disabled={isLoading}
                  />
                  <Input 
                    type="tel"
                    label="Phone Number"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    error={errors.phone}
                    placeholder="(555) 123-4567"
                    disabled={isLoading}
                  />
              </div>

              {/* Notification Preferences */}
              <div className="pt-6 border-t border-gray-100">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Notification Preferences</h3>
                  <div className="space-y-4">
                      <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-900">Email Notifications</span>
                              <span className="text-sm text-gray-500">Receive updates and reminders via email.</span>
                          </div>
                          <button 
                            type="button" 
                            disabled={isLoading}
                            onClick={() => handleChange('emailNotifications', !formData.emailNotifications)}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${formData.emailNotifications ? 'bg-brand-600' : 'bg-gray-200'}`}
                          >
                            <span aria-hidden="true" className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.emailNotifications ? 'translate-x-5' : 'translate-x-0'}`}></span>
                          </button>
                      </div>

                      <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-900">Push Notifications</span>
                              <span className="text-sm text-gray-500">Receive real-time alerts on your device.</span>
                          </div>
                           <button 
                            type="button" 
                            disabled={isLoading}
                            onClick={() => handleChange('pushNotifications', !formData.pushNotifications)}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${formData.pushNotifications ? 'bg-brand-600' : 'bg-gray-200'}`}
                          >
                            <span aria-hidden="true" className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.pushNotifications ? 'translate-x-5' : 'translate-x-0'}`}></span>
                          </button>
                      </div>
                  </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
                <Button type="button" variant="secondary" onClick={handleCancel} disabled={isLoading}>
                  <X className="h-4 w-4 mr-2" /> Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  <Save className="h-4 w-4 mr-2" /> {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-gray-400 shadow-sm mr-4">
                    <UserIcon className="h-5 w-5" />
                    </div>
                    <div>
                    <p className="text-sm font-medium text-gray-500">Full Name</p>
                    <p className="text-lg font-semibold text-gray-900">{user.name}</p>
                    </div>
                </div>

                <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-gray-400 shadow-sm mr-4">
                    <Mail className="h-5 w-5" />
                    </div>
                    <div>
                    <p className="text-sm font-medium text-gray-500">Email Address</p>
                    <p className="text-lg font-semibold text-gray-900">{user.email || <span className="text-gray-400 italic">Not provided</span>}</p>
                    </div>
                </div>

                <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-gray-400 shadow-sm mr-4">
                    <Phone className="h-5 w-5" />
                    </div>
                    <div>
                    <p className="text-sm font-medium text-gray-500">Phone Number</p>
                    <p className="text-lg font-semibold text-gray-900">{formatPhoneNumber(user.phone || '') || <span className="text-gray-400 italic">Not provided</span>}</p>
                    </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Notification Preferences</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-100 justify-between">
                          <div className="flex items-center">
                              <Bell className="h-5 w-5 text-gray-400 mr-3" />
                              <span className="font-medium text-gray-900">Email Updates</span>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${user.notificationPreferences?.email !== false ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                              {user.notificationPreferences?.email !== false ? 'Enabled' : 'Disabled'}
                          </span>
                      </div>
                      <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-100 justify-between">
                          <div className="flex items-center">
                              <Bell className="h-5 w-5 text-gray-400 mr-3" />
                              <span className="font-medium text-gray-900">Push Notifications</span>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${user.notificationPreferences?.push !== false ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                              {user.notificationPreferences?.push !== false ? 'Enabled' : 'Disabled'}
                          </span>
                      </div>
                  </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
};