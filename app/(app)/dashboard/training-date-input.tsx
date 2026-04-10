'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface TrainingDateInputProps {
  slug: string
  label: string
  userId: string
}

export function TrainingDateInput({ slug, label, userId }: TrainingDateInputProps) {
  const router = useRouter()
  const [date, setDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')

  async function handleSaveDate() {
    if (!date) return
    setSaving(true)

    const res = await fetch('/api/certificates/upsert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ course_slug: slug, issued_at: date }),
    })

    setSaving(false)
    if (res.ok) router.refresh()
  }

  async function handleUpload(file: File) {
    setUploading(true)
    setUploadMsg('')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('bucket', 'certificates')
    formData.append('path_prefix', `training/${userId}/${slug}`)

    const res = await fetch('/api/storage/upload', {
      method: 'POST',
      body: formData,
    })

    setUploading(false)
    if (!res.ok) {
      setUploadMsg('Upload failed')
    } else {
      setUploadMsg('Certificate uploaded')
    }
  }

  return (
    <div className="mt-2 space-y-2">
      <p className="text-sm text-muted-foreground">No certificate on record. If completed with another provider, enter the date below.</p>
      <div className="flex items-center gap-3">
        <Input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="text-sm w-40"
        />
        <Button size="sm" onClick={handleSaveDate} disabled={saving || !date}>
          {saving ? 'Saving...' : 'Save Date'}
        </Button>
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) handleUpload(file)
            }}
          />
          <span className="inline-flex items-center px-3 py-1.5 rounded-md border text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
            {uploading ? 'Uploading...' : 'Upload Certificate'}
          </span>
        </label>
        {uploadMsg && <span className="text-xs text-green-600">{uploadMsg}</span>}
      </div>
    </div>
  )
}
