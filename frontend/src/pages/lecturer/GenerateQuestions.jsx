import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Navbar from '../../components/Navbar';
import GoBack from '../../components/GoBack';

const GenerateQuestions = () => {
  const [subjects, setSubjects] = useState([]);
  const [modules, setModules] = useState([]);
  const [formData, setFormData] = useState({
    subjectId: '',
    moduleId: '',
    topic: '',
    maxWeightage: '',
    numberOfQuestions: '',
  });
  const [generatedQuestions, setGeneratedQuestions] = useState([]); // Array of { questionText }
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedQuestion, setEditedQuestion] = useState({ questionText: '' });
  const [questionCO, setQuestionCO] = useState({}); // Store CO for each question by index
  const [questionLO, setQuestionLO] = useState({}); // Store LO for each question by index
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const links = [
    { to: '/lecturer/generate-questions', label: 'Generate Questions' },
    { to: '/lecturer/create-paper', label: 'Generate Question Paper' },
    { to: '/lecturer/unused-questions', label: 'View Unused Questions' },
    { to: '/lecturer/my-papers', label: 'View Generated Papers' },
  ];

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (formData.subjectId) {
      fetchModules(formData.subjectId);
    } else {
      setModules([]);
    }
  }, [formData.subjectId]);

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/lecturer/subjects');
      setSubjects(response.data);
    } catch (err) {
      setError('Failed to fetch subjects');
    }
  };

  const fetchModules = async (subjectId) => {
    try {
      const response = await api.get(`/lecturer/modules/${subjectId}`);
      setModules(response.data);
    } catch (err) {
      setError('Failed to fetch modules');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await api.post('/lecturer/generate-questions', formData);
      const questions = response.data.questions;
      // Ensure structure matches { questionText }
      const normalizedQuestions = questions.map(q => ({
        questionText: typeof q === 'string' ? q : q.questionText || '',
      }));
      setGeneratedQuestions(normalizedQuestions); // Now storing objects
      // Initialize CO and LO for each question
      const initialCO = {};
      const initialLO = {};
      questions.forEach((_, index) => {
        initialCO[index] = '';
        initialLO[index] = '';
      });
      setQuestionCO(initialCO);
      setQuestionLO(initialLO);
      setSuccess('Questions generated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate questions');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (index) => {
    setEditingIndex(index);
    setEditedQuestion({ ...generatedQuestions[index] });
  };

  const handleSaveEdit = () => {
    const updated = [...generatedQuestions];
    updated[editingIndex] = editedQuestion;
    setGeneratedQuestions(updated);
    setEditingIndex(null);
    setEditedQuestion({ questionText: '' });
  };

  const handleCOChange = (index, value) => {
    setQuestionCO({
      ...questionCO,
      [index]: value,
    });
  };

  const handleLOChange = (index, value) => {
    setQuestionLO({
      ...questionLO,
      [index]: value,
    });
  };

  const handleAddQuestion = async (item, index) => {
    if (!questionCO[index] || !questionLO[index]) {
      setError("Please select both Course Outcome (CO) and BTL before adding.");
      return;
    }

    try {
      await api.post('/lecturer/save-question', {
        subjectId: formData.subjectId,
        moduleId: formData.moduleId,
        topic: formData.topic,
        question: item.questionText,
        marks: formData.maxWeightage,
        courseOutcome: questionCO[index],
        learningOutcome: questionLO[index],
      });
      setSuccess('Question saved successfully');
      // Remove the question from the list after saving
      const updated = generatedQuestions.filter((_, i) => i !== index);
      setGeneratedQuestions(updated);
      // Reindex CO and LO for remaining questions
      const reindexedCO = {};
      const reindexedLO = {};
      updated.forEach((_, newIndex) => {
        // Find the original index of this question
        let originalIndex = 0;
        let count = 0;
        for (let i = 0; i < generatedQuestions.length; i++) {
          if (i !== index) {
            if (count === newIndex) {
              originalIndex = i;
              break;
            }
            count++;
          }
        }
        reindexedCO[newIndex] = questionCO[originalIndex] || '';
        reindexedLO[newIndex] = questionLO[originalIndex] || '';
      });
      setQuestionCO(reindexedCO);
      setQuestionLO(reindexedLO);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save question');
    }
  };

  const handleAddModule = async () => {
    if (!formData.subjectId) return;

    // Find the next available module number
    let nextModuleNum = 1;
    const existingNames = modules.map(m => m.moduleName);
    while (existingNames.includes(`Module ${nextModuleNum}`) && nextModuleNum <= 5) {
      nextModuleNum++;
    }

    if (nextModuleNum > 5) {
      setError('You can only add up to 5 modules (Module 1 to Module 5).');
      return;
    }

    const moduleName = `Module ${nextModuleNum}`;

    try {
      await api.post('/lecturer/modules', {
        subjectId: formData.subjectId,
        moduleName,
      });
      setSuccess(`${moduleName} added successfully`);
      fetchModules(formData.subjectId);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add module');
    }
  };

  return (
    <div className="min-h-screen bg-primary-50">
      <Navbar links={links} />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <GoBack />
          <h1 className="text-3xl font-bold text-primary-600 mb-6">Generate Questions</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <select
                    name="subjectId"
                    value={formData.subjectId}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((subject) => (
                      <option key={subject._id} value={subject._id}>
                        {subject.subjectName} ({subject.subjectCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Module</label>
                  <div className="flex gap-2">
                    <select
                      name="moduleId"
                      value={formData.moduleId}
                      onChange={handleChange}
                      required
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Select Module</option>
                      {modules.map((module) => (
                        <option key={module._id} value={module._id}>
                          {module.moduleName}
                        </option>
                      ))}
                    </select>
                    {formData.subjectId && (
                      <button
                        type="button"
                        onClick={handleAddModule}
                        className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 active:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                      >
                        Add Module
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Topic</label>
                  <input
                    type="text"
                    name="topic"
                    value={formData.topic}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Weightage (Marks)
                  </label>
                  <input
                    type="number"
                    name="maxWeightage"
                    value={formData.maxWeightage}
                    onChange={handleChange}
                    required
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Questions
                  </label>
                  <input
                    type="number"
                    name="numberOfQuestions"
                    value={formData.numberOfQuestions}
                    onChange={handleChange}
                    required
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {loading ? 'Generating...' : 'Generate Questions'}
              </button>
            </form>
          </div>

          {generatedQuestions.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-primary-600 mb-4">Generated Questions</h2>
              <div className="space-y-4">
                {generatedQuestions.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-md p-4">
                    {editingIndex === index ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Question Text
                          </label>
                          <textarea
                            value={editedQuestion.questionText}
                            onChange={(e) => setEditedQuestion({ ...editedQuestion, questionText: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Course Outcome (CO)
                            </label>
                            <select
                              value={questionCO[index] || ''}
                              onChange={(e) => handleCOChange(index, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                            >
                              <option value="">Select CO</option>
                              <option value="CO1">CO1</option>
                              <option value="CO2">CO2</option>
                              <option value="CO3">CO3</option>
                              <option value="CO4">CO4</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              BTL (Bloom's Taxonomy Level)
                            </label>
                            <select
                              value={questionLO[index] || ''}
                              onChange={(e) => handleLOChange(index, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                            >
                              <option value="">Select BTL</option>
                              <option value="L1">L1</option>
                              <option value="L2">L2</option>
                              <option value="L3">L3</option>
                              <option value="L4">L4</option>
                              <option value="L5">L5</option>
                              <option value="L6">L6</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveEdit}
                            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 active:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingIndex(null);
                              setEditedQuestion({ questionText: '' });
                            }}
                            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 active:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="mb-2 font-medium text-gray-800">{item.questionText}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Course Outcome (CO)
                            </label>
                            <select
                              value={questionCO[index] || ''}
                              onChange={(e) => handleCOChange(index, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                            >
                              <option value="">Select CO</option>
                              <option value="CO1">CO1</option>
                              <option value="CO2">CO2</option>
                              <option value="CO3">CO3</option>
                              <option value="CO4">CO4</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              BTL (Bloom's Taxonomy Level)
                            </label>
                            <select
                              value={questionLO[index] || ''}
                              onChange={(e) => handleLOChange(index, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                            >
                              <option value="">Select BTL</option>
                              <option value="L1">L1</option>
                              <option value="L2">L2</option>
                              <option value="L3">L3</option>
                              <option value="L4">L4</option>
                              <option value="L5">L5</option>
                              <option value="L6">L6</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(index)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleAddQuestion(item, index)}
                            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 active:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GenerateQuestions;


