import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Navbar from '../../components/Navbar';
import GoBack from '../../components/GoBack';

const UnusedQuestions = () => {
  const [unusedQuestions, setUnusedQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const links = [
    { to: '/lecturer/generate-questions', label: 'Generate Questions' },
    { to: '/lecturer/create-paper', label: 'Generate Question Paper' },
    { to: '/lecturer/unused-questions', label: 'View Unused Questions' },
    { to: '/lecturer/my-papers', label: 'View Generated Papers' },
  ];

  useEffect(() => {
    fetchUnusedQuestions();
  }, []);

  const fetchUnusedQuestions = async () => {
    try {
      const response = await api.get('/lecturer/unused-questions');
      setUnusedQuestions(response.data);
    } catch (err) {
      setError('Failed to fetch unused questions');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (fileContent, fileName) => {
    const blob = new Blob([fileContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-50">
        <Navbar links={links} />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-50">
      <Navbar links={links} />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <GoBack />
          <h1 className="text-3xl font-bold text-primary-600 mb-6">Unused Questions</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-6">
            {unusedQuestions.length === 0 ? (
              <p className="text-gray-500">No unused questions found</p>
            ) : (
              <div className="space-y-4">
                {unusedQuestions.map((item) => (
                  <div
                    key={item._id}
                    className="border border-gray-200 rounded-md p-4 hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-primary-600 break-all">{item.fileName}</h3>
                        <p className="text-gray-600">
                          Created: {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                        {item.questionPaperId && (
                          <p className="text-gray-600">
                            Paper: {item.questionPaperId.subjectName || 'N/A'} -{' '}
                            {item.questionPaperId.assessmentType || 'N/A'}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDownload(item.fileContent, item.fileName)}
                        className="w-full sm:w-auto bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 active:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnusedQuestions;


