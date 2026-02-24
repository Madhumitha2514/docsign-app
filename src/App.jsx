import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login               from './pages/Login'
import Register            from './pages/Register'
import Dashboard           from './pages/Dashboard'
import SignatureEditorPage from './pages/SignatureEditorPage'
import PublicSignPage from './pages/PublicSignPage'
import SignSuccessPage from './pages/SignSuccessPage'

function ProtectedRoute({ children }) {
  const { token } = useAuth()
  return token ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route path="/dashboard" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />
      
      <Route path="/editor/:id" element={
        <ProtectedRoute><SignatureEditorPage /></ProtectedRoute>
      } />
      
     
      <Route path="/sign-public/:token" element={<PublicSignPage />} />
      <Route path="/sign-success" element={<SignSuccessPage />} />
      
      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  )
}
