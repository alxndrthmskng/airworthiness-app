import Link from 'next/link'

interface FeedPost {
  id: string
  author_id: string
  post_type: string
  data: Record<string, unknown>
  created_at: string
  author_handle: string
  author_display_name: string
  author_avatar_path: string | null
}

interface Props {
  post: FeedPost
  avatarUrl: string | null
  isOwn: boolean
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  const now = Date.now()
  const diff = Math.max(0, now - then)
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks}w ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function renderBody(post: FeedPost): React.ReactNode {
  const d = post.data as Record<string, string | number | null>
  switch (post.post_type) {
    case 'module_pass':
      return (
        <div>
          <p className="text-sm font-medium text-foreground">
            Passed Module {d.module_id} ({d.category})
          </p>
          {(d.mcq_score !== null || d.essay_score !== null) && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {d.mcq_score !== null && <>MCQ {d.mcq_score}%</>}
              {d.mcq_score !== null && d.essay_score !== null && ' · '}
              {d.essay_score !== null && <>Essay {d.essay_score}%</>}
            </p>
          )}
        </div>
      )
    case 'type_rating_added':
      return (
        <div>
          <p className="text-sm font-medium text-foreground">New type rating</p>
          <p className="text-xs text-muted-foreground mt-0.5">{d.rating}</p>
        </div>
      )
    case 'training_completed':
      return (
        <div>
          <p className="text-sm font-medium text-foreground">Continuation training completed</p>
          <p className="text-xs text-muted-foreground mt-0.5">{d.training_slug}</p>
        </div>
      )
    default:
      return <p className="text-sm text-muted-foreground">{post.post_type}</p>
  }
}

export function PostCard({ post, avatarUrl, isOwn }: Props) {
  return (
    <article className="rounded-xl border border-border p-5">
      <header className="flex items-center gap-3 mb-3">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-border/60" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-muted border border-border/60 flex items-center justify-center text-xs font-semibold text-muted-foreground">
            {post.author_display_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <Link href={`/u/${post.author_handle}`} className="text-sm font-medium text-foreground hover:underline">
            {post.author_display_name}
          </Link>
          <p className="text-xs text-muted-foreground">@{post.author_handle} · {relativeTime(post.created_at)}</p>
        </div>
        {isOwn && (
          <form action={`/api/posts/${post.id}`} method="DELETE" className="hidden" />
        )}
      </header>
      {renderBody(post)}
    </article>
  )
}
