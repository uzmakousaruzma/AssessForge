import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [otpMessage, setOtpMessage] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirm, setResetConfirm] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetOtpSent, setResetOtpSent] = useState(false);
  const [resetTimer, setResetTimer] = useState(0);
  const [resetLoading, setResetLoading] = useState(false);
  const {
    loginWithOtp,
    requestLoginOtp,
    resendLoginOtp,
    requestPasswordResetOtp,
    resetPasswordWithOtp,
  } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!otpTimer) return;
    const interval = setInterval(() => {
      setOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [otpTimer]);

  useEffect(() => {
    if (!resetTimer) return;
    const interval = setInterval(() => {
      setResetTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resetTimer]);

  const handleRequestOtp = async () => {
    setError('');
    setOtpMessage('');
    if (!email || !password) {
      setError('Please enter email and password first.');
      return;
    }
    setOtpLoading(true);
    try {
      await requestLoginOtp(email, password);
      setOtpSent(true);
      setOtp('');
      setOtpMessage('OTP sent to your registered email.');
      setOtpTimer(60);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (otpTimer > 0) return;
    if (!email) {
      setError('Please enter your email to resend OTP.');
      return;
    }
    setError('');
    setOtpMessage('');
    setOtpLoading(true);
    try {
      await resendLoginOtp(email);
      setOtpMessage('A new OTP has been sent.');
      setOtpTimer(60);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setOtpMessage('');
    setLoading(true);

    if (!otp) {
      setError('Please enter the OTP sent to your email.');
      setLoading(false);
      return;
    }

    try {
      const user = await loginWithOtp(email, otp);
      navigate(`/${user.role}/dashboard`);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordToggle = () => {
    setForgotOpen((prev) => !prev);
    setResetEmail(email);
    setResetError('');
    setResetMessage('');
  };

  const handleRequestResetOtp = async () => {
    setResetError('');
    setResetMessage('');
    if (!resetEmail) {
      setResetError('Please enter your registered email.');
      return;
    }
    setResetLoading(true);
    try {
      await requestPasswordResetOtp(resetEmail);
      setResetOtpSent(true);
      setResetMessage('OTP sent to your email. Enter it below to reset password.');
      setResetTimer(60);
    } catch (err) {
      setResetError(err.response?.data?.message || 'Failed to send reset OTP');
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setResetError('');
    setResetMessage('');
    if (!resetEmail || !resetOtp || !resetPassword || !resetConfirm) {
      setResetError('Please complete all reset fields.');
      return;
    }
    if (resetPassword !== resetConfirm) {
      setResetError('Passwords do not match.');
      return;
    }
    if (resetPassword.length < 8) {
      setResetError('Password must be at least 8 characters.');
      return;
    }

    setResetLoading(true);
    try {
      await resetPasswordWithOtp(resetEmail, resetOtp, resetPassword);
      setResetMessage('Password updated. You can sign in with the new password.');
      setResetOtp('');
      setResetPassword('');
      setResetConfirm('');
      setResetTimer(0);
    } catch (err) {
      setResetError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-primary-600">
            Sign in to AssessForge
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          {otpMessage && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
              {otpMessage}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm pr-10"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {!otpSent && (
              <button
                type="button"
                onClick={handleRequestOtp}
                disabled={otpLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {otpLoading ? 'Sending...' : 'Get OTP'}
              </button>
            )}

            {otpSent && (
              <div>
                <label htmlFor="otp" className="sr-only">
                  OTP
                </label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  maxLength="6"
                  inputMode="numeric"
                  required
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm tracking-widest text-center"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
                <div className="flex items-center justify-between mt-2 text-sm">
                  <span className="text-gray-600">
                    {otpTimer > 0 ? `Resend OTP in ${otpTimer}s` : 'You can resend the OTP now.'}
                  </span>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={otpTimer > 0 || otpLoading}
                    className="text-primary-600 hover:text-primary-500 disabled:opacity-50"
                  >
                    Resend OTP
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in with OTP'}
            </button>
            <button
              type="button"
              onClick={handleForgotPasswordToggle}
              className="w-full text-sm text-primary-600 hover:text-primary-500"
            >
              {forgotOpen ? 'Close password reset' : 'Forgot password?'}
            </button>
          </div>

          {forgotOpen && (
            <div className="border-t border-gray-200 pt-4 space-y-3">
              {resetError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                  {resetError}
                </div>
              )}
              {resetMessage && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded text-sm">
                  {resetMessage}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Registered email"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleRequestResetOtp}
                  disabled={resetLoading}
                  className="self-end px-4 py-2 bg-primary-50 text-primary-700 border border-primary-200 rounded-md hover:bg-primary-100 disabled:opacity-50 text-sm"
                >
                  {resetLoading ? 'Sending...' : 'Get OTP'}
                </button>
              </div>
              {resetOtpSent && (
                <>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter reset OTP"
                      maxLength="6"
                      inputMode="numeric"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={handleRequestResetOtp}
                      disabled={resetTimer > 0 || resetLoading}
                      className="self-end px-4 py-2 bg-white text-primary-700 border border-primary-200 rounded-md hover:bg-primary-50 disabled:opacity-50 text-sm"
                    >
                      {resetTimer > 0 ? `Resend in ${resetTimer}s` : 'Resend OTP'}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showResetPassword ? "text" : "password"}
                      placeholder="New password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm pr-10"
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                    >
                      {showResetPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showResetConfirm ? "text" : "password"}
                      placeholder="Confirm new password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm pr-10"
                      value={resetConfirm}
                      onChange={(e) => setResetConfirm(e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                      onClick={() => setShowResetConfirm(!showResetConfirm)}
                    >
                      {showResetConfirm ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                    </button>
                  </div>
                  <button
                    type="submit"
                    onClick={handleResetPassword}
                    disabled={resetLoading}
                    className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
                  >
                    {resetLoading ? 'Updating...' : 'Reset password'}
                  </button>
                </>
              )}
            </div>
          )}

          <div className="text-center">
            <Link
              to="/register"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Don't have an account? Register
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;





