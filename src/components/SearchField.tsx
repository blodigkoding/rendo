import { useEffect, useRef } from 'react';
import { CloseIcon, SearchIcon } from './icons';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoFocus?: boolean;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onFocus?: () => void;
  'aria-label': string;
}

export function SearchField({
  value,
  onChange,
  placeholder,
  autoFocus,
  onKeyDown,
  onFocus,
  ...rest
}: Props) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Autofokus kun på pekerenheter med tastatur – ellers spretter mobiltastaturet opp.
    if (autoFocus && window.matchMedia('(min-width: 768px)').matches) {
      ref.current?.focus();
    }
  }, [autoFocus]);

  return (
    <div className="search">
      <span className="search__icon">
        <SearchIcon />
      </span>
      <input
        ref={ref}
        type="search"
        inputMode="search"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        aria-label={rest['aria-label']}
      />
      {value && (
        <button className="search__clear" onClick={() => onChange('')} aria-label="Tøm søk" type="button">
          <CloseIcon />
        </button>
      )}
    </div>
  );
}
