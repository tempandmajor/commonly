import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { EventCategory } from '@/lib/types/event';

interface CategoryNavProps {
  activeCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

const categories = [
  { id: EventCategory.FoodWineFestivals, label: 'Food & Wine Festivals', emoji: '🍷' },
  { id: EventCategory.FilmFestivals, label: 'Film Festivals', emoji: '🎬' },
  { id: EventCategory.ArtExhibitions, label: 'Art Exhibitions', emoji: '🎨' },
  { id: EventCategory.CulturalFestivals, label: 'Cultural Festivals', emoji: '🌍' },
  { id: EventCategory.TechStartupEvents, label: 'Tech & Startup Events', emoji: '💻' },
  { id: EventCategory.BusinessConferences, label: 'Business Conferences', emoji: '💼' },
  { id: EventCategory.EducationalWorkshops, label: 'Educational Workshops', emoji: '📚' },
  { id: EventCategory.FitnessWellnessEvents, label: 'Fitness & Wellness Events', emoji: '🧘' },
  { id: EventCategory.SportsEvents, label: 'Sports Events', emoji: '⚽' },
  { id: EventCategory.CharitableFundraisers, label: 'Charitable Fundraisers', emoji: '❤️' },
  { id: EventCategory.ComedyShows, label: 'Comedy Shows', emoji: '😂' },
  { id: EventCategory.PerformingArts, label: 'Performing Arts', emoji: '🎭' },
  { id: EventCategory.PopupMarkets, label: 'Popup Markets', emoji: '🛍️' },
  { id: EventCategory.FashionEvents, label: 'Fashion Events', emoji: '👗' },
];

const CategoryNav: React.FC<CategoryNavProps> = ({ activeCategory, onSelectCategory }) => {
  return (
    <section className='border-b bg-gray-50/50 py-4'>
      <div className='container mx-auto px-4'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-lg font-semibold text-[#2B2B2B]'>Browse by Category</h2>
          {activeCategory && (
            <div className='flex items-center gap-2'>
              <Badge variant='secondary' className='gap-1'>
                {categories.find(cat => cat.id === activeCategory)?.emoji}
                {categories.find(cat => cat.id === activeCategory)?.label || activeCategory}
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => onSelectCategory(null)}
                  className='h-4 w-4 p-0 hover:bg-transparent'
                >
                  <X className='h-3 w-3' />
                </Button>
              </Badge>
            </div>
          )}
        </div>

        <div className='flex flex-wrap gap-2'>
          <Button
            variant={!activeCategory ? 'default' : 'outline'}
            onClick={() => onSelectCategory(null)}
            className='text-sm'
          >
            All Events
          </Button>

          {categories.map(category => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? 'default' : 'outline'}
              onClick={() => onSelectCategory(category.id)}
              className='text-sm gap-1'
            >
              <span>{category.emoji}</span>
              {category.label}
            </Button>
          ))}
        </div>

        {activeCategory && (
          <div className='mt-3 text-sm text-muted-foreground'>
            Showing events in{' '}
            {categories.find(cat => cat.id === activeCategory)?.label || activeCategory}
          </div>
        )}
      </div>
    </section>
  );
};

export default CategoryNav;
