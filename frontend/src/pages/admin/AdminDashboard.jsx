import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { UserPlus, FileText, Building } from 'lucide-react';

const AdminDashboard = () => {
  const links = [
    { to: '/admin/add-lecturer', label: 'Add Lecturer' },
    { to: '/admin/view-papers', label: 'View Question Papers' },
    { to: '/admin/college-details', label: 'College Details' },
  ];

  return (
    <div className="min-h-screen bg-primary-50">
      <Navbar links={links} />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-primary-600 mb-8">Admin Dashboard</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              to="/admin/add-lecturer"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 border-2 border-transparent hover:border-primary-300 flex flex-col items-center text-center"
            >
              <UserPlus className="w-12 h-12 text-primary-600 mb-4" />
              <h2 className="text-xl font-semibold text-primary-600 mb-2">Add Lecturer</h2>
              <p className="text-gray-600">Manage approved lecturer emails</p>
            </Link>
            <Link
              to="/admin/view-papers"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 border-2 border-transparent hover:border-primary-300 flex flex-col items-center text-center"
            >
              <FileText className="w-12 h-12 text-primary-600 mb-4" />
              <h2 className="text-xl font-semibold text-primary-600 mb-2">View Question Papers</h2>
              <p className="text-gray-600">Review and download question papers</p>
            </Link>
            <Link
              to="/admin/college-details"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 border-2 border-transparent hover:border-primary-300 flex flex-col items-center text-center"
            >
              <Building className="w-12 h-12 text-primary-600 mb-4" />
              <h2 className="text-xl font-semibold text-primary-600 mb-2">College Details</h2>
              <p className="text-gray-600">Update college information and subjects</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;


