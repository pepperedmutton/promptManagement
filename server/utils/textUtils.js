const chineseToArabicMap = {
  '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
  '十一': 11, '十二': 12, '十三': 13, '十四': 14, '十五': 15, '十六': 16, '十七': 17, '十八': 18, '十九': 19,
};

function convertChineseNumber(numStr) {
  if (chineseToArabicMap[numStr]) {
    return chineseToArabicMap[numStr];
  }
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

function normalizeGroupTitle(title) {
  if (typeof title !== 'string') return title;
  const match = title.match(/第\s*([一二三四五六七八九十\d]+)\s*页/);
  if (match && match[1]) {
    const normalizedNumber = normalizePageNumber(match[1]);
    return `第 ${normalizedNumber} 页`;
  }
  return title;
}

module.exports = { normalizeGroupTitle };
