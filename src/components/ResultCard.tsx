import { useState } from 'react'
import type { TransactionResult } from '../types/transaction'
import {
  CopyIcon,
  CheckIcon,
  SuccessCheckIcon,
  FailedXIcon,
  ClockIcon,
  InfoIcon,
} from './Icons'
import {
  generateTransactionSummary,
  copyToClipboard,
} from '../utils/clipboard'

interface ResultCardProps {
  transaction: TransactionResult
}

export function ResultCard({ transaction }: ResultCardProps) {
  const [copiedSummary, setCopiedSummary] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const handleCopySummary = async () => {
    const summary = generateTransactionSummary(transaction)
    const success = await copyToClipboard(summary)
    if (success) {
      setCopiedSummary(true)
      setTimeout(() => setCopiedSummary(false), 2200)
    }
  }

  const handleCopyValue = async (val: string, fieldKey: string) => {
    const success = await copyToClipboard(val)
    if (success) {
      setCopiedField(fieldKey)
      setTimeout(() => setCopiedField(null), 1800)
    }
  }

  const isSuccess = transaction.status === 'success'
  const isFailed = transaction.status === 'failed'
  const isPending = transaction.status === 'pending'
  const isMock = Boolean(transaction.isMock)

  return (
    <article className="result-card" aria-label="Transaction Result">
      {/* Prominent Mock Notice - ONLY displayed for simulated demo fixtures */}
      {isMock && (
        <div className="mock-banner" role="status">
          <InfoIcon width={16} height={16} className="mock-banner-icon" />
          <div className="mock-banner-text">
            <strong>SIMULATED DEMO FIXTURE:</strong> This result is offline mock
            data for preview purposes only. It was not retrieved from the live Bohr
            Testnet RPC.
          </div>
        </div>
      )}

      {/* Card Header */}
      <div className="result-header">
        <div className="status-badge-wrap">
          <span
            className={`status-badge ${
              isSuccess
                ? 'status-success'
                : isFailed
                  ? 'status-failed'
                  : 'status-pending'
            }`}
          >
            {isSuccess && <SuccessCheckIcon width={16} height={16} />}
            {isFailed && <FailedXIcon width={16} height={16} />}
            {isPending && <ClockIcon width={16} height={16} />}
            <span>
              {isSuccess ? 'Success' : isFailed ? 'Failed' : 'Pending'}
            </span>
          </span>

          {isMock ? (
            <span className="mock-label-pill">MOCK DATA</span>
          ) : (
            <span className="live-label-pill">
              <span className="network-dot" /> LIVE RPC
            </span>
          )}
        </div>

        <button
          type="button"
          className={`copy-summary-btn ${copiedSummary ? 'copied' : ''}`}
          onClick={handleCopySummary}
          title="Copy formatted transaction summary to clipboard"
          aria-label="Copy transaction summary to clipboard"
        >
          {copiedSummary ? (
            <>
              <CheckIcon width={15} height={15} />
              <span>Summary Copied</span>
            </>
          ) : (
            <>
              <CopyIcon width={15} height={15} />
              <span>Copy Summary</span>
            </>
          )}
        </button>
      </div>

      {/* Primary Hash Banner */}
      <div className="tx-hash-row">
        <span className="field-label">Transaction Hash</span>
        <div className="hash-value-wrap">
          <span className="hash-mono break-all">{transaction.hash}</span>
          <button
            type="button"
            className="copy-mini-btn"
            onClick={() => handleCopyValue(transaction.hash, 'hash')}
            title="Copy transaction hash"
            aria-label="Copy transaction hash"
          >
            {copiedField === 'hash' ? (
              <CheckIcon width={14} height={14} className="text-emerald" />
            ) : (
              <CopyIcon width={14} height={14} />
            )}
          </button>
        </div>
      </div>

      {/* Explanation Box */}
      <div
        className={`explanation-card ${
          isSuccess ? 'exp-success' : isFailed ? 'exp-failed' : 'exp-pending'
        }`}
      >
        <div className="explanation-title">
          <InfoIcon width={16} height={16} />
          <span>Result Explanation</span>
        </div>
        <p className="explanation-text">{transaction.explanation}</p>
      </div>

      {/* Key-Value Details Grid */}
      <div className="details-grid">
        {/* From Address */}
        <div className="detail-item">
          <span className="detail-label">From Address</span>
          <div className="address-value-wrap">
            <span className="address-mono break-all">{transaction.from}</span>
            {transaction.from !== 'Unavailable' && (
              <button
                type="button"
                className="copy-mini-btn"
                onClick={() => handleCopyValue(transaction.from, 'from')}
                title="Copy sender address"
                aria-label="Copy sender address"
              >
                {copiedField === 'from' ? (
                  <CheckIcon width={13} height={13} className="text-emerald" />
                ) : (
                  <CopyIcon width={13} height={13} />
                )}
              </button>
            )}
          </div>
        </div>

        {/* To Address / Contract Creation */}
        <div className="detail-item">
          <span className="detail-label">To Address</span>
          <div className="address-value-wrap">
            <span className="address-mono break-all">{transaction.to}</span>
            {transaction.to !== 'Contract creation' &&
              transaction.to !== 'Unavailable' && (
                <button
                  type="button"
                  className="copy-mini-btn"
                  onClick={() => handleCopyValue(transaction.to, 'to')}
                  title="Copy recipient address"
                  aria-label="Copy recipient address"
                >
                  {copiedField === 'to' ? (
                    <CheckIcon width={13} height={13} className="text-emerald" />
                  ) : (
                    <CopyIcon width={13} height={13} />
                  )}
                </button>
              )}
          </div>
        </div>

        {/* Block Number */}
        <div className="detail-item">
          <span className="detail-label">Block Number</span>
          <span className="detail-value mono">
            {transaction.blockNumber !== null
              ? `#${transaction.blockNumber.toLocaleString()}`
              : 'Unavailable'}
          </span>
        </div>

        {/* Gas Used */}
        <div className="detail-item">
          <span className="detail-label">Gas Used</span>
          <span className="detail-value mono">{transaction.gasUsed}</span>
        </div>

        {/* Transaction Fee */}
        <div className="detail-item">
          <span className="detail-label">Transaction Fee</span>
          <span className="detail-value mono highlight">
            {transaction.transactionFee}
          </span>
        </div>

        {/* Value (Native BOT) */}
        <div className="detail-item">
          <span className="detail-label">Value Transferred</span>
          <span className="detail-value mono">
            {transaction.value || 'Unavailable'}
          </span>
        </div>

        {/* Nonce */}
        <div className="detail-item">
          <span className="detail-label">Nonce</span>
          <span className="detail-value mono">
            {transaction.nonce !== undefined ? transaction.nonce.toString() : 'Unavailable'}
          </span>
        </div>
      </div>

      {/* Card Footer */}
      <div className="result-footer">
        <span className="footer-note">
          EVM Status:{' '}
          <code>
            {isSuccess
              ? '0x1 (SUCCESS)'
              : isFailed
                ? '0x0 (REVERT)'
                : 'PENDING'}
          </code>
        </span>
        {transaction.timestamp && (
          <span className="footer-timestamp">{transaction.timestamp}</span>
        )}
      </div>
    </article>
  )
}
