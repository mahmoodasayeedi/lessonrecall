"""Split a transcript into ~75-second chunks with a small overlap.

Why chunks? Later we embed each chunk and search them. A chunk must be
small enough to be precise (so the timestamp points to the right minute)
but big enough to hold a complete explanation.

Why overlap? If an explanation starts at the end of one chunk, the next
chunk repeats the last ~10 seconds, so the idea is not cut in half.
"""
from app.models import Chunk, Transcript, TranscriptSegment


def chunk_transcript(transcript: Transcript, target_seconds: int = 75, overlap_seconds: int = 10) -> list[Chunk]:
    segments = sorted(transcript.segments, key=lambda s: s.start)
    groups = _group_segments(segments, target_seconds, overlap_seconds)

    chunks = []
    for index, group in enumerate(groups):
        start = int(group[0].start)
        chunks.append(
            Chunk(
                chunk_index=index,
                text=" ".join(s.text for s in group),
                start_seconds=start,
                end_seconds=int(round(group[-1].end)),
                video_id=transcript.video_id,
                title=transcript.title,
                source_type=transcript.source_type,
                language=transcript.language,
                timestamp_url=f"{transcript.youtube_url}&t={start}s" if transcript.youtube_url else None,
            )
        )
    return chunks


def _group_segments(
    segments: list[TranscriptSegment], target_seconds: int, overlap_seconds: int
) -> list[list[TranscriptSegment]]:
    groups: list[list[TranscriptSegment]] = []
    current: list[TranscriptSegment] = []

    for seg in segments:
        current.append(seg)
        if current[-1].end - current[0].start >= target_seconds:
            groups.append(current)
            # Carry the last few seconds over into the next chunk (the overlap),
            # but never the whole chunk, so we always move forward.
            cutoff = current[-1].end - overlap_seconds
            carry = [s for s in current[1:] if s.start >= cutoff]
            current = carry

    # Whatever is left becomes the last chunk, unless it is only overlap we already stored
    if current and (not groups or current[-1] is not groups[-1][-1]):
        groups.append(current)
    return groups
