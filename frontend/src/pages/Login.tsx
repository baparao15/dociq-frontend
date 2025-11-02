import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FileText, AlertCircle, Lock, Mail } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to login. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex flex-col items-start justify-center space-y-6 text-left">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 bg-gradient-primary rounded-xl shadow-neon flex items-center justify-center">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Legal Document Demystifier</h1>
          </div>
          <p className="text-xl text-dark-300 leading-relaxed">
            AI-powered legal document analysis platform. Identify risks, get summaries, and protect your interests.
          </p>
          <div className="flex flex-col gap-3 mt-6">
            <div className="flex items-center gap-3 text-dark-300">
              <div className="w-2 h-2 bg-accent-neon rounded-full"></div>
              <span>Identify risky clauses in contracts</span>
            </div>
            <div className="flex items-center gap-3 text-dark-300">
              <div className="w-2 h-2 bg-accent-neon rounded-full"></div>
              <span>Get AI-powered document summaries</span>
            </div>
            <div className="flex items-center gap-3 text-dark-300">
              <div className="w-2 h-2 bg-accent-neon rounded-full"></div>
              <span>Receive safer alternative suggestions</span>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="lg:hidden text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-primary rounded-xl shadow-neon mb-3">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
              <p className="text-dark-400">Sign in to continue</p>
            </div>

            <div className="bg-dark-800/60 backdrop-blur-xl rounded-2xl shadow-premium p-8 border border-dark-700">
              <div className="hidden lg:block mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
                <p className="text-dark-400">Sign in to your account</p>
              </div>

              {/* Demo Credentials */}
              <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <h3 className="text-blue-400 font-semibold text-sm mb-2">🎯 Demo Credentials</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-blue-300">Email:</span>
                    <span className="text-dark-300 ml-1">test@example.com</span>
                  </div>
                  <div>
                    <span className="text-blue-300">Password:</span>
                    <span className="text-dark-300 ml-1">mypassword123</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('test@example.com');
                    setPassword('mypassword123');
                  }}
                  className="mt-3 text-xs text-blue-400 hover:text-blue-300 transition-colors underline"
                >
                  Click to auto-fill
                </button>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-dark-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-500" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-dark-900/50 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-dark-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-500" />
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-dark-900/50 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-gradient-primary hover:opacity-90 text-white font-semibold rounded-lg shadow-neon transition-opacity duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-dark-400">
                  Don't have an account?{' '}
                  <Link to="/signup" className="text-accent-neon hover:text-accent-emerald transition-colors font-medium">
                    Sign up
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
