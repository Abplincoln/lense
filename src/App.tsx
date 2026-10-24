import { useState, useEffect, useCallback, useRef } from 'react'
import './App.css'
import { Header } from './components/Header'
import { SearchBox } from './components/SearchBox'
import { ResultCard } from './components/ResultCard'
import {
  EmptyState,
  LoadingState,
  InvalidHashState,
  NotFoundState,
  RpcErrorState,
} from './components/StateViews'
import { DemoToolbar } from './components/DemoToolbar'
import { validateTransactionHash } from './utils/validation'
import {
  verifyChainId,
  fetchTransactionAndReceipt,
  mapRpcToTransactionResult,
} from './utils/rpc'
import { BOT_CHAIN_CONFIG } from './config/network'
import {
  MOCK_SUCCESS_TX,
  MOCK_FAILED_TX,
  MOCK_PENDING_TX,
  type DemoPreset,
} from './data/mockTransactions'
import type { ViewState } from './types/transaction'

export function App() {
  const [inputHash, setInputHash] = useState<string>('')
  const [viewState, setViewState] = useState<ViewState>({ type: 'idle' })
  const [isChainVerified, setIsChainVerified] = useState<boolean>(false)
  const [verificationError, setVerificationError] = useState<string | null>(null)
  const activeSearchIdRef = useRef<number>(0)

  // Verify Bohr Testnet endpoint (Chain ID 968) on startup
  useEffect(() => {
    let isMounted = true
    verifyChainId().then((result) => {
      if (!isMounted) return
      if (result.verified) {
        setIsChainVerified(true)
        setVerificationError(null)
      } else {
        setIsChainVerified(false)
        const errorMsg =
          result.error ||
          `Endpoint verification failed: RPC did not return Chain ID ${BOT_CHAIN_CONFIG.chainId}.`
        setVerificationError(errorMsg)
      }
    })
    return () => {
      isMounted = false
    }
  }, [])

  const checkEndpointVerification = useCallback(async (): Promise<boolean> => {
    const result = await verifyChainId()
    if (result.verified) {
      setIsChainVerified(true)
      setVerificationError(null)
      return true
    } else {
      setIsChainVerified(false)
      const errorMsg =
        result.error ||
        `Endpoint verification failed: RPC did not return Chain ID ${BOT_CHAIN_CONFIG.chainId}.`
      setVerificationError(errorMsg)
      return false
    }
  }, [])

  // Real RPC Search Handler
  const handleSearch = async (hashToQuery: string) => {
    const trimmed = hashToQuery.trim()

    // Increment search token to prevent race conditions from concurrent or stale requests
    const searchId = ++activeSearchIdRef.current

    // 1. Validate EVM 32-byte hash format BEFORE sending any RPC request
    const validation = validateTransactionHash(trimmed)
    if (!validation.isValid) {
      setViewState({
        type: 'invalid_hash',
        message: validation.error || 'Invalid 32-byte EVM transaction hash.',
        rawInput: trimmed,
      })
      return
    }

    // 2. Set loading state
    setViewState({
      type: 'loading',
      message: `Querying ${BOT_CHAIN_CONFIG.networkName} for ${trimmed.slice(0, 10)}...`,
    })

    // 3. Ensure Chain ID 968 is verified before processing live lookup
    if (!isChainVerified) {
      const verified = await checkEndpointVerification()
      if (searchId !== activeSearchIdRef.current) return

      if (!verified) {
        setViewState({
          type: 'rpc_error',
          hash: trimmed,
          errorMessage:
            verificationError ||
            `Cannot lookup transaction: RPC at ${BOT_CHAIN_CONFIG.rpcUrl} failed Chain ID 968 verification.`,
          canRetry: true,
        })
        return
      }
    }

    // 4. Execute real JSON-RPC queries to Bohr Testnet
    try {
      const { tx, receipt } = await fetchTransactionAndReceipt(trimmed)
      if (searchId !== activeSearchIdRef.current) return

      // Transaction lookup returned null
      if (!tx) {
        setViewState({
          type: 'not_found',
          hash: trimmed,
        })
        return
      }

      // Map actual RPC responses into transaction result
      const mappedResult = mapRpcToTransactionResult(tx, receipt)
      setViewState({
        type: 'result',
        data: mappedResult,
      })
    } catch (err: unknown) {
      if (searchId !== activeSearchIdRef.current) return

      const errorMessage =
        err instanceof Error
          ? err.message
          : `Failed to fetch transaction from ${BOT_CHAIN_CONFIG.rpcUrl}`
      setViewState({
        type: 'rpc_error',
        hash: trimmed,
        errorMessage,
        canRetry: true,
      })
    }
  }

  const handleClear = () => {
    activeSearchIdRef.current++
    setInputHash('')
    setViewState({ type: 'idle' })
  }

  const handleSelectSample = (hash: string) => {
    setInputHash(hash)
    handleSearch(hash)
  }

  const handleSelectPreset = (preset: DemoPreset) => {
    activeSearchIdRef.current++
    setInputHash(preset.hash)

    switch (preset.action) {
      case 'live_sample':
        // Real RPC query for the live Bohr Testnet transaction
        handleSearch(preset.hash)
        break

      case 'mock_success':
        setViewState({
          type: 'result',
          data: MOCK_SUCCESS_TX,
        })
        break

      case 'mock_failed':
        setViewState({
          type: 'result',
          data: MOCK_FAILED_TX,
        })
        break

      case 'mock_pending':
        setViewState({
          type: 'result',
          data: MOCK_PENDING_TX,
        })
        break

      case 'invalid': {
        const validation = validateTransactionHash(preset.hash)
        setViewState({
          type: 'invalid_hash',
          message: validation.error || 'Invalid transaction hash.',
          rawInput: preset.hash,
        })
        break
      }
    }
  }

  const handleSetStateDirectly = (
    stateType:
      | 'idle'
      | 'loading'
      | 'mock_success'
      | 'mock_failed'
      | 'mock_pending'
      | 'invalid'
      | 'not_found'
      | 'rpc_error',
  ) => {
    activeSearchIdRef.current++
    switch (stateType) {
      case 'idle':
        setInputHash('')
        setViewState({ type: 'idle' })
        break

      case 'loading':
        setViewState({
          type: 'loading',
          message: 'Querying Bohr Testnet (Simulated Loader)...',
        })
        break

      case 'mock_success':
        setInputHash(MOCK_SUCCESS_TX.hash)
        setViewState({ type: 'result', data: MOCK_SUCCESS_TX })
        break

      case 'mock_failed':
        setInputHash(MOCK_FAILED_TX.hash)
        setViewState({ type: 'result', data: MOCK_FAILED_TX })
        break

      case 'mock_pending':
        setInputHash(MOCK_PENDING_TX.hash)
        setViewState({ type: 'result', data: MOCK_PENDING_TX })
        break

      case 'invalid': {
        const badHash = '0x1234badhash'
        setInputHash(badHash)
        const validation = validateTransactionHash(badHash)
        setViewState({
          type: 'invalid_hash',
          message: validation.error || 'Invalid transaction hash format.',
          rawInput: badHash,
        })
        break
      }

      case 'not_found': {
        const missingHash =
          '0x0000000000000000000000000000000000000000000000000000000000000404'
        setInputHash(missingHash)
        setViewState({
          type: 'not_found',
          hash: missingHash,
        })
        break
      }

      case 'rpc_error': {
        const errHash =
          '0x0000000000000000000000000000000000000000000000000000000000000500'
        setInputHash(errHash)
        setViewState({
          type: 'rpc_error',
          hash: errHash,
          errorMessage:
            'RPC node connection timed out (ETIMEDOUT) at https://rpc.bohr.life',
          canRetry: true,
        })
        break
      }
    }
  }

  const isLoading = viewState.type === 'loading'

  return (
    <div className="lense-app">
      <div className="app-container">
        {/* Main Header with Live Network Status */}
        <Header isVerified={isChainVerified} error={verificationError} />

        {/* Development Toolbar with clearly isolated offline fixtures */}
        <DemoToolbar
          onSelectPreset={handleSelectPreset}
          onSetStateDirectly={handleSetStateDirectly}
        />

        {/* Single Transaction Hash Input & Search Button */}
        <main className="main-content">
          <SearchBox
            value={inputHash}
            onChange={setInputHash}
            onSearch={handleSearch}
            onClear={handleClear}
            isLoading={isLoading}
          />

          {/* Dynamic View State Render */}
          <div className="view-stage">
            {viewState.type === 'idle' && (
              <EmptyState onSelectSample={handleSelectSample} />
            )}

            {viewState.type === 'loading' && (
              <LoadingState message={viewState.message} />
            )}

            {viewState.type === 'result' && (
              <ResultCard transaction={viewState.data} />
            )}

            {viewState.type === 'invalid_hash' && (
              <InvalidHashState
                message={viewState.message}
                rawInput={viewState.rawInput}
                onReset={handleClear}
              />
            )}

            {viewState.type === 'not_found' && (
              <NotFoundState
                hash={viewState.hash}
                onRetry={() => handleSearch(viewState.hash)}
              />
            )}

            {viewState.type === 'rpc_error' && (
              <RpcErrorState
                hash={viewState.hash}
                errorMessage={viewState.errorMessage}
                onRetry={() => {
                  if (viewState.hash) {
                    handleSearch(viewState.hash)
                  } else {
                    checkEndpointVerification()
                  }
                }}
              />
            )}
          </div>
        </main>

        {/* Developer-Tool Footer */}
        <footer className="app-footer">
          <div className="footer-line">
            <span>Lense • {BOT_CHAIN_CONFIG.networkName} (Chain ID {BOT_CHAIN_CONFIG.chainId})</span>
            <span className="footer-separator">•</span>
            <span>RPC: {BOT_CHAIN_CONFIG.rpcUrl}</span>
            <span className="footer-separator">•</span>
            <span>
              Status:{' '}
              {isChainVerified ? (
                <strong style={{ color: 'var(--color-success)' }}>Connected</strong>
              ) : (
                <strong style={{ color: 'var(--color-failed)' }}>Connecting / Offline</strong>
              )}
            </span>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default App
