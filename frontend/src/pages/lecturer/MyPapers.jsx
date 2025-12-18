import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Navbar from '../../components/Navbar';
import GoBack from '../../components/GoBack';
import { toRoman } from '../../utils/romanNumerals';

const MyPapers = () => {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const links = [
    { to: '/lecturer/generate-questions', label: 'Generate Questions' },
    { to: '/lecturer/create-paper', label: 'Generate Question Paper' },
    { to: '/lecturer/unused-questions', label: 'View Unused Questions' },
    { to: '/lecturer/my-papers', label: 'View Generated Papers' },
  ];

  useEffect(() => {
    fetchPapers();
  }, []);

  const fetchPapers = async () => {
    try {
      const response = await api.get('/lecturer/my-papers');
      setPapers(response.data);
    } catch (err) {
      setError('Failed to fetch papers');
    } finally {
      setLoading(false);
    }
  };

  const handleSendToAdmin = async (id) => {
    if (!window.confirm('Are you sure you want to send this paper to admin?')) return;

    try {
      await api.put(`/lecturer/my-papers/${id}/send`);
      setSuccess('Paper sent to admin successfully');
      fetchPapers();
    } catch (err) {
      setError('Failed to send paper');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this paper?')) return;

    try {
      await api.delete(`/lecturer/my-papers/${id}`);
      setSuccess('Paper deleted successfully');
      fetchPapers();
    } catch (err) {
      setError('Failed to delete paper');
    }
  };

  const filteredPapers = papers.filter(
    (paper) =>
      paper.subjectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paper.assessmentType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="text-3xl font-bold text-primary-600 mb-6">My Generated Papers</h1>

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
            <input
              type="text"
              placeholder="Search by subject or assessment type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
            />
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            {filteredPapers.length === 0 ? (
              <p className="text-gray-500">No papers found</p>
            ) : (
              <div className="space-y-4">
                {filteredPapers.map((paper) => (
                  <div
                    key={paper._id}
                    className="border border-gray-200 rounded-md p-4 hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-primary-600">
                          {paper.subjectName}
                        </h3>
                        <p className="text-gray-600">Subject Code: {paper.subjectCode}</p>
                        <p className="text-gray-600">Faculty: {paper.facultyName}</p>
                        <p className="text-gray-600">
                          Assessment: {paper.assessmentType} - Semester {toRoman(paper.semester)}
                        </p>
                        <p className="text-gray-600">
                          Date: {new Date(paper.assessmentDate).toLocaleDateString()}
                        </p>
                        <p className="text-gray-600">Max Marks: {paper.maximumMarks}</p>
                        <p
                          className={`text-sm ${paper.sentToAdmin ? 'text-green-600' : 'text-yellow-600'
                            }`}
                        >
                          Status: {paper.sentToAdmin ? 'Sent to Admin' : 'Draft'}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        {paper.docxUrl && (
                          <a
                            href={`${api.defaults.baseURL.replace('/api', '')}${paper.docxUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 active:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] text-center"
                          >
                            Download DOCX
                          </a>
                        )}
                        {!paper.sentToAdmin && (
                          <button
                            onClick={() => handleSendToAdmin(paper._id)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                          >
                            Send to Admin
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(paper._id)}
                          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 active:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                          Delete
                        </button>
                      </div>
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

export default MyPapers;


