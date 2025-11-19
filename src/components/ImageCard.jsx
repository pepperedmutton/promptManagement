import React, { useState } from 'react'
import './ImageCard.css'
import { useProjects } from '../contexts/ProjectContext'

export function ImageCard({ 
  image, 
  projectId, 
  onPromptChange, 
  onDelete, 
  onMoveToGroup,
  draggable = false,
  onDragStart,
  onDragEnd
}) {
  const { getImageUrl } = useProjects()
  const [copySuccess, setCopySuccess] = useState(false)
  const [copyImageSuccess, setCopyImageSuccess] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [imageError, setImageError] = useState(false)

  // 使用 previewUrl（乐观更新）或真实 URL
  const imageVersion = image.updatedAt || image.addedAt || ''
  const imageUrl = image.previewUrl || getImageUrl(projectId, image.filename, imageVersion)

  const handleCopyPrompt = async () => {
    if (!image.prompt) return
    
    try {
      await navigator.clipboard.writeText(image.prompt)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  const handleCopyImage = async () => {
    if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
      alert('当前浏览器暂不支持复制图片')
      return
    }

    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ])
      setCopyImageSuccess(true)
      setTimeout(() => setCopyImageSuccess(false), 2000)
    } catch (err) {
      console.error('复制图片失败:', err)
      alert('复制图片失败，请稍后再试')
    }
  }

  const handleDelete = () => {
    if (window.confirm('确定要删除这张图片吗？')) {
      onDelete(image.id)
      setMenuOpen(false)
    }
  }

  const handleMoveToGroup = () => {
    if (onMoveToGroup) {
      onMoveToGroup(image.id)
      setMenuOpen(false)
    }
  }

  const toggleMenu = () => {
    setMenuOpen(prev => !prev)
  }

  // 点击外部关闭菜单
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuOpen && !e.target.closest('.image-card__menu-container')) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [menuOpen])

  return (
    <div 
      className={`image-card ${image.isOptimistic ? 'image-card--optimistic' : ''}`}
      draggable={draggable && !image.isOptimistic}
      onDragStart={(e) => {
        if (onDragStart) {
          onDragStart(e, image.id)
        }
      }}
      onDragEnd={onDragEnd}
    >
      <div className="image-card__wrapper">
        {imageError ? (
          <div className="image-card__placeholder">加载失败</div>
        ) : (
          <img 
            src={imageUrl} 
            alt="Uploaded" 
            className="image-card__img"
            onError={() => setImageError(true)}
          />
        )}

        <button
          className={`image-card__copy-image-btn ${copyImageSuccess ? 'copied' : ''}`}
          onClick={handleCopyImage}
          title={copyImageSuccess ? '已复制图片' : '复制图片'}
          type="button"
        >
          {copyImageSuccess ? '✓' : '⧉'}
        </button>
        
        {/* 乐观更新指示器 */}
        {image.isOptimistic && (
          <div className="image-card__optimistic-badge">
            ⏳ 同步中...
          </div>
        )}
        
        {/* 左上角三点菜单 */}
        <div className="image-card__menu-container">
          <button
            className="image-card__menu-btn"
            onClick={toggleMenu}
            title="更多选项"
          >
            ⋯
          </button>
          {menuOpen && (
            <div className="image-card__menu-dropdown">
              {onMoveToGroup && (
                <button
                  className="image-card__menu-item"
                  onClick={handleMoveToGroup}
                >
                  📁 移动到分组
                </button>
              )}
              <button
                className="image-card__menu-item image-card__menu-item--danger"
                onClick={handleDelete}
              >
                🗑️ 删除图片
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="image-card__prompt-section">
        <div className="image-card__header">
          <label className="image-card__label">Prompt:</label>
          <button
            className={`image-card__copy-btn ${copySuccess ? 'copied' : ''}`}
            onClick={handleCopyPrompt}
            disabled={!image.prompt}
            title="复制 Prompt"
          >
            {copySuccess ? '✓ 已复制' : '📋 复制'}
          </button>
        </div>
        <textarea
          className="image-card__textarea"
          value={image.prompt}
          onChange={(e) => onPromptChange(image.id, e.target.value)}
          placeholder="输入此图片的 prompt..."
          rows={4}
        />
      </div>
    </div>
  )
}
