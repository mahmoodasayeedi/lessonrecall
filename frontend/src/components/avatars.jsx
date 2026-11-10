export const AVATARS = [
  { id: 'owl',   emoji: '🦉', bg: '#DFF3EC' },
  { id: 'fox',   emoji: '🦊', bg: '#FBE4EC' },
  { id: 'panda', emoji: '🐼', bg: '#EEEAF5' },
  { id: 'cat',   emoji: '🐱', bg: '#FFF1D6' },
  { id: 'penguin', emoji: '🐧', bg: '#E3EEFB' },
  { id: 'flower', emoji: '🌸', bg: '#FBE4EC' },
  { id: 'rocket', emoji: '🚀', bg: '#EEEAF5' },
  { id: 'books',  emoji: '📚', bg: '#DFF3EC' },
]

export function AvatarCircle({ avatarId, name = '', size = 40 }) {
  const a = AVATARS.find((x) => x.id === avatarId)
  const initials = name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
  return (
    <span aria-hidden="true"
      style={{ width: size, height: size, borderRadius: '50%', display: 'inline-grid', placeItems: 'center',
               background: a ? a.bg : 'var(--soft)', border: '2px solid var(--line)', flexShrink: 0,
               fontSize: a ? size * 0.55 : size * 0.36, fontWeight: 700, color: 'var(--ink)' }}>
      {a ? a.emoji : initials}
    </span>
  )
}

// tell every open UserMenu that the avatar changed
export const announceAvatar = (id) => window.dispatchEvent(new CustomEvent('lr-avatar', { detail: id }))