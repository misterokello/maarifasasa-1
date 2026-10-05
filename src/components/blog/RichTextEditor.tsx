import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { FontFamily } from '@tiptap/extension-font-family';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import { Extension } from '@tiptap/core';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Quote,
  Image as ImageIcon,
  Youtube as YoutubeIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Undo,
  Redo,
  Space,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    paragraphSpacing: {
      setSpaceBefore: (spacing: string) => ReturnType;
      setSpaceAfter: (spacing: string) => ReturnType;
      unsetSpaceBefore: () => ReturnType;
      unsetSpaceAfter: () => ReturnType;
    };
  }
}

const RichTextEditor = ({ content, onChange }: RichTextEditorProps) => {
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);

  // Custom line height extension
  const LineHeight = Extension.create({
    name: 'lineHeight',
    
    addOptions() {
      return {
        types: ['paragraph', 'heading'],
      };
    },
    
    addGlobalAttributes() {
      return [
        {
          types: this.options.types,
          attributes: {
            lineHeight: {
              default: null,
              parseHTML: element => element.style.lineHeight || null,
              renderHTML: attributes => {
                if (!attributes.lineHeight) {
                  return {};
                }
                return {
                  style: `line-height: ${attributes.lineHeight}`,
                };
              },
            },
          },
        },
      ];
    },
    
    addCommands() {
      return {
        setLineHeight: (lineHeight: string) => ({ commands }: any) => {
          return this.options.types.every((type: string) =>
            commands.updateAttributes(type, { lineHeight })
          );
        },
        unsetLineHeight: () => ({ commands }: any) => {
          return this.options.types.every((type: string) =>
            commands.resetAttributes(type, 'lineHeight')
          );
        },
      };
    },
  });

  // Custom paragraph spacing extension
  const ParagraphSpacing = Extension.create({
    name: 'paragraphSpacing',
    
    addOptions() {
      return {
        types: ['paragraph', 'heading', 'bulletList', 'orderedList'],
      };
    },
    
    addGlobalAttributes() {
      return [
        {
          types: this.options.types,
          attributes: {
            spaceBefore: {
              default: null,
              parseHTML: element => {
                const marginTop = element.style.marginTop;
                return marginTop ? marginTop.replace('px', '') : null;
              },
              renderHTML: attributes => {
                if (!attributes.spaceBefore) {
                  return {};
                }
                return {
                  style: `margin-top: ${attributes.spaceBefore}px`,
                };
              },
            },
            spaceAfter: {
              default: null,
              parseHTML: element => {
                const marginBottom = element.style.marginBottom;
                return marginBottom ? marginBottom.replace('px', '') : null;
              },
              renderHTML: attributes => {
                if (!attributes.spaceAfter) {
                  return {};
                }
                return {
                  style: `margin-bottom: ${attributes.spaceAfter}px`,
                };
              },
            },
          },
        },
      ];
    },
    
    addCommands() {
      return {
        setSpaceBefore:
          (spacing: string) =>
          ({ commands }: any) => {
            return this.options.types.every((type: string) =>
              commands.updateAttributes(type, { spaceBefore: spacing })
            );
          },
        setSpaceAfter:
          (spacing: string) =>
          ({ commands }: any) => {
            return this.options.types.every((type: string) =>
              commands.updateAttributes(type, { spaceAfter: spacing })
            );
          },
        unsetSpaceBefore:
          () =>
          ({ commands }: any) => {
            return this.options.types.every((type: string) =>
              commands.resetAttributes(type, 'spaceBefore')
            );
          },
        unsetSpaceAfter:
          () =>
          ({ commands }: any) => {
            return this.options.types.every((type: string) =>
              commands.resetAttributes(type, 'spaceAfter')
            );
          },
      };
    },
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextStyle,
      Color,
      FontFamily,
      LineHeight,
      ParagraphSpacing,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Youtube.configure({
        controls: true,
        nocookie: true,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  const addImage = () => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl('');
      setImageDialogOpen(false);
    }
  };

  const addVideo = () => {
    if (videoUrl) {
      editor.commands.setYoutubeVideo({
        src: videoUrl,
        width: 640,
        height: 360,
      });
      setVideoUrl('');
      setVideoDialogOpen(false);
    }
  };

  const setLink = () => {
    if (!linkUrl) return;
    
    if (linkUrl === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
    setLinkUrl('');
    setLinkDialogOpen(false);
  };

  const openLinkDialog = () => {
    const previousUrl = editor.getAttributes('link').href;
    setLinkUrl(previousUrl || '');
    setLinkDialogOpen(true);
  };

  const ToolbarButton = ({ onClick, active, children }: any) => (
    <Button
      type="button"
      onClick={onClick}
      variant={active ? 'default' : 'ghost'}
      size="sm"
      className="h-8 w-8 p-0"
    >
      {children}
    </Button>
  );

  return (
    <div className="border rounded-lg overflow-hidden flex flex-col max-h-[80vh]">
      {/* Toolbar */}
      <div className="bg-muted/50 border-b p-2 flex flex-wrap gap-1 sticky top-0 z-10 shrink-0">
        {/* Text Formatting */}
        <div className="flex gap-1 border-r pr-2 mr-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive('underline')}
          >
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarButton>
        </div>

        {/* Headings */}
        <div className="flex gap-1 border-r pr-2 mr-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive('heading', { level: 1 })}
          >
            <Heading1 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive('heading', { level: 2 })}
          >
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive('heading', { level: 3 })}
          >
            <Heading3 className="h-4 w-4" />
          </ToolbarButton>
        </div>

        {/* Text Alignment */}
        <div className="flex gap-1 border-r pr-2 mr-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            active={editor.isActive({ textAlign: 'left' })}
          >
            <AlignLeft className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            active={editor.isActive({ textAlign: 'center' })}
          >
            <AlignCenter className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            active={editor.isActive({ textAlign: 'right' })}
          >
            <AlignRight className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            active={editor.isActive({ textAlign: 'justify' })}
          >
            <AlignJustify className="h-4 w-4" />
          </ToolbarButton>
        </div>

        {/* Lists & Quote */}
        <div className="flex gap-1 border-r pr-2 mr-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive('blockquote')}
          >
            <Quote className="h-4 w-4" />
          </ToolbarButton>
        </div>

        {/* Link */}
        <div className="flex gap-1 border-r pr-2 mr-2">
          <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                type="button" 
                variant={editor.isActive('link') ? 'default' : 'ghost'}
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={openLinkDialog}
              >
                <LinkIcon className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Insert Link</DialogTitle>
                <DialogDescription>
                  Enter the URL you want to link to
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="link-url">URL</Label>
                  <Input
                    id="link-url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://example.com"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        setLink();
                      }
                    }}
                  />
                </div>
              </div>
              <DialogFooter className="gap-2">
                {editor.isActive('link') && (
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      editor.chain().focus().unsetLink().run();
                      setLinkDialogOpen(false);
                    }}
                  >
                    Remove Link
                  </Button>
                )}
                <Button type="button" onClick={setLink}>
                  {editor.isActive('link') ? 'Update Link' : 'Insert Link'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Font Family */}
        <div className="border-r pr-2 mr-2">
          <Select
            value={editor.getAttributes('textStyle').fontFamily || 'default'}
            onValueChange={(value) => {
              if (value === 'default') {
                editor.chain().focus().unsetFontFamily().run();
              } else {
                editor.chain().focus().setFontFamily(value).run();
              }
            }}
          >
            <SelectTrigger className="h-8 w-32">
              <SelectValue placeholder="Font" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="Arial">Arial</SelectItem>
              <SelectItem value="'Courier New'">Courier New</SelectItem>
              <SelectItem value="Georgia">Georgia</SelectItem>
              <SelectItem value="'Times New Roman'">Times New Roman</SelectItem>
              <SelectItem value="Verdana">Verdana</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Paragraph Spacing */}
        <div className="flex gap-2 border-r pr-2 mr-2">
          <div>
            <Select
              value={
                editor.getAttributes('paragraph').spaceBefore ||
                editor.getAttributes('bulletList').spaceBefore ||
                editor.getAttributes('orderedList').spaceBefore ||
                'default'
              }
              onValueChange={(value) => {
                if (value === 'default') {
                  editor.chain().focus().unsetSpaceBefore().run();
                } else {
                  editor.chain().focus().setSpaceBefore(value).run();
                }
              }}
            >
              <SelectTrigger className="h-8 w-36">
                <SelectValue placeholder="Before" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Before: Default</SelectItem>
                <SelectItem value="0">Before: None (0)</SelectItem>
                <SelectItem value="4">Before: Tiny (4px)</SelectItem>
                <SelectItem value="8">Before: Small (8px)</SelectItem>
                <SelectItem value="12">Before: Medium (12px)</SelectItem>
                <SelectItem value="16">Before: Large (16px)</SelectItem>
                <SelectItem value="24">Before: XL (24px)</SelectItem>
                <SelectItem value="32">Before: 2XL (32px)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Select
              value={
                editor.getAttributes('paragraph').spaceAfter ||
                editor.getAttributes('bulletList').spaceAfter ||
                editor.getAttributes('orderedList').spaceAfter ||
                'default'
              }
              onValueChange={(value) => {
                if (value === 'default') {
                  editor.chain().focus().unsetSpaceAfter().run();
                } else {
                  editor.chain().focus().setSpaceAfter(value).run();
                }
              }}
            >
              <SelectTrigger className="h-8 w-36">
                <SelectValue placeholder="After" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">After: Default</SelectItem>
                <SelectItem value="0">After: None (0)</SelectItem>
                <SelectItem value="4">After: Tiny (4px)</SelectItem>
                <SelectItem value="8">After: Small (8px)</SelectItem>
                <SelectItem value="12">After: Medium (12px)</SelectItem>
                <SelectItem value="16">After: Large (16px)</SelectItem>
                <SelectItem value="24">After: XL (24px)</SelectItem>
                <SelectItem value="32">After: 2XL (32px)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Font Size */}
        <div className="border-r pr-2 mr-2">
          <Select
            onValueChange={(value) => {
              if (value === '1') {
                editor.chain().focus().toggleHeading({ level: 1 }).run();
              } else if (value === '2') {
                editor.chain().focus().toggleHeading({ level: 2 }).run();
              } else if (value === '3') {
                editor.chain().focus().toggleHeading({ level: 3 }).run();
              } else {
                editor.chain().focus().setParagraph().run();
              }
            }}
          >
            <SelectTrigger className="h-8 w-24">
              <SelectValue placeholder="Size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="3">Large</SelectItem>
              <SelectItem value="2">Medium</SelectItem>
              <SelectItem value="1">Huge</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Line Spacing */}
        <div className="border-r pr-2 mr-2">
          <Select
            value={editor.getAttributes('paragraph').lineHeight || 'default'}
            onValueChange={(value) => {
              if (value === 'default') {
                editor.chain().focus().unsetLineHeight().run();
              } else {
                editor.chain().focus().setLineHeight(value).run();
              }
            }}
          >
            <SelectTrigger className="h-8 w-32">
              <SelectValue placeholder="Spacing" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="1">Single (1.0)</SelectItem>
              <SelectItem value="1.15">1.15</SelectItem>
              <SelectItem value="1.5">1.5</SelectItem>
              <SelectItem value="2">Double (2.0)</SelectItem>
              <SelectItem value="2.5">2.5</SelectItem>
              <SelectItem value="3">Triple (3.0)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Text Color */}
        <div className="border-r pr-2 mr-2">
          <input
            type="color"
            onInput={(e) =>
              editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()
            }
            value={editor.getAttributes('textStyle').color || '#000000'}
            className="h-8 w-12 rounded border cursor-pointer"
          />
        </div>

        {/* Media */}
        <div className="flex gap-1 border-r pr-2 mr-2">
          <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0">
                <ImageIcon className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Insert Image</DialogTitle>
                <DialogDescription>
                  Enter the URL of the image you want to insert
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="image-url">Image URL</Label>
                  <Input
                    id="image-url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" onClick={addImage}>
                  Insert Image
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0">
                <YoutubeIcon className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Insert Video</DialogTitle>
                <DialogDescription>
                  Paste a YouTube or Vimeo link
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="video-url">Video URL</Label>
                  <Input
                    id="video-url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" onClick={addVideo}>
                  Insert Video
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Undo/Redo */}
        <div className="flex gap-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            active={false}
          >
            <Undo className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            active={false}
          >
            <Redo className="h-4 w-4" />
          </ToolbarButton>
        </div>
      </div>

      {/* Editor Content */}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-4 min-h-[400px] focus:outline-none overflow-y-auto flex-1"
      />
    </div>
  );
};

export default RichTextEditor;
