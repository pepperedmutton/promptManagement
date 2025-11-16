/**
 * 从 PNG 文件中提取文本块（tEXt/iTXt chunks）
 * 用于读取 Stable Diffusion 等工具保存的 prompt 信息
 */

export async function extractPngMetadata(file) {
  if (!file || file.type !== 'image/png') {
    return null
  }

  try {
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    
    // 检查 PNG 签名
    const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10]
    for (let i = 0; i < pngSignature.length; i++) {
      if (uint8Array[i] !== pngSignature[i]) {
        return null
      }
    }

    const metadata = {}
    let offset = 8 // 跳过 PNG 签名

    // 读取所有 chunks
    while (offset < uint8Array.length) {
      // 读取 chunk 长度（4 bytes, big-endian）
      const length = (uint8Array[offset] << 24) |
                     (uint8Array[offset + 1] << 16) |
                     (uint8Array[offset + 2] << 8) |
                     uint8Array[offset + 3]
      offset += 4

      // 读取 chunk 类型（4 bytes ASCII）
      const typeBytes = uint8Array.slice(offset, offset + 4)
      const type = String.fromCharCode(...typeBytes)
      offset += 4

      // 读取 chunk 数据
      const data = uint8Array.slice(offset, offset + length)
      offset += length

      // 跳过 CRC（4 bytes）
      offset += 4

      // 处理文本类型的 chunks
      if (type === 'tEXt') {
        const result = parseTEXtChunk(data)
        if (result) {
          metadata[result.keyword] = result.text
        }
      } else if (type === 'iTXt') {
        const result = parseITXtChunk(data)
        if (result) {
          metadata[result.keyword] = result.text
        }
      }

      // 遇到 IEND chunk 就停止
      if (type === 'IEND') {
        break
      }
    }

    return metadata
  } catch (error) {
    console.error('解析 PNG metadata 失败:', error)
    return null
  }
}

/**
 * 解析 tEXt chunk
 * 格式: keyword\0text
 */
function parseTEXtChunk(data) {
  try {
    // 找到 null 分隔符
    let nullIndex = 0
    while (nullIndex < data.length && data[nullIndex] !== 0) {
      nullIndex++
    }

    if (nullIndex >= data.length) return null

    const keyword = new TextDecoder('latin1').decode(data.slice(0, nullIndex))
    const text = new TextDecoder('latin1').decode(data.slice(nullIndex + 1))

    return { keyword, text }
  } catch (error) {
    return null
  }
}

/**
 * 解析 iTXt chunk
 * 格式: keyword\0compression_flag\0compression_method\0language_tag\0translated_keyword\0text
 */
function parseITXtChunk(data) {
  try {
    let offset = 0

    // 读取 keyword
    let nullIndex = offset
    while (nullIndex < data.length && data[nullIndex] !== 0) {
      nullIndex++
    }
    const keyword = new TextDecoder('latin1').decode(data.slice(offset, nullIndex))
    offset = nullIndex + 1

    // 跳过 compression flag (1 byte)
    const compressionFlag = data[offset]
    offset += 1

    // 跳过 compression method (1 byte)
    offset += 1

    // 跳过 language tag (找到下一个 null)
    while (offset < data.length && data[offset] !== 0) {
      offset++
    }
    offset += 1

    // 跳过 translated keyword (找到下一个 null)
    while (offset < data.length && data[offset] !== 0) {
      offset++
    }
    offset += 1

    // 读取文本内容
    let textData = data.slice(offset)
    
    // 如果启用了压缩，这里需要解压缩（通常 SD 图片不压缩）
    if (compressionFlag === 1) {
      // 压缩格式通常是 zlib，这里暂不处理
      console.warn('遇到压缩的 iTXt chunk，暂不支持')
      return null
    }

    const text = new TextDecoder('utf-8').decode(textData)
    return { keyword, text }
  } catch (error) {
    return null
  }
}

/**
 * 从 metadata 中提取 prompt
 * 支持多种常见的 keyword 格式
 */
export function extractPromptFromMetadata(metadata) {
  if (!metadata) return null

  // 常见的 prompt 字段名
  const promptKeys = [
    'parameters',      // Stable Diffusion WebUI
    'prompt',          // 通用
    'Description',     // 一些工具使用
    'Comment',         // PNG 标准注释
    'UserComment',     // EXIF
  ]

  for (const key of promptKeys) {
    if (metadata[key]) {
      // 如果是 parameters 字段，可能包含完整的生成参数
      if (key === 'parameters') {
        return parseSDParameters(metadata[key])
      }
      return metadata[key]
    }
  }

  return null
}

/**
 * 解析 Stable Diffusion WebUI 的 parameters 格式
 * 格式通常是: prompt\nNegative prompt: xxx\nSteps: xxx, ...
 */
function parseSDParameters(parameters) {
  try {
    const lines = parameters.split('\n')
    
    // 第一行通常是 positive prompt
    let prompt = ''
    let negativePrompt = ''
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      if (line.startsWith('Negative prompt:')) {
        negativePrompt = line.replace('Negative prompt:', '').trim()
      } else if (line.includes('Steps:') || line.includes('Sampler:')) {
        // 遇到生成参数行就停止
        break
      } else if (i === 0) {
        // 第一行是 positive prompt
        prompt = line
      }
    }

    // 组合 prompt 信息
    let result = prompt
    if (negativePrompt) {
      result += `\n\nNegative prompt: ${negativePrompt}`
    }
    
    return result || parameters
  } catch (error) {
    return parameters
  }
}
