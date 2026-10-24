import type { TransactionResult } from '../types/transaction'

export const MOCK_SUCCESS_TX: TransactionResult = {
  hash: '0x4a82bf398d57e3f8924b11f0082c9a6234190cbbce9e94b29bb88a294871e84a',
  status: 'success',
  from: '0x71C84166208d8871599e7428549306b864a75369',
  to: '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5',
  blockNumber: 14839201,
  gasUsed: '48,290 gas (48.3% of limit)',
  gasLimit: '100,000 gas',
  transactionFee: '0.000966 BOT',
  explanation: 'Transaction execution succeeded (status 0x1) and was confirmed in block #14,839,201.',
  value: '25.5 BOT',
  nonce: 42,
  isMock: true,
}

export const MOCK_FAILED_TX: TransactionResult = {
  hash: '0x7b1c34a2e5d896172084cba36f90d1829e2f694125c13b78041a38910488cd51',
  status: 'failed',
  from: '0x8892d9d970e5b7fb6a12b9a7f34791e84323e201',
  to: '0x2c608f1b98a0029837d7a228c89b09a72173f081',
  blockNumber: 14839188,
  gasUsed: '150,000 gas (100.0% of limit)',
  gasLimit: '150,000 gas',
  transactionFee: '0.0045 BOT',
  explanation: 'Transaction execution failed (status 0x0). The transaction was mined into block #14,839,188, but EVM execution reverted. The exact failure reason is not established from receipt status alone.',
  value: '0 BOT',
  nonce: 19,
  isMock: true,
}

export const MOCK_PENDING_TX: TransactionResult = {
  hash: '0x3f91a123bc894567def0123456789abc0123456789abcdef0123456789abcdef',
  status: 'pending',
  from: '0x43d3ad4f50b7621ca77e5f08df5a1e40c4b0df22',
  to: '0x1204ad4be6d75c62550571f3ead025efe7ca3099',
  blockNumber: null,
  gasUsed: 'Unavailable (Pending in mempool)',
  gasLimit: '120,000 gas',
  transactionFee: 'Unavailable (Pending)',
  explanation: 'Transaction is currently pending in the Bohr Testnet mempool. It has not yet been confirmed into a block, so execution receipt and final gas metrics remain unavailable.',
  value: '1.25 BOT',
  nonce: 5,
  isMock: true,
}

export interface DemoPreset {
  label: string
  description: string
  hash: string
  action: 'live_sample' | 'mock_success' | 'mock_failed' | 'mock_pending' | 'invalid' | 'not_found' | 'rpc_error'
}

export const DEMO_PRESETS: DemoPreset[] = [
  {
    label: 'Live Bohr Tx',
    description: 'Queries live confirmed transaction on Bohr Testnet',
    hash: '0x9076c062d2e0b69cf93785c3117a7183143c10d31dbd43ddca3894e1f4eaa2cb',
    action: 'live_sample',
  },
  {
    label: 'Fixture: Success',
    description: 'Demonstrates offline mock success result',
    hash: MOCK_SUCCESS_TX.hash,
    action: 'mock_success',
  },
  {
    label: 'Fixture: Failed',
    description: 'Demonstrates offline mock failed result',
    hash: MOCK_FAILED_TX.hash,
    action: 'mock_failed',
  },
  {
    label: 'Fixture: Pending',
    description: 'Demonstrates offline mock pending result',
    hash: MOCK_PENDING_TX.hash,
    action: 'mock_pending',
  },
  {
    label: 'Test: Invalid Hash',
    description: 'Tests format validation rejection',
    hash: '0x1234badhash',
    action: 'invalid',
  },
]
