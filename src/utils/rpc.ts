import { BOT_CHAIN_CONFIG } from '../config/network.ts'
import type { TransactionResult, TransactionStatus } from '../types/transaction.ts'

export interface RpcTransaction {
  hash: string
  from: string
  to: string | null
  blockNumber: string | null
  gas: string
  gasPrice?: string
  value: string
  nonce: string
  input?: string
  maxFeePerGas?: string
  maxPriorityFeePerGas?: string
}

export interface RpcTransactionReceipt {
  transactionHash: string
  blockNumber: string
  from: string
  to: string | null
  contractAddress: string | null
  cumulativeGasUsed: string
  gasUsed: string
  effectiveGasPrice?: string
  status: string // '0x1' | '0x0'
  logs: unknown[]
}

interface JsonRpcResponse<T> {
  jsonrpc: string
  id: number | string
  result?: T
  error?: {
    code: number
    message: string
    data?: unknown
  }
}

/**
 * Sends a JSON-RPC 2.0 POST request to the configured Bohr Testnet RPC.
 */
export async function postJsonRpc<T>(
  method: string,
  params: unknown[] = [],
  timeoutMs = 12000,
): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(BOT_CHAIN_CONFIG.rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method,
        params,
        id: Date.now(),
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(
        `RPC HTTP ${response.status} ${response.statusText || 'Error'} from ${BOT_CHAIN_CONFIG.rpcUrl}`,
      )
    }

    const data: JsonRpcResponse<T> = await response.json()

    if (data.error) {
      throw new Error(
        `JSON-RPC Error [${data.error.code}]: ${data.error.message || 'Unknown node error'}`,
      )
    }

    if (data.result === undefined) {
      throw new Error(`RPC node returned no result payload for method "${method}".`)
    }

    return data.result
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        throw new Error(
          `RPC request timed out after ${timeoutMs / 1000}s while calling "${method}" at ${BOT_CHAIN_CONFIG.rpcUrl}`,
        )
      }
      throw err
    }
    throw new Error(`Failed to communicate with RPC at ${BOT_CHAIN_CONFIG.rpcUrl}`)
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Verifies that the connected RPC endpoint is Bohr Testnet (Chain ID 968).
 */
export async function verifyChainId(): Promise<{
  verified: boolean
  chainId: number
  error?: string
}> {
  try {
    const chainIdHex = await postJsonRpc<string>('eth_chainId')
    const chainId = Number(BigInt(chainIdHex))

    if (chainId !== BOT_CHAIN_CONFIG.chainId) {
      return {
        verified: false,
        chainId,
        error: `Network mismatch: Connected to Chain ID ${chainId}, but required Chain ID is ${BOT_CHAIN_CONFIG.chainId} (${BOT_CHAIN_CONFIG.networkName}).`,
      }
    }

    return {
      verified: true,
      chainId,
    }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Unable to query eth_chainId from RPC'
    return {
      verified: false,
      chainId: 0,
      error: `Chain ID verification failed: ${message}`,
    }
  }
}

/**
 * Fetches transaction details and receipt from Bohr Testnet.
 */
export async function fetchTransactionAndReceipt(hash: string): Promise<{
  tx: RpcTransaction | null
  receipt: RpcTransactionReceipt | null
}> {
  // Query transaction payload
  const tx = await postJsonRpc<RpcTransaction | null>(
    'eth_getTransactionByHash',
    [hash],
  )

  if (!tx) {
    return { tx: null, receipt: null }
  }

  // Query transaction receipt (null if still pending in mempool)
  let receipt: RpcTransactionReceipt | null = null
  try {
    receipt = await postJsonRpc<RpcTransactionReceipt | null>(
      'eth_getTransactionReceipt',
      [hash],
    )
  } catch {
    // If receipt query fails while tx exists, treat as unconfirmed / pending
    receipt = null
  }

  return { tx, receipt }
}

/**
 * Formats a BigInt Wei amount into a human-readable BOT string with zero precision loss.
 */
export function formatWeiToBot(wei: bigint): string {
  const divisor = 10n ** 18n
  const integerPart = wei / divisor
  const remainder = wei % divisor

  if (remainder === 0n) {
    return `${integerPart.toString()} ${BOT_CHAIN_CONFIG.currencySymbol}`
  }

  const remainderStr = remainder.toString().padStart(18, '0')
  const trimmed = remainderStr.replace(/0+$/, '')
  return `${integerPart.toString()}.${trimmed} ${BOT_CHAIN_CONFIG.currencySymbol}`
}

/**
 * Maps actual Bohr Testnet RPC responses into the UI TransactionResult format.
 */
export function mapRpcToTransactionResult(
  tx: RpcTransaction,
  receipt: RpcTransactionReceipt | null,
): TransactionResult {
  const isPending = !receipt || tx.blockNumber === null

  let status: TransactionStatus
  if (isPending) {
    status = 'pending'
  } else if (receipt.status === '0x1') {
    status = 'success'
  } else {
    status = 'failed'
  }

  // Recipient address or "Contract creation" when null
  let toAddress: string
  if (tx.to && tx.to !== '0x') {
    toAddress = tx.to
  } else {
    toAddress = 'Contract creation'
  }

  // Block number
  const blockHex = receipt?.blockNumber ?? tx.blockNumber
  const blockNumber = blockHex ? Number(BigInt(blockHex)) : null

  // Gas used calculation
  let gasUsedStr = 'Unavailable'
  let gasLimitStr = 'Unavailable'

  if (tx.gas) {
    gasLimitStr = `${BigInt(tx.gas).toLocaleString()} gas`
  }

  if (receipt?.gasUsed) {
    const gasUsedBigInt = BigInt(receipt.gasUsed)
    if (tx.gas) {
      const gasLimitBigInt = BigInt(tx.gas)
      const percent =
        gasLimitBigInt > 0n
          ? ((Number(gasUsedBigInt) / Number(gasLimitBigInt)) * 100).toFixed(1)
          : null
      gasUsedStr = `${gasUsedBigInt.toLocaleString()} gas${
        percent ? ` (${percent}% of limit)` : ''
      }`
    } else {
      gasUsedStr = `${gasUsedBigInt.toLocaleString()} gas`
    }
  } else if (isPending) {
    gasUsedStr = 'Unavailable'
  }

  // Transaction fee calculation:
  // gasUsed × effectiveGasPrice when available, otherwise gasUsed × gasPrice from transaction
  let transactionFeeStr = 'Unavailable'
  if (receipt?.gasUsed) {
    const gasUsedBigInt = BigInt(receipt.gasUsed)
    const priceHex = receipt.effectiveGasPrice ?? tx.gasPrice ?? null

    if (priceHex) {
      const feeWei = gasUsedBigInt * BigInt(priceHex)
      transactionFeeStr = formatWeiToBot(feeWei)
    }
  } else if (isPending) {
    transactionFeeStr = 'Unavailable'
  }

  // Native Value
  let valueStr = 'Unavailable'
  if (tx.value !== undefined && tx.value !== null && tx.value !== '') {
    valueStr = formatWeiToBot(BigInt(tx.value))
  }

  // Nonce
  const nonce = tx.nonce ? Number(BigInt(tx.nonce)) : undefined

  // Explanation adhering strictly to guidelines:
  // "Do not infer a failure reason from status alone. Explain that the transaction failed but its exact cause is not established."
  let explanation: string
  if (status === 'success') {
    explanation = blockNumber !== null
      ? `Transaction execution succeeded (status 0x1) and was confirmed in block #${blockNumber.toLocaleString()} on Bohr Testnet.`
      : `Transaction execution succeeded (status 0x1) on Bohr Testnet.`
  } else if (status === 'failed') {
    explanation = blockNumber !== null
      ? `Transaction execution failed (status 0x0). The transaction was mined into block #${blockNumber.toLocaleString()}, but EVM execution reverted. The exact failure reason is not established from receipt status alone.`
      : `Transaction execution failed (status 0x0). EVM execution reverted, but the exact failure reason is not established from receipt status alone.`
  } else {
    explanation = `Transaction is currently pending in the Bohr Testnet mempool. It has not yet been confirmed into a block, so execution receipt and final gas metrics remain unavailable.`
  }

  return {
    hash: tx.hash,
    status,
    from: tx.from || 'Unavailable',
    to: toAddress,
    blockNumber,
    gasUsed: gasUsedStr,
    gasLimit: gasLimitStr,
    transactionFee: transactionFeeStr,
    explanation,
    value: valueStr,
    nonce,
    contractAddress: receipt?.contractAddress ?? null,
    isMock: false, // Genuine live RPC result!
  }
}
