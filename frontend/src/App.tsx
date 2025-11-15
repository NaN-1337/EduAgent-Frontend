import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { LanguageProvider } from './contexts/LanguageContext'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProfilePage from './pages/ProfilePage'
import TeacherDashboard from './pages/teacher/TeacherDashboard'
import NewLessonPage from './pages/teacher/NewLessonPage'
import FactCheckPanel from './pages/teacher/FactCheckPanel'
import LessonEditor from './pages/teacher/LessonEditor'
import StudentsView from './pages/teacher/StudentsView'
import MyLessons from './pages/teacher/MyLessons'
import StudentDashboard from './pages/student/StudentDashboard'
import StudentLessonsPage from './pages/student/StudentLessonsPage'
import JoinLessonPage from './pages/student/JoinLessonPage'
import StudentLessonPlayer from './pages/student/StudentLessonPlayer'
import IndividualDashboard from './pages/individual/IndividualDashboard'

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/teacher/new-lesson" element={<NewLessonPage />} />
          <Route path="/teacher/lessons" element={<MyLessons />} />
          <Route path="/teacher/students" element={<StudentsView />} />
          <Route path="/teacher/lessons/:lessonId/edit" element={<LessonEditor />} />
          <Route path="/teacher/lessons/:lessonId/fact-check" element={<FactCheckPanel />} />
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/lessons" element={<StudentLessonsPage />} />
          <Route path="/lesson/join" element={<JoinLessonPage />} />
          <Route path="/lesson/:id" element={<StudentLessonPlayer />} />
          <Route path="/individual/dashboard" element={<IndividualDashboard />} />
        </Routes>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}

export default App

