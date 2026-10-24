import {
  AlertCircleIcon,
  ServerCrashIcon,
  SpinnerIcon,
  InfoIcon,
} from './Icons'
import { BOT_CHAIN_CONFIG } from '../config/network'

// 1. Empty State
interface EmptyStateProps {
  onSelectSample: (hash: string) => void
}

export function EmptyState({ onSelectSample }: EmptyStateProps) {
  return (
    <section className="state-card empty-state" aria-label="Instructions">
      <div className="state-icon-circle empty-icon-wrap">
        <InfoIcon width={28} height={28} />
      </div>

      <h2 className="state-title">No Transaction Selected</h2>
      <p className="state-desc">
        Paste a 32-byte transaction hash from {BOT_CHAIN_CONFIG.networkName} in the
        input above and click <strong>Search</strong> to query the live RPC for
        execution status, gas metrics, and fee breakdown.
      </p>

      <div className="empty-specs-box">
        <div className="specs-header">Network & Format Requirements:</div>
        <ul className="specs-list">
          <li>
            Target Network: <strong>{BOT_CHAIN_CONFIG.networkName}</strong> (Chain ID: <code>{BOT_CHAIN_CONFIG.chainId}</code>)
          </li>
          <li>
            RPC Endpoint: <code>{BOT_CHAIN_CONFIG.rpcUrl}</code>
          </li>
          <li>
            Hash Format: <code>0x</code> followed by 64 hexadecimal characters (66 chars total)
          </li>
        </ul>
      </div>

      <div className="sample-hashes-prompt">
        <span className="sample-prompt-label">Try a confirmed live Bohr Testnet transaction:</span>
        <div className="sample-chips">
          <button
            type="button"
            className="sample-chip live-chip"
            onClick={() =>
              onSelectSample(
                '0x9076c062d2e0b69cf93785c3117a7183143c10d31dbd43ddca3894e1f4eaa2cb',
              )
            }
          >
            <span className="network-dot" /> Live Bohr Testnet Tx
          </button>
        </div>
      </div>
    </section>
  )
}

// 2. Loading State
interface LoadingStateProps {
  message?: string
}

export function LoadingState({ message }: LoadingStateProps) {
  return (
    <section
      className="state-card loading-state"
      role="status"
      aria-label="Querying Bohr Testnet"
    >
      <div className="loading-spinner-wrap">
        <SpinnerIcon width={40} height={40} />
      </div>
      <h2 className="state-title">
        {message || `Querying ${BOT_CHAIN_CONFIG.networkName}...`}
      </h2>
      <p className="state-desc">
        Fetching transaction payload and receipt logs from {BOT_CHAIN_CONFIG.rpcUrl}
      </p>

      {/* Clean receipt skeleton to give responsive developer-tool feedback */}
      <div className="skeleton-card" aria-hidden="true">
        <div className="skeleton-line skeleton-title" />
        <div className="skeleton-line skeleton-sub" />
        <div className="skeleton-grid">
          <div className="skeleton-box" />
          <div className="skeleton-box" />
          <div className="skeleton-box" />
          <div className="skeleton-box" />
        </div>
      </div>
    </section>
  )
}

// 4. Invalid Hash State
interface InvalidHashStateProps {
  message: string
  rawInput: string
  onReset: () => void
}

export function InvalidHashState({
  message,
  rawInput,
  onReset,
}: InvalidHashStateProps) {
  return (
    <section
      className="state-card error-state invalid-hash-state"
      role="alert"
      aria-label="Invalid Transaction Hash"
    >
      <div className="state-icon-circle invalid-icon-wrap">
        <AlertCircleIcon width={30} height={30} />
      </div>

      <h2 className="state-title text-rose">Invalid Transaction Hash</h2>
      <p className="state-desc">{message}</p>

      <div className="raw-input-preview">
        <span className="raw-label">Input received:</span>
        <code className="raw-value break-all">
          {rawInput ? `"${rawInput}"` : '<empty string>'}
        </code>
        <span className="raw-meta">
          Length: {rawInput.length} chars (required: 66)
        </span>
      </div>

      <div className="state-actions">
        <button type="button" className="action-btn secondary-btn" onClick={onReset}>
          Clear and Try Again
        </button>
      </div>
    </section>
  )
}

// 5. Not Found State
interface NotFoundStateProps {
  hash: string
  onRetry: () => void
}

export function NotFoundState({ hash, onRetry }: NotFoundStateProps) {
  return (
    <section
      className="state-card not-found-state"
      role="alert"
      aria-label="Transaction Not Found"
    >
      <div className="state-icon-circle notfound-icon-wrap">
        <AlertCircleIcon width={30} height={30} />
      </div>

      <h2 className="state-title">Transaction Not Found</h2>
      <p className="state-desc">
        No transaction matching this hash was returned by {BOT_CHAIN_CONFIG.networkName} RPC.
      </p>

      <div className="searched-hash-box">
        <span className="box-sub">Searched Hash:</span>
        <span className="hash-mono break-all">{hash}</span>
      </div>

      <div className="not-found-reasons">
        <span className="reasons-title">Possible causes:</span>
        <ul>
          <li>The transaction has not yet reached the RPC node or was dropped.</li>
          <li>The transaction was replaced or cancelled with higher gas fees.</li>
          <li>The hash belongs to another blockchain or mainnet.</li>
        </ul>
      </div>

      <div className="state-actions">
        <button type="button" className="action-btn primary-btn" onClick={onRetry}>
          Re-query RPC
        </button>
      </div>
    </section>
  )
}

// 6. General RPC Error State
interface RpcErrorStateProps {
  hash?: string
  errorMessage: string
  onRetry: () => void
}

export function RpcErrorState({
  hash,
  errorMessage,
  onRetry,
}: RpcErrorStateProps) {
  return (
    <section
      className="state-card rpc-error-state"
      role="alert"
      aria-label="RPC Connection Error"
    >
      <div className="state-icon-circle rpc-icon-wrap">
        <ServerCrashIcon width={30} height={30} />
      </div>

      <h2 className="state-title text-rose">RPC / Network Error</h2>
      <p className="state-desc">
        Unable to communicate with the {BOT_CHAIN_CONFIG.networkName} JSON-RPC node.
      </p>

      <div className="rpc-error-details">
        <div className="error-code-badge">RPC FAILURE</div>
        <div className="error-message-text">{errorMessage}</div>
        {hash && (
          <div className="searched-hash-line">
            Target Hash: <code className="break-all">{hash}</code>
          </div>
        )}
        <div className="searched-hash-line">
          Endpoint: <code>{BOT_CHAIN_CONFIG.rpcUrl}</code> (Chain ID {BOT_CHAIN_CONFIG.chainId})
        </div>
      </div>

      <div className="state-actions">
        <button type="button" className="action-btn primary-btn" onClick={onRetry}>
          Retry Request
        </button>
      </div>
    </section>
  )
}
