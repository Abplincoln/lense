import type { TransactionResult } from '../types/transaction.ts'
import { BOT_CHAIN_CONFIG } from '../config/network.ts'

export function generateTransactionSummary(tx: TransactionResult): string {
  const blockDisplay =
    tx.blockNumber !== null
      ? `#${tx.blockNumber.toLocaleString()}`
      : 'Unavailable'

  const lines = [
    `========================================`,
    `LENSE - BOT CHAIN TRANSACTION SUMMARY`,
    `========================================`,
    `Network:         ${BOT_CHAIN_CONFIG.networkName} (Chain ID ${BOT_CHAIN_CONFIG.chainId})`,
    `Status:          ${tx.status.toUpperCase()}`,
    `Transaction:     ${tx.hash}`,
    `Block Number:    ${blockDisplay}`,
    `From:            ${tx.from}`,
    `To:              ${tx.to}`,
    `Gas Used:        ${tx.gasUsed}`,
    `Transaction Fee: ${tx.transactionFee}`,
    `Value:           ${tx.value || 'Unavailable'}`,
    `Nonce:           ${tx.nonce !== undefined ? tx.nonce.toString() : 'Unavailable'}`,
    `Explanation:     ${tx.explanation}`,
    `========================================`,
  ]

  // ONLY append mock warning if the fixture is explicitly flagged as a mock
  if (tx.isMock) {
    lines.splice(
      lines.length - 1,
      0,
      `----------------------------------------`,
      `[Note: Simulated mock data fixture - not a live RPC query]`,
    )
  }

  return lines.join('\n')
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Fallback below
  }

  try {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    const successful = document.execCommand('copy')
    document.body.removeChild(textArea)
    return successful
  } catch (err) {
    console.error('Failed to copy to clipboard', err)
    return false
  }
}
