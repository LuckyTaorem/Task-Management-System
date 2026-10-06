// src/pages/Register.jsx
import { useState } from 'react'; 
import { useNavigate, Link } from 'react-router-dom'; 
import API from '../api'; 

const Register = () => {
  const [name, setName] = useState(''); 
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState(''); 
  const [error, setError] = useState(''); 
  const navigate = useNavigate(); 

  const handleRegister = async (e) => {
    e.preventDefault(); 
    try {
      const { data } = await API.post('/auth/register', { name, email, password }); 
      localStorage.setItem('user', JSON.stringify(data)); 
      navigate('/tasks'); 
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed'); 
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen p-4 overflow-hidden bg-slate-50">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-float"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-float-delayed"></div>

      {/* Register Card */}
      <div className="relative w-full max-w-md p-8 sm:p-10 space-y-8 bg-white/80 backdrop-blur-2xl rounded-[2rem] shadow-2xl shadow-indigo-100/50 border border-white animate-fade-in-up z-10">
        
        {/* Header section with Icon */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto bg-indigo-50 rounded-2xl flex items-center justify-center shadow-inner mb-6">
            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Create Account</h2> {}
          <p className="text-slate-500 font-medium">Join us to manage your workspace</p>
        </div>
        
        {/* Error Alert */}
        {error && ( 
          <div className="flex items-center gap-3 p-4 text-sm text-red-600 bg-red-50/80 rounded-2xl border border-red-100 animate-popup">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="font-semibold">{error}</span> {}
          </div>
        )}
        
        {/* Register Form */}
        <form onSubmit={handleRegister} className="space-y-6"> {}
          
          <div className="space-y-1.5 group">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 transition-colors group-focus-within:text-indigo-600">
              Full Name {}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input 
                type="text" 
                required 
                value={name} 
                onChange={(e) => {
  setName(e.target.value);
}}

                className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all duration-300 text-slate-900 font-medium placeholder-slate-400" 
                placeholder="John Doe" 
              />
            </div>
          </div>

          <div className="space-y-1.5 group">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 transition-colors group-focus-within:text-indigo-600">
              Email Address {}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <input 
                type="email" 
                required 
                value={email} 
                onChange={(e) => {
  setEmail(e.target.value);
}}

                className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all duration-300 text-slate-900 font-medium placeholder-slate-400" 
                placeholder="you@example.com" 
              />
            </div>
          </div>

          <div className="space-y-1.5 group">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 transition-colors group-focus-within:text-indigo-600">
              Password {}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <input 
                type="password" 
                required 
                value={password} 
                onChange={(e) => {
  setPassword(e.target.value);
}}

                className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all duration-300 text-slate-900 font-medium placeholder-slate-400" 
                placeholder="••••••••" 
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="group w-full flex items-center justify-center gap-2 px-6 py-4 text-white font-bold bg-indigo-600 rounded-2xl hover:bg-indigo-700 active:scale-[0.98] transition-all duration-300 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 mt-2"
          >
            Register {}
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </form>

        {/* Footer */}
        <p className="text-sm text-center text-slate-500 font-medium pt-2">
          Already have an account?{' '} {}
          <Link to="/login" className="text-indigo-600 font-bold hover:text-indigo-700 hover:underline transition-all"> {}
            Log in {}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register; 