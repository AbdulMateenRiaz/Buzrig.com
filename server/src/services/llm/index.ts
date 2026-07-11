export { llmChat, getOpenAI } from './client.js'
export { generateRemediation } from './remediation-generator.js'
export { analyzeAttackChains } from './attack-chain-analyzer.js'
export { generatePoC } from './poc-generator.js'
export {
  REMEDIATION_SYSTEM_PROMPT,
  ATTACK_CHAIN_SYSTEM_PROMPT,
  POC_SYSTEM_PROMPT,
  buildRemediationPrompt,
  buildAttackChainPrompt,
} from './prompts.js'
