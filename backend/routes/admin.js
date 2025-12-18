import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticate, authorize } from '../middleware/auth.js';
import ApprovedLecturer from '../models/ApprovedLecturer.js';
import CollegeDetails from '../models/CollegeDetails.js';
import Subject from '../models/Subject.js';
import QuestionPaper from '../models/QuestionPaper.js';
import User from '../models/User.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// Add Lecturer
router.post('/add-lecturer', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if user is already an admin
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser && existingUser.role === 'admin') {
      return res.status(400).json({ message: 'User is already registered as an Admin cannot be added as lecturer' });
    }

    const existingLecturer = await ApprovedLecturer.findOne({ email });
    if (existingLecturer) {
      return res.status(400).json({ message: 'Lecturer already approved' });
    }

    const approvedLecturer = new ApprovedLecturer({
      email: email.toLowerCase(),
      addedBy: req.user._id,
      department: req.user.department,
    });

    await approvedLecturer.save();

    // Update user if exists
    // Update user if exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      user.isApproved = true;
      await user.save();
    }

    res.status(201).json({ message: 'Lecturer added successfully', lecturer: approvedLecturer });
  } catch (error) {
    console.error('Add lecturer error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all approved lecturers
router.get('/lecturers', async (req, res) => {
  try {
    const lecturers = await ApprovedLecturer.find({ addedBy: req.user._id }).populate('addedBy', 'email').sort({ addedAt: -1 });
    res.json(lecturers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove lecturer
router.delete('/lecturers/:id', async (req, res) => {
  try {
    const lecturer = await ApprovedLecturer.findById(req.params.id);
    if (!lecturer) {
      return res.status(404).json({ message: 'Lecturer not found' });
    }

    if (lecturer.department !== req.user.department) {
      return res.status(403).json({ message: 'Not authorized to remove this lecturer' });
    }

    await ApprovedLecturer.findByIdAndDelete(req.params.id);

    // Update user if exists
    const User = (await import('../models/User.js')).default;
    const user = await User.findOne({ email: lecturer.email });
    if (user) {
      user.isApproved = false;
      await user.save();
    }

    res.json({ message: 'Lecturer removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// College Details - Get
router.get('/college-details', async (req, res) => {
  try {
    let collegeDetails = await CollegeDetails.findOne({ adminId: req.user._id });
    if (!collegeDetails) {
      collegeDetails = new CollegeDetails({
        adminId: req.user._id,
        department: req.user.department
      });
      await collegeDetails.save();
    }
    res.json(collegeDetails);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// College Details - Update
router.put('/college-details', upload.single('logo'), async (req, res) => {
  try {
    let collegeDetails = await CollegeDetails.findOne({ adminId: req.user._id });

    if (!collegeDetails) {
      collegeDetails = new CollegeDetails({
        adminId: req.user._id,
        department: req.user.department
      });
    }

    if (req.file) {
      collegeDetails.logoUrl = `/uploads/${req.file.filename}`;
    }

    if (req.body.collegeName) collegeDetails.collegeName = req.body.collegeName;
    if (req.body.collegeAddress) collegeDetails.collegeAddress = req.body.collegeAddress;
    if (req.body.department) collegeDetails.department = req.body.department;

    collegeDetails.updatedBy = req.user._id;
    collegeDetails.updatedAt = new Date();

    await collegeDetails.save();
    res.json({ message: 'College details updated successfully', collegeDetails });
  } catch (error) {
    console.error('College details update error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add Subject
router.post('/subjects', async (req, res) => {
  try {
    const { subjectName, subjectCode, semester } = req.body;

    if (!subjectName || !subjectCode || !semester) {
      return res.status(400).json({ message: 'Subject name, code, and semester are required' });
    }

    const existingSubject = await Subject.findOne({ subjectCode });
    if (existingSubject) {
      return res.status(400).json({ message: 'Subject code already exists' });
    }

    const subject = new Subject({
      subjectName,
      subjectCode,
      semester: parseInt(semester),
      department: req.user.department,
      addedBy: req.user._id,
    });

    await subject.save();
    res.status(201).json({ message: 'Subject added successfully', subject });
  } catch (error) {
    console.error('Add subject error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all subjects
router.get('/subjects', async (req, res) => {
  try {
    const subjects = await Subject.find({
      addedBy: req.user._id
    }).populate('addedBy', 'email').sort({ createdAt: -1 });
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete subject
router.delete('/subjects/:id', async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    if (subject.addedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this subject' });
    }

    await Subject.findByIdAndDelete(req.params.id);
    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// View Question Papers
router.get('/question-papers', async (req, res) => {
  try {
    // Find lecturers added by this admin
    const approvedLecturers = await ApprovedLecturer.find({ addedBy: req.user._id });
    const approvedEmails = approvedLecturers.map(al => al.email);

    // Find User IDs for these emails
    const users = await User.find({ email: { $in: approvedEmails } });
    const lecturerIds = users.map(u => u._id);

    const papers = await QuestionPaper.find({
      sentToAdmin: true,
      lecturerId: { $in: lecturerIds }
    })
      .populate('lecturerId', 'email')
      .populate('subjectId', 'subjectName subjectCode')
      .sort({ createdAt: -1 });
    res.json(papers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete Question Paper
router.delete('/question-papers/:id', async (req, res) => {
  try {
    const UnusedQuestion = (await import('../models/UnusedQuestion.js')).default;
    await UnusedQuestion.deleteMany({ questionPaperId: req.params.id });
    await QuestionPaper.findByIdAndDelete(req.params.id);
    res.json({ message: 'Question paper deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;


