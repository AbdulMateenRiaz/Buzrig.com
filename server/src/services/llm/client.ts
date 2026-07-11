import OpenAI from 'openai'
import { env } from '../../config/env.js'
import { logger } from '../../lib/logger.js'

let openaiClient: OpenAI | null = null

export function getOpenAI(): OpenAI {
  if (!openaiClient) {
    if (!env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured')
    }
    openaiClient = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
      timeout: 120_000, // 2 minutes for long code generation
      maxRetries: 3,
    })
  }
  return openaiClient
}

export interface LLMResponse {
  content: string
  model: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

/**
 * Send a prompt to the LLM with retry logic and error handling
 */
export async function llmChat(
  systemPrompt: string,
  userPrompt: string,
  options: { temperature?: number; maxTokens?: number; model?: string } = {}
): Promise<LLMResponse> {
  const { temperature = 0.2, maxTokens = 4096, model = 'gpt-4o' } = options
  const client = getOpenAI()

  try {
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      max_tokens: maxTokens,
    })

    const choice = response.choices[0]
    if (!choice?.message?.content) {
      throw new Error('Empty response from LLM')
    }

    return {
      content: choice.message.content,
      model: response.model,
      promptTokens: response.usage?.prompt_tokens ?? 0,
      completionTokens: response.usage?.completion_tokens ?? 0,
      totalTokens: response.usage?.total_tokens ?? 0,
    }
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      logger.error({ statusCode: error.status, message: error.message }, 'OpenAI API error')
      if (error.status === 429) {
        throw new Error('LLM rate limited — please retry in a moment')
      }
      if (error.status === 401) {
        throw new Error('Invalid OpenAI API key')
      }
    }
    throw error
  }
}
