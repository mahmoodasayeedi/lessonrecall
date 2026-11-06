"""Custom errors for the ingestion pipeline.

Java comparison: like custom exceptions you catch in a @ControllerAdvice.
main.py turns every IngestionError into a clean JSON error response.
"""


class IngestionError(Exception):
    status_code = 400
    code = "INGESTION_ERROR"

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


class InvalidUrlError(IngestionError):
    code = "INVALID_URL"


class VideoUnavailableError(IngestionError):
    status_code = 404
    code = "VIDEO_UNAVAILABLE"


class UnsupportedFileError(IngestionError):
    status_code = 415
    code = "UNSUPPORTED_FILE"


class FileTooLargeError(IngestionError):
    status_code = 413
    code = "FILE_TOO_LARGE"


class NoSpeechError(IngestionError):
    status_code = 422
    code = "NO_SPEECH"


class TranscriptionFailedError(IngestionError):
    status_code = 502
    code = "TRANSCRIPTION_FAILED"

class NoTextError(IngestionError):
    status_code = 422
    code = "NO_TEXT"

class NotFoundError(IngestionError):
    status_code = 404
    code = "NOT_FOUND"

class UnauthorizedError(IngestionError):
    status_code = 401
    code = "UNAUTHORIZED"
