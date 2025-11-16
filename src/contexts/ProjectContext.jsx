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

  // 创建项目
  const createProject = async (name, description = '') => {
    try {
      const newProject = await apiClient.createProject(name, description)
      setProjects(prev => [...prev, newProject])
      return newProject
    } catch (error) {
      console.error('创建项目失败:', error)
      throw error
    }
  }

  // 删除项目
  const deleteProject = async (projectId) => {
    try {
      await apiClient.deleteProject(projectId)
      setProjects(prev => prev.filter(p => p.id !== projectId))
    } catch (error) {
      console.error('删除项目失败:', error)
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

  // 添加图片到项目
  const addImageToProject = async (projectId, file, prompt = '') => {
    try {
      const imageId = await apiClient.addImageToProject(projectId, file, prompt)
      await loadProjects() // 重新加载以获取最新数据
      return imageId
    } catch (error) {
      console.error('添加图片失败:', error)
      throw error
    }
  }

  // 更新图片 prompt
  const updateImagePrompt = async (projectId, imageId, prompt) => {
    try {
      // 记录旧值用于撤销
      const project = projects.find(p => p.id === projectId)
      const image = project?.images.find(img => img.id === imageId)
      if (image) {
        setHistory(prev => [...prev, {
          type: 'UPDATE_PROMPT',
          projectId,
          imageId,
          oldPrompt: image.prompt,
          newPrompt: prompt,
          timestamp: Date.now()
        }])
      }

      await apiClient.updateImagePrompt(projectId, imageId, prompt)
      
      // 立即更新本地状态
      setProjects(prev =>
        prev.map(p =>
          p.id === projectId
            ? {
                ...p,
                images: p.images.map(img =>
                  img.id === imageId ? { ...img, prompt } : img
                )
              }
            : p
        )
      )
    } catch (error) {
      console.error('更新 prompt 失败:', error)
      throw error
    }
  }

  // 删除图片
  const deleteImage = async (projectId, imageId) => {
    try {
      // 记录被删除的图片用于撤销
      const project = projects.find(p => p.id === projectId)
      const image = project?.images.find(img => img.id === imageId)
      if (image) {
        setHistory(prev => [...prev, {
          type: 'DELETE_IMAGE',
          projectId,
          image: { ...image },
          imageIndex: project.images.findIndex(img => img.id === imageId),
          timestamp: Date.now()
        }])
      }

      await apiClient.deleteImage(projectId, imageId)
      
      // 立即更新本地状态
      setProjects(prev =>
        prev.map(p => {
          if (p.id === projectId) {
            return { ...p, images: p.images.filter(img => img.id !== imageId) }
          }
          return p
        })
      )
    } catch (error) {
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
    createProject,
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
