'use client';

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Send, Image, Smile, AtSign, X, Star, Film, Eye, Reply, Heart, ThumbsUp, Frown } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { z } from 'zod';

const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(2000, 'Comment is too long'),
  isAnonymous: z.boolean().default(false),
  allowReplies: z.boolean().default(true),
  enableNotifications: z.boolean().default(true),
});

const reviewSchema = commentSchema.extend({
  rating: z.number().min(1).max(5),
  wouldRecommend: z.boolean().default(true),
});

type CommentFormValues = z.infer<typeof commentSchema>;
type ReviewFormValues = z.infer<typeof reviewSchema>;

interface Attachment {
  id: string;
  file: File;
  type: 'image' | 'video';
  url?: string | undefined;
  progress?: number | undefined;
}

interface User {
  id: string;
  name: string;
  avatar?: string | undefined;
  email?: string | undefined;
}

interface CommentFormProps {
  mode?: 'comment' | 'review' | 'reply' | 'edit';
  placeholder?: string | undefined;
  allowAttachments?: boolean | undefined;
  allowAnonymous?: boolean | undefined;
  allowRating?: boolean | undefined;
  maxLength?: number | undefined;
  minLength?: number | undefined;
  user?: User | undefined;
  parentComment?: {
    id: string | undefined;
    author: string;
    content: string;
  };
  editingComment?: {
    id: string;
    content: string;
    rating?: number;
    isAnonymous?: boolean;
  };
  onSubmit?: (data: CommentFormValues | ReviewFormValues) => Promise<void>;
  onCancel?: () => void;
  className?: string;
  autoFocus?: boolean;
  showUserInfo?: boolean;
}

const EMOJI_REACTIONS = [
  { emoji: '👍', label: 'Like', icon: ThumbsUp },
  { emoji: '❤️', label: 'Love', icon: Heart },
  { emoji: '😂', label: 'Laugh', icon: Smile },
  { emoji: '😮', label: 'Wow', icon: Eye },
  { emoji: '😢', label: 'Sad', icon: Frown },
] as const;

const MENTION_PATTERN = /@(\w+)/g;

export const CommentForm: React.FC<CommentFormProps> = ({
  mode = 'comment',
  placeholder,
  allowAttachments = true,
  allowAnonymous = false,
  allowRating = false,
  maxLength = 2000,
  minLength = 1,
  user,
  parentComment,
  editingComment,
  onSubmit,
  onCancel,
  className,
  autoFocus = false,
  showUserInfo = true,
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [detectedMentions, setDetectedMentions] = useState<string[]>([]);

  const formSchema = useMemo(() => {
    if (mode === 'review' || allowRating) {
      return reviewSchema;
    }
    return commentSchema;
  }, [mode, allowRating]);

  const form = useForm<CommentFormValues | ReviewFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: editingComment?.content || '',
      isAnonymous: editingComment?.isAnonymous ?? false,
      allowReplies: true,
      enableNotifications: true,
          ...(allowRating ? { rating: editingComment?.rating ?? 5, wouldRecommend: true } : {}),
    } as any,
  });

  const { watch, register, handleSubmit, setValue, formState: { errors, isValid } } = form;

  const watchContent = watch('content');

  const watchRating = allowRating ? (watch('rating' as any) as number | undefined) : undefined;

  const extractMentions = useCallback((text: string): string[] => {
    const mentions: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = MENTION_PATTERN.exec(text)) !== null) {
      if (match[1]) mentions.push(match[1]);
    }
    return Array.from(new Set(mentions));
  }, []);

  const handleContentChange = useCallback((content: string) => {
    setValue('content', content);
    const mentions = extractMentions(content);
    setDetectedMentions(mentions);

  }, [setValue, extractMentions]);

  const handleAttachment = useCallback(async (file: File, type: 'image' | 'video') => {
    if (!allowAttachments) return;

    const newAttachment: Attachment = {
      id: `${Date.now()}-${Math.random()}`,
      file,
      type,
      progress: 0,
    };

    setAttachments(prev => [...prev, newAttachment]);

    try {
      setUploadProgress(10);

      await new Promise(resolve => setTimeout(resolve, 1000));
      setUploadProgress(50);

      const mockUrl = URL.createObjectURL(file);
      setUploadProgress(100);

      setAttachments(prev =>
        prev.map(att =>
          att.id === newAttachment.id
            ? { ...att, url: mockUrl, progress: 100 }
            : att
        )
      );

      setTimeout(() => setUploadProgress(0), 500);
    } catch (error) {
      console.error('Upload failed:', error);
      setAttachments(prev => prev.filter(att => att.id !== newAttachment.id));
      toast({
        title: 'Upload failed',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }

  }, [allowAttachments, toast]);

  const removeAttachment = useCallback((id: string) => {
    setAttachments(prev => {
      const attachment = prev.find(att => att.id === id);
      if (attachment?.url) {
        URL.revokeObjectURL(attachment.url);
      }
      return prev.filter(att => att.id !== id);
    });

  }, []);

  const insertEmoji = useCallback((emoji: string) => {
    const currentContent = watchContent || '';
    const newContent = currentContent + emoji;
    handleContentChange(newContent);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();

  }, [watchContent, handleContentChange]);

  const onFormSubmit = useCallback(async (data: CommentFormValues | ReviewFormValues) => {
    if (!onSubmit) return;

    try {
      setIsSubmitting(true);

      const submissionData = {
        ...data,
        attachments: attachments.map(att => ({
          id: att.id,
          type: att.type,
          url: att.url,
        })),
        mentions: detectedMentions,
        ...(parentComment ? { parentId: parentComment.id } : {}),
        ...(editingComment ? { editingId: editingComment.id } : {}),
      };

      await onSubmit(submissionData as CommentFormValues | ReviewFormValues);

      form.reset();
      setAttachments([]);
      setDetectedMentions([]);

      toast({
        title: mode === 'edit' ? 'Comment updated' : 'Comment posted',
        description: mode === 'edit' ? 'Your comment has been updated successfully.' : 'Your comment has been posted successfully.',
      });
    } catch (error) {
      console.error('Submission failed:', error);
      toast({
        title: 'Failed to post comment',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }

  }, [onSubmit, attachments, detectedMentions, parentComment, editingComment, mode, form, toast]);

  const isFormValid = useMemo(() => {
    return isValid && watchContent && watchContent.trim().length >= minLength;

  }, [isValid, watchContent, minLength]);

  const remainingChars = useMemo(() => {
    return maxLength - (watchContent.length || 0);

  }, [maxLength, watchContent]);

  return (

    <Card className={cn('w-full transition-all duration-300 hover:shadow-md', className)}>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {showUserInfo && user && (
            <div className="flex items-center gap-3 animate-fade-in">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {user.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground">{user.name}</p>
                <p className="text-sm text-muted-foreground">
                  {mode === 'reply' && parentComment
                    ? `Replying to @${parentComment.author}`
                    : mode === 'edit'
                    ? 'Editing comment'
                    : 'Writing a comment'}
                </p>
              </div>
            </div>
          )}

          {parentComment && mode === 'reply' && (
            <Card className="bg-muted/30 border-l-4 border-l-primary animate-slide-in">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Reply className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">@{parentComment.author}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {parentComment.content}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {allowRating && (
            <div className="space-y-3 animate-slide-in-delay-1">
              <Label className="text-base font-medium">Rating</Label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setValue('rating' as any, star as any)}
                    className="transition-colors duration-200"
                  >
                    <Star
                      className={cn(
                        'h-6 w-6 transition-all duration-200',
                        star <= (watchRating || 0)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground hover:text-yellow-400'
                      )}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm font-medium">
                  {`${watchRating || 0} star${(watchRating || 0) !== 1 ? 's' : ''}`}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-3 animate-slide-in-delay-2">
            <div className="relative">
              <Textarea
          {...register('content')}
                ref={textareaRef}
                placeholder={placeholder || `Write your ${mode}...`}
                className={cn(
                  'min-h-[120px] resize-none transition-all duration-200',
                  'focus:ring-2 focus:ring-primary/20 focus:border-primary',
                  errors.content && 'border-destructive focus:border-destructive'
                )}
                maxLength={maxLength}
                onChange={(e) => handleContentChange((e.target as HTMLTextAreaElement).value)}
                autoFocus={autoFocus}
              />

              {remainingChars < 100 && (
                <div className={cn(
                  'absolute bottom-2 right-2 text-xs',
                  remainingChars < 20 ? 'text-destructive' : 'text-muted-foreground'
                )}>
                  {remainingChars}
                </div>
              )}
            </div>

            {errors.content && (
              <Alert className="animate-fade-in border-destructive/50 bg-destructive/10">
                <AlertDescription>{errors.content.message}</AlertDescription>
              </Alert>
            )}
          </div>

          {attachments.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-in-delay-3">
              {attachments.map((attachment) => (
                <div key={attachment.id} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                    {attachment.url ? (
                      attachment.type === 'image' ? (
                        <img
                          src={attachment.url}
                          alt="Attachment"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Film className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="animate-pulse bg-muted-foreground/20 w-full h-full" />
                      </div>
                    )}
                  </div>

                  <Button
                    type="button"
                    className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-all duration-200 border"
                    onClick={() => removeAttachment(attachment.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>

                  {attachment.progress !== undefined && attachment.progress < 100 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                      <Progress value={attachment.progress} className="w-3/4 h-1" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Uploading...</span>
                <span className="font-medium">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {detectedMentions.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground animate-fade-in">
              <AtSign className="w-4 h-4" />
              <span>Mentioning: {detectedMentions.map(m => `@${m}`).join(', ')}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              {allowAttachments && (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*,video/*"
                    onChange={(e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        const isImage = file.type.startsWith('image/');
                        const isVideo = file.type.startsWith('video/');
                        if (isImage || isVideo) {
                          handleAttachment(file, isImage ? 'image' : 'video');
                        }
                      }
                    }}

                  />

                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-9 px-3 transition-all duration-200 hover:bg-primary/10"
                  >
                    <Image className="w-4 h-4" />
                  </Button>
                </>
              )}

              <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    className="h-9 px-3 transition-all duration-200 hover:bg-primary/10"
                  >
                    <Smile className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-4">
                  <div className="grid grid-cols-5 gap-2">
                    {EMOJI_REACTIONS.map((reaction) => (
                      <button
                        key={reaction.emoji}
                        type="button"
                        onClick={() => insertEmoji(reaction.emoji)}
                        className="aspect-square rounded-md hover:bg-muted transition-colors duration-200 flex items-center justify-center text-lg"
                        title={reaction.label}
                      >
                        {reaction.emoji}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {allowAnonymous && (
                <div className="flex items-center gap-2 ml-4">
                  <Switch
          {...register('isAnonymous')}
                    id="anonymous"
                    className="data-[state=checked]:bg-primary"
                  />
                  <Label htmlFor="anonymous" className="text-sm">
                    Post anonymously
                  </Label>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {onCancel && (
                <Button
                  type="button"
                  onClick={onCancel}
                  className="transition-all duration-200 hover:bg-destructive/10 hover:text-destructive border"
                >
                  Cancel
                </Button>
              )}

              <Button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="min-w-[100px] transition-all duration-300 hover:scale-105"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    {mode === 'edit' ? 'Updating...' : 'Posting...'}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    {mode === 'edit' ? 'Update' : 'Post'}
                  </div>
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>

    </Card>

  );

};

export default CommentForm;