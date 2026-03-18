import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { dataDir } from '../config.js'
import type { GenerateProvider, ImageOpts, VideoOpts, GenerateResult } from './base.js'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'google/gemini-3-pro-image-preview'

export class NanoBananaProvider implements GenerateProvider {
  readonly name = 'nanobanana'
  readonly supportsImage = true
  readonly supportsVideo = false

  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async generateImage(opts: ImageOpts): Promise<GenerateResult> {
    const { prompt, workId, filename } = opts

    try {
      const res = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3271',
        },
        body: JSON.stringify({
          model: MODEL,
          modalities: ['text', 'image'],
          messages: [
            {
              role: 'user',
              content: [{ type: 'text', text: prompt }],
            },
          ],
        }),
      })

      if (!res.ok) {
        const errBody = await res.text()
        return { success: false, error: `OpenRouter API error ${res.status}: ${errBody}`, code: 'API_ERROR' }
      }

      const data = await res.json() as any
      const content = data.choices?.[0]?.message?.content

      if (!content) {
        return { success: false, error: 'No content in response', code: 'API_ERROR' }
      }

      // Extract base64 image data from response
      // Content can be a string or an array of content parts
      let base64Data: string | null = null
      let mimeType = 'image/png'

      if (typeof content === 'string') {
        // Look for data URL in text
        const match = content.match(/data:(image\/[^;]+);base64,([A-Za-z0-9+/=]+)/)
        if (match) {
          mimeType = match[1]
          base64Data = match[2]
        }
      } else if (Array.isArray(content)) {
        for (const part of content) {
          if (part.type === 'image_url' && part.image_url?.url) {
            const match = part.image_url.url.match(/data:(image\/[^;]+);base64,(.+)/)
            if (match) {
              mimeType = match[1]
              base64Data = match[2]
              break
            }
          }
          // Also check for inline_data format
          if (part.type === 'image' && part.source?.data) {
            base64Data = part.source.data
            mimeType = part.source.media_type ?? 'image/png'
            break
          }
          // Check for text content with embedded base64
          if (part.type === 'text' && typeof part.text === 'string') {
            const textMatch = part.text.match(/data:(image\/[^;]+);base64,([A-Za-z0-9+/=]+)/)
            if (textMatch) {
              mimeType = textMatch[1]
              base64Data = textMatch[2]
              break
            }
          }
        }
      }

      if (!base64Data) {
        return { success: false, error: 'No image data found in response', code: 'API_ERROR' }
      }

      const buffer = Buffer.from(base64Data, 'base64')
      const assetPath = join(dataDir, 'works', workId, 'assets', 'images', filename)
      const dir = assetPath.substring(0, assetPath.lastIndexOf('/'))
      await mkdir(dir, { recursive: true })
      await writeFile(assetPath, buffer)

      return {
        success: true,
        assetPath,
        previewUrl: `/api/works/${workId}/assets/images/${filename}`,
      }
    } catch (err: any) {
      return { success: false, error: err.message, code: 'API_ERROR' }
    }
  }

  async generateVideo(_opts: VideoOpts): Promise<GenerateResult> {
    return {
      success: false,
      error: 'NanoBanana provider does not support video generation',
      code: 'INVALID_PARAMS',
    }
  }
}
