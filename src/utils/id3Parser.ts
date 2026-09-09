export interface Id3Metadata {
  title?: string;
  artist?: string;
  album?: string;
  duration?: number; // in seconds
  coverBytes?: Uint8Array;
  coverMime?: string;
}

/**
 * Extracts ID3v2 metadata (Title, Artist, Album, Duration, and embedded Cover Art)
 * from the binary Uint8Array of an MP3/audio file.
 */
export function parseId3(bytes: Uint8Array): Id3Metadata {
  const result: Id3Metadata = {};
  if (bytes.length < 10) return result;

  let tagSize = 0;

  // Check 'ID3' header identifier
  if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
    const majorVersion = bytes[3]; // 2 = ID3v2.2, 3 = ID3v2.3, 4 = ID3v2.4
    tagSize =
      ((bytes[6] & 0x7f) << 21) |
      ((bytes[7] & 0x7f) << 14) |
      ((bytes[8] & 0x7f) << 7) |
      (bytes[9] & 0x7f);

    let offset = 10;
    const maxOffset = Math.min(bytes.length, 10 + tagSize);

    if (majorVersion === 2) {
      // ID3v2.2 uses 3-char frame IDs and 3-byte size
      while (offset + 6 < maxOffset) {
        if (bytes[offset] === 0) break; // Padding
        const frameId = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2]);
        const frameSize = (bytes[offset + 3] << 16) | (bytes[offset + 4] << 8) | bytes[offset + 5];
        if (frameSize <= 0 || offset + 6 + frameSize > maxOffset) break;

        const frameData = bytes.subarray(offset + 6, offset + 6 + frameSize);
        if (frameId === 'TT2') result.title = decodeText(frameData);
        else if (frameId === 'TP1') result.artist = decodeText(frameData);
        else if (frameId === 'TAL') result.album = decodeText(frameData);
        else if (frameId === 'TLE') {
          const ms = parseInt(decodeText(frameData), 10);
          if (!isNaN(ms) && ms > 0) result.duration = Math.round(ms / 1000);
        } else if (frameId === 'PIC') {
          const encoding = frameData[0];
          const format = String.fromCharCode(frameData[1], frameData[2], frameData[3]).toLowerCase();
          const mime = format === 'png' ? 'image/png' : 'image/jpeg';
          let descEnd = 5;
          if (encoding === 1 || encoding === 2) {
            while (
              descEnd < frameData.length - 1 &&
              !(frameData[descEnd] === 0 && frameData[descEnd + 1] === 0)
            ) {
              descEnd += 2;
            }
            descEnd += 2;
          } else {
            while (descEnd < frameData.length && frameData[descEnd] !== 0) descEnd++;
            descEnd += 1;
          }
          if (descEnd < frameData.length) {
            result.coverBytes = frameData.subarray(descEnd);
            result.coverMime = mime;
          }
        }
        offset += 6 + frameSize;
      }
    } else {
      // ID3v2.3 and ID3v2.4
      while (offset + 10 < maxOffset) {
        if (bytes[offset] === 0) break; // Padding

        const frameId = String.fromCharCode(
          bytes[offset],
          bytes[offset + 1],
          bytes[offset + 2],
          bytes[offset + 3]
        );

        let frameSize = 0;
        if (majorVersion === 4) {
          frameSize =
            ((bytes[offset + 4] & 0x7f) << 21) |
            ((bytes[offset + 5] & 0x7f) << 14) |
            ((bytes[offset + 6] & 0x7f) << 7) |
            (bytes[offset + 7] & 0x7f);
        } else {
          frameSize =
            (bytes[offset + 4] << 24) |
            (bytes[offset + 5] << 16) |
            (bytes[offset + 6] << 8) |
            bytes[offset + 7];
        }

        if (frameSize <= 0 || offset + 10 + frameSize > maxOffset) {
          break;
        }

        const frameData = bytes.subarray(offset + 10, offset + 10 + frameSize);

        if (frameId === 'TIT2') {
          result.title = decodeText(frameData);
        } else if (frameId === 'TPE1') {
          result.artist = decodeText(frameData);
        } else if (frameId === 'TALB') {
          result.album = decodeText(frameData);
        } else if (frameId === 'TLEN') {
          const ms = parseInt(decodeText(frameData), 10);
          if (!isNaN(ms) && ms > 0) {
            result.duration = Math.round(ms / 1000);
          }
        } else if (frameId === 'APIC') {
          try {
            const encoding = frameData[0];
            let mimeEnd = 1;
            while (mimeEnd < frameData.length && frameData[mimeEnd] !== 0) {
              mimeEnd++;
            }
            const mimeStr = String.fromCharCode(...frameData.subarray(1, mimeEnd)).toLowerCase();
            const mime = mimeStr.includes('png') ? 'image/png' : 'image/jpeg';

            let descEnd = mimeEnd + 2;
            if (encoding === 1 || encoding === 2) {
              while (
                descEnd < frameData.length - 1 &&
                !(frameData[descEnd] === 0 && frameData[descEnd + 1] === 0)
              ) {
                descEnd += 2;
              }
              descEnd += 2;
            } else {
              while (descEnd < frameData.length && frameData[descEnd] !== 0) {
                descEnd++;
              }
              descEnd += 1;
            }

            if (descEnd < frameData.length) {
              result.coverBytes = frameData.subarray(descEnd);
              result.coverMime = mime;
            }
          } catch (e) {
            console.warn('Error extracting APIC frame:', e);
          }
        }

        offset += 10 + frameSize;
      }
    }
  }

  // If duration wasn't explicitly encoded in ID3 TLEN, estimate it from audio payload
  if (!result.duration || result.duration <= 0) {
    result.duration = estimateAudioDuration(bytes, tagSize > 0 ? 10 + tagSize : 0);
  }

  return result;
}

/**
 * Accurately estimates MP3 audio duration in seconds by parsing MPEG frame bitrate
 */
export function estimateAudioDuration(bytes: Uint8Array, headerOffset = 0): number {
  const audioBytes = bytes.length - headerOffset;
  if (audioBytes <= 0) return 0;

  // Search for the first valid MPEG sync word (11 bits: 0xFF, 0xEx)
  for (let i = headerOffset; i < Math.min(bytes.length - 4, headerOffset + 8000); i++) {
    if (bytes[i] === 0xff && (bytes[i + 1] & 0xe0) === 0xe0) {
      const bitrateIdx = (bytes[i + 2] >> 4) & 0x0f;
      // MPEG-1 Layer III standard bitrates in kbps
      const bitrates = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0];
      const bitrate = bitrates[bitrateIdx];
      if (bitrate && bitrate > 0) {
        return Math.max(1, Math.round((audioBytes * 8) / (bitrate * 1000)));
      }
    }
  }

  // Fallback: assume typical 128 kbps
  return Math.max(1, Math.round((audioBytes * 8) / (128 * 1000)));
}

function decodeText(data: Uint8Array): string {
  if (!data || data.length === 0) return '';
  const encoding = data[0];
  const content = data.subarray(1);

  if (encoding === 1 || encoding === 2) {
    let str = '';
    const start =
      (content[0] === 0xff && content[1] === 0xfe) ||
      (content[0] === 0xfe && content[1] === 0xff)
        ? 2
        : 0;
    for (let i = start; i < content.length - 1; i += 2) {
      const code = content[i] | (content[i + 1] << 8);
      if (code === 0) break;
      str += String.fromCharCode(code);
    }
    return str.trim();
  } else {
    let str = '';
    for (let i = 0; i < content.length; i++) {
      if (content[i] === 0) break;
      str += String.fromCharCode(content[i]);
    }
    return str.trim();
  }
}
