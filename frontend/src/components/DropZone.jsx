import { useRef, useState } from 'react'

export default function DropZone({ file, onFile, accept = '.mp4,.mp3,.pdf', disabled = false }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files?.[0]
    if (dropped) onFile(dropped)
  }

  return (
    <div role="button" tabIndex={0}
        onClick={() => !disabled && inputRef.current.click()}
        onDrop={(e) => (disabled ? e.preventDefault() : handleDrop(e))}
         onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current.click()}
         onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
         onDragLeave={() => setDragging(false)}
         
             style={{ border: `2px dashed ${dragging ? 'var(--mint)' : 'var(--line)'}`, borderRadius: 14,
              background: dragging ? 'var(--mint-tint)' : 'var(--paper)', padding: '22px 16px',
              textAlign: 'center', transition: 'all .15s',
              opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}>
      <input ref={inputRef} type="file" accept={accept} hidden
             onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
      <div style={{ fontSize: 26, color: 'var(--mint)' }}>⬆</div>
      {file ? (
        <>
          <div style={{ fontWeight: 600, marginTop: 4 }}>{file.name}</div>
          <div className="muted" style={{ fontSize: 13 }}>
            {(file.size / 1024 / 1024).toFixed(1)} MB · click to choose another file
          </div>
        </>
      ) : (
        <>
          <div style={{ fontWeight: 600, marginTop: 4 }}>Drop a file here or click to browse</div>
          <div className="muted" style={{ fontSize: 13 }}>MP4, MP3 or PDF · max 25 MB</div>
        </>
      )}
    </div>
  )
}