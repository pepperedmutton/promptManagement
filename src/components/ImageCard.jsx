import React from 'react'
import './ImageCard.css'
import { useImageURL } from '../hooks/useImageURL'

export function ImageCard({ image, onPromptChange, onDelete }) {
  const { url, loading } = useImageURL(image.id)

  return (
    <div className="image-card">
      <div className="image-card__wrapper">
        {loading ? (
          <div className="image-card__placeholder">加载中...</div>
        ) : url ? (
          <img src={url} alt="Uploaded" className="image-card__img" />
        ) : (
          <div className="image-card__placeholder">未找到图片</div>
        )}
        <button
          className="image-card__delete"
          onClick={() => onDelete(image.id)}
          title="删除图片"
        >
          ✕
        </button>
      </div>

      <div className="image-card__prompt-section">
        <label className="image-card__label">Prompt:</label>
        <textarea
          className="image-card__textarea"
          value={image.prompt}
          onChange={(e) => onPromptChange(image.id, e.target.value)}
          placeholder="输入此图片的 prompt..."
          rows={4}
        />
      </div>
    </div>
  )
}
