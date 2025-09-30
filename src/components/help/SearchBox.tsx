import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { HelpArticle } from '@/services/helpCenterService';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

interface SearchBoxProps {
  articles: HelpArticle[];
  onArticleSelect: (article: HelpArticle) => void;
}

const SearchBox = ({ articles, onArticleSelect }: SearchBoxProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredArticles = articles.filter(
    article =>
      article.title.toLowerCase().includes(search.toLowerCase()) ||
      article.content.toLowerCase().includes(search.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className='relative w-full max-w-md mx-auto'>
      <div className='relative w-full cursor-pointer' onClick={() => setOpen(true)}>
        <input
          placeholder='Search help articles...'
          className='w-full h-10 pl-10 pr-4 rounded-md border border-input bg-background focus-visible:ring-2 focus-visible:ring-ring'
          value={search}
          readOnly
        />
        <Search className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput
            placeholder='Search help articles...'
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading='Articles'>
              {filteredArticles.map(article => (
                <CommandItem
                  key={article.id}
                  value={article.title}
                  onSelect={() => {
                    onArticleSelect(article);
                    setOpen(false);
                    setSearch('');
                  }}
                >
                  <div className='flex flex-col'>
                    <span className='font-medium'>{article.title}</span>
                    <span className='text-sm text-muted-foreground'>{article.category}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </div>
  );
};

export default SearchBox;
