'use client';

/*
::neup.documentation::snappy-card-select
::title Snappy Card Select

Provides a searchable stacked-card picker with an optional snapping scroll mode,
selected-card collapse state, and removable selection for form fields that need
descriptive option cards instead of a plain select box. Snapping is configured
by the caller through the `snappy` prop, not through an in-field UI toggle.

The option list opens when the field is activated and remains visible through
outside clicks that do not move interaction to another form control. Focusing
or clicking another interactive field closes the option list while preserving
the current input text or selected value card.

Snappy mode calculates each card's scroll position relative to the scroll
container, then snaps to the nearest card after scrolling pauses. This keeps
middle cards selectable instead of letting native scroll-snap clamp the list to
the first or last reachable position.

The option viewport shows `maxCards` cards, five by default. `maxCards={0}`
shows every matching option without capping the list height; positive values
are treated as two or more cards.

The snapped visible window owns the rounded corners: the top snapped card gets
the top radius and the last visible card in that window gets the bottom radius.
Cards outside that snapped window keep their layout space for scrolling, but
their borders are transparent so clipped neighbors do not leave outline
artifacts at the viewport edge.

Selecting an option delays the external value change until the option list has
collapsed. The clicked card stays visible as the selected card while the other
cards shrink away. The collapse duration is 100ms per matching item, capped at
300ms. Clearing the selection plays the reverse transition, expanding the
stack from the selected card back to the visible card window before the
highlight is removed. The list scrollbar uses the same muted border tone as
the selector stack.

::end
*/

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { X } from 'lucide-react';

import { Input } from '@neup/components/ui/input';
import { Label } from '@neup/components/ui/label';

const CARD_HEIGHT_REM = 3.75;
const CARD_HEIGHT_FALLBACK_PX = CARD_HEIGHT_REM * 16;
const SELECTION_COLLAPSE_MS_PER_ITEM = 100;
const MAX_SELECTION_COLLAPSE_MS = 300;
const OPTION_ENTER_EXPAND_DELAY_MS = 20;

type SelectionAnimationMode =
  | 'collapsing'
  | 'expanding'
  | null;

export type SnappyCardSelectOption<
  TValue extends string = string,
> = {
  value: TValue;
  label: string;
  description?: string;
};

type SnappyCardSelectProps<
  TValue extends string = string,
> = {
  inputId: string;
  label: string;
  options: SnappyCardSelectOption<TValue>[];
  value: SnappyCardSelectOption<TValue> | null;
  onChange: (
    option: SnappyCardSelectOption<TValue> | null,
  ) => void;
  placeholder?: string;
  maxCards?: number;
  snappy?: boolean;
  required?: boolean;
  disabled?: boolean;
  emptyMessage?: string;
};

export function SnappyCardSelect<
  TValue extends string = string,
>({
  inputId,
  label,
  options,
  value,
  onChange,
  placeholder = 'Search options',
  maxCards = 5,
  snappy = true,
  required = false,
  disabled = false,
  emptyMessage = 'No matching options found.',
}: SnappyCardSelectProps<TValue>) {
  const [query, setQuery] = useState('');
  const [
    pendingSelectedOption,
    setPendingSelectedOption,
  ] = useState<SnappyCardSelectOption<TValue> | null>(
    null,
  );
  const [
    pendingSelectedOptionIndex,
    setPendingSelectedOptionIndex,
  ] = useState<number | null>(null);
  const [
    collapseListHeight,
    setCollapseListHeight,
  ] = useState<number | null>(null);
  const [
    selectionAnimationMode,
    setSelectionAnimationMode,
  ] = useState<SelectionAnimationMode>(null);
  const [
    shouldCollapseNonSelectedOptions,
    setShouldCollapseNonSelectedOptions,
  ] = useState(false);
  const [
    topVisibleOptionIndex,
    setTopVisibleOptionIndex,
  ] = useState(0);
  const [isOptionsVisible, setIsOptionsVisible] =
    useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const snapTimeoutRef = useRef<number | null>(null);
  const selectionTimeoutRef = useRef<number | null>(null);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredOptions = useMemo(() => {
    if (!normalizedQuery) {
      return options;
    }

    return options.filter((option) => {
      const searchableFields = [
        option.label,
        option.value,
        option.description ?? '',
      ];

      return searchableFields.some((field) =>
        field.toLowerCase().includes(normalizedQuery),
      );
    });
  }, [normalizedQuery, options]);

  const getOptionElements = useCallback(() => {
    const container = listRef.current;

    if (!container) {
      return [];
    }

    return Array.from(
      container.querySelectorAll<HTMLButtonElement>(
        '[data-snappy-card-option="true"]',
      ),
    );
  }, []);

  const getOptionScrollTop = useCallback((
    container: HTMLDivElement,
    element: HTMLButtonElement,
  ) => {
    const containerRect =
      container.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();

    return (
      elementRect.top -
      containerRect.top +
      container.scrollTop
    );
  }, []);

  const clampScrollTop = useCallback((
    container: HTMLDivElement,
    scrollTop: number,
  ) => {
    const maxScrollTop = Math.max(
      container.scrollHeight - container.clientHeight,
      0,
    );

    return Math.min(
      Math.max(scrollTop, 0),
      maxScrollTop,
    );
  }, []);

  const normalizedMaxCards = Number.isFinite(maxCards)
    ? Math.floor(maxCards)
    : 5;
  const shouldShowAllCards = normalizedMaxCards === 0;
  const visibleOptionCount = shouldShowAllCards
    ? filteredOptions.length
    : Math.max(normalizedMaxCards, 2);
  const visibleCardOverlapPx = Math.max(
    visibleOptionCount - 1,
    0,
  );
  const selectionCollapseDurationMs = Math.min(
    filteredOptions.length *
      SELECTION_COLLAPSE_MS_PER_ITEM,
    MAX_SELECTION_COLLAPSE_MS,
  );

  const getExpandedListHeight = useCallback(() => {
    const container = listRef.current;

    if (!container) {
      return CARD_HEIGHT_FALLBACK_PX;
    }

    const optionElements = getOptionElements();
    const optionHeight =
      optionElements[0]?.getBoundingClientRect().height ??
      CARD_HEIGHT_FALLBACK_PX;
    const maxVisibleHeight = shouldShowAllCards
      ? Number.POSITIVE_INFINITY
      : optionHeight * visibleOptionCount -
        visibleCardOverlapPx;

    return Math.min(
      container.scrollHeight,
      maxVisibleHeight,
    );
  }, [
    getOptionElements,
    shouldShowAllCards,
    visibleCardOverlapPx,
    visibleOptionCount,
  ]);

  /**
   * Finds the card whose top edge is nearest to the
   * scroll container's current scroll position.
   */
  const getNearestOptionIndex = useCallback(() => {
    const container = listRef.current;
    const optionElements = getOptionElements();

    if (!container || optionElements.length === 0) {
      return 0;
    }

    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    optionElements.forEach((element, index) => {
      const optionScrollTop = getOptionScrollTop(
        container,
        element,
      );
      const distance = Math.abs(
        optionScrollTop - container.scrollTop,
      );

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    return nearestIndex;
  }, [getOptionElements, getOptionScrollTop]);

  const clearSnapTimeout = useCallback(() => {
    if (snapTimeoutRef.current === null) {
      return;
    }

    window.clearTimeout(snapTimeoutRef.current);
    snapTimeoutRef.current = null;
  }, []);

  const clearSelectionTimeout = useCallback(() => {
    if (selectionTimeoutRef.current === null) {
      return;
    }

    window.clearTimeout(selectionTimeoutRef.current);
    selectionTimeoutRef.current = null;
  }, []);

  const snapListToNearestOption = useCallback(() => {
    const container = listRef.current;

    if (!container || !snappy) {
      return;
    }

    const optionElements = getOptionElements();

    if (optionElements.length === 0) {
      return;
    }

    const nearestIndex = getNearestOptionIndex();
    const nearestOption = optionElements[nearestIndex];
    const nearestOptionScrollTop = getOptionScrollTop(
      container,
      nearestOption,
    );

    setTopVisibleOptionIndex(nearestIndex);

    container.scrollTo({
      top: clampScrollTop(
        container,
        nearestOptionScrollTop,
      ),
      behavior: 'smooth',
    });
  }, [
    clampScrollTop,
    getNearestOptionIndex,
    getOptionScrollTop,
    getOptionElements,
    snappy,
  ]);

  const resetListPosition = useCallback(() => {
    clearSnapTimeout();
    setTopVisibleOptionIndex(0);

    requestAnimationFrame(() => {
      listRef.current?.scrollTo({
        top: 0,
        behavior: 'auto',
      });
    });
  }, [clearSnapTimeout]);

  const handleScroll = useCallback(() => {
    setTopVisibleOptionIndex(getNearestOptionIndex());

    if (!snappy) {
      return;
    }

    clearSnapTimeout();

    snapTimeoutRef.current = window.setTimeout(() => {
      snapListToNearestOption();
      snapTimeoutRef.current = null;
    }, 120);
  }, [
    clearSnapTimeout,
    getNearestOptionIndex,
    snappy,
    snapListToNearestOption,
  ]);

  const handleInputChange = (
    nextQuery: string,
  ) => {
    setQuery(nextQuery);
    setIsOptionsVisible(true);

    if (value) {
      onChange(null);
    }

    resetListPosition();
  };

  const handleSelect = (
    option: SnappyCardSelectOption<TValue>,
    index: number,
  ) => {
    clearSnapTimeout();
    clearSelectionTimeout();

    const optionElements = getOptionElements();
    const listHeight =
      listRef.current?.getBoundingClientRect().height ?? 0;
    const selectedCardHeight =
      optionElements[index]?.getBoundingClientRect()
        .height ?? CARD_HEIGHT_FALLBACK_PX;

    setPendingSelectedOption(option);
    setPendingSelectedOptionIndex(index);
    setCollapseListHeight(listHeight);
    setSelectionAnimationMode('collapsing');
    setShouldCollapseNonSelectedOptions(true);

    requestAnimationFrame(() => {
      setCollapseListHeight(selectedCardHeight);
    });

    selectionTimeoutRef.current = window.setTimeout(() => {
      setQuery('');
      setPendingSelectedOption(null);
      setPendingSelectedOptionIndex(null);
      setCollapseListHeight(null);
      setSelectionAnimationMode(null);
      setShouldCollapseNonSelectedOptions(false);
      setIsOptionsVisible(false);
      onChange(option);
      selectionTimeoutRef.current = null;
    }, selectionCollapseDurationMs);
  };

  const handleClear = () => {
    if (!value) {
      return;
    }

    setIsOptionsVisible(true);
    clearSelectionTimeout();
    clearSnapTimeout();

    const selectedOptionIndex = options.findIndex(
      (option) => option.value === value.value,
    );

    setQuery('');
    setPendingSelectedOption(value);
    setPendingSelectedOptionIndex(
      selectedOptionIndex >= 0
        ? selectedOptionIndex
        : null,
    );
    setCollapseListHeight(CARD_HEIGHT_FALLBACK_PX);
    setSelectionAnimationMode('expanding');
    setShouldCollapseNonSelectedOptions(true);
    setTopVisibleOptionIndex(0);
    onChange(null);

    requestAnimationFrame(() => {
      listRef.current?.scrollTo({
        top: 0,
        behavior: 'auto',
      });

      const expandedListHeight =
        getExpandedListHeight();

      requestAnimationFrame(() => {
        setShouldCollapseNonSelectedOptions(false);
        setCollapseListHeight(expandedListHeight);
      });
    });

    selectionTimeoutRef.current = window.setTimeout(() => {
      setPendingSelectedOption(null);
      setPendingSelectedOptionIndex(null);
      setCollapseListHeight(null);
      setSelectionAnimationMode(null);
      setShouldCollapseNonSelectedOptions(false);
      selectionTimeoutRef.current = null;
    }, selectionCollapseDurationMs + OPTION_ENTER_EXPAND_DELAY_MS);
  };

  useEffect(() => {
    resetListPosition();
  }, [filteredOptions.length, resetListPosition]);

  useEffect(() => {
    if (!snappy) {
      clearSnapTimeout();
      return;
    }

    requestAnimationFrame(() => {
      snapListToNearestOption();
    });
  }, [
    clearSnapTimeout,
    snapListToNearestOption,
    snappy,
  ]);

  useEffect(() => {
    return () => {
      clearSnapTimeout();
      clearSelectionTimeout();
    };
  }, [clearSelectionTimeout, clearSnapTimeout]);

  useEffect(() => {
    const isInteractiveTarget = (
      target: EventTarget | null,
    ) => {
      if (!(target instanceof Element)) {
        return false;
      }

      return target.closest(
        'input, textarea, select, button, [role="button"], [role="combobox"], [role="listbox"], [contenteditable="true"], [tabindex]:not([tabindex="-1"])',
      );
    };

    const handleDocumentInteraction = (
      event: FocusEvent | PointerEvent,
    ) => {
      if (!isOptionsVisible) {
        return;
      }

      const target = event.target;

      if (
        rootRef.current &&
        target instanceof Node &&
        rootRef.current.contains(target)
      ) {
        return;
      }

      if (!isInteractiveTarget(target)) {
        return;
      }

      setIsOptionsVisible(false);
    };

    document.addEventListener(
      'focusin',
      handleDocumentInteraction,
    );
    document.addEventListener(
      'pointerdown',
      handleDocumentInteraction,
      true,
    );

    return () => {
      document.removeEventListener(
        'focusin',
        handleDocumentInteraction,
      );
      document.removeEventListener(
        'pointerdown',
        handleDocumentInteraction,
        true,
      );
    };
  }, [isOptionsVisible]);

  const isSelectionCollapsing =
    selectionAnimationMode === 'collapsing';
  const isSelectionExpanding =
    selectionAnimationMode === 'expanding';
  const isSelectionAnimating =
    selectionAnimationMode !== null &&
    pendingSelectedOption !== null;
  const shouldShowSelectedValueCard =
    value !== null && !isSelectionExpanding;
  const shouldRenderOptions =
    isOptionsVisible || isSelectionAnimating;

  return (
    <div ref={rootRef} className="space-y-2">
      <Label htmlFor={inputId}>
        {label}

        {required ? (
          <span
            className="ml-1 text-destructive"
            aria-hidden="true"
          >
            *
          </span>
        ) : null}
      </Label>

      {shouldShowSelectedValueCard ? (
        <div className="flex w-full items-start justify-between rounded-lg border border-primary bg-primary/5 px-4 py-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">
              {value.label}
            </div>

            {value.description ? (
              <div className="mt-0.5 text-xs text-muted-foreground">
                {value.description}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="ml-3 shrink-0 rounded-sm p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            aria-label={`Remove selected ${label.toLowerCase()}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <>
          {!isSelectionCollapsing ? (
            <Input
              id={inputId}
              value={query}
              onFocus={() => setIsOptionsVisible(true)}
              onClick={() => setIsOptionsVisible(true)}
              onChange={(event) =>
                handleInputChange(event.target.value)
              }
              placeholder={placeholder}
              autoComplete="off"
              required={required}
              disabled={disabled}
              aria-controls={`${inputId}-options`}
              aria-expanded={
                shouldRenderOptions &&
                filteredOptions.length > 0
              }
            />
          ) : null}

          {shouldRenderOptions ? (
            <div
              id={`${inputId}-options`}
              ref={listRef}
              onScroll={handleScroll}
              role="listbox"
              aria-label={`${label} options`}
              className={[
                'overflow-y-auto',
                '[scrollbar-color:hsl(var(--border))_transparent] [scrollbar-width:thin]',
                '[&::-webkit-scrollbar]:w-2',
                '[&::-webkit-scrollbar-track]:bg-transparent',
                '[&::-webkit-scrollbar-thumb]:rounded-full',
                '[&::-webkit-scrollbar-thumb]:bg-border',
                '[&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground/40',
                snappy ? 'scroll-smooth' : '',
                isSelectionAnimating
                  ? 'overflow-hidden transition-[height,max-height] ease-in-out'
                  : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={
                isSelectionAnimating
                  ? {
                      height: `${collapseListHeight ?? 0}px`,
                      maxHeight: `${collapseListHeight ?? 0}px`,
                      transitionDuration: `${selectionCollapseDurationMs}ms`,
                    }
                  : shouldShowAllCards
                    ? undefined
                    : {
                        maxHeight: `calc(${
                          visibleOptionCount * CARD_HEIGHT_REM
                        }rem - ${visibleCardOverlapPx}px)`,
                      }
              }
            >
              {filteredOptions.length === 0 ? (
                <div className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                  {emptyMessage}
                </div>
              ) : (
                filteredOptions.map((option, index) => {
                  const isPendingSelectedOption =
                    pendingSelectedOptionIndex === index;
                  const shouldCollapseOption =
                    shouldCollapseNonSelectedOptions &&
                    !isPendingSelectedOption;
                  const isFirstVisible =
                    index === topVisibleOptionIndex;
                  const lastVisibleOptionIndex = Math.min(
                    topVisibleOptionIndex +
                      visibleOptionCount -
                      1,
                    filteredOptions.length - 1,
                  );
                  const isLastVisible =
                    index === lastVisibleOptionIndex;
                  const isInsideVisibleWindow =
                    index >= topVisibleOptionIndex &&
                    index <= lastVisibleOptionIndex;
                  const radiusClass = [
                    isPendingSelectedOption || isFirstVisible
                      ? 'rounded-t-lg'
                      : 'rounded-t-none',
                    isPendingSelectedOption || isLastVisible
                      ? 'rounded-b-lg'
                      : 'rounded-b-none',
                  ].join(' ');

                  return (
                    <button
                      key={`${option.value}-${index}`}
                      type="button"
                      role="option"
                      disabled={
                        disabled || isSelectionAnimating
                      }
                      aria-selected={isPendingSelectedOption}
                      onClick={() =>
                        handleSelect(option, index)
                      }
                      data-snappy-card-option="true"
                      className={[
                        'flex h-[3.75rem] w-full flex-col justify-center overflow-hidden border px-4 text-left',
                        'transition-[height,border-width,background-color,border-color,opacity]',
                        'hover:border-primary/40 hover:bg-muted/40',
                        'focus-visible:relative focus-visible:z-10',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        'disabled:pointer-events-none',
                        disabled ? 'opacity-50' : '',
                        index > 0 && !isSelectionAnimating
                          ? '-mt-px'
                          : '',
                        shouldCollapseOption
                          ? 'h-0 border-y-0 opacity-0'
                          : '',
                        isPendingSelectedOption
                          ? 'border-primary bg-primary/5'
                          : isInsideVisibleWindow
                            ? 'border-border'
                            : 'border-transparent',
                        radiusClass,
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      style={{
                        height: shouldCollapseOption
                          ? '0px'
                          : undefined,
                        transitionDuration: `${selectionCollapseDurationMs}ms`,
                      }}
                    >
                      <div className="truncate text-sm font-medium">
                        {option.label}
                      </div>

                      {option.description ? (
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">
                          {option.description}
                        </div>
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
