import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import User from '../models/User.js';
import ApprovedLecturer from '../models/ApprovedLecturer.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const ensureMailConfig = () => {
  return process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
};

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendOtpEmail = async (to, otp, purpose) => {
  const subject = purpose === 'password-reset'
    ? 'Your password reset OTP'
    : 'Your login OTP';

  const text = `Your OTP for ${purpose === 'password-reset' ? 'resetting your password' : 'logging in'} is ${otp}. 
This code expires in 10 minutes. If you did not request this, please ignore the email.`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
  });
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, role, department } = req.body;

    // Validation
    if (!email || !password || !role || !department) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // For lecturers, check if email is approved
    if (role === 'lecturer') {
      const approvedLecturer = await ApprovedLecturer.findOne({ email });
      if (!approvedLecturer) {
        return res.status(400).json({ message: 'Email not approved for lecturer registration' });
      }
    }

    // Create user
    const user = new User({
      email,
      password,
      role,
      department,
      isApproved: role === 'admin' ? true : false,
    });

    await user.save();

    // If lecturer, update isApproved to true
    if (role === 'lecturer') {
      user.isApproved = true;
      await user.save();
    }

    res.status(201).json({ message: 'Registration successful', userId: user._id });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Request OTP for login (email + password validation)
router.post('/login/request-otp', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (!ensureMailConfig()) {
      return res.status(500).json({ message: 'Email service is not configured on the server' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isApproved) {
      return res.status(403).json({ message: 'Account not approved' });
    }

    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);

    user.loginOtp = hashedOtp;
    user.loginOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    await sendOtpEmail(user.email, otp, 'login');

    res.json({ message: 'OTP sent to your registered email. It expires in 10 minutes.' });
  } catch (error) {
    console.error('Request login OTP error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Resend OTP for login
router.post('/login/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    if (!ensureMailConfig()) {
      return res.status(500).json({ message: 'Email service is not configured on the server' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.isApproved) {
      return res.status(403).json({ message: 'Account not approved' });
    }

    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);
    user.loginOtp = hashedOtp;
    user.loginOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendOtpEmail(user.email, otp, 'login');

    res.json({ message: 'A new OTP has been sent to your email.' });
  } catch (error) {
    console.error('Resend login OTP error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify OTP and complete login
router.post('/login', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.loginOtp || !user.loginOtpExpiresAt) {
      return res.status(400).json({ message: 'Please request an OTP first' });
    }

    if (user.loginOtpExpiresAt < new Date()) {
      return res.status(401).json({ message: 'OTP expired. Please request a new one.' });
    }

    const isOtpValid = await bcrypt.compare(otp, user.loginOtp);
    if (!isOtpValid) {
      return res.status(401).json({ message: 'Invalid OTP' });
    }

    if (!user.isApproved) {
      return res.status(403).json({ message: 'Account not approved' });
    }

    user.loginOtp = null;
    user.loginOtpExpiresAt = null;
    await user.save();

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        department: user.department,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Forgot password: request OTP
router.post('/forgot-password/request-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    if (!ensureMailConfig()) {
      return res.status(500).json({ message: 'Email service is not configured on the server' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);
    user.resetOtp = hashedOtp;
    user.resetOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendOtpEmail(user.email, otp, 'password-reset');

    res.json({ message: 'Password reset OTP sent to your email. It expires in 10 minutes.' });
  } catch (error) {
    console.error('Forgot password request error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Forgot password: reset using OTP
router.post('/forgot-password/reset', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.resetOtp || !user.resetOtpExpiresAt) {
      return res.status(400).json({ message: 'Please request a password reset OTP first' });
    }

    if (user.resetOtpExpiresAt < new Date()) {
      return res.status(401).json({ message: 'OTP expired. Please request a new one.' });
    }

    const isOtpValid = await bcrypt.compare(otp, user.resetOtp);
    if (!isOtpValid) {
      return res.status(401).json({ message: 'Invalid OTP' });
    }

    user.password = newPassword;
    user.resetOtp = null;
    user.resetOtpExpiresAt = null;
    user.loginOtp = null;
    user.loginOtpExpiresAt = null;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        email: req.user.email,
        role: req.user.role,
        department: req.user.department,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;














