import { useState, useRef, useEffect, useId } from 'react';

export interface LocationComboboxProps {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  suggestions?: string[];
  placeholder?: string;
  isDropoff?: boolean;
  pickupReference?: string;
  helperText?: string;
  required?: boolean;
  className?: string;
}

export default function LocationCombobox({
  id,
  label,
  value,
  onChange,
  suggestions = [],
  placeholder,
  isDropoff = false,
  pickupReference = '',
  helperText,
  required = false,
  className = '',
}: LocationComboboxProps) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedItemRef = useRef<HTMLButtonElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [showAllHubs, setShowAllHubs] = useState(true);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-scroll to selected hub when dropdown opens
  useEffect(() => {
    if (isOpen && selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [isOpen]);

  const trimmedValue = value.trim();
  const query = trimmedValue.toLowerCase();

  // Check if current value matches an official hub
  const isOfficialHub = suggestions.some(
    loc => loc.toLowerCase() === trimmedValue.toLowerCase()
  );

  // Check if drop-off is currently configured as "Same as pick-up"
  const isSameAsPickup =
    isDropoff &&
    (!trimmedValue ||
      (pickupReference &&
        trimmedValue.toLowerCase() === pickupReference.trim().toLowerCase()));

  // A custom address is typed when value is not empty, not an official hub, and (if dropoff) not empty
  const isCustomAddress = Boolean(trimmedValue && !isOfficialHub && !(isDropoff && isSameAsPickup));

  // Determine whether to show all suggestions or filter them
  // If value is empty, matches an official hub, or user clicked toggle/browse all, show ALL options!
  const shouldShowAll = !trimmedValue || isOfficialHub || showAllHubs;

  const filteredSuggestions = shouldShowAll
    ? suggestions
    : suggestions.filter(loc => loc.toLowerCase().includes(query));

  // Helper to extract a friendly region / tag badge for each hub
  function getHubTag(hubName: string): string {
    const lower = hubName.toLowerCase();
    if (lower.includes('airport')) return '✈ Airport';
    if (lower.includes('railway') || lower.includes('station')) return '🚆 Rail Station';
    if (lower.includes('mumbai') || lower.includes('bandra') || lower.includes('andheri') || lower.includes('juhu') || lower.includes('thane') || lower.includes('powai') || lower.includes('colaba') || lower.includes('dadar') || lower.includes('panvel')) return 'Mumbai / MMR';
    if (lower.includes('pune') || lower.includes('hinjewadi') || lower.includes('baner') || lower.includes('wakad') || lower.includes('kothrud')) return 'Pune';
    if (lower.includes('goa')) return 'Goa';
    if (lower.includes('nashik')) return 'Nashik';
    if (lower.includes('nagpur')) return 'Nagpur';
    if (lower.includes('aurangabad') || lower.includes('sambhajinagar')) return 'Aurangabad';
    if (lower.includes('shirdi')) return 'Shirdi';
    if (lower.includes('kolhapur')) return 'Kolhapur';
    if (lower.includes('lonavala')) return 'Lonavala';
    if (lower.includes('alibaug')) return 'Alibaug';
    return 'DriveNow Hub';
  }

  // Build the list of selectable items for keyboard navigation
  type DropdownItem =
    | { type: 'same_as_pickup'; label: string; value: string }
    | { type: 'custom'; label: string; value: string }
    | { type: 'hub'; label: string; value: string };

  const dropdownItems: DropdownItem[] = [];

  if (isDropoff) {
    dropdownItems.push({
      type: 'same_as_pickup',
      label: `Same as pick-up (${pickupReference || 'Selected pick-up hub'})`,
      value: '',
    });
  }

  if (trimmedValue && !isOfficialHub) {
    dropdownItems.push({
      type: 'custom',
      label: `Use custom address: "${trimmedValue}"`,
      value: trimmedValue,
    });
  }

  filteredSuggestions.forEach(hub => {
    dropdownItems.push({
      type: 'hub',
      label: hub,
      value: hub,
    });
  });

  function handleSelect(itemValue: string) {
    onChange(itemValue);
    setIsOpen(false);
    setShowAllHubs(true);
    setHighlightedIndex(-1);
  }

  function handleClear() {
    onChange('');
    setIsOpen(true);
    setShowAllHubs(true);
    setHighlightedIndex(-1);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setIsOpen(true);
        setShowAllHubs(true);
        setHighlightedIndex(0);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev =>
        prev < dropdownItems.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev =>
        prev > 0 ? prev - 1 : dropdownItems.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < dropdownItems.length) {
        handleSelect(dropdownItems[highlightedIndex].value);
      } else {
        // Confirm whatever user currently typed
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  }

  return (
    <div ref={containerRef} className={`relative space-y-1 ${className}`}>
      {/* Label & Status Badge Bar */}
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={inputId} className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <span>{label}</span>
          {required && <span className="text-primary">*</span>}
        </label>

        <div className="flex items-center gap-2">
          {/* Quick "Same as pick-up" toggle button for dropoff */}
          {isDropoff && (
            <button
              type="button"
              onClick={() => onChange('')}
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                isSameAsPickup
                  ? 'bg-primary/15 border-primary/40 text-primary font-bold'
                  : 'bg-muted/80 border-border text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              title="Set drop-off to match pick-up location"
            >
              ↺ Same as pick-up
            </button>
          )}

          {/* Status Badge */}
          {isOfficialHub && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              Official Hub
            </span>
          )}
          {isCustomAddress && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
              Custom Address
            </span>
          )}
        </div>
      </div>

      {/* Input Field with Left & Right Icons */}
      <div className="relative flex items-center">
        {/* Left Map Pin Icon */}
        <div className="absolute left-3.5 text-muted-foreground pointer-events-none flex items-center">
          <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>

        {/* Text Input */}
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          value={value}
          onChange={e => {
            onChange(e.target.value);
            setIsOpen(true);
            setShowAllHubs(false);
            setHighlightedIndex(-1);
          }}
          onFocus={() => {
            setIsOpen(true);
            if (isOfficialHub || !trimmedValue) {
              setShowAllHubs(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={
            placeholder ||
            (isDropoff
              ? `Same as pick-up (${pickupReference || 'hub'}) or type address...`
              : 'Select hub from list or type custom address / location...')
          }
          className="w-full bg-muted border border-border rounded-xl pl-10 pr-20 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-primary transition-all focus:ring-1 focus:ring-primary/20"
          autoComplete="off"
        />

        {/* Right Controls: Clear + Toggle Dropdown */}
        <div className="absolute right-2.5 flex items-center gap-1">
          {trimmedValue.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors cursor-pointer"
              title="Clear text"
              aria-label="Clear location"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setIsOpen(prev => {
                const next = !prev;
                if (next) setShowAllHubs(true);
                return next;
              });
              if (!isOpen && inputRef.current) {
                inputRef.current.focus();
              }
            }}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors cursor-pointer"
            title="Toggle suggestions list"
            aria-label="Toggle suggestions dropdown"
          >
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        </div>
      </div>

      {/* Helper text or description */}
      {helperText && (
        <p className="text-[11px] text-muted-foreground/80 pl-1">
          {helperText}
        </p>
      )}

      {/* Floating Suggestions Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-border rounded-xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto">
          {/* Quick Notice Header with Hub Count */}
          <div className="px-3.5 py-2 border-b border-border flex items-center justify-between text-[11px] text-muted-foreground font-bold sticky top-0 bg-gray-50 z-10">
            <span>
              {shouldShowAll
                ? `All Available Hubs (${suggestions.length} options)`
                : `Matching Hubs (${filteredSuggestions.length} found)`}
            </span>
            {!shouldShowAll && (
              <button
                type="button"
                onClick={() => setShowAllHubs(true)}
                className="text-[10px] text-primary hover:underline font-bold cursor-pointer"
              >
                Show all {suggestions.length} hubs
              </button>
            )}
          </div>

          <div className="p-1.5 space-y-1">
            {/* Drop-off Special Option: "Same as pick-up" */}
            {isDropoff && (
              <button
                type="button"
                onClick={() => handleSelect('')}
                className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between text-xs font-bold transition-colors cursor-pointer ${
                  isSameAsPickup
                    ? 'bg-primary/15 text-primary'
                    : 'text-foreground hover:bg-muted/80'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs">
                    ↺
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-foreground">Same as pick-up</p>
                    <p className="text-[11px] font-normal text-muted-foreground truncate">
                      {pickupReference || 'Return to the same hub as pick-up'}
                    </p>
                  </div>
                </div>
                {isSameAsPickup && (
                  <span className="text-primary text-xs shrink-0 font-bold">✓ Selected</span>
                )}
              </button>
            )}

            {/* Custom Address Selection Option */}
            {trimmedValue && !isOfficialHub && (
              <button
                type="button"
                onClick={() => handleSelect(trimmedValue)}
                className="w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between text-xs bg-amber-50 hover:bg-amber-100/80 border border-amber-200 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 text-xs">
                    🏠
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-amber-800 truncate">
                      Use custom address: &ldquo;{trimmedValue}&rdquo;
                    </p>
                    <p className="text-[10px] text-amber-700/80">
                      Doorstep delivery & pickup at this custom location
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-amber-700 uppercase font-bold tracking-wider px-1.5 py-0.5 bg-amber-100 rounded shrink-0">
                  Custom
                </span>
              </button>
            )}

            {/* Hub Suggestions Divider */}
            {filteredSuggestions.length > 0 && (
              <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                <span>DriveNow Hubs & Branches ({filteredSuggestions.length})</span>
                <span className="text-[9px] text-muted-foreground font-bold">Select any hub below</span>
              </div>
            )}

            {/* List of Hub Suggestions */}
            {filteredSuggestions.map((hub) => {
              const isSelected = hub.toLowerCase() === trimmedValue.toLowerCase();
              const tag = getHubTag(hub);
              return (
                <button
                  key={hub}
                  ref={isSelected ? selectedItemRef : undefined}
                  type="button"
                  onClick={() => handleSelect(hub)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between text-xs font-bold transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-primary/15 text-primary border border-primary/30'
                      : 'text-foreground hover:bg-muted/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                    }`}>
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <span className="truncate font-bold">{hub}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <span className="text-[10px] font-bold text-muted-foreground/70 bg-muted px-1.5 py-0.5 rounded border border-border/50">
                      {tag}
                    </span>
                    {isSelected && (
                      <span className="text-primary text-xs font-bold">✓</span>
                    )}
                  </div>
                </button>
              );
            })}

            {/* Empty State when no hubs match */}
            {filteredSuggestions.length === 0 && (
              <div className="p-4 text-center text-xs text-muted-foreground space-y-2">
                <p>No hub matching &ldquo;{trimmedValue}&rdquo;.</p>
                <p className="text-[11px] text-foreground">
                  You can proceed with this as your <span className="text-amber-600 font-bold">custom location</span>.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAllHubs(true)}
                  className="px-3 py-1 bg-muted hover:bg-secondary text-primary rounded-lg text-xs font-bold cursor-pointer"
                >
                  Browse all {suggestions.length} hubs
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
