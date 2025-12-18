import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { Brain, FilePlus, Archive, FolderOpen } from 'lucide-react';

const LecturerDashboard = () => {
  const links = [
    { to: '/lecturer/generate-questions', label: 'Generate Questions' },
    { to: '/lecturer/create-paper', label: 'Generate Question Paper' },
    { to: '/lecturer/unused-questions', label: 'View Unused Questions' },
    { to: '/lecturer/my-papers', label: 'View Generated Papers' },
  ];

  return (
    <div className="min-h-screen bg-primary-50">
      <Navbar links={links} />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-primary-600 mb-8">Lecturer Dashboard</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              to="/lecturer/generate-questions"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 border-2 border-transparent hover:border-primary-300 flex flex-col items-center text-center"
            >
              <Brain className="w-12 h-12 text-primary-600 mb-4" />
              <h2 className="text-xl font-semibold text-primary-600 mb-2">Generate Questions</h2>
              <p className="text-gray-600">Use AI to generate questions on topics</p>
            </Link>
            <Link
              to="/lecturer/create-paper"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 border-2 border-transparent hover:border-primary-300 flex flex-col items-center text-center"
            >
              <FilePlus className="w-12 h-12 text-primary-600 mb-4" />
              <h2 className="text-xl font-semibold text-primary-600 mb-2">Generate Question Paper</h2>
              <p className="text-gray-600">Create question papers from saved questions</p>
            </Link>
            <Link
              to="/lecturer/unused-questions"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 border-2 border-transparent hover:border-primary-300 flex flex-col items-center text-center"
            >
              <Archive className="w-12 h-12 text-primary-600 mb-4" />
              <h2 className="text-xl font-semibold text-primary-600 mb-2">View Unused Questions</h2>
              <p className="text-gray-600">View unused questions from previous papers</p>
            </Link>
            <Link
              to="/lecturer/my-papers"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 border-2 border-transparent hover:border-primary-300 flex flex-col items-center text-center"
            >
              <FolderOpen className="w-12 h-12 text-primary-600 mb-4" />
              <h2 className="text-xl font-semibold text-primary-600 mb-2">View Generated Papers</h2>
              <p className="text-gray-600">View and manage your question papers</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LecturerDashboard;


