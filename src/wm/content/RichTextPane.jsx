import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { Table, TableCell, TableHeader, TableRow, TableKit } from '@tiptap/extension-table'
import Image from '@tiptap/extension-image'
import { Markdown } from '@tiptap/markdown'

export function RichTextPane({ content, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Image.configure({
        inline: false,
        allowBase64: true,
      }),
      Markdown,
    ],
    editorProps: {
      attributes: {
        class: 'tiptap',
        spellcheck: 'false',
      },
    },
    onCreate: ({ editor }) => {
      if (content) {
        editor.commands.setContent(content, false, { contentType: 'markdown' })
      }
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getMarkdown())
    },
  })

  if (!editor) return null

  return <EditorContent editor={editor} />
}