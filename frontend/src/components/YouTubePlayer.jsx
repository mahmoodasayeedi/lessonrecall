// Embedded YouTube player. Changing `start` reloads the video at that second.
export default function YouTubePlayer({ videoId, start = 0, seekKey = 0, title }) {
  if (!videoId) {
    return (
      <div style={{ aspectRatio: '16 / 9', background: 'var(--player)', borderRadius: 14, color: '#D9D2EA',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
        Select a YouTube video from the materials to watch it here.
      </div>
    )
  }
  const autoplay = seekKey > 0 ? 1 : 0     // only autoplay after the user clicked a timestamp
  return (
    <iframe
      key={`${videoId}-${seekKey}`}          // a new key makes React reload the iframe at the new start time
      title={title || 'Course video'}
      src={`https://www.youtube.com/embed/${videoId}?start=${start}&autoplay=${autoplay}&rel=0`}
      style={{ width: '100%', aspectRatio: '16 / 9', border: 'none', borderRadius: 14, background: 'var(--player)' }}
      allow="autoplay; encrypted-media; picture-in-picture"
      allowFullScreen
    />
  )
}