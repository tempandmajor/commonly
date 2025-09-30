import { Check, Star } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { UnifiedCaterer } from '@/types/unifiedCaterer';

interface CatererTabsProps {
  caterer: UnifiedCaterer;
  selectedMenu: string | null;
  onMenuSelect: (menuId: string) => void;
}

const CatererTabs = ({ caterer, selectedMenu, onMenuSelect }: CatererTabsProps) => {
  return (
    <Tabs defaultValue='about' className='w-full'>
      <TabsList className='mb-6'>
        <TabsTrigger value='about'>About</TabsTrigger>
        <TabsTrigger value='menus'>Menus</TabsTrigger>
        <TabsTrigger value='reviews'>Reviews</TabsTrigger>
      </TabsList>

      <TabsContent value='about' className='space-y-6'>
        <div>
          <h2 className='text-xl font-semibold mb-4'>About this caterer</h2>
          <p className='text-muted-foreground'>{caterer.description}</p>
        </div>

        <div>
          <h3 className='font-medium mb-3'>Specialties</h3>
          <div className='flex flex-wrap gap-2'>
            {caterer.specialties?.map((specialty: string, index: number) => (
              <Badge key={index} variant='secondary'>
                {specialty}
              </Badge>
            ))}
            {(!caterer.specialties || caterer.specialties.length === 0) && (
              <p className='text-sm text-muted-foreground'>No specialties listed</p>
            )}
          </div>
        </div>

        <div>
          <h3 className='font-medium mb-3'>Dietary Options</h3>
          <div className='grid grid-cols-2 gap-2'>
            {caterer.specialDiets && caterer.specialDiets.length > 0 ? (
              caterer.specialDiets.map((option: string, index: number) => (
                <div key={index} className='flex items-center'>
                  <Check className='h-4 w-4 mr-2 text-green-500' />
                  <span>{option}</span>
                </div>
              ))
            ) : (
              <p className='text-sm text-muted-foreground'>No dietary options specified</p>
            )}
          </div>
        </div>
      </TabsContent>

      <TabsContent value='menus' className='space-y-6'>
        {caterer.menu?.length ? (
          caterer.menu.map((menu: any) => (
            <Card
              key={menu.id}
              className={`overflow-hidden ${selectedMenu === menu.id ? 'border-primary' : ''}`}
            >
              <CardHeader>
                <div className='flex items-start justify-between'>
                  <div>
                    <CardTitle>{menu.name}</CardTitle>
                    <CardDescription>{menu.description}</CardDescription>
                  </div>
                  <div className='text-right'>
                    <span className='text-lg font-bold'>${menu.price}</span>
                    <p className='text-xs text-muted-foreground'>per person</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {menu.courses?.map((course: any, index: number) => (
                    <div key={index}>
                      <h4 className='font-medium text-sm'>{course.type}</h4>
                      <ul className='mt-1 space-y-1'>
                        {course.items?.map((item: string, idx: number) => (
                          <li key={idx} className='text-sm text-muted-foreground'>
                            {item}
                          </li>
                        ))}
                      </ul>
                      {index < (menu.courses?.length || 0) - 1 && <Separator className='my-3' />}
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant={selectedMenu === menu.id ? 'default' : 'outline'}
                  className='w-full'
                  onClick={() => onMenuSelect(menu.id)}
                >
                  {selectedMenu === menu.id ? 'Selected' : 'Select This Menu'}
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className='text-center py-8'>
            <p className='text-muted-foreground'>No menus available for this caterer.</p>
          </div>
        )}
      </TabsContent>

      <TabsContent value='reviews' className='space-y-6'>
        <div className='flex items-center mb-6'>
          <Star className='h-5 w-5 text-yellow-500 fill-yellow-500 mr-1' />
          <span className='text-lg font-semibold mr-2'>{caterer.rating}</span>
          <span className='text-muted-foreground'>({caterer.reviewCount} reviews)</span>
        </div>

        {caterer.reviews && caterer.reviews.length > 0 ? (
          <div className='space-y-4'>
            {caterer.reviews.map(review => (
              <Card key={review.id} className='overflow-hidden'>
                <CardContent className='p-4'>
                  <div className='flex justify-between mb-2'>
                    <div>
                      <p className='font-medium'>{review.userName}</p>
                      <p className='text-xs text-muted-foreground'>
                        {new Date(review.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className='flex items-center'>
                      <Star className='h-4 w-4 text-yellow-500 fill-yellow-500 mr-1' />
                      <span>{review.rating}</span>
                    </div>
                  </div>
                  <p className='text-sm'>{review.comment}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className='text-center py-8'>
            <p className='text-muted-foreground'>No reviews available yet.</p>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};

export default CatererTabs;
