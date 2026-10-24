import { DEMO_PRESETS, type DemoPreset } from '../data/mockTransactions'

interface DemoToolbarProps {
  onSelectPreset: (preset: DemoPreset) => void
  onSetStateDirectly: (
    stateType: 'idle' | 'loading' | 'mock_success' | 'mock_failed' | 'mock_pending' | 'invalid' | 'not_found' | 'rpc_error',
  ) => void
}

export function DemoToolbar({
  onSelectPreset,
  onSetStateDirectly,
}: DemoToolbarProps) {
  return (
    <div className="demo-toolbar" aria-label="Development Toolbar">
      <div className="demo-toolbar-header">
        <span className="demo-toolbar-title">
          <span className="pulse-dot" /> Quick Actions & Offline Fixtures
        </span>
        <span className="demo-toolbar-caption">
          Search bar performs LIVE Bohr Testnet (Chain ID 968) queries
        </span>
      </div>

      <div className="demo-preset-buttons">
        <button
          type="button"
          className="demo-btn state-btn-live"
          onClick={() => onSelectPreset(DEMO_PRESETS[0])}
          title="Query live confirmed transaction on Bohr Testnet"
        >
          ⚡ Live Bohr Tx
        </button>

        <button
          type="button"
          className="demo-btn state-btn-idle"
          onClick={() => onSetStateDirectly('idle')}
          title="Reset to Empty State"
        >
          Empty State
        </button>

        <button
          type="button"
          className="demo-btn state-btn-loading"
          onClick={() => onSetStateDirectly('loading')}
          title="Preview Loading State"
        >
          Loading State
        </button>

        <button
          type="button"
          className="demo-btn state-btn-success"
          onClick={() => onSelectPreset(DEMO_PRESETS[1])}
          title="Fixture: Success"
        >
          Fixture: Success
        </button>

        <button
          type="button"
          className="demo-btn state-btn-failed"
          onClick={() => onSelectPreset(DEMO_PRESETS[2])}
          title="Fixture: Failed"
        >
          Fixture: Failed
        </button>

        <button
          type="button"
          className="demo-btn state-btn-pending"
          onClick={() => onSelectPreset(DEMO_PRESETS[3])}
          title="Fixture: Pending"
        >
          Fixture: Pending
        </button>

        <button
          type="button"
          className="demo-btn state-btn-invalid"
          onClick={() => onSelectPreset(DEMO_PRESETS[4])}
          title="Test: Invalid Hash Format"
        >
          Invalid Hash
        </button>
      </div>
    </div>
  )
}
