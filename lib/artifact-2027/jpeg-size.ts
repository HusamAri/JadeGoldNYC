export function jpegSize(bytes: Uint8Array) {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Error('JPEG imzası geçersiz.');
  let pos = 2;
  while (pos + 3 < bytes.length) {
    if (bytes[pos++] !== 0xff) throw new Error('JPEG segmenti geçersiz.');
    while (bytes[pos] === 0xff) pos++;
    const marker = bytes[pos++];
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    const length = (bytes[pos] << 8) | bytes[pos + 1];
    if (length < 2 || pos + length > bytes.length) throw new Error('JPEG uzunluğu geçersiz.');
    if ([0xc0,0xc1,0xc2].includes(marker)) {
      if (length < 8) throw new Error('JPEG boyut bilgisi eksik.');
      return {height:(bytes[pos+3]<<8)|bytes[pos+4],width:(bytes[pos+5]<<8)|bytes[pos+6]};
    }
    pos += length;
  }
  throw new Error('JPEG boyutu okunamadı.');
}
