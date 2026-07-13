import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import Scans from './pages/Scans'
import Vulnerabilities from './pages/Vulnerabilities'
import Remediations from './pages/Remediations'
import Compliance from './pages/Compliance'
import AttackChain from './pages/AttackChain'
import Settings from './pages/Settings'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected app routes */}
      <Route path="/app" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="scans" element={<Scans />} />
        <Route path="vulnerabilities" element={<Vulnerabilities />} />
        <Route path="attack-chains" element={<AttackChain />} />
        <Route path="remediations" element={<Remediations />} />
        <Route path="compliance" element={<Compliance />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}

export default App
