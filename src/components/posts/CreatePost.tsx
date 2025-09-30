'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useFormUndoRedo } from '@/hooks/useFormUndoRedo';
import {
  textPostSchema,
  imagePostSchema,
  videoPostSchema,
  audioPostSchema,
  pollPostSchema,
  eventPostSchema,
  productPostSchema,
  postDefaults,
  extractMentions,
  extractHashtags,
  validateMediaFile,
  postTypes,
  type CreatePostFormValues,
} from '@/lib/validations/postValidation';
import {
  Type,
  Image,
  Video,
  Music,
  BarChart3,
  Calendar,
  ShoppingBag,
  MapPin,
  Hash,
  AtSign,
  Send,
  Save,
  X,
  Plus,
  Trash2,
  Globe,
  Users,
  Lock,
  UserCheck,
  Bold,
  Italic,
  Underline,
  Link,
  Grid3x3,
  Square,
  List,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';

interface CreatePostProps {
  defaultType?: (typeof postTypes)[number] | undefined;
  communityId?: string | undefined;
  onSuccess?: (post: unknown) => void | undefined;
  onCancel?: () => void | undefined;
}

const postTypeIcons = {
  text: Type,
  image: Image,
  video: Video,
  audio: Music,
  poll: BarChart3,
  event: Calendar,
  product: ShoppingBag,
};

const postTypeLabels = {
  text: 'Text',
  image: 'Photo',
  video: 'Video',
  audio: 'Audio',
  poll: 'Poll',
  event: 'Event',
  product: 'Product',
};

const visibilityIcons = {
  public: Globe,
  followers: Users,
  friends: UserCheck,
  private: Lock,
};

const visibilityLabels = {
  public: 'Public',
  followers: 'Followers',
  friends: 'Friends',
  private: 'Only Me',
};

export const CreatePost: React.FC<CreatePostProps> = ({
  defaultType = 'text',
  communityId,
  onSuccess,
  onCancel,
}) => {
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState<(typeof postTypes)[number]>(defaultType);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [detectedMentions, setDetectedMentions] = useState<string[]>([]);

  // Get the appropriate schema based on selected type
  const getSchema = () => {
    switch (selectedType) {
      case 'text':
        return textPostSchema;
      case 'image':
        return imagePostSchema;
      case 'video':
        return videoPostSchema;
      case 'audio':
        return audioPostSchema;
      case 'poll':
        return pollPostSchema;
      case 'event':
        return eventPostSchema;
      case 'product':
        return productPostSchema;
      default:
        return textPostSchema;
    }
  };

  const form = useForm<CreatePostFormValues>({
    resolver: zodResolver(getSchema()),
    defaultValues: {
          ...postDefaults,
      type: selectedType,
    } as unknown,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = form;
  const { undo, redo } = useFormUndoRedo(form);

  // Watch content for mentions and hashtags
  const content = watch('content');
  useEffect(() => {
    if (content) {
      const mentions = extractMentions(content);
      const hashtags = extractHashtags(content);
      setDetectedMentions(mentions);
      setValue('mentions', mentions);
      setValue('tags', [...new Set([...selectedTags, ...hashtags])]);
    }
  }, [content, selectedTags, setValue]);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    { key: 'Enter', ctrl: true, callback: () => handleSubmit(onSubmit)() },
    { key: 's', ctrl: true, callback: () => saveDraft() },
    { key: 'z', ctrl: true, callback: undo },
    { key: 'z', ctrl: true, shift: true, callback: redo },
    { key: 'Escape', callback: () => onCancel?.() },
  ]);

  const onSubmit = async (data: CreatePostFormValues) => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: 'Success',
        description:
          data.status === 'scheduled'
            ? `Post scheduled for ${data.scheduledDate?.toLocaleString()}`
            : 'Post created successfully',
      });

      onSuccess?.(data);
      reset();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create post. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveDraft = async () => {
    const _data = watch();
    setValue('status', 'draft');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: 'Draft saved',
        description: 'Your post has been saved as a draft',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save draft',
        variant: 'destructive',
      });
    }
  };

  const handleTypeChange = (type: (typeof postTypes)[number]) => {
    setSelectedType(type);
    reset({
          ...postDefaults,
      type,
    } as unknown);
  };

  const renderPostTypeContent = () => {
    switch (selectedType) {
      case 'text':
        return <TextPostContent form={form} />;
      case 'image':
        return <ImagePostContent form={form} uploadProgress={uploadProgress} />;
      case 'video':
        return <VideoPostContent form={form} uploadProgress={uploadProgress} />;
      case 'audio':
        return <AudioPostContent form={form} uploadProgress={uploadProgress} />;
      case 'poll':
        return <PollPostContent form={form} />;
      case 'event':
        return <EventPostContent form={form} />;
      case 'product':
        return <ProductPostContent form={form} />;
      default:
        return null;
    }
  };

  return (
    <Card className='w-full max-w-2xl mx-auto'>
      <CardHeader>
        <CardTitle>Create Post</CardTitle>
      </CardHeader>

      <CardContent className='space-y-6'>
        {/* Post Type Selection */}
        <div className='grid grid-cols-4 md:grid-cols-7 gap-2'>
          {postTypes.map(type => {
            const Icon = postTypeIcons[type];
            return (
              <Button
                key={type}
                type='button'
                variant={selectedType === type ? 'default' : 'outline'}
                size='sm'
                onClick={() => handleTypeChange(type)}
                className='flex flex-col gap-1 h-auto py-2'
              >
                <Icon className='w-4 h-4' />
                <span className='text-xs'>{postTypeLabels[type]}</span>
              </Button>
            );
          })}
        </div>

        <Separator />

        {/* Main Content Area */}
        <div className='space-y-4'>
          {/* Content Field (common for all types) */}
          <div className='space-y-2'>
            <Label htmlFor='content'>What's on your mind?</Label>
            <Textarea
              id='content'
          {...register('content')}
              placeholder={`Share your ${selectedType}...`}
              rows={4}
              className='resize-none'
            />
            {errors.content && <p className='text-sm text-destructive'>{errors.content.message}</p>}
          </div>

          {/* Type-specific content */}
          {renderPostTypeContent()}
        </div>

        <Separator />

        {/* Additional Options */}
        <div className='space-y-4'>
          {/* Visibility */}
          <div className='space-y-2'>
            <Label htmlFor='visibility'>Who can see this?</Label>
            <Select
              value={watch('visibility')}
              onValueChange={value => setValue('visibility', value as unknown)}
            >
              <SelectTrigger id='visibility'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(visibilityLabels).map(([value, label]) => {
                  const Icon = visibilityIcons[value as keyof typeof visibilityIcons];
                  return (
                    <SelectItem key={value} value={value}>
                      <div className='flex items-center gap-2'>
                        <Icon className='w-4 h-4' />
                        {label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className='space-y-2'>
            <Label>Tags</Label>
            <div className='flex flex-wrap gap-2'>
              {watch('tags')?.map((tag, index) => (
                <div
                  key={index}
                  className='flex items-center gap-1 px-2 py-1 bg-secondary rounded-full text-sm'
                >
                  <Hash className='w-3 h-3' />
                  {tag}
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    onClick={() => {
                      const tags = watch('tags') || [];
                      setValue(
                        'tags',
                        tags.filter((_, i) => i !== index)
                      );
                    }}
                    className='h-4 w-4 p-0'
                  >
                    <X className='w-3 h-3' />
                  </Button>
                </div>
              ))}
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => {
                  const tag = prompt('Add a tag:');
                  if (tag) {
                    const tags = watch('tags') || [];
                    setValue('tags', [...tags, tag]);
                  }
                }}
              >
                <Plus className='w-3 h-3 mr-1' />
                Add Tag
              </Button>
            </div>
          </div>

          {/* Mentions */}
          {detectedMentions.length > 0 && (
            <Alert>
              <AtSign className='w-4 h-4' />
              <AlertDescription>
                Mentioning: {detectedMentions.map(m => `@${m}`).join(', ')}
              </AlertDescription>
            </Alert>
          )}

          {/* Additional Settings */}
          <Tabs defaultValue='settings' className='w-full'>
            <TabsList className='grid w-full grid-cols-3'>
              <TabsTrigger value='settings'>Settings</TabsTrigger>
              <TabsTrigger value='schedule'>Schedule</TabsTrigger>
              <TabsTrigger value='location'>Location</TabsTrigger>
            </TabsList>

            <TabsContent value='settings' className='space-y-4'>
              <div className='flex items-center justify-between'>
                <Label htmlFor='allowComments'>Allow comments</Label>
                <Switch
                  id='allowComments'
                  checked={watch('allowComments')}
                  onCheckedChange={checked => setValue('allowComments', checked)}
                />
              </div>
              <div className='flex items-center justify-between'>
                <Label htmlFor='allowReactions'>Allow reactions</Label>
                <Switch
                  id='allowReactions'
                  checked={watch('allowReactions')}
                  onCheckedChange={checked => setValue('allowReactions', checked)}
                />
              </div>
              <div className='flex items-center justify-between'>
                <Label htmlFor='allowSharing'>Allow sharing</Label>
                <Switch
                  id='allowSharing'
                  checked={watch('allowSharing')}
                  onCheckedChange={checked => setValue('allowSharing', checked)}
                />
              </div>
            </TabsContent>

            <TabsContent value='schedule' className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='status'>Post status</Label>
                <Select
                  value={watch('status')}
                  onValueChange={value => setValue('status', value as unknown)}
                >
                  <SelectTrigger id='status'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='draft'>Save as draft</SelectItem>
                    <SelectItem value='published'>Publish now</SelectItem>
                    <SelectItem value='scheduled'>Schedule for later</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {watch('status') === 'scheduled' && (
                <div className='space-y-2'>
                  <Label htmlFor='scheduledDate'>Schedule date and time</Label>
                  <Input
                    id='scheduledDate'
                    type='datetime-local'
          {...register('scheduledDate')}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                  {errors.scheduledDate && (
                    <p className='text-sm text-destructive'>{errors.scheduledDate.message}</p>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value='location' className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='locationName'>Location name</Label>
                <div className='relative'>
                  <MapPin className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
                  <Input
                    id='locationName'
          {...register('location.name')}
                    placeholder='Where are you?'
                    className='pl-10'
                  />
                </div>
              </div>

              {watch('location.name') && (
                <Alert>
                  <MapPin className='w-4 h-4' />
                  <AlertDescription>Location will be shown with your post</AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>

      <CardFooter className='flex justify-between'>
        <div className='flex gap-2'>
          <Button type='button' variant='outline' onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type='button' variant='outline' onClick={saveDraft} disabled={isSubmitting}>
            <Save className='w-4 h-4 mr-2' />
            Save Draft
          </Button>
        </div>

        <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
          {isSubmitting ? (
            <>Creating...</>
          ) : (
            <>
              <Send className='w-4 h-4 mr-2' />
              {watch('status') === 'scheduled' ? 'Schedule' : 'Post'}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

// Type-specific content components
const TextPostContent: React.FC<{ form: any }> = ({ form }) => {
  const [showFormatting, setShowFormatting] = useState(false);

  return (
    <div className='space-y-2'>
      <Button
        type='button'
        variant='outline'
        size='sm'
        onClick={() => setShowFormatting(!showFormatting)}
      >
        <Type className='w-4 h-4 mr-2' />
        {showFormatting ? 'Hide' : 'Show'} Formatting
      </Button>

      {showFormatting && (
        <div className='flex gap-2 p-2 border rounded'>
          <Button type='button' variant='ghost' size='icon'>
            <Bold className='w-4 h-4' />
          </Button>
          <Button type='button' variant='ghost' size='icon'>
            <Italic className='w-4 h-4' />
          </Button>
          <Button type='button' variant='ghost' size='icon'>
            <Underline className='w-4 h-4' />
          </Button>
          <Button type='button' variant='ghost' size='icon'>
            <Link className='w-4 h-4' />
          </Button>
        </div>
      )}
    </div>
  );
};

const ImagePostContent: React.FC<{ form: unknown; uploadProgress: number }> = ({
  form,
  uploadProgress,
}) => {
  const {
    watch,
    setValue,
    register,
    formState: { errors },
  } = form;
  const images = watch('images') || [];

  return (
    <div className='space-y-4'>
      <div className='space-y-2'>
        <Label>Upload Images</Label>
        <p className='text-sm text-muted-foreground'>You can upload up to 10 images</p>
      </div>

      {uploadProgress > 0 && uploadProgress < 100 && (
        <Progress value={uploadProgress} className='w-full' />
      )}

      {images.length > 0 && (
        <>
          <div className='space-y-2'>
            <Label htmlFor='layout'>Layout</Label>
            <Select value={watch('layout')} onValueChange={value => setValue('layout', value)}>
              <SelectTrigger id='layout'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='grid'>
                  <div className='flex items-center gap-2'>
                    <Grid3x3 className='w-4 h-4' />
                    Grid
                  </div>
                </SelectItem>
                <SelectItem value='carousel'>
                  <div className='flex items-center gap-2'>
                    <List className='w-4 h-4' />
                    Carousel
                  </div>
                </SelectItem>
                <SelectItem value='single'>
                  <div className='flex items-center gap-2'>
                    <Square className='w-4 h-4' />
                    Single
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            {images.map((image: unknown, index: number) => (
              <div key={index} className='space-y-2 p-3 border rounded'>
                <img src={image.url} alt='' className='w-full h-32 object-cover rounded' />
                <Input {...register(`images.${index}.caption`)} placeholder='Add a caption...' />
                <Input
          {...register(`images.${index}.altText`)}
                  placeholder='Describe this image...'
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const VideoPostContent: React.FC<{ form: unknown; uploadProgress: number }> = ({
  form,
  uploadProgress,
}) => {
  const {
    watch,
    register,
    setValue,
    formState: { errors },
  } = form;

  return (
    <div className='space-y-4'>
      <div className='space-y-2'>
        <Label htmlFor='videoUrl'>Video URL</Label>
        <div className='relative'>
          <Video className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
          <Input
            id='videoUrl'
          {...register('video.url')}
            placeholder='Upload or paste video URL'
            className='pl-10'
          />
        </div>
        {errors.video?.url && (
          <p className='text-sm text-destructive'>{errors.video.url.message}</p>
        )}
      </div>

      {uploadProgress > 0 && uploadProgress < 100 && (
        <Progress value={uploadProgress} className='w-full' />
      )}

      {watch('video.url') && (
        <>
          <div className='space-y-2'>
            <Label htmlFor='thumbnailUrl'>Thumbnail</Label>
            <Input
              id='thumbnailUrl'
          {...register('video.thumbnailUrl')}
              placeholder='Upload thumbnail image'
            />
          </div>

          <div className='flex gap-4'>
            <div className='flex items-center gap-2'>
              <Switch
                id='autoplay'
                checked={watch('autoplay')}
                onCheckedChange={checked => setValue('autoplay', checked)}
              />
              <Label htmlFor='autoplay'>Autoplay</Label>
            </div>
            <div className='flex items-center gap-2'>
              <Switch
                id='loop'
                checked={watch('loop')}
                onCheckedChange={checked => setValue('loop', checked)}
              />
              <Label htmlFor='loop'>Loop</Label>
            </div>
            <div className='flex items-center gap-2'>
              <Switch
                id='muted'
                checked={watch('muted')}
                onCheckedChange={checked => setValue('muted', checked)}
              />
              <Label htmlFor='muted'>Muted</Label>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const AudioPostContent: React.FC<{ form: unknown; uploadProgress: number }> = ({
  form,
  uploadProgress,
}) => {
  const {
    watch,
    register,
    setValue,
    formState: { errors },
  } = form;

  return (
    <div className='space-y-4'>
      <div className='space-y-2'>
        <Label htmlFor='audioUrl'>Audio file</Label>
        <div className='relative'>
          <Music className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
          <Input
            id='audioUrl'
          {...register('audio.url')}
            placeholder='Upload audio file'
            className='pl-10'
          />
        </div>
        {errors.audio?.url && (
          <p className='text-sm text-destructive'>{errors.audio.url.message}</p>
        )}
      </div>

      {uploadProgress > 0 && uploadProgress < 100 && (
        <Progress value={uploadProgress} className='w-full' />
      )}

      {watch('audio.url') && (
        <>
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='audioTitle'>Title</Label>
              <Input id='audioTitle' {...register('audio.title')} placeholder='Track title' />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='audioArtist'>Artist</Label>
              <Input id='audioArtist' {...register('audio.artist')} placeholder='Artist name' />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='coverUrl'>Cover image</Label>
            <Input id='coverUrl' {...register('audio.coverUrl')} placeholder='Upload cover image' />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='visualizer'>Visualizer style</Label>
            <Select
              value={watch('visualizer')}
              onValueChange={value => setValue('visualizer', value)}
            >
              <SelectTrigger id='visualizer'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='waveform'>Waveform</SelectItem>
                <SelectItem value='bars'>Bars</SelectItem>
                <SelectItem value='circular'>Circular</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}
    </div>
  );
};

const PollPostContent: React.FC<{ form: any }> = ({ form }) => {
  const {
    watch,
    setValue,
    register,
    formState: { errors },
  } = form;
  const options = watch('poll.options') || [];

  const addOption = () => {
    if (options.length < 6) {
      setValue('poll.options', [...options, { text: '', emoji: '' }]);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setValue(
        'poll.options',
        options.filter((_: unknown, i: number) => i !== index)
      );
    }
  };

  return (
    <div className='space-y-4'>
      <div className='space-y-2'>
        <Label htmlFor='pollQuestion'>Poll question</Label>
        <Input
          id='pollQuestion'
          {...register('poll.question')}
          placeholder='What do you want to ask?'
        />
        {errors.poll?.question && (
          <p className='text-sm text-destructive'>{errors.poll.question.message}</p>
        )}
      </div>

      <div className='space-y-2'>
        <Label>Options</Label>
        {options.map((option: unknown, index: number) => (
          <div key={index} className='flex gap-2'>
            <Input
          {...register(`poll.options.${index}.text`)}
              placeholder={`Option ${index + 1}`}
            />
            <Input {...register(`poll.options.${index}.emoji`)} placeholder='😊' className='w-16' />
            <Button
              type='button'
              variant='ghost'
              size='icon'
              onClick={() => removeOption(index)}
              disabled={options.length <= 2}
            >
              <Trash2 className='w-4 h-4' />
            </Button>
          </div>
        ))}

        {options.length < 6 && (
          <Button type='button' variant='outline' size='sm' onClick={addOption}>
            <Plus className='w-4 h-4 mr-2' />
            Add Option
          </Button>
        )}
      </div>

      <div className='space-y-4'>
        <div className='flex items-center gap-2'>
          <Switch
            id='allowMultiple'
            checked={watch('poll.allowMultiple')}
            onCheckedChange={checked => setValue('poll.allowMultiple', checked)}
          />
          <Label htmlFor='allowMultiple'>Allow multiple choices</Label>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='pollEndDate'>End date (optional)</Label>
          <Input
            id='pollEndDate'
            type='datetime-local'
          {...register('poll.endDate')}
            min={new Date().toISOString().slice(0, 16)}
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='showResults'>Show results</Label>
          <Select
            value={watch('poll.showResults')}
            onValueChange={value => setValue('poll.showResults', value as unknown)}
          >
            <SelectTrigger id='showResults'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='always'>Always visible</SelectItem>
              <SelectItem value='after_vote'>After voting</SelectItem>
              <SelectItem value='after_end'>After poll ends</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

const EventPostContent: React.FC<{ form: any }> = ({ form }) => {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  return (
    <div className='space-y-4'>
      <div className='space-y-2'>
        <Label htmlFor='eventTitle'>Event title</Label>
        <Input id='eventTitle' {...register('event.title')} placeholder="What's happening?" />
        {errors.event?.title && (
          <p className='text-sm text-destructive'>{errors.event.title.message}</p>
        )}
      </div>

      <div className='grid grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <Label htmlFor='startDate'>Start date</Label>
          <Input id='startDate' type='datetime-local' {...register('event.startDate')} />
          {errors.event?.startDate && (
            <p className='text-sm text-destructive'>{errors.event.startDate.message}</p>
          )}
        </div>
        <div className='space-y-2'>
          <Label htmlFor='endDate'>End date (optional)</Label>
          <Input id='endDate' type='datetime-local' {...register('event.endDate')} />
        </div>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='eventLocation'>Location</Label>
        <div className='relative'>
          <MapPin className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
          <Input
            id='eventLocation'
          {...register('event.location')}
            placeholder='Where is it happening?'
            className='pl-10'
          />
        </div>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='ticketUrl'>Ticket URL (optional)</Label>
        <div className='relative'>
          <Link className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
          <Input
            id='ticketUrl'
          {...register('event.ticketUrl')}
            placeholder='Link to tickets'
            className='pl-10'
          />
        </div>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='coverImage'>Cover image</Label>
        <Input id='coverImage' {...register('event.coverImage')} placeholder='Upload event cover' />
      </div>

      <div className='flex gap-4'>
        <div className='flex items-center gap-2'>
          <Switch
            id='showRSVP'
            checked={watch('showRSVP')}
            onCheckedChange={checked => setValue('showRSVP', checked)}
          />
          <Label htmlFor='showRSVP'>Show RSVP button</Label>
        </div>
        <div className='flex items-center gap-2'>
          <Switch
            id='showTicketButton'
            checked={watch('showTicketButton')}
            onCheckedChange={checked => setValue('showTicketButton', checked)}
          />
          <Label htmlFor='showTicketButton'>Show ticket button</Label>
        </div>
      </div>
    </div>
  );
};

const ProductPostContent: React.FC<{ form: any }> = ({ form }) => {
  const {
    watch,
    setValue,
    register,
    formState: { errors },
  } = form;

  return (
    <div className='space-y-4'>
      <div className='space-y-2'>
        <Label htmlFor='productName'>Product name</Label>
        <Input
          id='productName'
          {...register('product.name')}
          placeholder='What are you showcasing?'
        />
        {errors.product?.name && (
          <p className='text-sm text-destructive'>{errors.product.name.message}</p>
        )}
      </div>

      <div className='space-y-2'>
        <Label htmlFor='productDescription'>Description</Label>
        <Textarea
          id='productDescription'
          {...register('product.description')}
          placeholder='Describe your product...'
          rows={3}
        />
      </div>

      <div className='grid grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <Label htmlFor='productPrice'>Price</Label>
          <Input
            id='productPrice'
            type='number'
            {...register('product.price', { valueAsNumber: true })}
            placeholder='0.00'
            step='0.01'
            min='0'
          />
          {errors.product?.price && (
            <p className='text-sm text-destructive'>{errors.product.price.message}</p>
          )}
        </div>
        <div className='space-y-2'>
          <Label htmlFor='currency'>Currency</Label>
          <Select
            value={watch('product.currency')}
            onValueChange={value => setValue('product.currency', value)}
          >
            <SelectTrigger id='currency'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='USD'>USD</SelectItem>
              <SelectItem value='EUR'>EUR</SelectItem>
              <SelectItem value='GBP'>GBP</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className='space-y-2'>
        <Label>Product images</Label>
        <p className='text-sm text-muted-foreground'>Add product images (max 5)</p>
      </div>

      <div className='grid grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <Label htmlFor='ctaText'>Button text</Label>
          <Input id='ctaText' {...register('product.ctaText')} placeholder='Shop Now' />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='ctaUrl'>Product URL</Label>
          <div className='relative'>
            <Link className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
            <Input
              id='ctaUrl'
              {...register('product.ctaUrl')}
              placeholder='Link to product'
              className='pl-10'
            />
          </div>
        </div>
      </div>

      <div className='flex gap-4'>
        <div className='flex items-center gap-2'>
          <Switch
            id='showPrice'
            checked={watch('showPrice')}
            onCheckedChange={checked => setValue('showPrice', checked)}
          />
          <Label htmlFor='showPrice'>Show price</Label>
        </div>
        <div className='flex items-center gap-2'>
          <Switch
            id='enableQuickBuy'
            checked={watch('enableQuickBuy')}
            onCheckedChange={checked => setValue('enableQuickBuy', checked)}
          />
          <Label htmlFor='enableQuickBuy'>Enable quick buy</Label>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
