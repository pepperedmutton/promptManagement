import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProjects } from '../contexts/ProjectContext'
import { ImageCard } from '../components/ImageCard'
import { ImageGroup } from '../components/ImageGroup'
import { GroupSelector } from '../components/GroupSelector'
import { Button } from '../components/Button'
import { extractPngMetadata, extractPromptFromMetadata } from '../utils/pngMetadata'
import { parsePageText, hasPageMarkers, normalizeGroupTitle } from '../utils/textParser'
import { useDragScroll } from '../hooks/useDragScroll'
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
    canUndo,
    createImageGroup,
    insertImageGroup,
    updateImageGroup,
    deleteImageGroup,
    addImageToGroup,
    removeImageFromGroup
  } = useProjects()

  const project = getProject(projectId)
  const pasteProcessingRef = useRef(false)
  const [showGroupSelector, setShowGroupSelector] = useState(false)
  const [selectedImageId, setSelectedImageId] = useState(null)
  const [draggingImageId, setDraggingImageId] = useState(null)
  const [showInsertSelector, setShowInsertSelector] = useState(false);
  const [hoveredGroupId, setHoveredGroupId] = useState(null);
  useDragScroll(Boolean(draggingImageId))

  // 计算分组显示的数据

  const { groups, ungroupedImages } = useMemo(() => {
    if (!project) return { groups: [], ungroupedImages: [] }

    const imageGroups = project.imageGroups || []
    const allImages = project.images || []

    

    // 获取所有已分组的图片ID

    const groupedImageIds = new Set()

    imageGroups.forEach(group => {

      (group.imageIds || []).forEach(id => groupedImageIds.add(id))

    })

    

    // 为每个分组附加完整的图片对象

    const groupsWithImages = imageGroups.map(group => ({

      ...group,

      images: (group.imageIds || [])

        .map(id => allImages.find(img => img.id === id))

        .filter(Boolean) // 过滤掉不存在的图像

    }))

    

    // 未分组的图片

    const ungrouped = allImages.filter(img => !groupedImageIds.has(img.id))

    

    return {
      groups: groupsWithImages,
      ungroupedImages: ungrouped
    }
  }, [project])

  const referenceGroup = useMemo(() => ({
    id: 'ungrouped',
    title: '设定集',
    description: '这里暂存所有还没有分组的素材，拖拽到右侧分组即可整理。',
    images: ungroupedImages
  }), [ungroupedImages])

  const displayGroups = useMemo(() => {
    return [referenceGroup, ...groups].map((group, index) => ({
      ...group,
      metaBackground: index % 2 === 0 ? 'image-group--bg-primary' : 'image-group--bg-secondary'
    }))
  }, [referenceGroup, groups])


  const moveGroupOptions = useMemo(() => {

    return [

      ...groups,

      {

        id: 'ungrouped',

        title: '移出当前分组',

        description: '将图片移到未分组区域',

        images: ungroupedImages

      }

    ]

  }, [groups, ungroupedImages])



  const findGroupContainingImage = useCallback((imageId) => {

    if (!project?.imageGroups) return null

    return project.imageGroups.find(group =>

      (group.imageIds || []).includes(imageId)

    ) || null

  }, [project])



  // 添加图片并尝试读取 PNG metadata
  const addImageWithMetadata = useCallback(async (file) => {
    // 先提取 PNG metadata（如果是PNG文件）
    let extractedPrompt = ''
    if (file.type === 'image/png') {
      try {
        const metadata = await extractPngMetadata(file)
        const prompt = extractPromptFromMetadata(metadata)
        if (prompt) {
          extractedPrompt = prompt
          console.log('✓ 从 PNG 提取到 prompt:', prompt.substring(0, 100) + '...')
        }
      } catch (error) {
        console.error('提取 PNG metadata 失败:', error)
      }
    }
    
    // 上传图片，如果提取到了 prompt 就一起发送
    const imageId = await addImageToProject(projectId, file, extractedPrompt)
    
    return imageId
  }, [projectId, addImageToProject])

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
      // 检查事件目标是否在文本输入框中编辑中文
      const target = e.target
      const isTextInput = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement
      
      // 如果是文本输入框且正在进行中文组合输入，则忽略快捷键
      if (isTextInput && target.closest && target.closest('[data-composing="true"]')) {
        return
      }
      
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
              // 1. 先将图片正常添加到项目（未分组区域）
              const newImage = await addImageWithMetadata(file);
              console.log('图片粘贴完成，已添加到未分组区域');

              // 2. 如果鼠标正悬停在一个有效的分组上，则立即将其移动到该分组
              if (newImage && hoveredGroupId && hoveredGroupId !== 'ungrouped') {
                console.log(`✓ 检测到悬停分组，立即移动图片到: ${hoveredGroupId}`);
                await addImageToGroup(projectId, hoveredGroupId, newImage.id);
                console.log(`✓ 图片已成功移动到分组`);
              }

            } catch (error) {
              console.error('粘贴并移动图片失败:', error)
              alert(`粘贴图片失败: ${error.message}`);
            }
          }
          
          // 1秒后重置标志
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
  }, [addImageWithMetadata, hoveredGroupId, addImageToGroup, projectId])

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

  const handleCreateGroup = async () => {
    try {
      const pageGroups = groups.filter(g => g.title.match(/第 (\d+) 页/));
      const nextNum = pageGroups.length + 1;
      const newTitle = `第 ${nextNum} 页`;
      await createImageGroup(projectId, newTitle, '')
    } catch (error) {
      console.error('创建分组失败:', error)
      alert('创建分组失败，请重试')
    }
  }

  const handleInsertGroup = () => {
    setShowInsertSelector(true);
  };

  const handleSelectInsertLocation = async (afterGroupId) => {
    try {
      await insertImageGroup(projectId, afterGroupId);
    } catch (error) {
      console.error('插入分组失败:', error);
      alert('插入分组失败，请重试');
    } finally {
      setShowInsertSelector(false);
    }
  };

  const handleUpdateGroup = async (groupId, updatedGroup) => {
    try {
      await updateImageGroup(projectId, groupId, updatedGroup)
    } catch (error) {
      console.error('更新分组失败:', error)
    }
  }

  const handleDeleteGroup = async (groupId) => {
    try {
      await deleteImageGroup(projectId, groupId)
    } catch (error) {
      console.error('删除分组失败:', error)
      alert('删除分组失败，请重试')
    }
  }

  const handleMoveToGroup = (imageId) => {
    setSelectedImageId(imageId)
    setShowGroupSelector(true)
  }

  const handleSelectGroup = async (groupId) => {

    if (selectedImageId) {

      try {

        if (groupId === 'ungrouped') {

          const currentGroup = findGroupContainingImage(selectedImageId)

          if (currentGroup) {

            await removeImageFromGroup(projectId, currentGroup.id, selectedImageId)

            console.log('图片已移出分组')

          }

        } else {

          await addImageToGroup(projectId, groupId, selectedImageId)

          console.log('图片已移动到分组')

        }

        setShowGroupSelector(false)

        setSelectedImageId(null)

      } catch (error) {

        console.error('移动图片失败:', error)

        alert('移动图片失败，请重试')

      }

    }

  }



  const handleDragStart = (e, imageId) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('imageId', imageId)
    setDraggingImageId(imageId)
  }

  const handleDragEnd = () => {
    setDraggingImageId(null)
  }

  const handleDrop = async (groupId, imageId) => {

    if (!imageId) return



    try {

      if (groupId === 'ungrouped') {

        const currentGroup = findGroupContainingImage(imageId)

        if (!currentGroup) return

        await removeImageFromGroup(projectId, currentGroup.id, imageId)

        console.log('图片已移出分组')

      } else {

        const currentGroup = findGroupContainingImage(imageId)

        if (currentGroup?.id === groupId) return

        await addImageToGroup(projectId, groupId, imageId)

        console.log('图片已拖拽到分组')

      }

    } catch (error) {

      console.error('移动图片失败:', error)

      alert('移动图片失败，请重试')

    }

  }

  // 处理txt文件导入
  const handleImportText = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.txt'
    
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return
      
      try {
        const text = await file.text()
        
        if (!hasPageMarkers(text)) {
          alert('未检测到页码标记（如"第一页"、"第1页"），请检查文件格式')
          return
        }
        
        const parsedGroups = parsePageText(text)
        
        if (parsedGroups.length === 0) {
          alert('无法解析文件内容或内容过短，请检查格式')
          return
        }
        
        const confirmed = window.confirm(
          `检测到 ${parsedGroups.length} 个有效页面内容，将更新或创建对应的分组。是否继续？`
        )
        
        if (!confirmed) return
        
        let updatedCount = 0
        let createdCount = 0
        
        for (const groupData of parsedGroups) {
          try {
            // 标准化导入的标题和已有的标题进行比较
            const normalizedImportTitle = normalizeGroupTitle(groupData.title);
            const existingGroup = groups.find(g => normalizeGroupTitle(g.title) === normalizedImportTitle)
            
            if (existingGroup) {
              // 更新已有分组
              await updateImageGroup(projectId, existingGroup.id, { description: groupData.description })
              updatedCount++
            } else {
              // 创建新分组
              await createImageGroup(projectId, groupData.title, groupData.description)
              createdCount++
            }
          } catch (error) {
            console.error(`处理分组"${groupData.title}"失败:`, error)
          }
        }
        
        alert(`✓ 导入完成！\n- ${updatedCount} 个分组已更新\n- ${createdCount} 个分组已创建`)
      } catch (error) {
        console.error('导入文件失败:', error)
        alert('导入文件失败，请重试')
      }
    }
    
    input.click()
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

        <Button
          variant="primary"
          size="small"
          onClick={handleCreateGroup}
        >
          ➕ 新建分组
        </Button>

        <Button
          variant="secondary"
          size="small"
          onClick={handleInsertGroup}
        >
          ↳ 插入分组
        </Button>

        <Button
          variant="secondary"
          size="small"
          onClick={handleImportText}
          title="从txt文件导入剧本，自动按页创建或更新分组"
        >
          📄 导入剧本
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
            {/* 显示所有分组 */}
            {displayGroups.map(group => {
              const isReferenceGroup = group.id === 'ungrouped'
              return (
              <ImageGroup
                key={group.id}
                group={group}
                projectId={projectId}
                onUpdateGroup={isReferenceGroup ? () => {} : handleUpdateGroup}
                onDeleteGroup={isReferenceGroup ? () => {} : handleDeleteGroup}
                onPromptChange={handlePromptChange}
                onDeleteImage={handleDeleteImage}
                onMoveToGroup={handleMoveToGroup}
                onDrop={handleDrop}
                draggable={true}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onMouseEnter={() => setHoveredGroupId(group.id)}
                onMouseLeave={() => setHoveredGroupId(null)}
              />
            )})}
          </div>
        )}
      </main>

      {/* 分组选择对话框 */}
      {showGroupSelector && (
        <GroupSelector
          groups={moveGroupOptions}
          onSelect={handleSelectGroup}
          onClose={() => {
            setShowGroupSelector(false)
            setSelectedImageId(null)
          }}
        />
      )}

      {/* 插入位置选择对话框 */}
      {showInsertSelector && (
        <GroupSelector
          groups={[{ id: 'start', title: '在所有分组之前' }, ...groups]}
          onSelect={handleSelectInsertLocation}
          onClose={() => setShowInsertSelector(false)}
          title="选择插入位置"
          selectButtonText="在此之后插入"
        />
      )}
    </div>
  )
}
