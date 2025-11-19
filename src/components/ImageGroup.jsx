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
  const descriptionAreaRef = useRef(null)

  const handleTitleChange = (e) => {
    onUpdateGroup(group.id, { ...group, title: e.target.value })
  }

  const handleDescriptionChange = (e) => {
    onUpdateGroup(group.id, { ...group, description: e.target.value })
  }

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
  }, [isEditingDesc, group.description])

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
                  if (e.key === 'Enter') setIsEditingTitle(false)
                }}
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
                value={group.description || ''}
                onChange={handleDescriptionChange}
                onBlur={() => setIsEditingDesc(false)}
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
