import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchFormProps {
  onSearch: (query: string) => void;
  placeholder?: string | undefined;
}

const SearchForm: React.FC<SearchFormProps> = ({ onSearch, placeholder = 'Search events...' }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className='flex w-full max-w-sm items-center space-x-2'>
      <Input
        type='text'
        placeholder={placeholder}
        value={query}
        onChange={e => setQuery((e.target as HTMLInputElement).value)}
        className='flex-1'
      />
      <Button type='submit' size='sm'>
        <Search className='h-4 w-4' />
      </Button>
    </form>
  );
};

export default SearchForm;
