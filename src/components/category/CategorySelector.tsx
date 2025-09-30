import React, { useMemo, useState } from 'react';
import { EnhancedScrollArea } from '@/components/ui/enhanced-scroll-area';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Check, Filter, MoreHorizontal, Tag } from 'lucide-react';
import clsx from 'clsx';

export type Category = {
  id: string;
  name: string;
  icon?: React.ReactNode;
};

interface CategorySelectorProps {
  categories: Category[];
  selected: string[];
  onChange: (next: string[]) => void;
  topCount?: number | undefined;
  className?: string | undefined;
}

/**
 * Horizontal, multi-select category selector with Airbnb-style icon + label pills.
 * - Keeps the UI compact and aligned with current design tokens.
 * - Adds an optional searchable "More" dialog for overflow categories.
 */
export const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  selected,
  onChange,
  topCount = 8,
  className,
}) => {
  const [open, setOpen] = useState(false);

  const top = useMemo(() => categories.slice(0, topCount), [categories, topCount]);
  const overflow = useMemo(() => categories.slice(topCount), [categories, topCount]);

  const isSelected = (id: string) => selected.includes(id);

  const toggle = (id: string) => {
    if (isSelected(id)) {
      onChange(selected.filter(s => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const clearAll = () => onChange([]);

  const selectionCount = selected.length;

  return (
    <div className={clsx('w-full', className)}>
      <EnhancedScrollArea className='overflow-x-auto'>
        <div className='flex items-center gap-2 min-w-max py-1'>
          <Button variant='secondary' size='sm' onClick={clearAll} className='shrink-0'>
            All{selectionCount > 0 ? ` (${selectionCount})` : ''}
          </Button>

          <Separator orientation='vertical' className='mx-1 h-6' />

          {top.map(cat => (
            <Toggle
              key={cat.id}
              pressed={isSelected(cat.id)}
              onPressedChange={() => toggle(cat.id)}
              className='shrink-0 px-3 py-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground'
              aria-label={cat.name}
            >
              <span className='flex items-center gap-2'>
                {cat.icon ?? <Tag className='h-4 w-4' />}
                <span className='whitespace-nowrap text-sm'>{cat.name}</span>
              </span>
            </Toggle>
          ))}

          {overflow.length > 0 && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant='outline' size='sm' className='ml-1 shrink-0'>
                  <MoreHorizontal className='h-4 w-4 mr-1' /> More
                  {selectionCount > top.length && (
                    <span className='ml-2 rounded bg-primary/10 px-1.5 text-xs'>
                      +{selectionCount - top.length}
                    </span>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className='sm:max-w-lg'>
                <DialogHeader>
                  <DialogTitle>Choose categories</DialogTitle>
                </DialogHeader>
                <Command>
                  <CommandInput placeholder='Search categories...' />
                  <CommandList>
                    <CommandEmpty>No categories found.</CommandEmpty>
                    <CommandGroup>
                      {[...overflow].map(cat => {
                        const active = isSelected(cat.id);
                        return (
                          <CommandItem
                            key={cat.id}
                            onSelect={() => toggle(cat.id)}
                            className='flex items-center justify-between'
                          >
                            <span className='flex items-center gap-2'>
                              {cat.icon ?? <Tag className='h-4 w-4' />}
                              {cat.name}
                            </span>
                            {active && <Check className='h-4 w-4' />}
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
                <div className='flex justify-end gap-2'>
                  <Button variant='ghost' onClick={() => setOpen(false)}>
                    Close
                  </Button>
                  <Button onClick={() => setOpen(false)}>
                    <Filter className='h-4 w-4 mr-1' /> Apply
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </EnhancedScrollArea>
    </div>
  );
};

export default CategorySelector;
