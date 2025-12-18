import mongoose from 'mongoose';

const collegeDetailsSchema = new mongoose.Schema({
  logoUrl: {
    type: String,
    default: '',
  },
  collegeName: {
    type: String,
    default: '',
  },
  collegeAddress: {
    type: String,
    default: '',
  },
  department: {
    type: String,
    default: '',
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('CollegeDetails', collegeDetailsSchema);



















