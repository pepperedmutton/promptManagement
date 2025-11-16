import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProjectProvider } from './contexts/ProjectContext'
import { ProjectListPage } from './pages/ProjectListPage'
import { PromptManagerPage } from './pages/PromptManagerPage'

export default function App() {
  return (
    <BrowserRouter>
      <ProjectProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/projects" replace />} />
          <Route path="/projects" element={<ProjectListPage />} />
          <Route path="/projects/:projectId" element={<PromptManagerPage />} />
          <Route path="*" element={<Navigate to="/projects" replace />} />
        </Routes>
      </ProjectProvider>
    </BrowserRouter>
  )
}
