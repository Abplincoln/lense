import { type KeyboardEvent, type FormEvent } from 'react'
import { SearchIcon, CloseIcon, SpinnerIcon } from './Icons'

interface SearchBoxProps {
  value: string
  onChange: (val: string) => void
  onSearch: (hash: string) => void
  onClear: () => void
  isLoading: boolean
}

export function SearchBox({
  value,
  onChange,
  onSearch,
  onClear,
  isLoading,
}: SearchBoxProps) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSearch(value)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onSearch(value)
    }
  }

  const trimmedLength = value.trim().length

  return (
    <form className="search-form" onSubmit={handleSubmit} noValidate>
      <div className="search-bar-wrap">
        <div className="search-input-container">
          <span className="search-prefix-icon" aria-hidden="true">
            <SearchIcon width={18} height={18} />
          </span>

          <input
            type="text"
            className="search-input"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste BOT Chain transaction hash (0x...)"
            aria-label="Transaction Hash Input"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck="false"
            disabled={isLoading}
          />

          {value && !isLoading && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={onClear}
              title="Clear input"
              aria-label="Clear input"
            >
              <CloseIcon width={16} height={16} />
            </button>
          )}

          {isLoading && (
            <div className="search-loading-indicator">
              <SpinnerIcon width={18} height={18} />
            </div>
          )}
        </div>

        <button
          type="submit"
          className="search-submit-btn"
          disabled={isLoading || !value.trim()}
        >
          {isLoading ? (
            <>
              <SpinnerIcon width={16} height={16} />
              <span>Searching</span>
            </>
          ) : (
            <>
              <SearchIcon width={16} height={16} />
              <span>Search</span>
            </>
          )}
        </button>
      </div>

      <div className="search-helper-row">
        <span className="search-format-hint">
          Format: <code>0x</code> + 64 hex characters (32-byte EVM hash)
        </span>
        {trimmedLength > 0 && (
          <span
            className={`search-char-count ${
              trimmedLength === 66 ? 'count-match' : 'count-mismatch'
            }`}
          >
            {trimmedLength} / 66 chars
          </span>
        )}
      </div>
    </form>
  )
}
