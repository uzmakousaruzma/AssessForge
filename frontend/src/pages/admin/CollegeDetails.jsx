import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Navbar from '../../components/Navbar';
import GoBack from '../../components/GoBack';
import { toRoman } from '../../utils/romanNumerals';

const CollegeDetails = () => {
  const [collegeDetails, setCollegeDetails] = useState({
    collegeName: '',
    collegeAddress: '',
    department: '',
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState({ subjectName: '', subjectCode: '', semester: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const links = [
    { to: '/admin/add-lecturer', label: 'Add Lecturer' },
    { to: '/admin/view-papers', label: 'View Question Papers' },
    { to: '/admin/college-details', label: 'College Details' },
  ];

  useEffect(() => {
    fetchCollegeDetails();
    fetchSubjects();
  }, []);

  const fetchCollegeDetails = async () => {
    try {
      const response = await api.get('/admin/college-details');
      setCollegeDetails({
        collegeName: response.data.collegeName || '',
        collegeAddress: response.data.collegeAddress || '',
        department: response.data.department || '',
      });
      if (response.data.logoUrl) {
        setLogoPreview(`${api.defaults.baseURL.replace('/api', '')}${response.data.logoUrl}`);
      }
    } catch (err) {
      setError('Failed to fetch college details');
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/admin/subjects');
      setSubjects(response.data);
    } catch (err) {
      setError('Failed to fetch subjects');
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCollegeDetails = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('collegeName', collegeDetails.collegeName);
      formData.append('collegeAddress', collegeDetails.collegeAddress);
      formData.append('department', collegeDetails.department);
      if (logoFile) {
        formData.append('logo', logoFile);
      }

      await api.put('/admin/college-details', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccess('College details updated successfully');
      fetchCollegeDetails();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update college details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await api.post('/admin/subjects', newSubject);
      setSuccess('Subject added successfully');
      setNewSubject({ subjectName: '', subjectCode: '', semester: '' });
      fetchSubjects();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add subject');
    }
  };

  const handleDeleteSubject = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return;

    try {
      await api.delete(`/admin/subjects/${id}`);
      setSuccess('Subject deleted successfully');
      fetchSubjects();
    } catch (err) {
      setError('Failed to delete subject');
    }
  };

  return (
    <div className="min-h-screen bg-primary-50">
      <Navbar links={links} />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <GoBack />
          <h1 className="text-3xl font-bold text-primary-600 mb-6">College Details</h1>

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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* College Details Form */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-primary-600 mb-4">College Information</h2>
              <form onSubmit={handleSaveCollegeDetails} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    College Logo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  />
                  {logoPreview && (
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="mt-2 h-20 w-20 object-contain"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    College Name
                  </label>
                  <input
                    type="text"
                    value={collegeDetails.collegeName}
                    onChange={(e) =>
                      setCollegeDetails({ ...collegeDetails, collegeName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    College Address
                  </label>
                  <textarea
                    value={collegeDetails.collegeAddress}
                    onChange={(e) =>
                      setCollegeDetails({ ...collegeDetails, collegeAddress: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    value={collegeDetails.department}
                    onChange={(e) =>
                      setCollegeDetails({ ...collegeDetails, department: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 active:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? 'Saving...' : 'Save College Details'}
                </button>
              </form>
            </div>

            {/* Subjects Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-primary-600 mb-4">Add Subjects</h2>
              <form onSubmit={handleAddSubject} className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject Name
                  </label>
                  <input
                    type="text"
                    value={newSubject.subjectName}
                    onChange={(e) =>
                      setNewSubject({ ...newSubject, subjectName: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject Code
                  </label>
                  <input
                    type="text"
                    value={newSubject.subjectCode}
                    onChange={(e) =>
                      setNewSubject({ ...newSubject, subjectCode: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Semester
                  </label>
                  <select
                    value={newSubject.semester}
                    onChange={(e) =>
                      setNewSubject({ ...newSubject, semester: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                  >
                    <option value="">Select Semester</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <option key={sem} value={sem}>
                        Semester {toRoman(sem)}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 active:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Add Subject
                </button>
              </form>

              <div>
                <h3 className="text-lg font-semibold text-primary-600 mb-3">Subjects List</h3>
                {subjects.length === 0 ? (
                  <p className="text-gray-500">No subjects added yet</p>
                ) : (
                  <div className="space-y-2">
                    {subjects.map((subject) => (
                      <div
                        key={subject._id}
                        className="flex justify-between items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors duration-200"
                      >
                        <div>
                          <span className="font-medium">{subject.subjectName}</span>
                          <span className="text-gray-500 ml-2">({subject.subjectCode})</span>
                          <span className="text-gray-500 ml-2">- Sem {toRoman(subject.semester)}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteSubject(subject._id)}
                          className="text-red-600 hover:text-red-800 font-medium transition-colors duration-200 hover:bg-red-50 px-3 py-1 rounded-md"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollegeDetails;


