import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Navbar from '../../components/Navbar';
import GoBack from '../../components/GoBack';

const AddLecturer = () => {
  const [email, setEmail] = useState('');
  const [lecturers, setLecturers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const links = [
    { to: '/admin/add-lecturer', label: 'Add Lecturer' },
    { to: '/admin/view-papers', label: 'View Question Papers' },
    { to: '/admin/college-details', label: 'College Details' },
  ];

  useEffect(() => {
    fetchLecturers();
  }, []);

  const fetchLecturers = async () => {
    try {
      const response = await api.get('/admin/lecturers');
      setLecturers(response.data);
    } catch (err) {
      setError('Failed to fetch lecturers');
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.post('/admin/add-lecturer', { email });
      setSuccess('Lecturer added successfully');
      setEmail('');
      fetchLecturers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add lecturer');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Are you sure you want to remove this lecturer?')) return;

    try {
      await api.delete(`/admin/lecturers/${id}`);
      setSuccess('Lecturer removed successfully');
      fetchLecturers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove lecturer');
    }
  };

  return (
    <div className="min-h-screen bg-primary-50">
      <Navbar links={links} />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <GoBack />
          <h1 className="text-3xl font-bold text-primary-600 mb-6">Add Lecturer</h1>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <form onSubmit={handleAdd} className="flex gap-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter lecturer email"
                required
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 active:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? 'Adding...' : 'Add Lecturer'}
              </button>
            </form>
          </div>

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

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-primary-600 mb-4">Approved Lecturers</h2>
            {lecturers.length === 0 ? (
              <p className="text-gray-500">No lecturers added yet</p>
            ) : (
              <div className="space-y-2">
                {lecturers.map((lecturer) => (
                  <div
                    key={lecturer._id}
                    className="flex justify-between items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors duration-200"
                  >
                    <span>{lecturer.email}</span>
                    <button
                      onClick={() => handleRemove(lecturer._id)}
                      className="text-red-600 hover:text-red-800 font-medium transition-colors duration-200 hover:bg-red-50 px-3 py-1 rounded-md"
                    >
                      Remove
                    </button>
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

export default AddLecturer;


