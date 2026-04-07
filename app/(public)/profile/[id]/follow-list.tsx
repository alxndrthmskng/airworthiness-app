import Link from 'next/link'

interface ListEntry {
  user_id: string
  public_id: string
  display_name: string
  avatar_path: string | null
  followed_since: string
}

interface Props {
  entries: ListEntry[]
  avatarUrlFor: (path: string | null) => string | null
  emptyMessage: string
}

export function FollowList({ entries, avatarUrlFor, emptyMessage }: Props) {
  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {entries.map(entry => {
        const avatarUrl = avatarUrlFor(entry.avatar_path)
        return (
          <Link
            key={entry.user_id}
            href={`/profile/${entry.public_id}`}
            className="rounded-xl border border-border p-4 flex items-center gap-3 hover:border-foreground/40 transition-colors"
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-border/60" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-muted border border-border/60 flex items-center justify-center text-xs font-semibold text-muted-foreground">
                {entry.display_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{entry.display_name}</p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
