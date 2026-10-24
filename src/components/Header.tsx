import { LensLogo } from './Icons'
import { BOT_CHAIN_CONFIG } from '../config/network'

interface HeaderProps {
  isVerified?: boolean
  error?: string | null
}

export function Header({ isVerified = true, error }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="brand-badge-row">
        <span className="network-pill" title={`RPC: ${BOT_CHAIN_CONFIG.rpcUrl}`}>
          <span className={`network-dot ${error ? 'dot-error' : isVerified ? 'dot-online' : 'dot-pending'}`} />
          {BOT_CHAIN_CONFIG.networkName}
        </span>
        <span className="chain-id-pill">
          Chain ID {BOT_CHAIN_CONFIG.chainId}
        </span>
        <span className="rpc-live-pill">JSON-RPC</span>
      </div>

      <div className="brand-title-wrap">
        <div className="brand-logo-container">
          <LensLogo className="brand-logo" width={38} height={38} />
        </div>
        <h1 className="brand-title">Lense</h1>
      </div>

      <p className="brand-tagline">Understand your BOT Chain transaction.</p>
    </header>
  )
}
