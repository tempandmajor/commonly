import DOMPurify from 'dompurify';
import { HelpArticle } from '@/services/helpCenterService';
import { DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { X } from 'lucide-react';

interface ArticleContentProps {
  article: HelpArticle;
  onClose: () => void;
}

const ArticleContent = ({ article, onClose }: ArticleContentProps) => {
  // Sanitize the HTML content to prevent XSS attacks
  const sanitizedContent = DOMPurify.sanitize(article.content, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'em',
      'u',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul',
      'ol',
      'li',
      'a',
      'img',
      'blockquote',
      'code',
      'pre',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id'],
  });

  return (
    <div className='fixed inset-0 z-50 bg-background/80 backdrop-blur-sm'>
      <div className='fixed left-[50%] top-[50%] z-50 w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] bg-background p-6 shadow-lg border rounded-lg'>
        <button
          onClick={onClose}
          className='absolute right-4 top-4 text-muted-foreground hover:text-foreground'
          aria-label='Close article'
        >
          <X className='h-4 w-4' />
        </button>

        <DialogTitle className='text-2xl font-bold mb-4'>{article.title}</DialogTitle>
        <DialogDescription className='sr-only'>Article about {article.title}</DialogDescription>

        <div
          className='prose prose-sm max-w-none'
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />
      </div>
    </div>
  );
};

export default ArticleContent;
