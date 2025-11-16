import React from 'react'
import { useNavigate } from 'react-router-dom'
import { formatDate, getTimeAgo } from '../utils/helpers'
import { Button } from './Button'
import './ProjectCard.css'

export function ProjectCard({ project, onDelete }) {
  const navigate = useNavigate()
  const imageCount = project.images?.length || 0

  const handleOpen = () => {
    navigate(`/projects/${project.id}`)
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    if (window.confirm(`确定删除项目 "${project.name}"？此操作不可恢复。`)) {
      onDelete(project.id)
    }
  }

  return (
    <div className="project-card" onClick={handleOpen}>
      <div className="project-card__header">
        <h3 className="project-card__title">{project.name}</h3>
        <button
          className="project-card__delete"
          onClick={handleDelete}
          title="删除项目"
        >
          ✕
        </button>
      </div>

      {project.description && (
        <p className="project-card__description">{project.description}</p>
      )}

      <div className="project-card__stats">
        <div className="project-card__stat">
          <span className="project-card__stat-label">图片数量</span>
          <span className="project-card__stat-value">{imageCount}</span>
        </div>
        <div className="project-card__stat">
          <span className="project-card__stat-label">创建时间</span>
          <span className="project-card__stat-value">
            {getTimeAgo(project.createdAt)}
          </span>
        </div>
      </div>

      <div className="project-card__preview">
        {imageCount > 0 ? (
          <div className="project-card__images">
            {project.images.slice(0, 3).map(img => (
              <div key={img.id} className="project-card__image">
                <img src={img.url} alt="" />
              </div>
            ))}
            {imageCount > 3 && (
              <div className="project-card__image project-card__image--more">
                +{imageCount - 3}
              </div>
            )}
          </div>
        ) : (
          <div className="project-card__empty">
            <p>暂无图片</p>
          </div>
        )}
      </div>

      <div className="project-card__footer">
        <Button variant="secondary" size="small" fullWidth>
          打开项目
        </Button>
      </div>
    </div>
  )
}
