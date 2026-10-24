import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  mapRpcToTransactionResult,
  formatWeiToBot,
  verifyChainId,
  fetchTransactionAndReceipt,
  type RpcTransaction,
  type RpcTransactionReceipt,
} from '../src/utils/rpc.ts'
import { validateTransactionHash } from '../src/utils/validation.ts'
import { generateTransactionSummary } from '../src/utils/clipboard.ts'
import { BOT_CHAIN_CONFIG } from '../src/config/network.ts'

describe('Lense Final QA Test Suite', () => {
  describe('1. EVM Hash Validation', () => {
    it('rejects empty input without RPC calls', () => {
      const res = validateTransactionHash('')
      assert.equal(res.isValid, false)
      assert.match(res.error || '', /empty/)
    })

    it('rejects input missing 0x prefix', () => {
      const res = validateTransactionHash('4a82bf398d57e3f8924b11f0082c9a6234190cbbce9e94b29bb88a294871e84a')
      assert.equal(res.isValid, false)
      assert.match(res.error || '', /0x/)
    })

    it('rejects input with wrong length', () => {
      const res = validateTransactionHash('0x1234')
      assert.equal(res.isValid, false)
      assert.match(res.error || '', /length/i)
    })

    it('rejects input with non-hex characters', () => {
      const badHex = '0x' + 'z'.repeat(64)
      const res = validateTransactionHash(badHex)
      assert.equal(res.isValid, false)
      assert.match(res.error || '', /non-hexadecimal/i)
    })

    it('accepts valid 66-character EVM hash', () => {
      const validHash = '0x9076c062d2e0b69cf93785c3117a7183143c10d31dbd43ddca3894e1f4eaa2cb'
      const res = validateTransactionHash(validHash)
      assert.equal(res.isValid, true)
    })
  })

  describe('2. Precision BigInt Arithmetic (Zero Precision Loss)', () => {
    it('formats 0 wei correctly', () => {
      assert.equal(formatWeiToBot(0n), '0 BOT')
    })

    it('formats smallest unit (1 wei = 10^-18 BOT) without float truncation', () => {
      assert.equal(formatWeiToBot(1n), '0.000000000000000001 BOT')
    })

    it('formats 1 full BOT (10^18 wei)', () => {
      assert.equal(formatWeiToBot(1000000000000000000n), '1 BOT')
    })

    it('formats Bohr testnet transaction fee correctly (46617 gas * 20 Gwei)', () => {
      const gasUsed = 46617n
      const price = 20000000000n
      const feeWei = gasUsed * price
      assert.equal(formatWeiToBot(feeWei), '0.00093234 BOT')
    })
  })

  describe('3. Result Mapping: Success Status 0x1', () => {
    const mockTx: RpcTransaction = {
      hash: '0x9076c062d2e0b69cf93785c3117a7183143c10d31dbd43ddca3894e1f4eaa2cb',
      from: '0x53d3ad4f50b7621ca77e5f08df5a1e40c4b0df34',
      to: '0xf704ad4be6d75c62550571f3ead025efe7ca30d1',
      blockNumber: '0x1a94f28',
      gas: '0xf1d0',
      value: '0x0',
      nonce: '0x219',
    }

    const mockReceipt: RpcTransactionReceipt = {
      transactionHash: mockTx.hash,
      blockNumber: '0x1a94f28',
      from: mockTx.from,
      to: mockTx.to,
      contractAddress: null,
      cumulativeGasUsed: '0xb619',
      gasUsed: '0xb619',
      effectiveGasPrice: '0x4a817c800',
      status: '0x1',
      logs: [],
    }

    it('maps status 0x1 to success and calculates correct fee', () => {
      const res = mapRpcToTransactionResult(mockTx, mockReceipt)
      assert.equal(res.status, 'success')
      assert.equal(res.hash, mockTx.hash)
      assert.equal(res.from, mockTx.from)
      assert.equal(res.to, mockTx.to)
      assert.equal(res.blockNumber, 27873064)
      assert.equal(res.transactionFee, '0.00093234 BOT')
      assert.equal(res.isMock, false)
      assert.match(res.explanation, /succeeded \(status 0x1\)/)
    })
  })

  describe('4. Result Mapping: Failed Status 0x0 (Neutral Revert Reason)', () => {
    const mockFailedTx: RpcTransaction = {
      hash: '0x2222222222222222222222222222222222222222222222222222222222222222',
      from: '0x1111111111111111111111111111111111111111',
      to: '0x3333333333333333333333333333333333333333',
      blockNumber: '0x100',
      gas: '0x30d40',
      value: '0x0',
      nonce: '0x1',
    }

    const mockFailedReceipt: RpcTransactionReceipt = {
      transactionHash: mockFailedTx.hash,
      blockNumber: '0x100',
      from: mockFailedTx.from,
      to: mockFailedTx.to,
      contractAddress: null,
      cumulativeGasUsed: '0x30d40',
      gasUsed: '0x30d40',
      effectiveGasPrice: '0x4a817c800',
      status: '0x0',
      logs: [],
    }

    it('maps status 0x0 to failed and does NOT invent a speculative failure reason', () => {
      const res = mapRpcToTransactionResult(mockFailedTx, mockFailedReceipt)
      assert.equal(res.status, 'failed')
      assert.match(res.explanation, /failed \(status 0x0\)/)
      assert.match(res.explanation, /exact failure reason is not established/i)
    })
  })

  describe('5. Result Mapping: Pending Transaction (No Receipt)', () => {
    const mockPendingTx: RpcTransaction = {
      hash: '0x3333333333333333333333333333333333333333333333333333333333333333',
      from: '0x1111111111111111111111111111111111111111',
      to: '0x4444444444444444444444444444444444444444',
      blockNumber: null,
      gas: '0x186a0',
      value: '0xde0b6b3a7640000', // 1 BOT
      nonce: '0xa',
    }

    it('maps transaction without receipt to pending with Unavailable for block, gasUsed, and fee', () => {
      const res = mapRpcToTransactionResult(mockPendingTx, null)
      assert.equal(res.status, 'pending')
      assert.equal(res.blockNumber, null)
      assert.equal(res.gasUsed, 'Unavailable')
      assert.equal(res.transactionFee, 'Unavailable')
      assert.match(res.explanation, /pending in the Bohr Testnet mempool/i)
    })
  })

  describe('6. Result Mapping: Contract Creation & Missing Optional Fields', () => {
    const mockCreationTx: RpcTransaction = {
      hash: '0x4444444444444444444444444444444444444444444444444444444444444444',
      from: '0x1111111111111111111111111111111111111111',
      to: null, // Contract creation
      blockNumber: '0x200',
      gas: '0x50000',
      value: '0x0',
      nonce: '0x2',
    }

    const mockCreationReceipt: RpcTransactionReceipt = {
      transactionHash: mockCreationTx.hash,
      blockNumber: '0x200',
      from: mockCreationTx.from,
      to: null,
      contractAddress: '0x9999999999999999999999999999999999999999',
      cumulativeGasUsed: '0x20000',
      gasUsed: '0x20000',
      effectiveGasPrice: '0x4a817c800',
      status: '0x1',
      logs: [],
    }

    it('displays "Contract creation" when recipient is null', () => {
      const res = mapRpcToTransactionResult(mockCreationTx, mockCreationReceipt)
      assert.equal(res.to, 'Contract creation')
    })

    it('displays Unavailable when optional fields are null or missing', () => {
      const emptyTx: RpcTransaction = {
        hash: '0x5555555555555555555555555555555555555555555555555555555555555555',
        from: '',
        to: null,
        blockNumber: null,
        gas: '',
        value: '',
        nonce: '',
      }
      const res = mapRpcToTransactionResult(emptyTx, null)
      assert.equal(res.from, 'Unavailable')
      assert.equal(res.to, 'Contract creation')
      assert.equal(res.gasUsed, 'Unavailable')
      assert.equal(res.transactionFee, 'Unavailable')
      assert.equal(res.value, 'Unavailable')
    })
  })

  describe('7. Summary Generation & Clipboard Copy', () => {
    it('generates summary matching displayed fields without mock disclaimer for genuine results', () => {
      const mockResult = mapRpcToTransactionResult(
        {
          hash: '0x9076c062d2e0b69cf93785c3117a7183143c10d31dbd43ddca3894e1f4eaa2cb',
          from: '0x53d3ad4f50b7621ca77e5f08df5a1e40c4b0df34',
          to: '0xf704ad4be6d75c62550571f3ead025efe7ca30d1',
          blockNumber: '0x1a94f28',
          gas: '0xf1d0',
          value: '0x0',
          nonce: '0x219',
        },
        {
          transactionHash: '0x9076c062d2e0b69cf93785c3117a7183143c10d31dbd43ddca3894e1f4eaa2cb',
          blockNumber: '0x1a94f28',
          from: '0x53d3ad4f50b7621ca77e5f08df5a1e40c4b0df34',
          to: '0xf704ad4be6d75c62550571f3ead025efe7ca30d1',
          contractAddress: null,
          cumulativeGasUsed: '0xb619',
          gasUsed: '0xb619',
          effectiveGasPrice: '0x4a817c800',
          status: '0x1',
          logs: [],
        },
      )

      const summary = generateTransactionSummary(mockResult)
      assert.match(summary, /SUCCESS/)
      assert.match(summary, /0x9076c062d2e0b69cf93785c3117a7183143c10d31dbd43ddca3894e1f4eaa2cb/)
      assert.match(summary, /#27,873,064/)
      assert.match(summary, /0x53d3ad4f50b7621ca77e5f08df5a1e40c4b0df34/)
      assert.match(summary, /0xf704ad4be6d75c62550571f3ead025efe7ca30d1/)
      assert.match(summary, /0.00093234 BOT/)
      // Must NOT contain mock disclaimer for genuine result
      assert.equal(summary.includes('mock data fixture'), false)
    })
  })

  describe('8. Live Bohr Testnet RPC Integration', () => {
    it('verifies live endpoint Chain ID is 968', async () => {
      const res = await verifyChainId()
      assert.equal(res.verified, true)
      assert.equal(res.chainId, BOT_CHAIN_CONFIG.chainId)
    })

    it('queries live test transaction and receives confirmed status', async () => {
      const hash = '0x9076c062d2e0b69cf93785c3117a7183143c10d31dbd43ddca3894e1f4eaa2cb'
      const { tx, receipt } = await fetchTransactionAndReceipt(hash)

      assert.notEqual(tx, null)
      assert.notEqual(receipt, null)
      assert.equal(tx?.hash, hash)
      assert.equal(receipt?.status, '0x1')
      assert.equal(receipt?.blockNumber, '0x1a94f28')

      const mapped = mapRpcToTransactionResult(tx!, receipt)
      assert.equal(mapped.status, 'success')
      assert.equal(mapped.blockNumber, 27873064)
      assert.equal(mapped.transactionFee, '0.00093234 BOT')
    })

    it('returns null for an unmined / unknown transaction hash', async () => {
      const unknownHash = '0x1111111111111111111111111111111111111111111111111111111111111111'
      const { tx } = await fetchTransactionAndReceipt(unknownHash)
      assert.equal(tx, null)
    })
  })
})
