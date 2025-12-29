import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProjects } from '../contexts/ProjectContext'
import { apiClient } from '../api/client'
import { Button } from '../components/Button'
import './MosaicEditorPage.css'

export function MosaicEditorPage() {
  const { projectId, imageId: routeImageId } = useParams()
  const navigate = useNavigate()
  const { getProject, getImageUrl } = useProjects()
  const project = getProject(projectId)
  const images = project?.images || []
  const imageGroups = project?.imageGroups || []

  const [selectedImageId, setSelectedImageId] = useState(routeImageId || images[0]?.id || null)
  const [intensity, setIntensity] = useState(24)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [statusTone, setStatusTone] = useState('info')
  const [loadingImage, setLoadingImage] = useState(false)
  const [localVersion, setLocalVersion] = useState('')

  const canvasRef = useRef(null)
  const baseImageRef = useRef(null)

  const selectedImage = useMemo(
    () => images.find(img => img.id === selectedImageId) || null,
    [images, selectedImageId]
  )

  // 全局按文件名排序的图片列表（自然数值排序），用于翻页逻辑
  const sortedImages = useMemo(() => {
    return [...images].sort((a, b) =>
      a.filename.localeCompare(b.filename, undefined, { numeric: true, sensitivity: 'base' })
    )
  }, [images])

  const groupedThumbnails = useMemo(() => {
    if (!images.length) return []

    const groupedIds = new Set()

    const groupsWithImages = imageGroups.map(group => {
      const populatedImages = (group.imageIds || [])
        .map(id => images.find(img => img.id === id))
        .filter(Boolean)
      populatedImages.forEach(img => groupedIds.add(img.id))

      // 按文件名进行自然排序（数字按数值顺序），遵从版本号序列规范
      populatedImages.sort((a, b) =>
        a.filename.localeCompare(b.filename, undefined, { numeric: true, sensitivity: 'base' })
      )

      return {
        id: group.id,
        title: group.title || '未命名分组',
        images: populatedImages
      }
    }).filter(group => group.images.length > 0)

    const ungrouped = images
      .filter(img => !groupedIds.has(img.id))
      .sort((a, b) => a.filename.localeCompare(b.filename, undefined, { numeric: true, sensitivity: 'base' }))
    if (ungrouped.length > 0) {
      groupsWithImages.push({
        id: 'ungrouped',
        title: '未分组',
        images: ungrouped
      })
    }

    return groupsWithImages
  }, [images, imageGroups])

  // 同步 URL 参数与选中图片
  useEffect(() => {
    if (routeImageId && routeImageId !== selectedImageId) {
      setSelectedImageId(routeImageId)
    }
  }, [routeImageId, selectedImageId])

  // 当项目或图片列表变化时处理默认选中项
  useEffect(() => {
    if (!project || images.length === 0) {
      setSelectedImageId(null)
      return
    }
    if (!selectedImageId || !images.some(img => img.id === selectedImageId)) {
      setSelectedImageId(images[0].id)
    }
  }, [project, images, selectedImageId])

  // 重置本地状态
  useEffect(() => {
    setLocalVersion('')
    setStatusMessage('')
    setHasChanges(false)
  }, [selectedImageId])

  // 键盘导航：左右箭头翻页
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!selectedImage || images.length <= 1) return
      
      const currentIndex = images.findIndex(img => img.id === selectedImageId)
      if (currentIndex === -1) return

      let nextIndex = -1

      if (event.key === 'ArrowLeft') {
        // 左箭头：上一张
        nextIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1
        event.preventDefault()
      } else if (event.key === 'ArrowRight') {
        // 右箭头：下一张
        nextIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0
        event.preventDefault()
      }

      if (nextIndex !== -1) {
        const nextImage = images[nextIndex]
        setSelectedImageId(nextImage.id)
        navigate(`/projects/${projectId}/mosaic/${nextImage.id}`, { replace: true })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedImage, selectedImageId, images, projectId, navigate])

  // 加载图片到画布
  useEffect(() => {
    if (!selectedImage || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const imageVersion = localVersion || selectedImage.updatedAt || selectedImage.addedAt || ''
    const imageUrl = getImageUrl(projectId, selectedImage.filename, imageVersion)

    setLoadingImage(true)
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      // 禁用平滑缩放以保持像素化效果
      ctx.imageSmoothingEnabled = false
      if (ctx.mozImageSmoothingEnabled !== undefined) ctx.mozImageSmoothingEnabled = false
      if (ctx.webkitImageSmoothingEnabled !== undefined) ctx.webkitImageSmoothingEnabled = false
      ctx.drawImage(img, 0, 0)
      baseImageRef.current = img
      setLoadingImage(false)
      setStatusMessage('')
      setHasChanges(false)
    }

    img.onerror = () => {
      setLoadingImage(false)
      setStatusTone('error')
      setStatusMessage('图片加载失败，请重试')
    }

    img.src = imageUrl

    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [selectedImage, projectId, localVersion, getImageUrl])

  const showStatus = (message, tone = 'info') => {
    setStatusMessage(message)
    setStatusTone(tone)
  }

  const applyMosaicAt = useCallback((event) => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d', { willReadFrequently: true })

    // 确保绘图时不进行平滑插值，保持方块感
    ctx.imageSmoothingEnabled = false

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (event.clientX - rect.left) * scaleX
    const y = (event.clientY - rect.top) * scaleY
    const size = Math.max(4, intensity)

    // 将起止坐标对齐到网格，这样每次应用都会填充同一套方块，避免平滑叠加
    const startX = Math.max(0, Math.floor((x - size / 2) / size) * size)
    const startY = Math.max(0, Math.floor((y - size / 2) / size) * size)
    const endX = Math.min(canvas.width, Math.ceil((x + size / 2) / size) * size)
    const endY = Math.min(canvas.height, Math.ceil((y + size / 2) / size) * size)

    for (let yy = startY; yy < endY; yy += size) {
      for (let xx = startX; xx < endX; xx += size) {
        const blockW = Math.min(size, canvas.width - xx)
        const blockH = Math.min(size, canvas.height - yy)
        // 使用 getImageData 获取该块的色值并计算平均值
        const imageData = ctx.getImageData(xx, yy, blockW, blockH)
        const data = imageData.data
        if (data.length === 0) continue

        let r = 0, g = 0, b = 0
        const pixels = data.length / 4
        for (let i = 0; i < data.length; i += 4) {
          r += data[i]
          g += data[i + 1]
          b += data[i + 2]
        }

        ctx.fillStyle = `rgb(${Math.round(r / pixels)}, ${Math.round(g / pixels)}, ${Math.round(b / pixels)})`
        ctx.fillRect(xx, yy, blockW, blockH)
      }
    }

    setHasChanges(true)
  }, [intensity])

  const handlePointerDown = (event) => {
    if (!selectedImage || loadingImage) return
    setIsDrawing(true)
    applyMosaicAt(event)
  }

  const handlePointerMove = (event) => {
    if (!isDrawing) return
    applyMosaicAt(event)
  }

  const handlePointerUp = () => {
    setIsDrawing(false)
  }

  const handleReset = () => {
    if (!canvasRef.current || !baseImageRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    ctx.drawImage(baseImageRef.current, 0, 0)
    setHasChanges(false)
    showStatus('已恢复原始图片', 'info')
  }

  const exportCanvasBlob = () => {
    return new Promise((resolve, reject) => {
      const canvas = canvasRef.current
      if (!canvas) {
        reject(new Error('画布未就绪'))
        return
      }
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('导出图像失败'))
        }
      }, 'image/png')
    })
  }

  const handleSave = async () => {
    if (!selectedImage || !hasChanges) return true
    try {
      setIsSaving(true)
      showStatus('正在保存...', 'info')
      const blob = await exportCanvasBlob()
      const result = await apiClient.saveMosaicImage(projectId, selectedImage.id, blob, selectedImage.filename)
      setHasChanges(false)
      setLocalVersion(result.updatedAt || Date.now().toString())
      showStatus('马赛克已保存', 'success')
      return true
    } catch (error) {
      console.error('保存马赛克失败:', error)
      showStatus('保存失败，请重试', 'error')
      return false
    } finally {
      setIsSaving(false)
    }
  }

  const handleSelectImage = (image) => {
    setSelectedImageId(image.id)
    navigate(`/projects/${projectId}/mosaic/${image.id}`, { replace: true })
  }

  const handlePreviousImage = async () => {
    if (images.length <= 1) return
    // 自动保存当前改动
    const saved = await handleSave()
    if (!saved) return // 保存失败则中止切换

  const currentIndex = sortedImages.findIndex(img => img.id === selectedImageId)
  const prevIndex = currentIndex > 0 ? currentIndex - 1 : sortedImages.length - 1
  const prevImage = sortedImages[prevIndex]
    setSelectedImageId(prevImage.id)
    navigate(`/projects/${projectId}/mosaic/${prevImage.id}`, { replace: true })
  }

  const handleNextImage = async () => {
    if (images.length <= 1) return
    // 自动保存当前改动
    const saved = await handleSave()
    if (!saved) return // 保存失败则中止切换

  const currentIndex = sortedImages.findIndex(img => img.id === selectedImageId)
  const nextIndex = currentIndex < sortedImages.length - 1 ? currentIndex + 1 : 0
  const nextImage = sortedImages[nextIndex]
    setSelectedImageId(nextImage.id)
    navigate(`/projects/${projectId}/mosaic/${nextImage.id}`, { replace: true })
  }

  if (!project) {
    return (
      <div className="mosaic-editor">
        <div className="mosaic-editor__empty">
          <h2>项目不存在</h2>
          <Button variant="primary" onClick={() => navigate('/projects')}>
            返回项目列表
          </Button>
        </div>
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="mosaic-editor">
        <div className="mosaic-editor__empty">
          <h2>该项目还没有图片</h2>
          <p>请先上传图片后再进入马赛克模式。</p>
          <Button variant="primary" onClick={() => navigate(`/projects/${projectId}`)}>
            返回项目管理
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mosaic-editor">
      <header className="mosaic-editor__header">
        <Button variant="ghost" size="small" onClick={() => navigate(`/projects/${projectId}`)}>
          ← 返回项目
        </Button>
        <div className="mosaic-editor__title-group">
          <h1>{project.name}</h1>
          <p>马赛克编辑模式 · 拖拽鼠标打码 · 使用 ← → 键翻页</p>
        </div>
        <div className="mosaic-editor__actions">
          <Button
            variant="ghost"
            size="small"
            onClick={handlePreviousImage}
            disabled={images.length <= 1}
            title="上一张 (←)"
          >
            ← 上一张
          </Button>
          <Button
            variant="ghost"
            size="small"
            onClick={handleNextImage}
            disabled={images.length <= 1}
            title="下一张 (→)"
          >
            下一张 →
          </Button>
          <Button
            variant="secondary"
            size="small"
            onClick={handleReset}
            disabled={!selectedImage || loadingImage}
          >
            还原
          </Button>
          <Button
            variant="primary"
            size="small"
            onClick={handleSave}
            disabled={!hasChanges || isSaving || !selectedImage}
          >
            {isSaving ? '保存中...' : '保存马赛克'}
          </Button>
        </div>
      </header>

      <div className="mosaic-editor__content">
        <section className="mosaic-editor__workspace">
          <div className="mosaic-editor__controls">
            <label className="mosaic-editor__slider-label">
              马赛克强度
              <div className="mosaic-editor__slider">
                <input
                  type="range"
                  min="6"
                  max="80"
                  step="2"
                  value={intensity}
                  onChange={(e) => setIntensity(Number(e.target.value))}
                />
                <span>{intensity}px</span>
              </div>
            </label>
            <div className={`mosaic-editor__status mosaic-editor__status--${statusTone}`}>
              {statusMessage || (hasChanges ? '有未保存的更改' : '提示：按住鼠标左键拖拽进行打码')}
            </div>
          </div>

          <div className="mosaic-editor__canvas-wrapper">
            {loadingImage && <div className="mosaic-editor__loading">图片加载中...</div>}
            <canvas
              ref={canvasRef}
              className="mosaic-editor__canvas"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            />
          </div>
        </section>

        <aside className="mosaic-editor__sidebar">
          <h2>项目图片</h2>
          <div className="mosaic-editor__thumbnails">
            {groupedThumbnails.length === 0 ? (
              <div className="mosaic-editor__thumbnail-empty">暂无图片</div>
            ) : (
              groupedThumbnails.map(group => (
                <div key={group.id} className="mosaic-editor__thumbnail-group">
                  <div className="mosaic-editor__thumbnail-group-title">
                    <span>{group.title}</span>
                    <span className="mosaic-editor__thumbnail-count">{group.images.length}</span>
                  </div>
                  <div className="mosaic-editor__thumbnail-grid">
                    {group.images.map(image => {
                      const version = image.updatedAt || image.addedAt || ''
                      const thumbUrl = getImageUrl(projectId, image.filename, version)
                      const isActive = image.id === selectedImageId
                      return (
                        <button
                          key={image.id}
                          className={`mosaic-editor__thumbnail ${isActive ? 'is-active' : ''}`}
                          onClick={() => handleSelectImage(image)}
                        >
                          <img src={thumbUrl} alt={image.filename} />
                          <span className="mosaic-editor__thumbnail-name">{image.filename}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
