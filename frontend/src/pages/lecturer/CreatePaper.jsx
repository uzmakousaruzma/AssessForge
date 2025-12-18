import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Navbar from '../../components/Navbar';
import GoBack from '../../components/GoBack';
import { toRoman } from '../../utils/romanNumerals';

const CreatePaper = () => {
  const [subjects, setSubjects] = useState([]);
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [selectedMarks, setSelectedMarks] = useState('');
  const [formData, setFormData] = useState({
    assessmentType: '',
    semester: '',
    subjectId: '',
    facultyName: '',
    assessmentDate: '',
    assessmentTime: '',
    maximumMarks: '',
    numberOfQuestionsToAttend: '',
    courseOutcome: '',
    learningOutcome: '',
  });
  const [mainQuestions, setMainQuestions] = useState([]); // Array of main questions, each with sub-questions
  const [addedQuestionIds, setAddedQuestionIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [warning, setWarning] = useState('');

  const links = [
    { to: '/lecturer/generate-questions', label: 'Generate Questions' },
    { to: '/lecturer/create-paper', label: 'Generate Question Paper' },
    { to: '/lecturer/unused-questions', label: 'View Unused Questions' },
    { to: '/lecturer/my-papers', label: 'View Generated Papers' },
  ];

  const marksOptions = [5, 10, 8, 9];
  const MARK_TOLERANCE = 0.01;

  const getOperatorForIndex = (index) => (index % 2 === 0 ? 'OR' : 'AND');

  const reindexMainQuestions = (questions) =>
    questions.map((mq, idx) => ({
      ...mq,
      questionNumber: idx + 1,
      operator: getOperatorForIndex(idx),
    }));

  useEffect(() => {
    if (formData.semester) {
      fetchSubjects();
    }
  }, [formData.semester]);

  useEffect(() => {
    if (formData.subjectId) {
      fetchAvailableQuestions();
    }
  }, [formData.subjectId]);

  useEffect(() => {
    if (selectedMarks && formData.subjectId) {
      filterQuestionsByMarks(selectedMarks, addedQuestionIds);
    } else {
      setFilteredQuestions([]);
    }
  }, [selectedMarks, availableQuestions, addedQuestionIds, formData.subjectId]);

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/lecturer/subjects', {
        params: { semester: formData.semester },
      });
      setSubjects(response.data);
    } catch (err) {
      setError('Failed to fetch subjects');
    }
  };

  const fetchAvailableQuestions = async () => {
    try {
      const params = { subjectId: formData.subjectId };
      const response = await api.get('/lecturer/available-questions', { params });
      setAvailableQuestions(response.data);
    } catch (err) {
      setError('Failed to fetch questions');
    }
  };

  const filterQuestionsByMarks = (marks, questionIds = addedQuestionIds) => {
    const filtered = availableQuestions.filter(
      (q) => q.marks === parseInt(marks) && !questionIds.includes(q._id) && !q.isUsed
    );
    setFilteredQuestions(filtered);
  };

  const handleChange = (e) => {
    const newFormData = {
      ...formData,
      [e.target.name]: e.target.value,
    };
    setFormData(newFormData);

    // Reset subject when semester changes
    if (e.target.name === 'semester') {
      newFormData.subjectId = '';
      setSubjects([]);
      setSelectedMarks('');
      setFilteredQuestions([]);
      setMainQuestions([]);
      setAddedQuestionIds([]);
    }

    // Reset marks filter when subject changes
    if (e.target.name === 'subjectId') {
      setSelectedMarks('');
      setFilteredQuestions([]);
      setMainQuestions([]);
      setAddedQuestionIds([]);
    }
  };

  const calculateTotalMarks = () => {
    return mainQuestions.reduce((sum, mainQ) => {
      const mainMarks = mainQ.subQuestions.reduce((s, sq) => s + (parseFloat(sq.marks) || 0), 0);
      return sum + mainMarks;
    }, 0);
  };

  const getCurrentMainQuestionIndex = () => {
    const maxMarks = parseFloat(formData.maximumMarks) || 0;
    const questionsToAttend = parseInt(formData.numberOfQuestionsToAttend, 10) || 0;
    const resultantMarks = questionsToAttend ? maxMarks / questionsToAttend : 0;

    if (resultantMarks <= 0) return -1;

    // Find the last main question that hasn't reached the resultant marks
    for (let i = mainQuestions.length - 1; i >= 0; i--) {
      const mainQ = mainQuestions[i];
      const mainMarks = mainQ.subQuestions.reduce((s, sq) => s + (parseFloat(sq.marks) || 0), 0);
      if (mainMarks < resultantMarks - MARK_TOLERANCE) {
        return i;
      }
    }

    // If all main questions are complete, create a new one
    return -1;
  };

  const handleAddQuestion = (question) => {
    const maxMarks = parseFloat(formData.maximumMarks) || 0;
    const questionsToAttend = parseInt(formData.numberOfQuestionsToAttend, 10) || 0;
    const resultantMarks = questionsToAttend ? maxMarks / questionsToAttend : 0;
    const questionMarks = parseFloat(question.marks) || 0;
    const totalMarks = calculateTotalMarks();
    const requiredTotal = maxMarks * 2;

    if (resultantMarks <= 0) {
      setError('Please enter maximum marks and number of questions to attend before adding questions.');
      return;
    }

    if (requiredTotal > 0 && totalMarks >= requiredTotal - MARK_TOLERANCE) {
      setWarning(`You have reached the total marks limit (${requiredTotal}).`);
      return;
    }

    if (requiredTotal > 0 && totalMarks + questionMarks > requiredTotal + MARK_TOLERANCE) {
      setWarning(`Adding this question would exceed the total marks limit (${requiredTotal}).`);
      return;
    }

    const currentMainIndex = getCurrentMainQuestionIndex();
    const updatedMainQuestions = [...mainQuestions];

    let targetMainIndex = currentMainIndex;

    // If no incomplete main question exists, create a new one
    if (targetMainIndex === -1) {
      const newMainQuestion = {
        questionNumber: mainQuestions.length + 1,
        subQuestions: [],
        operator: getOperatorForIndex(mainQuestions.length),
      };
      updatedMainQuestions.push(newMainQuestion);
      targetMainIndex = updatedMainQuestions.length - 1;
    }

    const targetMain = { ...updatedMainQuestions[targetMainIndex] };
    const currentMainMarks = targetMain.subQuestions.reduce((s, sq) => s + (parseFloat(sq.marks) || 0), 0);

    // Check if adding this question would exceed resultant marks for this main question
    if (currentMainMarks + questionMarks > resultantMarks + MARK_TOLERANCE) {
      setWarning(`Adding this question would exceed the allotted ${resultantMarks} marks for Question ${targetMain.questionNumber}.`);
      return;
    }

    // Add as sub-question
    const isSingleFullMark = targetMain.subQuestions.length === 0 && Math.abs(questionMarks - resultantMarks) <= MARK_TOLERANCE;
    const subQuestionLetter = isSingleFullMark ? '' : String.fromCharCode(97 + targetMain.subQuestions.length); // a, b, c...
    const newSubQuestion = {
      subQuestionLetter,
      subQuestionText: question.question,
      marks: questionMarks,
      courseOutcome: question.courseOutcome || '',
      learningOutcome: question.learningOutcome || '',
      questionId: question._id,
    };

    targetMain.subQuestions.push(newSubQuestion);
    updatedMainQuestions[targetMainIndex] = targetMain;

    setMainQuestions(reindexMainQuestions(updatedMainQuestions));
    setAddedQuestionIds([...addedQuestionIds, question._id]);
    setFilteredQuestions(filteredQuestions.filter((q) => q._id !== question._id));
    setWarning('');
    setError('');
  };

  const handleRemoveSubQuestion = (mainIndex, subIndex) => {
    const updated = [...mainQuestions];
    const subQuestion = updated[mainIndex].subQuestions[subIndex];

    // Remove the sub-question
    updated[mainIndex].subQuestions.splice(subIndex, 1);

    // Reassign letters
    updated[mainIndex].subQuestions.forEach((sq, idx) => {
      sq.subQuestionLetter = String.fromCharCode(97 + idx);
    });

    // If main question has no sub-questions, remove it
    if (updated[mainIndex].subQuestions.length === 0) {
      updated.splice(mainIndex, 1);
    }

    setMainQuestions(reindexMainQuestions(updated));
    const newAddedIds = addedQuestionIds.filter((id) => id !== subQuestion.questionId);
    setAddedQuestionIds(newAddedIds);
    setWarning('');

    // Refresh filtered questions if marks are selected
    if (selectedMarks && formData.subjectId) {
      setTimeout(() => {
        filterQuestionsByMarks(selectedMarks);
      }, 0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setWarning('');

    const maxMarks = parseFloat(formData.maximumMarks) || 0;
    const questionsToAttend = parseInt(formData.numberOfQuestionsToAttend, 10) || 0;
    const resultantMarks = questionsToAttend ? maxMarks / questionsToAttend : 0;

    if (mainQuestions.length === 0) {
      setError('Please add at least one question');
      return;
    }

    if (!questionsToAttend || !maxMarks || resultantMarks <= 0) {
      setError('Please provide valid maximum marks and number of questions to attend.');
      return;
    }

    if (mainQuestions.length < questionsToAttend) {
      setError(`Add at least ${questionsToAttend} main questions so students can attend the required number.`);
      return;
    }

    const mismatch = mainQuestions.find((mainQ) => {
      const marks = mainQ.subQuestions.reduce((s, sq) => s + (parseFloat(sq.marks) || 0), 0);
      return Math.abs(marks - resultantMarks) > MARK_TOLERANCE;
    });

    if (mismatch) {
      const marks = mismatch.subQuestions.reduce((s, sq) => s + (parseFloat(sq.marks) || 0), 0);
      setError(`Question ${mismatch.questionNumber} totals ${marks} marks. Each main question must total ${resultantMarks}.`);
      return;
    }

    setLoading(true);

    try {
      // Transform main questions with sub-questions into the format expected by backend
      const questions = mainQuestions.map((mainQ) => {
        const mainQuestionText = mainQ.subQuestions.length > 0
          ? mainQ.subQuestions.map(sq => `${mainQ.questionNumber}${sq.subQuestionLetter}. ${sq.subQuestionText}`).join(' ')
          : '';

        return {
          questionText: mainQuestionText,
          marks: mainQ.subQuestions.reduce((sum, sq) => sum + (parseFloat(sq.marks) || 0), 0),
          courseOutcome: '',
          learningOutcome: '',
          operator: mainQ.operator || getOperatorForIndex(mainQ.questionNumber - 1),
          subQuestions: mainQ.subQuestions.map((sq) => ({
            subQuestionLetter: sq.subQuestionLetter,
            subQuestionText: sq.subQuestionText,
            marks: sq.marks,
            courseOutcome: sq.courseOutcome || '',
            learningOutcome: sq.learningOutcome || '',
            questionId: sq.questionId,
          })),
        };
      });

      const response = await api.post('/lecturer/create-paper', {
        ...formData,
        questions,
      });
      setSuccess('Question paper created successfully!');
      setFormData({
        assessmentType: '',
        semester: '',
        subjectId: '',
        facultyName: '',
        assessmentDate: '',
        assessmentTime: '',
        maximumMarks: '',
        numberOfQuestionsToAttend: '',
        courseOutcome: '',
        learningOutcome: '',
      });
      setMainQuestions([]);
      setAddedQuestionIds([]);
      setSelectedMarks('');
      setFilteredQuestions([]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create paper');
    } finally {
      setLoading(false);
    }
  };

  const selectedSubject = subjects.find((s) => s._id === formData.subjectId);
  const totalMarks = calculateTotalMarks();
  const maxMarks = parseFloat(formData.maximumMarks) || 0;
  const questionsToAttend = parseInt(formData.numberOfQuestionsToAttend, 10) || 0;
  const resultantMarks = questionsToAttend ? maxMarks / questionsToAttend : 0;
  const requiredTotal = maxMarks * 2;
  const perQuestionValid = resultantMarks > 0 && mainQuestions.every((mq) => {
    const marks = mq.subQuestions.reduce((s, sq) => s + (parseFloat(sq.marks) || 0), 0);
    return Math.abs(marks - resultantMarks) <= MARK_TOLERANCE;
  });
  const hasEnoughQuestions = questionsToAttend > 0 && mainQuestions.length >= questionsToAttend;
  const totalWithinLimit = requiredTotal > 0 ? Math.abs(totalMarks - requiredTotal) <= MARK_TOLERANCE : false;
  const readyToGenerate = perQuestionValid && hasEnoughQuestions && mainQuestions.length > 0 && totalWithinLimit;

  return (
    <div className="min-h-screen bg-primary-50">
      <Navbar links={links} />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <GoBack />
          <h1 className="text-3xl font-bold text-primary-600 mb-6">Generate Question Paper</h1>

          {error && (
            <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded mb-4 shadow-md">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border-2 border-green-300 text-green-700 px-4 py-3 rounded mb-4 shadow-md">
              {success}
            </div>
          )}

          {warning && (
            <div className="bg-yellow-50 border-2 border-yellow-300 text-yellow-700 px-4 py-3 rounded mb-4 shadow-md">
              {warning}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Paper Details Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-primary-600 mb-4">Paper Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assessment Type
                  </label>
                  <select
                    name="assessmentType"
                    value={formData.assessmentType}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                  >
                    <option value="">Select Type</option>
                    <option value="I Internal">I Internal</option>
                    <option value="II Internal">II Internal</option>
                    <option value="III Internal">III Internal</option>
                    <option value="Final">Final</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
                  <select
                    name="semester"
                    value={formData.semester}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                  >
                    <option value="">Select Semester</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <option key={sem} value={sem}>
                        {toRoman(sem)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <select
                    name="subjectId"
                    value={formData.subjectId}
                    onChange={handleChange}
                    required
                    disabled={!formData.semester}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">{formData.semester ? 'Select Subject' : 'Select Semester first'}</option>
                    {subjects.map((subject) => (
                      <option key={subject._id} value={subject._id}>
                        {subject.subjectName} ({subject.subjectCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject Code (Auto)
                  </label>
                  <input
                    type="text"
                    value={selectedSubject?.subjectCode || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Faculty Name</label>
                  <input
                    type="text"
                    name="facultyName"
                    value={formData.facultyName}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assessment Date
                  </label>
                  <input
                    type="date"
                    name="assessmentDate"
                    value={formData.assessmentDate}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assessment Time (minutes)
                  </label>
                  <input
                    type="number"
                    name="assessmentTime"
                    value={formData.assessmentTime}
                    onChange={handleChange}
                    required
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Marks
                  </label>
                  <input
                    type="number"
                    name="maximumMarks"
                    value={formData.maximumMarks}
                    onChange={handleChange}
                    onWheel={(e) => e.target.blur()}
                    required
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Questions to Attend
                  </label>
                  <input
                    type="number"
                    name="numberOfQuestionsToAttend"
                    value={formData.numberOfQuestionsToAttend}
                    onChange={handleChange}
                    onWheel={(e) => e.target.blur()}
                    required
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Add Questions Section */}
            {formData.subjectId && formData.maximumMarks && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-primary-600">Add Questions</h2>
                  <div className="text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-md border border-blue-200">
                    <span className="font-semibold">Marks per Question:</span> {resultantMarks || 0}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Marks Weightage
                  </label>
                  <div className="flex gap-3 flex-wrap">
                    {marksOptions.map((marks) => (
                      <button
                        key={marks}
                        type="button"
                        onClick={() => {
                          setSelectedMarks(selectedMarks === marks.toString() ? '' : marks.toString());
                          setWarning('');
                        }}
                        className={`px-6 py-2 rounded-md font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 ${selectedMarks === marks.toString()
                          ? 'bg-primary-600 text-white shadow-lg ring-2 ring-primary-300'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                      >
                        {marks} Marks
                      </button>
                    ))}
                  </div>
                </div>

                {selectedMarks && (
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-semibold text-gray-700">
                        Available Questions ({selectedMarks} Marks)
                      </h3>
                      <div className="text-sm text-gray-600">
                        Marks per main question: {resultantMarks || 0}
                      </div>
                    </div>
                    {filteredQuestions.length === 0 ? (
                      <p className="text-gray-500">No questions available for {selectedMarks} marks</p>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {filteredQuestions.map((question) => (
                          <div
                            key={question._id}
                            className="border-2 border-gray-200 rounded-md p-4 hover:border-primary-300 hover:shadow-md transition-all duration-200"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="text-gray-800 mb-2">{question.question}</p>
                                <p className="text-sm text-gray-500 mb-1">
                                  Module: {question.moduleId?.moduleName || 'N/A'} | Topic: {question.topic || 'N/A'}
                                </p>
                                {(question.courseOutcome || question.learningOutcome) && (
                                  <p className="text-sm text-primary-600 font-medium">
                                    {question.courseOutcome && `CO: ${question.courseOutcome}`}
                                    {question.courseOutcome && question.learningOutcome && ' | '}
                                    {question.learningOutcome && `BTL: ${question.learningOutcome}`}
                                  </p>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleAddQuestion(question)}
                                disabled={resultantMarks <= 0 || (maxMarks * 2 > 0 && totalMarks >= maxMarks * 2 - MARK_TOLERANCE)}
                                className="ml-4 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 active:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95"
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Preview Section */}
            {mainQuestions.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-primary-600">Preview Questions</h2>
                  <div className="text-sm font-medium text-gray-700 space-y-1">
                    <div className={perQuestionValid ? 'text-green-600 font-bold' : 'text-gray-700'}>
                      Each main question should total {resultantMarks || 0} marks.
                    </div>
                    <div className={hasEnoughQuestions ? 'text-green-600 font-bold' : 'text-gray-700'}>
                      Questions added: {mainQuestions.length} / {questionsToAttend || '—'} required
                    </div>
                    <div className="text-gray-600">
                      Total marks added across all questions: {totalMarks}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {mainQuestions.map((mainQ, mainIndex) => {
                    const mainMarks = mainQ.subQuestions.reduce((s, sq) => s + (parseFloat(sq.marks) || 0), 0);
                    return (
                      <div key={mainIndex} className="border-2 border-primary-300 rounded-md p-4 bg-primary-50">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-primary-700 mb-2">
                              Question {mainQ.questionNumber} (Total: {mainMarks} marks)
                            </h3>
                            <div className="space-y-2 ml-4">
                              {mainQ.subQuestions.map((sq, subIndex) => (
                                <div key={subIndex} className="flex justify-between items-start bg-white p-3 rounded border border-gray-200">
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-800">
                                      {mainQ.questionNumber}{sq.subQuestionLetter}. {sq.subQuestionText}
                                    </p>
                                    <div className="flex gap-3 text-sm text-gray-600 mt-1">
                                      <span>Marks: {sq.marks}</span>
                                      {sq.courseOutcome && <span className="text-primary-600 font-medium">CO: {sq.courseOutcome}</span>}
                                      {sq.learningOutcome && <span className="text-primary-600 font-medium">BTL: {sq.learningOutcome}</span>}
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSubQuestion(mainIndex, subIndex)}
                                    className="ml-4 bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 active:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 active:scale-95 text-sm"
                                  >
                                    Remove
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        {mainIndex < mainQuestions.length - 1 && (
                          <div className="mt-3 pt-3 border-t-2 border-primary-400">
                            <p className="text-center font-bold text-primary-700 text-lg">
                              {mainQ.operator || getOperatorForIndex(mainIndex)}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !readyToGenerate}
              className="w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 active:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] font-semibold text-lg"
            >
              {loading ? 'Generating Paper...' : 'Generate Question Paper'}
            </button>
            {!readyToGenerate && mainQuestions.length > 0 && (
              <p className="text-center text-sm text-gray-600 mt-2">
                Ensure each main question totals {resultantMarks || 0} marks and add at least {questionsToAttend || 0} main questions.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePaper;
