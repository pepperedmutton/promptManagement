import React, { useState } from 'react'
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
  onDragEnd
}) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isEditingDesc, setIsEditingDesc] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

  const handleTitleChange = (e) => {
    onUpdateGroup(group.id, { ...group, title: e.target.value })
  }

  const handleDescriptionChange = (e) => {
    onUpdateGroup(group.id, { ...group, description: e.target.value })
  }

  const handleDelete = () => {
    if (window.confirm(`确定要删除分组"${group.title}"吗？组内的图片不会被删除，只是取消分组。`)) {
      onDeleteGroup(group.id)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    
    if (onDrop && group.id !== 'ungrouped') {
      const imageId = e.dataTransfer.getData('imageId')
      if (imageId) {
        onDrop(group.id, imageId)
      }
    }
  }

  return (
    <div 
      className={`image-group ${isDragOver ? 'image-group--drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
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
                placeholder="输入组名称..."
              />
            ) : (
              <span
                onDoubleClick={() => setIsEditingTitle(true)}
                style={{ cursor: 'pointer' }}
                title="双击编辑"
              >
                {group.title || '未命名分组'}
              </span>
            )}
          </div>

          {isEditingDesc ? (
            <textarea
              className="image-group__description"
              value={group.description || ''}
              onChange={handleDescriptionChange}
              onBlur={() => setIsEditingDesc(false)}
              rows={8}
              placeholder="输入分组说明...

例如：
———————— 第1页：日常出场 + 身材印象 ————————
功能：介绍女主是正常少女...

コマ1（上横）
内容：清晨街道/校园远景..."
              autoFocus
            />
          ) : group.description ? (
            <div
              className="image-group__description"
              onDoubleClick={() => setIsEditingDesc(true)}
              title="双击编辑说明"
            >
              {group.description}
            </div>
          ) : (
            <div
              className="image-group__description"
              onDoubleClick={() => setIsEditingDesc(true)}
              style={{ opacity: 0.5, fontStyle: 'italic' }}
              title="双击添加说明"
            >
              点击此处添加分组说明...
            </div>
          )}
        </div>

        <div className="image-group__actions">
          <button
            className="image-group__toggle"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? '展开' : '收起'}
          >
            {isCollapsed ? '▼' : '▲'}
          </button>
          <button
            className="image-group__delete"
            onClick={handleDelete}
            title="删除此分组"
          >
            删除分组
          </button>
        </div>
      </div>

      <div className={`image-group__content ${isCollapsed ? 'collapsed' : ''}`}>
        {group.images && group.images.length > 0 ? (
          group.images.map(image => (
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
              ? '此分组还没有图片。上传图片后会显示在这里，你可以将它们移动到其他分组。'
              : '此分组还没有图片。将未分组的图片拖拽到此处，或使用菜单移动图片到此分组。'}
          </div>
        )}
      </div>
    </div>
  )
}
