'use client'
import { useEffect, useState } from 'react'
import '@/lib/react-dom-polyfill'

interface EditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  modules?: any
  formats?: string[]
  className?: string
}

export default function Editor({ value, onChange, placeholder, modules, formats, className }: EditorProps) {
  const [mounted, setMounted] = useState(false)
  const [Quill, setQuill] = useState<any>(null)

  useEffect(() => {
    setMounted(true)
    import('react-quill').then((mod) => {
      setQuill(() => mod.default)
    })
  }, [])

  if (!mounted || !Quill) {
    return (
      <div className="h-[200px] border rounded-md bg-muted/20 animate-pulse" />
    )
  }

  return (
    <Quill
      theme="snow"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      modules={modules}
      formats={formats}
      className={className}
    />
  )
}
