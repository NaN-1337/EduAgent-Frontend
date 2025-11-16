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
import LessonViewer from './pages/teacher/LessonViewer'
import StudentsView from './pages/teacher/StudentsView'
import MyLessons from './pages/teacher/MyLessons'
import TeacherQuizzesPage from './pages/teacher/TeacherQuizzesPage'
import StudentDashboard from './pages/student/StudentDashboard'
import StudentLessonsPage from './pages/student/StudentLessonsPage'
import StudentQuizzesPage from './pages/student/StudentQuizzesPage'
import JoinLessonPage from './pages/student/JoinLessonPage'
import StudentLessonPlayer from './pages/student/StudentLessonPlayer'
import IndividualDashboard from './pages/individual/IndividualDashboard'
import LearningPathsPage from './pages/individual/LearningPathsPage'
import NewLearningPathPage from './pages/individual/NewLearningPathPage'
import LearningPathViewPage from './pages/individual/LearningPathViewPage'

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
          <Route path="/teacher/lessons/:lessonId/view" element={<LessonViewer />} />
          <Route path="/teacher/lessons/:lessonId/fact-check" element={<FactCheckPanel />} />
          <Route path="/teacher/quizzes" element={<TeacherQuizzesPage />} />
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/lessons" element={<StudentLessonsPage />} />
          <Route path="/student/quizzes" element={<StudentQuizzesPage />} />
          <Route path="/student/learning-paths" element={<LearningPathsPage />} />
          <Route path="/student/learning-paths/new" element={<NewLearningPathPage />} />
          <Route path="/student/learning-paths/:id" element={<LearningPathViewPage />} />
          <Route path="/lesson/join" element={<JoinLessonPage />} />
          <Route path="/lesson/:id" element={<StudentLessonPlayer />} />
          <Route path="/individual/dashboard" element={<IndividualDashboard />} />
          <Route path="/individual/learning-paths" element={<LearningPathsPage />} />
          <Route path="/individual/learning-paths/new" element={<NewLearningPathPage />} />
          <Route path="/individual/learning-paths/:id" element={<LearningPathViewPage />} />
        </Routes>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}

export default App

