import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Check, ChevronsUpDown, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

export interface SearchSelectOption {
  value: string;
  label: string;
  description?: string | undefined;
  icon?: React.ReactNode | undefined;
  group?: string | undefined;
  disabled?: boolean | undefined;
}

interface SearchSelectProps {
  options: SearchSelectOption[];
  value?: string | undefined| string[];
  onChange: (value: string | string[]) => void;
  placeholder?: string | undefined;
  searchPlaceholder?: string | undefined;
  emptyMessage?: string | undefined;
  className?: string | undefined;
  disabled?: boolean | undefined;
  multiple?: boolean | undefined;
  maxSelected?: number | undefined;
  showSearch?: boolean | undefined;
  createOption?: (inputValue: string) => void | undefined;
  createOptionLabel?: (inputValue: string) => string | undefined;
  isLoading?: boolean | undefined;
  loadingMessage?: string | undefined;
}

export const SearchSelect: React.FC<SearchSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No options found.',
  className,
  disabled = false,
  multiple = false,
  maxSelected,
  showSearch = true,
  createOption,
  createOptionLabel = value => `Create "${value}"`,
  isLoading = false,
  loadingMessage = 'Loading...',
}) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const commandRef = useRef<HTMLDivElement>(null);

  // Convert value to array for consistent handling
  const selectedValues = useMemo(() => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }, [value]);

  // Group options by their group property
  const groupedOptions = useMemo(() => {
    const groups: Record<string, SearchSelectOption[]> = {};
    const ungrouped: SearchSelectOption[] = [];

    options.forEach(option => {
      if (option.group) {
        if (!groups[option.group]) {
          groups[option.group] = [];
        }
        groups[option.group].push(option);
      } else {
        ungrouped.push(option);
      }
    });

    return { groups, ungrouped };
  }, [options]);

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;

    const term = searchTerm.toLowerCase();
    return options.filter(
      option =>
        option.label.toLowerCase().includes(term) ||
        option.description?.toLowerCase().includes(term)
    );
  }, [options, searchTerm]);

  const handleSelect = (optionValue: string) => {
    if (multiple) {
      const newValues = selectedValues.includes(optionValue)
        ? selectedValues.filter(v => v !== optionValue)
        : [...selectedValues, optionValue];

      if (maxSelected && newValues.length > maxSelected) {
        return;
      }

      onChange(newValues);
    } else {
      onChange(optionValue);
      setOpen(false);
    }
    setSearchTerm('');
  };

  const handleCreate = () => {
    if (createOption && searchTerm) {
      createOption(searchTerm);
      setSearchTerm('');
      if (!multiple) {
        setOpen(false);
      }
    }
  };

  const handleRemove = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (multiple) {
      onChange(selectedValues.filter(v => v !== optionValue));
    } else {
      onChange('');
    }
  };

  const displayValue = useMemo(() => {
    if (selectedValues.length === 0) {
      return placeholder;
    }

    if (multiple) {
      return (
        <div className='flex gap-1 flex-wrap'>
          {selectedValues.map(val => {
            const option = options.find(opt => opt.value === val);
            return option ? (
              <Badge key={val} variant='secondary' className='text-xs'>
                {option.label}
                <button
                  type='button'
                  className='ml-1 hover:text-destructive'
                  onClick={e => handleRemove(val, e)}
                >
                  <X className='h-3 w-3' />
                </button>
              </Badge>
            ) : null;
          })}
        </div>
      );
    } else {
      const option = options.find(opt => opt.value === selectedValues[0]);
      return option ? (
        <div className='flex items-center gap-2'>
          {option.icon}
          <span>{option.label}</span>
        </div>
      ) : (
        placeholder
      );
    }
  }, [selectedValues, options, multiple, placeholder]);

  const showCreateOption =
    createOption &&
    searchTerm &&
    !options.some(opt => opt.label.toLowerCase() === searchTerm.toLowerCase());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className={cn(
            'w-full justify-between',
            !selectedValues.length && 'text-muted-foreground',
            className
          )}
          disabled={disabled}
        >
          <div className='flex-1 text-left truncate'>{displayValue}</div>
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-full p-0' align='start'>
        <Command ref={commandRef}>
          {showSearch && (
            <div className='flex items-center border-b px-3'>
              <Search className='mr-2 h-4 w-4 shrink-0 opacity-50' />
              <input
                className='flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50'
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={e => setSearchTerm((e.target as HTMLInputElement).value)}
              />
            </div>
          )}
          <CommandList>
            {isLoading ? (
              <CommandEmpty>{loadingMessage}</CommandEmpty>
            ) : filteredOptions.length === 0 && !showCreateOption ? (
              <CommandEmpty>{emptyMessage}</CommandEmpty>
            ) : (
              <>
                {groupedOptions.ungrouped.length > 0 && (
                  <CommandGroup>
                    {groupedOptions.ungrouped
                      .filter(option => filteredOptions.includes(option))
                      .map(option => (
                        <CommandItem
                          key={option.value}
                          value={option.value}
                          onSelect={() => handleSelect(option.value)}
                          disabled={option.disabled}
                          className='cursor-pointer'
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              selectedValues.includes(option.value) ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          <div className='flex-1'>
                            <div className='flex items-center gap-2'>
                              {option.icon}
                              <span>{option.label}</span>
                            </div>
                            {option.description && (
                              <p className='text-xs text-muted-foreground mt-1'>
                                {option.description}
                              </p>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                  </CommandGroup>
                )}

                {Object.entries(groupedOptions.groups).map(([groupName, groupOptions]) => {
                  const visibleOptions = groupOptions.filter(option =>
                    filteredOptions.includes(option)
                  );

                  if (visibleOptions.length === 0) return null;

                  return (
                    <React.Fragment key={groupName}>
                      <CommandSeparator />
                      <CommandGroup heading={groupName}>
                        {visibleOptions.map(option => (
                          <CommandItem
                            key={option.value}
                            value={option.value}
                            onSelect={() => handleSelect(option.value)}
                            disabled={option.disabled}
                            className='cursor-pointer'
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                selectedValues.includes(option.value) ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            <div className='flex-1'>
                              <div className='flex items-center gap-2'>
                                {option.icon}
                                <span>{option.label}</span>
                              </div>
                              {option.description && (
                                <p className='text-xs text-muted-foreground mt-1'>
                                  {option.description}
                                </p>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </React.Fragment>
                  );
                })}

                {showCreateOption && (
                  <>
                    <CommandSeparator />
                    <CommandGroup>
                      <CommandItem
                        value={searchTerm}
                        onSelect={handleCreate}
                        className='cursor-pointer text-primary'
                      >
                        <Check className='mr-2 h-4 w-4 opacity-0' />
                        {createOptionLabel(searchTerm)}
                      </CommandItem>
                    </CommandGroup>
                  </>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
