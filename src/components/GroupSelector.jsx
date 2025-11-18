import React from 'react'
import { Button } from './Button'
import './GroupSelector.css'

export function GroupSelector({ groups, onSelect, onClose }) {
  return (
    <div className="group-selector-overlay" onClick={onClose}>
      <div className="group-selector" onClick={(e) => e.stopPropagation()}>
        <div className="group-selector__header">
          <h2 className="group-selector__title">选择目标分组</h2>
          <button className="group-selector__close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="group-selector__list">
          {groups.length === 0 ? (
            <div className="group-selector__empty">
              还没有分组，请先创建分组
            </div>
          ) : (
            groups.map(group => (
              <div
                key={group.id}
                className="group-selector__item"
                onClick={() => onSelect(group.id)}
              >
                <h3 className="group-selector__item-title">{group.title}</h3>
                <p className="group-selector__item-count">
                  {group.images?.length || 0} 张图片
                </p>
              </div>
            ))
          )}
        </div>

        <div className="group-selector__actions">
          <Button variant="ghost" size="medium" onClick={onClose}>
            取消
          </Button>
        </div>
      </div>
    </div>
  )
}
