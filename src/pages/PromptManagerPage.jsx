import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProjects } from '../contexts/ProjectContext'
import { ImageCard } from '../components/ImageCard'
import { Button } from '../components/Button'
import { extractPngMetadata, extractPromptFromMetadata } from '../utils/pngMetadata'
import '../components/Button.css'
import './PromptManagerPage.css'

export function PromptManagerPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const {
    getProject,
    addImageToProject,
    updateImagePrompt,
    deleteImage,
    undo,
    canUndo
  } = useProjects()

  const project = getProject(projectId)
  const pasteProcessingRef = useRef(false)

  // 添加图片并尝试读取 PNG metadata
  const addImageWithMetadata = useCallback(async (file) => {
    const imageData = await addImageToProject(projectId, file)
    
    // 如果是 PNG 文件，尝试提取 prompt
    if (file.type === 'image/png') {
      const metadata = await extractPngMetadata(file)
      const prompt = extractPromptFromMetadata(metadata)
      
      if (prompt) {
        // 自动填充 prompt
        updateImagePrompt(projectId, imageData.id, prompt)
      }
    }
    
    return imageData.id
  }, [projectId, addImageToProject, updateImagePrompt])

  // 处理图片上传（包含 PNG metadata 读取）
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    for (const file of files) {
      await addImageWithMetadata(file)
    }
    // Reset input
    e.target.value = ''
  }

  // Ctrl+Z 撤销快捷键
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && canUndo) {
        e.preventDefault()
        undo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, canUndo])

  // 粘贴图片支持
  useEffect(() => {
    const handlePaste = async (e) => {
      // 使用 ref 防止重复处理
      if (pasteProcessingRef.current) {
        console.log('粘贴正在处理中，忽略重复事件')
        return
      }
      
      const items = e.clipboardData?.items
      if (!items) return

      // 查找第一个图片项
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault()
          e.stopPropagation()
          
          pasteProcessingRef.current = true
          console.log('开始处理粘贴的图片')
          
          const file = item.getAsFile()
          if (file) {
            try {
              await addImageWithMetadata(file)
              console.log('图片粘贴完成')
            } catch (error) {
              console.error('粘贴图片失败:', error)
            }
          }
          
          // 500ms 后重置标志
          setTimeout(() => {
            pasteProcessingRef.current = false
            console.log('粘贴处理标志已重置')
          }, 1000)
          
          return // 只处理第一个图片，立即返回
        }
      }
    }

    window.addEventListener('paste', handlePaste, true) // 使用捕获阶段
    return () => {
      window.removeEventListener('paste', handlePaste, true)
    }
  }, [addImageWithMetadata])

  if (!project) {
    return (
      <div className="prompt-manager-page">
        <div className="error-state">
          <h2>项目未找到</h2>
          <p>该项目可能已被删除</p>
          <Button variant="primary" onClick={() => navigate('/projects')}>
            返回项目列表
          </Button>
        </div>
      </div>
    )
  }

  const handlePromptChange = (imageId, prompt) => {
    updateImagePrompt(projectId, imageId, prompt)
  }

  const handleDeleteImage = (imageId) => {
    deleteImage(projectId, imageId)
  }

  const handleOpenMosaic = () => {
    if (!project || project.images.length === 0) return
    const targetImageId = project.images[0].id
    navigate(`/projects/${projectId}/mosaic/${targetImageId}`)
  }

  return (
    <div className="prompt-manager-page">
      <header className="page-header">
        <Button
          variant="ghost"
          size="small"
          onClick={() => navigate('/projects')}
        >
          ← 返回项目列表
        </Button>

        <div className="page-header__content">
          <h1 className="page-header__title">{project.name}</h1>
          {project.description && (
            <p className="page-header__subtitle">{project.description}</p>
          )}
        </div>

        <Button
          variant="ghost"
          size="small"
          onClick={undo}
          disabled={!canUndo}
          title="撤销上一步操作 (Ctrl+Z)"
        >
          ↶ 撤销
        </Button>

        <Button
          variant="secondary"
          size="small"
          onClick={handleOpenMosaic}
          disabled={project.images.length === 0}
        >
          🧩 马赛克模式
        </Button>

        <label htmlFor="image-upload" className="btn btn--primary btn--medium upload-label">
          📁 上传图片
        </label>
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />
      </header>

      <main className="prompt-manager-page__content">
        {project.images.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">🖼️</div>
            <h2 className="empty-state__title">还没有图片</h2>
            <p className="empty-state__description">
              上传 Stable Diffusion 生成的图片，并添加对应的 Prompt
            </p>
            <p className="empty-state__hint">
              💡 提示：你也可以直接按 <kbd>Ctrl+V</kbd> 粘贴图片
            </p>
            <label htmlFor="image-upload-empty" className="btn btn--secondary btn--large">
              上传第一张图片
            </label>
            <input
              id="image-upload-empty"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
          </div>
        ) : (
          <div className="image-gallery">
            {project.images.map(image => (
              <ImageCard
                key={image.id}
                image={image}
                projectId={projectId}
                onPromptChange={handlePromptChange}
                onDelete={handleDeleteImage}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
