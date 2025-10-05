# FFmpeg Installation Guide

To enable real video thumbnail generation (instead of placeholder thumbnails), install FFmpeg:

## Ubuntu/Debian:
```bash
sudo apt update
sudo apt install ffmpeg
```

## macOS (with Homebrew):
```bash
brew install ffmpeg
```

## Windows:
1. Download FFmpeg from https://ffmpeg.org/download.html
2. Extract to a folder (e.g., C:\ffmpeg)
3. Add C:\ffmpeg\bin to your PATH environment variable

## Verify Installation:
```bash
ffmpeg -version
```

## Current Status:
- ✅ Enhanced placeholder thumbnails are working
- ✅ Custom thumbnail uploads work
- ⚠️ Real video thumbnail generation requires FFmpeg
- ✅ System gracefully falls back to enhanced placeholders

Once FFmpeg is installed, the system will automatically:
1. Generate real thumbnails from video frames
2. Extract video metadata (duration, resolution)
3. Create multiple thumbnail options
4. Fall back to enhanced placeholders if generation fails
