const chineseToArabicMap = {
  '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
  '十一': 11, '十二': 12, '十三': 13, '十四': 14, '十五': 15, '十六': 16, '十七': 17, '十八': 18, '十九': 19,
};

function convertChineseNumber(numStr) {
  if (chineseToArabicMap[numStr]) {
    return chineseToArabicMap[numStr];
  }
  // 简单处理 "二十" "三十" 等
  if (numStr.startsWith('十')) return 10 + (chineseToArabicMap[numStr[1]] || 0);
  if (numStr.endsWith('十')) {
      if (numStr.length === 2) return chineseToArabicMap[numStr[0]] * 10;
      return 10;
  }
  if (numStr.includes('十')) {
      const parts = numStr.split('十');
      return (chineseToArabicMap[parts[0]] || 1) * 10 + (chineseToArabicMap[parts[1]] || 0);
  }
  return null;
}

function normalizePageNumber(numStr) {
  const arabicNum = parseInt(numStr, 10);
  if (!isNaN(arabicNum)) {
    return arabicNum;
  }
  const converted = convertChineseNumber(numStr);
  if (converted !== null) {
    return converted;
  }
  return numStr; // Fallback
}

export function normalizeGroupTitle(title) {
  if (typeof title !== 'string') return title;
  const match = title.match(/第\s*([一二三四五六七八九十\d]+)\s*页/);
  if (match && match[1]) {
    const normalizedNumber = normalizePageNumber(match[1]);
    return `第 ${normalizedNumber} 页`;
  }
  return title;
}

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
    
    const pageNumberStr = currentMatch[1]
    const startIndex = currentMatch.index + currentMatch[0].length
    const endIndex = nextMatch ? nextMatch.index : text.length
    
    // 提取该页的内容
    let content = text.substring(startIndex, endIndex).trim()
    
    // 过滤掉内容太短的（少于10个字符），可能是误匹配
    if (content.length < 10) {
      continue
    }
    
    const normalizedNumber = normalizePageNumber(pageNumberStr);

    groups.push({
      title: `第 ${normalizedNumber} 页`,
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
