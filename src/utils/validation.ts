/**
 * EVM 32-byte transaction hash validation.
 * Expected format: '0x' prefix followed by 64 hexadecimal characters (66 characters total).
 */
export const EVM_TX_HASH_REGEX = /^0x[0-9a-fA-F]{64}$/

export interface ValidationResult {
  isValid: boolean
  error?: string
}

export function validateTransactionHash(input: string): ValidationResult {
  const trimmed = input.trim()

  if (!trimmed) {
    return {
      isValid: false,
      error: 'Transaction hash cannot be empty. Please enter a 32-byte BOT Chain transaction hash.',
    }
  }

  if (!trimmed.startsWith('0x') && !trimmed.startsWith('0X')) {
    return {
      isValid: false,
      error: `Missing "0x" prefix. BOT Chain transaction hashes must start with "0x" (received: "${trimmed.slice(0, 8)}...").`,
    }
  }

  if (trimmed.length !== 66) {
    return {
      isValid: false,
      error: `Invalid length: Expected 66 characters (0x + 64 hex characters), but got ${trimmed.length} characters.`,
    }
  }

  if (!EVM_TX_HASH_REGEX.test(trimmed)) {
    return {
      isValid: false,
      error: 'Invalid characters: The transaction hash contains non-hexadecimal characters. Only 0-9 and a-f (case insensitive) are allowed.',
    }
  }

  return { isValid: true }
}

export function isEvmTxHash(input: string): boolean {
  return EVM_TX_HASH_REGEX.test(input.trim())
}
