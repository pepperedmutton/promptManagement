import React, { createContext, useContext, useEffect } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { putImage, deleteImageFromDB } from '../utils/db'

const ProjectContext = createContext(null)

export function ProjectProvider({ children }) {
  const [projects, setProjects] = useLocalStorage('sd-projects', [])

  // One-time migration: move in-memory image URLs/files to IndexedDB and strip non-serializable fields
  useEffect(() => {
    const hasLegacy = projects?.some(p => p.images?.some(img => (img && (img.url || img.file)) && !img.mime))
    if (!hasLegacy) return

    async function migrate() {
      const migrated = await Promise.all(
        projects.map(async (p) => {
          const newImages = []
          for (const img of (p.images || [])) {
            if (img && (img.url || img.file) && !img.mime) {
              try {
                let blob
                if (img.file instanceof Blob) {
                  blob = img.file
                } else if (img.url) {
                  // Attempt to fetch object URL to get blob during current session
                  blob = await fetch(img.url).then(r => r.blob())
                }
                if (blob) {
                  await putImage(String(img.id), blob)
                }
              } catch (_) {
                // ignore migration errors for individual images
              }
              // store only metadata
              newImages.push({
                id: String(img.id),
                mime: (img.file && img.file.type) || 'image/*',
                prompt: img.prompt || '',
                addedAt: img.addedAt || new Date().toISOString()
              })
            } else if (img) {
              // Already in new format
              newImages.push(img)
            }
          }
          return { ...p, images: newImages }
        })
      )
      setProjects(migrated)
    }

    migrate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Create a new project
  const createProject = (name, description = '') => {
    const newProject = {
      id: Date.now().toString(),
      name,
      description,
      createdAt: new Date().toISOString(),
      images: []
    }
    setProjects(prev => [...prev, newProject])
    return newProject
  }

  // Delete a project (cleanup indexedDB blobs)
  const deleteProject = (projectId) => {
    setProjects(prev => {
      const project = prev.find(p => p.id === projectId)
      if (project) {
        project.images.forEach(img => {
          deleteImageFromDB(img.id).catch(() => {})
        })
      }
      return prev.filter(p => p.id !== projectId)
    })
  }

  // Update project metadata
  const updateProject = (projectId, updates) => {
    setProjects(prev =>
      prev.map(p => p.id === projectId ? { ...p, ...updates } : p)
    )
  }

  // Add image to project (persist blob in IndexedDB; store metadata only)
  const addImageToProject = async (projectId, file) => {
    const imageId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    await putImage(imageId, file)
    const newImage = {
      id: imageId,
      mime: file.type,
      prompt: '',
      addedAt: new Date().toISOString()
    }

    setProjects(prev =>
      prev.map(p =>
        p.id === projectId
          ? { ...p, images: [...p.images, newImage] }
          : p
      )
    )
  }

  // Update image prompt
  const updateImagePrompt = (projectId, imageId, prompt) => {
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
  }

  // Delete image from project (and from IndexedDB)
  const deleteImage = (projectId, imageId) => {
    deleteImageFromDB(imageId).catch(() => {})
    setProjects(prev =>
      prev.map(p => {
        if (p.id === projectId) {
          return { ...p, images: p.images.filter(img => img.id !== imageId) }
        }
        return p
      })
    )
  }

  // Get project by ID
  const getProject = (projectId) => {
    return projects.find(p => p.id === projectId)
  }

  const value = {
    projects,
    createProject,
    deleteProject,
    updateProject,
    addImageToProject,
    updateImagePrompt,
    deleteImage,
    getProject
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
