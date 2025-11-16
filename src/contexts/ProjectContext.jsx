import React, { createContext, useContext, useState, useEffect } from 'react'
import { apiClient } from '../api/client'

const ProjectContext = createContext(null)

export function ProjectProvider({ children }) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState([]) // 操作历史记录

  // 加载项目数据
  useEffect(() => {
    loadProjects()
  }, [])

  // 订阅 WebSocket 更新
  useEffect(() => {
    const unsubscribe = apiClient.subscribe((data) => {
      if (data.type === 'projects-updated') {
        loadProjects()
      }
    })
    return unsubscribe
  }, [])

  async function loadProjects() {
    try {
      const data = await apiClient.getProjects()
      setProjects(data)
    } catch (error) {
      console.error('加载项目失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 打开文件夹作为项目
  const openFolder = async (folderPath, name) => {
    try {
      const newProject = await apiClient.openFolder(folderPath, name)
      setProjects(prev => {
        // 检查是否已存在
        const exists = prev.find(p => p.id === newProject.id)
        if (exists) return prev
        return [...prev, newProject]
      })
      return newProject
    } catch (error) {
      console.error('打开文件夹失败:', error)
      throw error
    }
  }

  // 创建项目（废弃）
  const createProject = async (name, description = '') => {
    throw new Error('请使用 openFolder 方法打开文件夹')
  }

  // 从列表移除项目
  const deleteProject = async (projectId) => {
    try {
      await apiClient.deleteProject(projectId)
      setProjects(prev => prev.filter(p => p.id !== projectId))
    } catch (error) {
      console.error('移除项目失败:', error)
      throw error
    }
  }

  // 更新项目
  const updateProject = async (projectId, updates) => {
    try {
      const updatedProject = await apiClient.updateProject(projectId, updates)
      setProjects(prev =>
        prev.map(p => p.id === projectId ? updatedProject : p)
      )
    } catch (error) {
      console.error('更新项目失败:', error)
      throw error
    }
  }

  // 添加图片到项目（乐观更新）
  const addImageToProject = async (projectId, file, prompt = '') => {
    // 生成临时 ID 和 blob URL 用于立即预览
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const blobUrl = URL.createObjectURL(file)
    
    const tempImage = {
      id: tempId,
      filename: file.name,
      mime: file.type,
      prompt: prompt || '',
      addedAt: new Date().toISOString(),
      isOptimistic: true, // 标记为乐观更新
      previewUrl: blobUrl  // 临时预览 URL
    }
    
    // 立即更新本地状态
    setProjects(prev =>
      prev.map(p =>
        p.id === projectId
          ? { ...p, images: [...p.images, tempImage] }
          : p
      )
    )
    
    try {
      // 发送到后端
      const response = await apiClient.addImageToProject(projectId, file, prompt)
      
      // 释放 blob URL
      URL.revokeObjectURL(blobUrl)
      
      // 后端返回后，用真实数据替换临时数据
      setProjects(prev =>
        prev.map(p =>
          p.id === projectId
            ? {
                ...p,
                images: p.images.map(img =>
                  img.id === tempId
                    ? { 
                        id: response.id, 
                        filename: response.filename,
                        mime: response.mime,
                        prompt: response.prompt,
                        addedAt: response.addedAt,
                        isOptimistic: false,
                        previewUrl: undefined
                      }
                    : img
                )
              }
            : p
        )
      )
      
      console.log('✓ 图片已保存，等待文件系统同步...')
      return response.id
    } catch (error) {
      // 失败时移除乐观更新并释放 blob URL
      URL.revokeObjectURL(blobUrl)
      setProjects(prev =>
        prev.map(p =>
          p.id === projectId
            ? { ...p, images: p.images.filter(img => img.id !== tempId) }
            : p
        )
      )
      console.error('添加图片失败:', error)
      throw error
    }
  }

  // 更新图片 prompt（乐观更新）
  const updateImagePrompt = async (projectId, imageId, prompt) => {
    // 记录旧值
    const project = projects.find(p => p.id === projectId)
    const image = project?.images.find(img => img.id === imageId)
    const oldPrompt = image?.prompt || ''
    
    if (image) {
      setHistory(prev => [...prev, {
        type: 'UPDATE_PROMPT',
        projectId,
        imageId,
        oldPrompt,
        newPrompt: prompt,
        timestamp: Date.now()
      }])
    }
    
    // 立即更新本地状态
    setProjects(prev =>
      prev.map(p =>
        p.id === projectId
          ? {
              ...p,
              images: p.images.map(img =>
                img.id === imageId
                  ? { ...img, prompt, isOptimistic: true }
                  : img
              )
            }
          : p
      )
    )

    try {
      // 发送到后端
      await apiClient.updateImagePrompt(projectId, imageId, prompt)
      
      // 移除乐观标记
      setProjects(prev =>
        prev.map(p =>
          p.id === projectId
            ? {
                ...p,
                images: p.images.map(img =>
                  img.id === imageId
                    ? { ...img, isOptimistic: false }
                    : img
                )
              }
            : p
        )
      )
      
      console.log('✓ Prompt 已保存，等待文件系统同步...')
    } catch (error) {
      // 失败时恢复旧值
      setProjects(prev =>
        prev.map(p =>
          p.id === projectId
            ? {
                ...p,
                images: p.images.map(img =>
                  img.id === imageId
                    ? { ...img, prompt: oldPrompt, isOptimistic: false }
                    : img
                )
              }
            : p
        )
      )
      console.error('更新 prompt 失败:', error)
      throw error
    }
  }

  // 删除图片（乐观更新）
  const deleteImage = async (projectId, imageId) => {
    // 记录被删除的图片
    const project = projects.find(p => p.id === projectId)
    const image = project?.images.find(img => img.id === imageId)
    const imageIndex = project?.images.findIndex(img => img.id === imageId)
    
    if (image) {
      setHistory(prev => [...prev, {
        type: 'DELETE_IMAGE',
        projectId,
        image: { ...image },
        imageIndex,
        timestamp: Date.now()
      }])
    }
    
    // 立即从本地状态移除
    setProjects(prev =>
      prev.map(p =>
        p.id === projectId
          ? { ...p, images: p.images.filter(img => img.id !== imageId) }
          : p
      )
    )

    try {
      // 发送到后端
      await apiClient.deleteImage(projectId, imageId)
      console.log('✓ 图片已删除，等待文件系统同步...')
    } catch (error) {
      // 失败时恢复图片
      if (image && imageIndex !== undefined) {
        setProjects(prev =>
          prev.map(p => {
            if (p.id === projectId) {
              const newImages = [...p.images]
              newImages.splice(imageIndex, 0, image)
              return { ...p, images: newImages }
            }
            return p
          })
        )
      }
      console.error('删除图片失败:', error)
      throw error
    }
  }

  // 撤销上一步操作
  const undo = async () => {
    if (history.length === 0) return

    const lastAction = history[history.length - 1]
    
    try {
      if (lastAction.type === 'UPDATE_PROMPT') {
        // 恢复旧的 prompt
        await apiClient.updateImagePrompt(
          lastAction.projectId,
          lastAction.imageId,
          lastAction.oldPrompt
        )
        
        setProjects(prev =>
          prev.map(p =>
            p.id === lastAction.projectId
              ? {
                  ...p,
                  images: p.images.map(img =>
                    img.id === lastAction.imageId 
                      ? { ...img, prompt: lastAction.oldPrompt } 
                      : img
                  )
                }
              : p
          )
        )
      } else if (lastAction.type === 'DELETE_IMAGE') {
        // 注意：删除操作的撤销需要重新上传文件，这里暂时不支持
        console.warn('暂不支持撤销删除操作')
        return
      }

      // 移除最后一条历史记录
      setHistory(prev => prev.slice(0, -1))
    } catch (error) {
      console.error('撤销操作失败:', error)
    }
  }

  // 获取项目
  const getProject = (projectId) => {
    return projects.find(p => p.id === projectId)
  }

  // 获取图片 URL
  const getImageUrl = (projectId, filename) => {
    return apiClient.getImageUrl(projectId, filename)
  }

  const value = {
    projects,
    loading,
    openFolder,
    createProject, // 保留但会抛出错误
    deleteProject,
    updateProject,
    addImageToProject,
    updateImagePrompt,
    deleteImage,
    getProject,
    getImageUrl,
    undo,
    canUndo: history.length > 0
  }

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  )
}

export function useProjects() {
  const context = useContext(ProjectContext)
  if (!context) {
    throw new Error('useProjects must be used within ProjectProvider')
  }
  return context
}
