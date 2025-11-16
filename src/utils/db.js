// Minimal IndexedDB helpers for storing image blobs
// Store name: 'sd-prompt-db', Object store: 'images'

const DB_NAME = 'sd-prompt-db'
const DB_VERSION = 1
const STORE_IMAGES = 'images'

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_IMAGES)) {
        db.createObjectStore(STORE_IMAGES)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function putImage(id, fileOrBlob) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_IMAGES, 'readwrite')
    const store = tx.objectStore(STORE_IMAGES)
    const req = store.put(fileOrBlob, id)
    req.onsuccess = () => resolve(true)
    req.onerror = () => reject(req.error)
  })
}

export async function getImage(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_IMAGES, 'readonly')
    const store = tx.objectStore(STORE_IMAGES)
    const req = store.get(id)
    req.onsuccess = () => resolve(req.result || null)
    req.onerror = () => reject(req.error)
  })
}

export async function deleteImageFromDB(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_IMAGES, 'readwrite')
    const store = tx.objectStore(STORE_IMAGES)
    const req = store.delete(id)
    req.onsuccess = () => resolve(true)
    req.onerror = () => reject(req.error)
  })
}

export async function clearAllImages() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_IMAGES, 'readwrite')
    const store = tx.objectStore(STORE_IMAGES)
    const req = store.clear()
    req.onsuccess = () => resolve(true)
    req.onerror = () => reject(req.error)
  })
}
