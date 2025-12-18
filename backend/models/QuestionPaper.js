import mongoose from 'mongoose';

const questionPaperSchema = new mongoose.Schema({
  lecturerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  templateType: {
    type: String,
    default: 'standard',
  },
  assessmentType: {
    type: String,
    enum: ['I Internal', 'II Internal', 'III Internal', 'Final'],
    required: true,
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8,
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
  },
  subjectName: {
    type: String,
    required: true,
  },
  subjectCode: {
    type: String,
    required: true,
  },
  facultyName: {
    type: String,
    required: true,
  },
  assessmentDate: {
    type: Date,
    required: true,
  },
  assessmentTime: {
    type: String,
    required: true,
  },
  maximumMarks: {
    type: Number,
    required: true,
  },
  numberOfQuestionsToAttend: {
    type: Number,
    required: true,
  },
  courseOutcome: {
    type: String,
    default: '',
  },
  learningOutcome: {
    type: String,
    default: '',
  },
  questions: [{
    questionNumber: {
      type: Number,
      required: true,
    },
    questionText: {
      type: String,
      required: true,
    },
    marks: {
      type: Number,
      required: true,
    },
    courseOutcome: {
      type: String,
      default: '',
    },
    learningOutcome: {
      type: String,
      default: '',
    },
    subQuestions: [{
      subQuestionLetter: {
        type: String,
        default: '',
      },
      subQuestionText: {
        type: String,
        required: true,
      },
      marks: {
        type: Number,
        required: true,
      },
      courseOutcome: {
        type: String,
        default: '',
      },
      learningOutcome: {
        type: String,
        default: '',
      },
    }],
    operator: {
      type: String,
      enum: ['and', 'or', 'AND', 'OR', null],
      default: null,
    },
  }],
  pdfUrl: {
    type: String,
    default: '',
  },
  docxUrl: {
    type: String,
    default: '',
  },
  sentToAdmin: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('QuestionPaper', questionPaperSchema);


