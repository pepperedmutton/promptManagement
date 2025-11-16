import React, { useState } from 'react'
import { useProjects } from '../contexts/ProjectContext'
import { ProjectCard } from '../components/ProjectCard'
import { Modal } from '../components/Modal'
import { Button } from '../components/Button'
import './ProjectListPage.css'

export function ProjectListPage() {
  const { projects, createProject, deleteProject } = useProjects()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')

  const handleCreateProject = (e) => {
    e.preventDefault()
    if (projectName.trim()) {
      createProject(projectName.trim(), projectDescription.trim())
      setProjectName('')
      setProjectDescription('')
      setIsModalOpen(false)
    }
  }

  return (
    <div className="project-list-page">
      <header className="page-header">
        <div className="page-header__content">
          <h1 className="page-header__title">Stable Diffusion Prompt 管理器</h1>
          <p className="page-header__subtitle">管理你的 AI 创作项目和 Prompt 库</p>
        </div>
        <Button
          variant="primary"
          size="large"
          onClick={() => setIsModalOpen(true)}
        >
          ➕ 新建项目
        </Button>
      </header>

      <main className="project-list-page__content">
        {projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">📁</div>
            <h2 className="empty-state__title">还没有项目</h2>
            <p className="empty-state__description">
              创建你的第一个项目，开始管理 Stable Diffusion 图片和 Prompt
            </p>
            <Button
              variant="secondary"
              size="large"
              onClick={() => setIsModalOpen(true)}
            >
              创建第一个项目
            </Button>
          </div>
        ) : (
          <div className="project-grid">
            {projects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                onDelete={deleteProject}
              />
            ))}
          </div>
        )}
      </main>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="新建项目"
      >
        <form onSubmit={handleCreateProject} className="project-form">
          <div className="form-field">
            <label htmlFor="project-name" className="form-label">
              项目名称 <span className="required">*</span>
            </label>
            <input
              id="project-name"
              type="text"
              className="form-input"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="例如：角色设计、风景画集..."
              required
              autoFocus
            />
          </div>

          <div className="form-field">
            <label htmlFor="project-description" className="form-label">
              项目描述（可选）
            </label>
            <textarea
              id="project-description"
              className="form-textarea"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="简单描述这个项目的用途..."
              rows={3}
            />
          </div>

          <div className="form-actions">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
            >
              取消
            </Button>
            <Button type="submit" variant="secondary">
              创建项目
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
