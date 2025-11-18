/**
 * 解析包含分页name的文本文件
 * 提取"第X页"标记之间的内容，创建分组数据结构
 * 
 * @param {string} text - 完整的文本内容
 * @returns {Array} 分组数组，每个元素包含 {title, description}
 */
export function parsePageText(text) {
  const groups = []
  
  // 匹配"第X页"的正则表达式（支持数字和中文数字）
  const pageRegex = /第([一二三四五六七八九十\d]+)页/g
  
  // 找到所有页码标记的位置
  const matches = [...text.matchAll(pageRegex)]
  
  if (matches.length === 0) {
    console.warn('未找到任何页码标记（如"第一页"、"第1页"）')
    return groups
  }
  
  // 提取每一页的内容
  for (let i = 0; i < matches.length; i++) {
    const currentMatch = matches[i]
    const nextMatch = matches[i + 1]
    
    const pageNumber = currentMatch[1]
    const startIndex = currentMatch.index + currentMatch[0].length
    const endIndex = nextMatch ? nextMatch.index : text.length
    
    // 提取该页的内容
    let content = text.substring(startIndex, endIndex).trim()
    
    // 过滤掉内容太短的（少于10个字符），可能是误匹配
    if (content.length < 10) {
      continue
    }
    
    groups.push({
      title: `第${pageNumber}页`,
      description: content
    })
  }
  
  return groups
}

/**
 * 验证文本是否包含有效的页码标记
 * @param {string} text - 要验证的文本
 * @returns {boolean} 是否包含页码标记
 */
export function hasPageMarkers(text) {
  const pageRegex = /第([一二三四五六七八九十\d]+)页/
  return pageRegex.test(text)
}

/**
 * 获取文本中检测到的页数
 * @param {string} text - 要分析的文本
 * @returns {number} 检测到的页数
 */
export function getPageCount(text) {
  const pageRegex = /第([一二三四五六七八九十\d]+)页/g
  const matches = [...text.matchAll(pageRegex)]
  return matches.length
}
