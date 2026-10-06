import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {});
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const fileInputRef = useRef(null);

  // Form States
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: '',
    location: '',
    portfolio: '',
    github: '',
    avatar: '' // Add this
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('user'));
    
    if (!currentUser?.token) {
      navigate('/login');
      return;
    }

    // Fetch the latest full profile data from the database
    const fetchProfileData = async () => {
      try {
        const { data } = await API.get('/auth/profile');
        
        // Populate the form fields with the fresh database data
        setFormData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          location: data.location || '',
          portfolio: data.portfolio || '',
          github: data.github || '',
          avatar: data.avatar || '' // Add this line
        });

        // Update local storage to keep the app synchronized
        const updatedUser = { ...currentUser, ...data };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      } catch (error) {
        console.error('Failed to load profile data', error);
      }
    };

    fetchProfileData();
  }, [navigate]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const { data } = await API.put('/auth/profile', formData);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      const updatedUser = { ...user, ...data };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update profile.' });
    } finally {
      setIsSaving(false);
    }
  }; // <-- This closing brace was missing!

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Limit file size to ~2MB to prevent MongoDB document size issues
      if (file.size > 2 * 1024 * 1024) {
        return setMessage({ type: 'error', text: 'Image must be smaller than 2MB' });
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, avatar: reader.result }); // Save base64 string
      };
      reader.readAsDataURL(file);
    }
  };

  const updatePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      return setMessage({ type: 'error', text: 'New passwords do not match.' });
    }
    
    setIsSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await API.put('/auth/password', { 
        currentPassword: passwords.currentPassword, 
        newPassword: passwords.newPassword 
      });
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update password.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in-up">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 sm:mb-12 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-5">
          <Link to="/tasks" className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 active:scale-95 transition-all duration-300 shadow-sm">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Account Settings</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">Manage your personal details and security</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Sidebar Navigation */}
        <div className="lg:col-span-4 space-y-6">
          {/* Profile Quick View Card */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-center relative overflow-hidden group hover:shadow-xl transition-all duration-500">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            
            <div className="relative mt-8 mb-4">
              {/* Hidden File Input */}
              <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handleImageChange} />
              
              <div onClick={handleImageClick} className="w-24 h-24 mx-auto bg-white rounded-full p-1.5 shadow-xl relative cursor-pointer group-hover:scale-105 transition-transform duration-300">
                <div className="w-full h-full bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-3xl font-bold overflow-hidden relative">
                  
                  {/* Render Image or Initial */}
                  {formData.avatar ? (
                    <img src={formData.avatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    formData.name.charAt(0).toUpperCase()
                  )}
                  
                  {/* Photo Overlay on Hover */}
                  <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                {/* Status Badge */}
                <div className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-400 border-2 border-white rounded-full"></div>
              </div>
            </div>
            <h2 className="text-xl font-extrabold text-slate-800">{formData.name}</h2>
            <p className="text-sm font-medium text-slate-500">{formData.email}</p>
          </div>

          {/* Settings Tabs */}
          <div className="bg-white p-3 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-2">
            <button 
              onClick={() => setActiveTab('general')} 
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all duration-300 ${activeTab === 'general' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-transparent text-slate-600 hover:bg-slate-50 hover:text-indigo-600'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              General Profile
            </button>
            <button 
              onClick={() => setActiveTab('security')} 
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all duration-300 ${activeTab === 'security' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-transparent text-slate-600 hover:bg-slate-50 hover:text-indigo-600'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              Security
            </button>
          </div>
        </div>

        {/* Right Column Content Area */}
        <div className="lg:col-span-8">
          <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-sm border border-slate-100 min-h-[500px]">
            
            {/* Status Message Popup */}
            {message.text && (
              <div className={`p-4 rounded-2xl mb-8 flex items-center gap-3 animate-popup border ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                {message.type === 'success' ? (
                  <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                ) : (
                  <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                )}
                <span className="font-bold text-sm">{message.text}</span>
              </div>
            )}

            {/* General Profile Tab */}
            {activeTab === 'general' && (
              <div className="animate-fade-in-up">
                <h2 className="text-2xl font-extrabold text-slate-800 mb-6">Personal Information</h2>
                <form onSubmit={saveProfile} className="space-y-6">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5 group">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 transition-colors group-focus-within:text-indigo-600">Full Name</label>
                      <input type="text" name="name" required value={formData.name} onChange={handleInputChange}
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all duration-300" />
                    </div>
                    
                    <div className="space-y-1.5 group">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
                      <input type="email" name="email" readOnly value={formData.email}
                        className="w-full px-5 py-3.5 bg-slate-100 border border-slate-200 text-slate-500 rounded-2xl cursor-not-allowed opacity-70" title="Email cannot be changed" />
                    </div>

                    <div className="space-y-1.5 group">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 transition-colors group-focus-within:text-indigo-600">Phone Number</label>
                      <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+1 (555) 000-0000"
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all duration-300" />
                    </div>

                    <div className="space-y-1.5 group">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 transition-colors group-focus-within:text-indigo-600">Location</label>
                      <input type="text" name="location" value={formData.location} onChange={handleInputChange} placeholder="City, Country"
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all duration-300" />
                    </div>

                    <div className="space-y-1.5 group">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 transition-colors group-focus-within:text-indigo-600">Portfolio URL</label>
                      <input type="url" name="portfolio" value={formData.portfolio} onChange={handleInputChange} placeholder="https://yourwebsite.com"
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all duration-300" />
                    </div>

                    <div className="space-y-1.5 group">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 transition-colors group-focus-within:text-indigo-600">GitHub Username</label>
                      <input type="text" name="github" value={formData.github} onChange={handleInputChange} placeholder="johndoe"
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all duration-300" />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100 flex justify-end">
                    <button type="submit" disabled={isSaving}
                      className="px-8 py-4 text-white font-bold bg-indigo-600 rounded-2xl hover:bg-indigo-700 active:scale-95 transition-all duration-300 shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                      {isSaving ? (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                      )}
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="animate-fade-in-up">
                <h2 className="text-2xl font-extrabold text-slate-800 mb-2">Change Password</h2>
                <p className="text-sm font-medium text-slate-500 mb-8">Ensure your account is using a long, random password to stay secure.</p>
                
                <form onSubmit={updatePassword} className="space-y-6 max-w-md">
                  <div className="space-y-1.5 group">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 transition-colors group-focus-within:text-indigo-600">Current Password</label>
                    <input type="password" name="currentPassword" required value={passwords.currentPassword} onChange={handlePasswordChange}
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all duration-300" placeholder="••••••••" />
                  </div>
                  
                  <div className="space-y-1.5 group">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 transition-colors group-focus-within:text-indigo-600">New Password</label>
                    <input type="password" name="newPassword" required value={passwords.newPassword} onChange={handlePasswordChange}
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all duration-300" placeholder="••••••••" />
                  </div>

                  <div className="space-y-1.5 group">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 transition-colors group-focus-within:text-indigo-600">Confirm New Password</label>
                    <input type="password" name="confirmPassword" required value={passwords.confirmPassword} onChange={handlePasswordChange}
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all duration-300" placeholder="••••••••" />
                  </div>

                  <div className="pt-6">
                    <button type="submit" disabled={isSaving}
                      className="w-full px-8 py-4 text-white font-bold bg-indigo-600 rounded-2xl hover:bg-indigo-700 active:scale-95 transition-all duration-300 shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                      {isSaving ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>
            )}
            
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;