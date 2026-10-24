export type TransactionStatus = 'success' | 'failed' | 'pending'

export interface TransactionResult {
  hash: string
  status: TransactionStatus
  from: string
  to: string
  blockNumber: number | null
  gasUsed: string
  gasLimit?: string
  transactionFee: string
  explanation: string
  value?: string
  timestamp?: string
  nonce?: number
  contractAddress?: string | null
  isMock?: boolean
}

export type ViewState =
  | { type: 'idle' }
  | { type: 'loading'; message?: string }
  | { type: 'result'; data: TransactionResult }
  | { type: 'invalid_hash'; message: string; rawInput: string }
  | { type: 'not_found'; hash: string }
  | { type: 'rpc_error'; hash?: string; errorMessage: string; canRetry?: boolean }
