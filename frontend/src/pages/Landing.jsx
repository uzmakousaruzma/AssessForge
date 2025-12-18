import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 via-white to-white flex items-center">
      <div className="max-w-6xl mx-auto px-6 py-16 grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          
          <h1 className="text-4xl sm:text-5xl font-extrabold text-primary-600 leading-tight">
            AssessForge - Smart Question Paper Generator
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Create balanced, outcome-driven question papers with ease. Generate, curate, and export papers while keeping every course outcome aligned to your assessment plan.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/login"
              className="inline-flex justify-center items-center px-6 py-3 rounded-md bg-primary-600 text-white font-semibold shadow-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="inline-flex justify-center items-center px-6 py-3 rounded-md border-2 border-primary-600 text-primary-700 font-semibold hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition"
            >
              Sign Up / Registration
            </Link>
          </div>
        </div>

        <div className="bg-white shadow-xl rounded-2xl border border-gray-100 p-6 space-y-4 mt-14">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-lg">
              1
            </div>
            <div>
              <p className="text-lg font-semibold text-primary-600">Smart question curation</p>
              <p className="text-sm text-gray-600">Pick and arrange generated questions to match your syllabus and outcomes.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-lg">
              2
            </div>
            <div>
              <p className="text-lg font-semibold text-primary-600">Balanced mark distribution</p>
              <p className="text-sm text-gray-600">Keep every main question aligned to the required marks automatically.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-lg">
              3
            </div>
            <div>
              <p className="text-lg font-semibold text-primary-600">Download-ready exports</p>
              <p className="text-sm text-gray-600">Get DOCX papers instantly and keep unused questions handy for later.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;

