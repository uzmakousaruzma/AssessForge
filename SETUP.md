# AssessForge Setup Guide

## Prerequisites

Before starting, ensure you have the following installed:
- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **MongoDB Atlas Account** - [Sign up](https://www.mongodb.com/cloud/atlas)
- **Google Gemini API Key** - [Get API Key](https://makersuite.google.com/app/apikey)

## Step-by-Step Setup

### 1. Clone/Download the Project

```bash
# If using git
git clone <repository-url>
cd assess_fr
```

### 2. Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the `backend` directory:
```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/assessforge?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
GEMINI_API_KEY=your_google_gemini_api_key_here
NODE_ENV=development
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_username_or_email
SMTP_PASS=your_smtp_password_or_app_password
SMTP_FROM="AssessForge <no-reply@yourdomain.com>"
```

**Important Notes:**
- Replace `username` and `password` in MONGODB_URI with your MongoDB Atlas credentials
- Replace `cluster` with your actual cluster name
- Generate a strong random string for JWT_SECRET (you can use: `openssl rand -base64 32`)
- Get your Gemini API key from Google AI Studio
- SMTP settings are required for login OTP and password reset emails. If you use Gmail, create an App Password and set `SMTP_SECURE=false` with port `587`.

4. Ensure uploads directories exist (they should be created automatically, but verify):
```bash
# Windows PowerShell
if (-not (Test-Path uploads)) { New-Item -ItemType Directory -Path uploads }
if (-not (Test-Path uploads/papers)) { New-Item -ItemType Directory -Path uploads/papers }

# Linux/Mac
mkdir -p uploads/papers
```

5. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### 3. Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

### 4. Initial Setup Steps

1. **Open the application** in your browser: `http://localhost:3000`

2. **Register an Admin account:**
   - Go to `/register`
   - Enter your email, password, select "Admin" role
   - Select your department
   - Click Register

3. **Login as Admin:**
   - Go to `/login`
   - Enter your email and password, click **Get OTP**, then enter the OTP sent to your email
   - You'll be redirected to the admin dashboard after OTP verification

4. **Add College Details:**
   - Navigate to "College Details" in the admin dashboard
   - Upload college logo (optional)
   - Enter college name, address, and department
   - Click "Save College Details"

5. **Add Subjects:**
   - In the "College Details" page, add subjects
   - Enter subject name and subject code
   - Click "Add Subject"

6. **Add Approved Lecturers:**
   - Navigate to "Add Lecturer"
   - Enter lecturer email addresses
   - Click "Add Lecturer"
   - Lecturers can now register with these emails

7. **Lecturer Registration:**
   - Lecturers should go to `/register`
   - Select "Lecturer" role
   - Use an email that was added by admin
   - Complete registration

8. **Password resets:**
   - On the login page click **Forgot password?**
   - Request an OTP to the registered email, then submit the OTP with the new password to update the account

## Usage Guide

### Admin Features

1. **Add Lecturer**: Add email addresses of lecturers who can register
2. **View Question Papers**: View all papers sent by lecturers, download PDF/DOCX
3. **College Details**: Manage college information and add subjects

### Lecturer Features

1. **Add Modules**: After admin adds subjects, lecturers can add modules for those subjects
2. **Generate Questions**: Use AI to generate descriptive questions (no code snippets) on topics
3. **Create Question Paper**: Create formatted question papers with selected questions
4. **View Unused Questions**: View questions that weren't used in papers
5. **My Papers**: View, download, and send papers to admin

## Troubleshooting

### Backend Issues

1. **MongoDB Connection Error:**
   - Verify your MongoDB Atlas connection string
   - Ensure your IP is whitelisted in MongoDB Atlas
   - Check if your username/password are correct

2. **Port Already in Use:**
   - Change PORT in `.env` file
   - Or kill the process using port 5000

3. **File Upload Errors:**
   - Ensure `uploads` and `uploads/papers` directories exist
   - Check file permissions

### Frontend Issues

1. **API Connection Error:**
   - Ensure backend is running on port 5000
   - Check `vite.config.js` proxy settings

2. **Build Errors:**
   - Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
   - Clear cache: `npm cache clean --force`

### Common Issues

1. **JWT Token Expired:**
   - Logout and login again
   - Tokens expire after 7 days

2. **Questions Not Generating:**
   - Verify Gemini API key is correct
   - Check API quota/limits

3. **PDF/DOCX Not Generating:**
   - Check server logs for errors
   - Ensure uploads directory has write permissions

## Production Deployment

### Backend Deployment

1. Set `NODE_ENV=production` in `.env`
2. Use a process manager like PM2:
```bash
npm install -g pm2
pm2 start server.js --name assessforge-backend
```

### Frontend Deployment

1. Build the frontend:
```bash
cd frontend
npm run build
```

2. Serve the `dist` folder using a web server (nginx, Apache, etc.)

3. Update API endpoints in production environment

## Support

For issues or questions, check:
- Backend logs in the terminal
- Browser console for frontend errors
- MongoDB Atlas logs for database issues

## Security Notes

- Never commit `.env` files to version control
- Use strong JWT secrets in production
- Regularly update dependencies
- Use HTTPS in production
- Implement rate limiting for API endpoints
- Validate and sanitize all user inputs














