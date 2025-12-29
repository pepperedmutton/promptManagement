import React, { useState, useRef, useEffect } from 'react'
import { ImageCard } from './ImageCard'
import './ImageGroup.css'

export function ImageGroup({
  group,
  projectId,
  onUpdateGroup,
  onDeleteGroup,
  onPromptChange,
  onDeleteImage,
  onMoveToGroup,
  onDrop,
  draggable = false,
  onDragStart,
  onDragEnd,
  onMouseEnter,
  onMouseLeave
}) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isEditingDesc, setIsEditingDesc] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isComposing, setIsComposing] = useState(false)
  const [localDescription, setLocalDescription] = useState(group.description || '')
  const descriptionAreaRef = useRef(null)
  const descriptionTimerRef = useRef(null)

  // 同步外部 group.description 到本地状态
  useEffect(() => {
    setLocalDescription(group.description || '')
  }, [group.description])

  const handleTitleChange = (e) => {
    onUpdateGroup(group.id, { ...group, title: e.target.value })
  }

  const handleDescriptionChange = (e) => {
    const newValue = e.target.value
    
    // 立即更新本地状态（UI 响应）
    setLocalDescription(newValue)
    
    // 清除之前的定时器
    if (descriptionTimerRef.current) {
      clearTimeout(descriptionTimerRef.current)
    }
    
    // 延迟 500ms 后再发送 API 请求
    descriptionTimerRef.current = setTimeout(() => {
      onUpdateGroup(group.id, { ...group, description: newValue })
    }, 500)
  }

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (descriptionTimerRef.current) {
        clearTimeout(descriptionTimerRef.current)
      }
    }
  }, [])

  const handleDelete = () => {
    const confirmed = window.confirm(
      `Delete "${group.title || 'this group'}"? Images stay in the project, only the group is removed.`
    )
    if (confirmed) {
      onDeleteGroup(group.id)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)

    if (onDrop) {
      const imageId = e.dataTransfer.getData('imageId')
      if (imageId) {
        onDrop(group.id, imageId)
      }
    }
  }

  useEffect(() => {
    if (isEditingDesc && descriptionAreaRef.current) {
      const textarea = descriptionAreaRef.current
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [isEditingDesc, localDescription])

  const groupBgClass = group.metaBackground || ''
  const shouldShowDescription = isEditingDesc || !isCollapsed

  return (
    <div
      className={`image-group ${groupBgClass} ${isDragOver ? 'image-group--drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="image-group__header">
        <div className="image-group__title-section">
          <div className="image-group__title">
            {isEditingTitle ? (
              <input
                type="text"
                value={group.title || ''}
                onChange={handleTitleChange}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => {
                  // 只在非组合输入状态下处理 Enter 键（兼容中文输入法）
                  if (e.key === 'Enter' && !isComposing) setIsEditingTitle(false)
                }}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
                autoFocus
                placeholder="Enter a group title..."
              />
            ) : (
              <span
                onDoubleClick={() => setIsEditingTitle(true)}
                style={{ cursor: 'pointer' }}
                title="Double-click to edit"
              >
                {group.title || 'Untitled group'}
              </span>
            )}
          </div>

          {shouldShowDescription && (
            isEditingDesc ? (
              <textarea
                ref={descriptionAreaRef}
                className="image-group__description"
                value={localDescription}
                onChange={handleDescriptionChange}
                onBlur={() => {
                  setIsEditingDesc(false)
                  // 编辑完成时立即保存（如果还有未保存的更改）
                  if (descriptionTimerRef.current) {
                    clearTimeout(descriptionTimerRef.current)
                    onUpdateGroup(group.id, { ...group, description: localDescription })
                  }
                }}
                onKeyDown={(e) => {
                  // Ctrl/Cmd + Enter 完成编辑，但只在非组合输入状态下处理
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isComposing) {
                    setIsEditingDesc(false)
                    // 立即保存
                    if (descriptionTimerRef.current) {
                      clearTimeout(descriptionTimerRef.current)
                      onUpdateGroup(group.id, { ...group, description: localDescription })
                    }
                  }
                }}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
                rows={1}
                placeholder={`Add a short description...

Example:
Mood board for landing page hero + print-ready files.
Vibe: bright, bold shapes with candid portraits.`}
                style={{ resize: 'none' }}
                autoFocus
              />
            ) : group.description ? (
              <div
                className="image-group__description"
                onDoubleClick={() => setIsEditingDesc(true)}
                title="Double-click to edit"
              >
                {group.description}
              </div>
            ) : (
              <div
                className="image-group__description"
                onDoubleClick={() => setIsEditingDesc(true)}
                style={{ opacity: 0.5, fontStyle: 'italic' }}
                title="Double-click to add a description"
              >
                Add a helpful description...
              </div>
            )
          )}
        </div>

        <div className="image-group__actions">
          <button
            className="image-group__toggle"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand group' : 'Collapse group'}
          >
            {isCollapsed ? 'Expand' : 'Collapse'}
          </button>
          <button
            className="image-group__delete"
            onClick={handleDelete}
            title="Delete this group"
          >
            Delete
          </button>
        </div>
      </div>

      <div className={`image-group__content ${isCollapsed ? 'collapsed' : ''}`}>
        {group.images && group.images.length > 0 ? (
          group.images.map((image) => (
            <ImageCard
              key={image.id}
              image={image}
              projectId={projectId}
              onPromptChange={onPromptChange}
              onDelete={onDeleteImage}
              onMoveToGroup={onMoveToGroup}
              draggable={draggable}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />
          ))
        ) : (
          <div className="image-group__empty">
            {group.id === 'ungrouped'
              ? 'No images yet. Upload or drag cards here to keep things organized.'
              : 'No images in this group. Drag cards here or use the menu to move images into the group.'}
          </div>
        )}
      </div>
    </div>
  )
}
