import React, { useState } from 'react'
import { useProjects } from '../contexts/ProjectContext'
import { ProjectCard } from '../components/ProjectCard'
import { Modal } from '../components/Modal'
import { Button } from '../components/Button'
import { apiClient } from '../api/client'
import './ProjectListPage.css'

export function ProjectListPage() {
  const { projects, openFolder, deleteProject } = useProjects()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [folderPath, setFolderPath] = useState('')
  const [projectName, setProjectName] = useState('')
  const [isSelecting, setIsSelecting] = useState(false)

  // 使用后端 API 调用系统文件夹选择器
  const handleSelectFolder = async () => {
    try {
      setIsSelecting(true)
      
      // 调用后端 API 打开系统文件夹选择对话框
      const result = await apiClient.selectFolder()
      
      if (result.folderPath) {
        setFolderPath(result.folderPath)
        // 自动使用文件夹名称作为项目名称
        const folderName = result.folderPath.split(/[/\\]/).pop()
        setProjectName(folderName)
      }
    } catch (error) {
      console.error('选择文件夹失败:', error)
      if (error.message.includes('未选择')) {
        // 用户取消了选择，不显示错误
        return
      }
      alert('选择文件夹失败: ' + error.message)
    } finally {
      setIsSelecting(false)
    }
  }

  const handleOpenFolder = async (e) => {
    e.preventDefault()
    if (folderPath.trim()) {
      try {
        await openFolder(folderPath.trim(), projectName.trim() || undefined)
        setFolderPath('')
        setProjectName('')
        setIsModalOpen(false)
      } catch (error) {
        alert(error.message || '打开文件夹失败')
      }
    }
  }

  return (
    <div className="project-list-page">
      <header className="page-header">
        <div className="page-header__content">
          <h1 className="page-header__title">Stable Diffusion Prompt 管理器</h1>
          <p className="page-header__subtitle">打开本地文件夹管理图片和 Prompt</p>
        </div>
        <Button
          variant="primary"
          size="large"
          onClick={() => setIsModalOpen(true)}
        >
          📁 打开文件夹
        </Button>
      </header>

      <main className="project-list-page__content">
        {projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">📁</div>
            <h2 className="empty-state__title">还没有打开的文件夹</h2>
            <p className="empty-state__description">
              选择一个包含 Stable Diffusion 图片的文件夹开始管理
            </p>
            <Button
              variant="secondary"
              size="large"
              onClick={() => setIsModalOpen(true)}
            >
              打开第一个文件夹
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
        title="打开文件夹"
      >
        <form onSubmit={handleOpenFolder} className="project-form">
          <div className="form-field">
            <label className="form-label">
              选择文件夹
            </label>
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={handleSelectFolder}
              disabled={isSelecting}
            >
              {isSelecting ? '正在打开选择器...' : '🗂️ 浏览并选择文件夹'}
            </Button>
            <p className="form-hint">
              💡 点击按钮打开系统文件夹选择对话框
            </p>
          </div>

          <div className="form-field">
            <label htmlFor="folder-path" className="form-label">
              文件夹路径 <span className="required">*</span>
            </label>
            <input
              id="folder-path"
              type="text"
              className="form-input"
              value={folderPath}
              onChange={(e) => setFolderPath(e.target.value)}
              placeholder="例如：D:\SD\outputs\project1"
              required
            />
            <p className="form-hint">
              💡 使用上方按钮选择，或手动输入文件夹路径
            </p>
          </div>

          <div className="form-field">
            <label htmlFor="project-name" className="form-label">
              项目名称（可选）
            </label>
            <input
              id="project-name"
              type="text"
              className="form-input"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="留空则使用文件夹名称"
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
              打开文件夹
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
