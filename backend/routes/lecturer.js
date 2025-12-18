import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, ImageRun, Media, BorderStyle } from 'docx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticate, authorize } from '../middleware/auth.js';
import GeneratedQuestion from '../models/GeneratedQuestion.js';
import QuestionPaper from '../models/QuestionPaper.js';
import UnusedQuestion from '../models/UnusedQuestion.js';
import Subject from '../models/Subject.js';
import Module from '../models/Module.js';
import ApprovedLecturer from '../models/ApprovedLecturer.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Utility function to convert numbers to Roman numerals
const toRoman = (num) => {
  const romanNumerals = [
    { value: 8, numeral: 'VIII' },
    { value: 7, numeral: 'VII' },
    { value: 6, numeral: 'VI' },
    { value: 5, numeral: 'V' },
    { value: 4, numeral: 'IV' },
    { value: 3, numeral: 'III' },
    { value: 2, numeral: 'II' },
    { value: 1, numeral: 'I' },
  ];

  for (let i = 0; i < romanNumerals.length; i++) {
    if (num >= romanNumerals[i].value) {
      return romanNumerals[i].numeral;
    }
  }
  return '';
};

// Ensure directories exist
const uploadsDir = path.join(__dirname, '../uploads');
const papersDir = path.join(uploadsDir, 'papers');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(papersDir)) fs.mkdirSync(papersDir, { recursive: true });

// Initialize Gemini AI
const GEMINIAPIKEY = "AIzaSyBIGNjXP7EuNI0LCPAwFLrIV96jpcIBIZM";
const genAI = new GoogleGenerativeAI(GEMINIAPIKEY);

// All lecturer routes require authentication and lecturer role
router.use(authenticate);
router.use(authorize('lecturer'));

// Get subjects (added by admin)
router.get('/subjects', async (req, res) => {
  try {
    const { semester } = req.query;

    // Find who added this lecturer
    const lecturerInfo = await ApprovedLecturer.findOne({ email: req.user.email });

    if (!lecturerInfo) {
      // Fallback or empty if not found? 
      // If a lecturer is not in ApprovedLecturer table, they technically shouldn't be here or have "addedBy"
      return res.json([]);
    }

    const query = {
      addedBy: lecturerInfo.addedBy
    };

    if (semester) {
      query.semester = parseInt(semester);
    }
    // Removed department filter as requested

    const subjects = await Subject.find(query).sort({ subjectName: 1 });
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add Module
router.post('/modules', async (req, res) => {
  try {
    const { subjectId, moduleName } = req.body;

    if (!subjectId || !moduleName) {
      return res.status(400).json({ message: 'Subject and module name are required' });
    }

    const module = new Module({
      subjectId,
      moduleName,
      lecturerId: req.user._id,
    });

    await module.save();
    res.status(201).json({ message: 'Module added successfully', module });
  } catch (error) {
    console.error('Add module error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get modules for a subject
router.get('/modules/:subjectId', async (req, res) => {
  try {
    const modules = await Module.find({
      subjectId: req.params.subjectId,
      lecturerId: req.user._id,
    }).sort({ createdAt: -1 });
    res.json(modules);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Generate Questions
router.post('/generate-questions', async (req, res) => {
  try {
    const { subjectId, moduleId, topic, maxWeightage, numberOfQuestions } = req.body;

    if (!subjectId || !moduleId || !topic || !maxWeightage || !numberOfQuestions) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `Generate ${numberOfQuestions} descriptive academic questions on the topic "${topic}" suitable for assessments worth up to ${maxWeightage} marks each.
Return the response strictly as a raw JSON array (no markdown or backticks) of objects with a single property:
- "questionText": the question stated in plain text with no code samples or snippets.
Do not include any code, pseudocode, markdown fences, numbering, or additional properties.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

  // Clean up any stray markdown fences just in case
  text = text.replace(/```json/gi, '').replace(/```/g, '').trim();

  let questions = [];
  try {
    questions = JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse Gemini response as JSON", text);
    questions = text.split('\n')
      .map(line => line.replace(/^\d+[\).]\s*/, '').trim())
      .filter(Boolean);
  }

  const normalized = questions
    .map((q) => {
      const questionText = typeof q === 'string'
        ? q
        : q?.questionText || q?.question || '';
      return {
        questionText: (questionText || '').replace(/```[\s\S]*?```/g, '').trim(),
      };
    })
    .filter((q) => q.questionText);

  res.json({ questions: normalized });
  } catch (error) {
    console.error('Generate questions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Save Generated Question
router.post('/save-question', async (req, res) => {
  try {
    const { subjectId, moduleId, topic, question, marks, courseOutcome, learningOutcome } = req.body;

    if (!subjectId || !moduleId || !topic || !question || !marks || !courseOutcome || !learningOutcome) {
      return res.status(400).json({ message: 'All fields (including CO and BTL) are required' });
    }

  const finalQuestionText = question.trim();

    const generatedQuestion = new GeneratedQuestion({
      lecturerId: req.user._id,
      subjectId,
      moduleId,
      topic,
      question: finalQuestionText,
      marks,
      courseOutcome,
      learningOutcome,
    });

    await generatedQuestion.save();
    res.status(201).json({ message: 'Question saved successfully', question: generatedQuestion });
  } catch (error) {
    console.error('Save question error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get available questions for paper creation
router.get('/available-questions', async (req, res) => {
  try {
    const { subjectId, moduleId, marks } = req.query;

    const query = {
      lecturerId: req.user._id,
      isUsed: false,
    };

    if (subjectId) query.subjectId = subjectId;
    if (moduleId) query.moduleId = moduleId;
    if (marks) query.marks = parseInt(marks);

    const questions = await GeneratedQuestion.find(query)
      .populate('subjectId', 'subjectName subjectCode')
      .populate('moduleId', 'moduleName')
      .sort({ createdAt: -1 });

    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create Question Paper
router.post('/create-paper', async (req, res) => {
  try {
    const {
      assessmentType,
      semester,
      subjectId,
      facultyName,
      assessmentDate,
      assessmentTime,
      maximumMarks,
      numberOfQuestionsToAttend,
      courseOutcome,
      learningOutcome,
      questions,
    } = req.body;

    if (!assessmentType || !semester || !subjectId || !facultyName || !assessmentDate || !assessmentTime || !maximumMarks || !numberOfQuestionsToAttend || !questions || questions.length === 0) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const parsedMaxMarks = parseFloat(maximumMarks);
    const parsedQuestionsToAttend = parseInt(numberOfQuestionsToAttend, 10);

    if (!Number.isFinite(parsedMaxMarks) || parsedMaxMarks <= 0) {
      return res.status(400).json({ message: 'Maximum marks must be a positive number' });
    }

    if (!Number.isFinite(parsedQuestionsToAttend) || parsedQuestionsToAttend <= 0) {
      return res.status(400).json({ message: 'Number of questions to attend must be a positive integer' });
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    const toNumber = (value) => {
      const n = parseFloat(value);
      return Number.isFinite(n) ? n : 0;
    };

    const resultantMarks = parsedMaxMarks / parsedQuestionsToAttend;

    if (!Number.isFinite(resultantMarks) || resultantMarks <= 0) {
      return res.status(400).json({ message: 'Resultant marks per question could not be determined. Please review maximum marks and questions to attend.' });
    }

    if (questions.length < parsedQuestionsToAttend) {
      return res.status(400).json({ message: `Please provide at least ${parsedQuestionsToAttend} main questions so students can attend the required number.` });
    }

    const mismatch = questions.find((q) => {
      const subMarks = q.subQuestions?.reduce((s, sq) => s + toNumber(sq.marks), 0) || 0;
      return Math.abs(subMarks - resultantMarks) > 0.01;
    });

    if (mismatch) {
      const index = questions.indexOf(mismatch);
      const subMarks = mismatch.subQuestions?.reduce((s, sq) => s + (parseFloat(sq.marks) || 0), 0) || 0;
      return res.status(400).json({ message: `Question ${index + 1} totals ${subMarks} marks. Each question must total ${resultantMarks} (maximum marks ÷ questions to attend).` });
    }

    const totalMarks = questions.reduce((sum, q) => {
      const subMarks = q.subQuestions?.reduce((s, sq) => s + toNumber(sq.marks), 0) || 0;
      return sum + subMarks;
    }, 0);

    const requiredTotal = parsedMaxMarks * 2;
    if (Math.abs(totalMarks - requiredTotal) > 0.01) {
      return res.status(400).json({ message: `Total marks (${totalMarks}) must equal ${requiredTotal} (maximum marks × 2).` });
    }

    // Create question paper
    const questionPaper = new QuestionPaper({
      lecturerId: req.user._id,
      department: req.user.department,
      assessmentType,
      semester,
      subjectId,
      subjectName: subject.subjectName,
      subjectCode: subject.subjectCode,
      facultyName,
      assessmentDate: new Date(assessmentDate),
      assessmentTime,
      maximumMarks,
      numberOfQuestionsToAttend,
      courseOutcome: courseOutcome || '',
      learningOutcome: learningOutcome || '',
      questions: questions.map((q, index) => {
        const marks = q.subQuestions?.reduce((s, sq) => s + toNumber(sq.marks), 0) || 0;
        const operator = index % 2 === 0 ? 'OR' : 'AND';

        return {
          questionNumber: index + 1,
          questionText: q.questionText || '',
          marks,
          courseOutcome: q.courseOutcome || '',
          learningOutcome: q.learningOutcome || '',
          subQuestions: q.subQuestions || [],
          operator,
        };
      }),
    });

    await questionPaper.save();

    // Mark questions as used
    const questionIds = questions.flatMap(q =>
      (q.subQuestions?.map(sq => sq.questionId).filter(Boolean) || [])
    ).filter(Boolean);

    await GeneratedQuestion.updateMany(
      { _id: { $in: questionIds } },
      { $set: { isUsed: true } }
    );

    // Generate DOCX only (PDF removed)
    const docxUrl = await generateDOCX(questionPaper, req.user.email);

    questionPaper.docxUrl = docxUrl;
    await questionPaper.save();

    // Collect unused questions and create text file
    await createUnusedQuestionsFile(questionPaper, req.user._id);

    res.status(201).json({
      message: 'Question paper created successfully',
      questionPaper,
      docxUrl,
    });
  } catch (error) {
    console.error('Create paper error:', error);
    try {
      fs.appendFileSync(path.join(__dirname, '..', 'error.log'), `[${new Date().toISOString()}] Create Paper Error: ${error.stack || error}\nRequest Body: ${JSON.stringify(req.body)}\n\n`);
    } catch (logErr) {
      console.error('Failed to write to error log:', logErr);
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Generate DOCX
async function generateDOCX(questionPaper, userEmail) {
  try {
    if (!questionPaper || !Array.isArray(questionPaper.questions)) {
      throw new Error('Invalid question paper data: questions array is missing or invalid');
    }

    const CollegeDetails = (await import('../models/CollegeDetails.js')).default;
    const ApprovedLecturer = (await import('../models/ApprovedLecturer.js')).default;

    // Find who added this lecturer (the admin)
    const lecturerApproval = await ApprovedLecturer.findOne({ email: userEmail });

    let collegeDetails = null;
    if (lecturerApproval) {
      // Fetch details specific to that admin
      collegeDetails = await CollegeDetails.findOne({ adminId: lecturerApproval.addedBy });
    }

    // Fallback if no admin-specific details found (e.g. for legacy or direct adds), try department or global
    if (!collegeDetails) {
      collegeDetails = await CollegeDetails.findOne({ department: questionPaper.department });
    }

    const fileName = `paper-${questionPaper._id}-${Date.now()}.docx`;
    const filePath = path.join(papersDir, fileName);

    const children = [];

    // Header
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'USN:____________', bold: true })],
        alignment: AlignmentType.RIGHT,
      })
    );

    // Logo and College Name - Logo on left, text on right
    // For DOCX, we'll use a table to position logo and text side by side
    if (collegeDetails?.logoUrl) {
      const logoPath = path.join(__dirname, '..', collegeDetails.logoUrl.replace(/^\//, ''));
      if (fs.existsSync(logoPath)) {
        try {
          const imageBuffer = fs.readFileSync(logoPath);
          const logoTable = new Table({
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new ImageRun({
                            data: imageBuffer,
                            transformation: {
                              width: 60,
                              height: 60,
                            },
                          }),
                        ],
                        alignment: AlignmentType.LEFT,
                      }),
                    ],
                    width: { size: 15, type: WidthType.PERCENTAGE },
                    margins: { top: 0, right: 0, bottom: 0, left: 0 },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: collegeDetails?.collegeName || 'College Name', bold: true, size: 24 })],
                        alignment: AlignmentType.CENTER,
                      }),
                      collegeDetails?.collegeAddress ? new Paragraph({
                        children: [new TextRun({ text: collegeDetails.collegeAddress })],
                        alignment: AlignmentType.CENTER,
                      }) : null,
                      collegeDetails?.department ? new Paragraph({
                        children: [new TextRun({ text: collegeDetails.department, bold: true })],
                        alignment: AlignmentType.CENTER,
                      }) : null,
                    ].filter(Boolean),
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    margins: { top: 0, right: 0, bottom: 0, left: 0 },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: '' })] })],
                    width: { size: 15, type: WidthType.PERCENTAGE },
                    margins: { top: 0, right: 0, bottom: 0, left: 0 },
                  }),
                ],
              }),
            ],
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE },
            },
          });
          children.push(logoTable);
        } catch (err) {
          console.error('Error loading logo for DOCX:', err);
          // Fallback to text only
          children.push(
            new Paragraph({
              children: [new TextRun({ text: collegeDetails?.collegeName || 'College Name', bold: true, size: 32 })],
              alignment: AlignmentType.CENTER,
            })
          );
          if (collegeDetails?.collegeAddress) {
            children.push(
              new Paragraph({
                children: [new TextRun({ text: collegeDetails.collegeAddress })],
                alignment: AlignmentType.CENTER,
              })
            );
          }
          if (collegeDetails?.department) {
            children.push(
              new Paragraph({
                children: [new TextRun({ text: collegeDetails.department, bold: true })],
                alignment: AlignmentType.CENTER,
              })
            );
          }
        }
      } else {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: collegeDetails?.collegeName || 'College Name', bold: true, size: 32 })],
            alignment: AlignmentType.CENTER,
          })
        );
        if (collegeDetails?.collegeAddress) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: collegeDetails.collegeAddress })],
              alignment: AlignmentType.CENTER,
            })
          );
        }
        if (collegeDetails?.department) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: collegeDetails.department, bold: true })],
              alignment: AlignmentType.CENTER,
            })
          );
        }
      }
    } else {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: collegeDetails?.collegeName || 'College Name', bold: true, size: 32 })],
          alignment: AlignmentType.CENTER,
        })
      );
      if (collegeDetails?.collegeAddress) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: collegeDetails.collegeAddress })],
            alignment: AlignmentType.CENTER,
          })
        );
      }
      if (collegeDetails?.department) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: collegeDetails.department, bold: true })],
            alignment: AlignmentType.CENTER,
          })
        );
      }
    }

    // Assessment type
    children.push(
      new Paragraph({
        children: [new TextRun({ text: questionPaper.assessmentType, bold: true, size: 28 })],
        alignment: AlignmentType.CENTER,
      })
    );

    children.push(new Paragraph({ text: '' }));

    // Details - partitioned equally (50/50)
    // Left column: Semester, Date, Subject, Subject Code, Faculty
    // Right column: Time, Max Marks (right-aligned)
    const detailsTableRows = [
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: `Semester: ${toRoman(questionPaper.semester)}` })] })],
            width: { size: 50, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: `Time: ${questionPaper.assessmentTime} minutes` })],
              alignment: AlignmentType.LEFT,
            })],
            width: { size: 50, type: WidthType.PERCENTAGE },
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: `Date: ${new Date(questionPaper.assessmentDate).toLocaleDateString()}` })] })],
            width: { size: 50, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: `Max Marks: ${questionPaper.maximumMarks}` })],
              alignment: AlignmentType.LEFT,
            })],
            width: { size: 50, type: WidthType.PERCENTAGE },
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: `Subject: ${questionPaper.subjectName}` })] })],
            width: { size: 50, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: '' })] })],
            width: { size: 50, type: WidthType.PERCENTAGE },
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: `Subject Code: ${questionPaper.subjectCode}` })] })],
            width: { size: 50, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: '' })] })],
            width: { size: 50, type: WidthType.PERCENTAGE },
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: `Faculty: ${questionPaper.facultyName}` })] })],
            width: { size: 50, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: '' })] })],
            width: { size: 50, type: WidthType.PERCENTAGE },
          }),
        ],
      }),
    ];

    // Add CO and LO rows if they exist
    if (questionPaper.courseOutcome) {
      detailsTableRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: `Course Outcome (CO): ${questionPaper.courseOutcome}` })] })],
              width: { size: 50, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: '' })] })],
              width: { size: 50, type: WidthType.PERCENTAGE },
            }),
          ],
        })
      );
    }

    if (questionPaper.learningOutcome) {
      detailsTableRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: `BTL: ${questionPaper.learningOutcome}` })] })],
              width: { size: 50, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: '' })] })],
              width: { size: 50, type: WidthType.PERCENTAGE },
            }),
          ],
        })
      );
    }

    const detailsTable = new Table({
      rows: detailsTableRows,
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.NONE },
        insideVertical: { style: BorderStyle.NONE },
      },
    });

    children.push(detailsTable);
    children.push(new Paragraph({ text: '' }));

    // Questions table
    const cellPadding = { top: 100, bottom: 100, left: 120, right: 120 };

    const questionRows = [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Q.NO', bold: true })] })], margins: cellPadding }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: `Answer any ${questionPaper.numberOfQuestionsToAttend} question(s)`, bold: true })],
              alignment: AlignmentType.CENTER,
            })],
            margins: cellPadding,
          }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'MARKS', bold: true })] })], margins: cellPadding }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'CO', bold: true })] })], margins: cellPadding }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'BTL', bold: true })] })], margins: cellPadding }),
        ],
      }),
    ];

    questionPaper.questions.forEach((rawQ, index) => {
      const q = rawQ || {};
      const qNumber = q.questionNumber ?? index + 1;
      const safeOperator = (q.operator || '').toString().toUpperCase();

      // Add sub-questions
      if (Array.isArray(q.subQuestions) && q.subQuestions.length > 0) {
        q.subQuestions.forEach((sqRaw, sqIndex) => {
          const sq = sqRaw || {};
          const sqLetter = (sq.subQuestionLetter ?? String.fromCharCode(97 + sqIndex) ?? '').toString();
          const sqText = (sq.subQuestionText ?? '').toString();
          const sqMarks = Number.isFinite(Number(sq.marks)) ? Number(sq.marks) : 0;
          const sqCO = (sq.courseOutcome ?? '').toString();
          const sqLO = (sq.learningOutcome ?? '').toString();

          questionRows.push(
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${qNumber}${sqLetter ? sqLetter + '.' : ''}` })] })], margins: cellPadding }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: sqText })] })], margins: cellPadding }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${sqMarks}` })] })], margins: cellPadding }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: sqCO })] })], margins: cellPadding }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: sqLO })] })], margins: cellPadding }),
              ],
            })
          );
        });
      } else if (q.questionText) {
        // Fallback to main question text if no sub-questions
        const mainText = (q.questionText ?? '').toString();
        const mainMarks = Number.isFinite(Number(q.marks)) ? Number(q.marks) : 0;
        const mainCO = (q.courseOutcome ?? '').toString();
        const mainLO = (q.learningOutcome ?? '').toString();

        questionRows.push(
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${qNumber}.` })] })], margins: cellPadding }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: mainText })] })], margins: cellPadding }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${mainMarks}` })] })], margins: cellPadding }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: mainCO })] })], margins: cellPadding }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: mainLO })] })], margins: cellPadding }),
            ],
          })
        );
      }

      // Add OR/AND separator after each main question (except the last one)
      if (index < questionPaper.questions.length - 1 && safeOperator) {
        const separatorText = safeOperator;
        questionRows.push(
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '' })] })] }),
              new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({ text: separatorText, bold: true })],
                  alignment: AlignmentType.CENTER,
                })],
              }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '' })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '' })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '' })] })] }),
            ],
          })
        );
      }
    });

    const questionsTable = new Table({
      rows: questionRows,
      width: { size: 100, type: WidthType.PERCENTAGE },
    });

    children.push(questionsTable);

    const doc = new Document({
      sections: [{ children }],
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(filePath, buffer);

    return `/uploads/papers/${fileName}`;
  } catch (error) {
    console.error('DOCX generation error:', error);
    throw error;
  }
}

// Create unused questions file
async function createUnusedQuestionsFile(questionPaper, lecturerId) {
  try {
    const unusedQuestions = await GeneratedQuestion.find({
      lecturerId,
      isUsed: false,
    }).populate('subjectId', 'subjectName').populate('moduleId', 'moduleName');

    if (unusedQuestions.length === 0) return;

    const fileName = `Unused_Questions_${questionPaper._id}_${Date.now()}.txt`;
    const fileContent = unusedQuestions
      .map((q, index) => {
        return `${index + 1}. ${q.question}\n   Subject: ${q.subjectId?.subjectName || 'N/A'}\n   Module: ${q.moduleId?.moduleName || 'N/A'}\n   Marks: ${q.marks}\n   Topic: ${q.topic}\n`;
      })
      .join('\n');

    const unusedQuestion = new UnusedQuestion({
      lecturerId,
      fileName,
      fileContent,
      questionPaperId: questionPaper._id,
    });

    await unusedQuestion.save();
  } catch (error) {
    console.error('Create unused questions file error:', error);
  }
}

// Get unused questions
router.get('/unused-questions', async (req, res) => {
  try {
    const unusedQuestions = await UnusedQuestion.find({ lecturerId: req.user._id })
      .populate('questionPaperId', 'subjectName assessmentType')
      .sort({ createdAt: -1 });
    res.json(unusedQuestions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get my papers
router.get('/my-papers', async (req, res) => {
  try {
    const papers = await QuestionPaper.find({ lecturerId: req.user._id })
      .populate('subjectId', 'subjectName subjectCode')
      .sort({ createdAt: -1 });
    res.json(papers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send paper to admin
router.put('/my-papers/:id/send', async (req, res) => {
  try {
    const paper = await QuestionPaper.findById(req.params.id);
    if (!paper || paper.lecturerId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Paper not found' });
    }

    paper.sentToAdmin = true;
    await paper.save();

    res.json({ message: 'Paper sent to admin successfully', paper });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete paper
router.delete('/my-papers/:id', async (req, res) => {
  try {
    const paper = await QuestionPaper.findById(req.params.id);
    if (!paper || paper.lecturerId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Paper not found' });
    }

    await UnusedQuestion.deleteMany({ questionPaperId: req.params.id });
    await QuestionPaper.findByIdAndDelete(req.params.id);

    res.json({ message: 'Paper deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;

