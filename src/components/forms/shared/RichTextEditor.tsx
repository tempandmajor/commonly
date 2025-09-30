import React, { useCallback, useMemo } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Link,
  Image,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Heading3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string | undefined;
  className?: string | undefined;
  minHeight?: string | undefined;
  maxHeight?: string | undefined;
  disabled?: boolean | undefined;
  showToolbar?: boolean | undefined;
  allowedFormats?: string[] | undefined;
}

type FormatType =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strikethrough'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'ul'
  | 'ol'
  | 'quote'
  | 'code'
  | 'link'
  | 'image'
  | 'align-left'
  | 'align-center'
  | 'align-right'
  | 'undo'
  | 'redo';

interface ToolbarButton {
  type: FormatType;
  icon: React.ComponentType<{ className?: string } | undefined | undefined | undefined>;
  tooltip: string;
  shortcut?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start typing...',
  className,
  minHeight = '200px',
  maxHeight = '500px',
  disabled = false,
  showToolbar = true,
  allowedFormats = [
    'bold',
    'italic',
    'underline',
    'strikethrough',
    'h1',
    'h2',
    'h3',
    'ul',
    'ol',
    'quote',
    'code',
    'link',
    'image',
    'align-left',
    'align-center',
    'align-right',
    'undo',
    'redo',
  ],
}) => {
  const [selection, setSelection] = React.useState({ start: 0, end: 0 });
  const [history, setHistory] = React.useState<string[]>([value]);
  const [historyIndex, setHistoryIndex] = React.useState(0);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const toolbarButtons: ToolbarButton[] = [
    { type: 'bold', icon: Bold, tooltip: 'Bold', shortcut: 'Ctrl+B' },
    { type: 'italic', icon: Italic, tooltip: 'Italic', shortcut: 'Ctrl+I' },
    { type: 'underline', icon: Underline, tooltip: 'Underline', shortcut: 'Ctrl+U' },
    { type: 'strikethrough', icon: Strikethrough, tooltip: 'Strikethrough' },
    { type: 'h1', icon: Heading1, tooltip: 'Heading 1' },
    { type: 'h2', icon: Heading2, tooltip: 'Heading 2' },
    { type: 'h3', icon: Heading3, tooltip: 'Heading 3' },
    { type: 'ul', icon: List, tooltip: 'Bullet List' },
    { type: 'ol', icon: ListOrdered, tooltip: 'Numbered List' },
    { type: 'quote', icon: Quote, tooltip: 'Blockquote' },
    { type: 'code', icon: Code, tooltip: 'Code Block' },
    { type: 'link', icon: Link, tooltip: 'Insert Link' },
    { type: 'image', icon: Image, tooltip: 'Insert Image' },
    { type: 'align-left', icon: AlignLeft, tooltip: 'Align Left' },
    { type: 'align-center', icon: AlignCenter, tooltip: 'Align Center' },
    { type: 'align-right', icon: AlignRight, tooltip: 'Align Right' },
    { type: 'undo', icon: Undo, tooltip: 'Undo', shortcut: 'Ctrl+Z' },
    { type: 'redo', icon: Redo, tooltip: 'Redo', shortcut: 'Ctrl+Y' },
  ];

  const filteredButtons = toolbarButtons.filter(btn => allowedFormats.includes(btn.type));

  const updateHistory = useCallback(
    (newValue: string) => {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newValue);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    },
    [history, historyIndex]
  );

  const wrapSelection = useCallback(
    (prefix: string, suffix: string = prefix) => {
      if (!textareaRef.current) return;

      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end);

      const newText =
        value.substring(0, start) + prefix + selectedText + suffix + value.substring(end);

      onChange(newText);
      updateHistory(newText);

      // Restore cursor position
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, end + prefix.length);
      }, 0);
    },
    [value, onChange, updateHistory]
  );

  const insertAtCursor = useCallback(
    (text: string) => {
      if (!textareaRef.current) return;

      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const newText = value.substring(0, start) + text + value.substring(end);

      onChange(newText);
      updateHistory(newText);

      // Move cursor after inserted text
      setTimeout(() => {
        textarea.focus();
        const newPosition = start + text.length;
        textarea.setSelectionRange(newPosition, newPosition);
      }, 0);
    },
    [value, onChange, updateHistory]
  );

  const applyFormat = useCallback(
    (format: FormatType) => {
      switch (format) {
        case 'bold':
          wrapSelection('**');
          break;
        case 'italic':
          wrapSelection('*');
          break;
        case 'underline':
          wrapSelection('<u>', '</u>');
          break;
        case 'strikethrough':
          wrapSelection('~~');
          break;
        case 'h1':
          insertAtCursor('\n# ');
          break;
        case 'h2':
          insertAtCursor('\n## ');
          break;
        case 'h3':
          insertAtCursor('\n### ');
          break;
        case 'ul':
          insertAtCursor('\n- ');
          break;
        case 'ol':
          insertAtCursor('\n1. ');
          break;
        case 'quote':
          insertAtCursor('\n> ');
          break;
        case 'code':
          wrapSelection('```\n', '\n```');
          break;
        case 'link':
          const url = prompt('Enter URL:');
          if (url) {
            wrapSelection('[', `](${url})`);
          }
          break;
        case 'image':
          const imageUrl = prompt('Enter image URL:');
          if (imageUrl) {
            insertAtCursor(`![alt text](${imageUrl})`);
          }
          break;
        case 'align-left':
          wrapSelection('<div style="text-align: left">', '</div>');
          break;
        case 'align-center':
          wrapSelection('<div style="text-align: center">', '</div>');
          break;
        case 'align-right':
          wrapSelection('<div style="text-align: right">', '</div>');
          break;
        case 'undo':
          if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
            onChange(history[historyIndex - 1]);
          }
          break;
        case 'redo':
          if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1);
            onChange(history[historyIndex + 1]);
          }
          break;
      }
    },
    [wrapSelection, insertAtCursor, history, historyIndex, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'b':
            e.preventDefault();
            applyFormat('bold');
            break;
          case 'i':
            e.preventDefault();
            applyFormat('italic');
            break;
          case 'u':
            e.preventDefault();
            applyFormat('underline');
            break;
          case 'z':
            e.preventDefault();
            applyFormat('undo');
            break;
          case 'y':
            e.preventDefault();
            applyFormat('redo');
            break;
        }
      }
    },
    [applyFormat]
  );

  const groupedButtons = useMemo(() => {
    const groups: ToolbarButton[][] = [];
    let currentGroup: ToolbarButton[] = [];

    filteredButtons.forEach((btn, index) => {
      currentGroup.push(btn);

      // Create new group after certain buttons
      if (['strikethrough', 'h3', 'code', 'image', 'align-right'].includes(btn.type)) {
        groups.push(currentGroup);
        currentGroup = [];
      }
    });

    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  }, [filteredButtons]);

  return (
    <div className={cn('border rounded-lg overflow-hidden', className)}>
      {showToolbar && (
        <div className='border-b bg-muted/50 p-2'>
          <TooltipProvider>
            <div className='flex items-center gap-1 flex-wrap'>
              {groupedButtons.map((group, groupIndex) => (
                <React.Fragment key={groupIndex}>
                  {groupIndex > 0 && <Separator orientation='vertical' className='h-6 mx-1' />}
                  {group.map(btn => (
                    <Tooltip key={btn.type}>
                      <TooltipTrigger asChild>
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8'
                          onClick={() => applyFormat(btn.type)}
                          disabled={disabled}
                        >
                          <btn.icon className='h-4 w-4' />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {btn.tooltip}
                          {btn.shortcut && (
                            <span className='ml-2 text-xs opacity-60'>{btn.shortcut}</span>
                          )}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </TooltipProvider>
        </div>
      )}

      <Textarea
        ref={textareaRef}
        value={value}
        onChange={e => {
          onChange((e.target as HTMLInputElement).value);
          updateHistory((e.target as HTMLInputElement).value);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'border-0 resize-none focus-visible:ring-0 rounded-none',
          'prose prose-sm max-w-none'
        )}
        style={{
          minHeight,
          maxHeight,
        }}
      />
    </div>
  );
};
