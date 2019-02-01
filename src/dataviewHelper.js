export default class {
  constructor(dv) {
    this.dataview = dv;
  }

  getString(length, offset, raw) {
    let str = '';
    let i;

    offset = offset || 0;
    length = length || this.dataview.byteLength - offset;

    if (length < 0) {
      length += this.dataview.byteLength;
    }

    if (typeof Buffer !== 'undefined') {
      const data = [];

      for (i = offset; i < offset + length; i++) {
        data.push(this.dataview.getUint8(i));
      }

      return new Buffer(data).toString();
    } else {
      for (i = offset; i < offset + length; i++) {
        str += String.fromCharCode(this.dataview.getUint8(i));
      }

      if (raw) {
        return str;
      }

      return decodeURIComponent(escape(str));
    }
  }

  getStringUtf16(length, offset, bom) {
    let littleEndian = false;
    let str = '';
    let useBuffer = false;
    let i;

    offset = offset || 0;
    length = length || this.dataview.byteLength - offset;

    if (typeof Buffer !== 'undefined') {
      str = [];
      useBuffer = true;
    }

    if (length < 0) {
      length += this.dataview.byteLength;
    }

    if (bom) {
      if (offset + 1 > this.dataview.byteLength) {
        return '';
      }

      const bomInt = this.dataview.getUint16(offset);

      if (bomInt === 0xfffe) {
        littleEndian = true;
      }

      offset += 2;
      length -= 2;
    }

    for (i = offset; i < offset + length; i += 2) {
      let ch = this.dataview.getUint16(i, littleEndian);

      if ((ch >= 0 && ch <= 0xd7ff) || (ch >= 0xe000 && ch <= 0xffff)) {
        if (useBuffer) {
          str.push(ch);
        } else {
          str += String.fromCharCode(ch);
        }
      } else if (ch >= 0x10000 && ch <= 0x10ffff) {
        ch -= 0x10000;
        if (useBuffer) {
          str.push(((0xffc00 & ch) >> 10) + 0xd800);
          str.push((0x3ff & ch) + 0xdc00);
        } else {
          str +=
            String.fromCharCode(((0xffc00 & ch) >> 10) + 0xd800) +
            String.fromCharCode((0x3ff & ch) + 0xdc00);
        }
      }
    }

    if (useBuffer) {
      return new Buffer(str).toString();
    } else {
      return decodeURIComponent(escape(str));
    }
  }

  getSynch(num) {
    let out = 0;
    let mask = 0x7f000000;
    while (mask) {
      out >>= 1;
      out |= num & mask;
      mask >>= 8;
    }
    return out;
  }

  getUint8Synch(offset) {
    return this.getSynch(this.dataview.getUint8(offset));
  }

  getUint32Synch(offset) {
    return this.getSynch(this.dataview.getUint32(offset));
  }

  /*
   * Not really an int as such, but named for consistency
   */
  getUint24(offset, littleEndian) {
    if (littleEndian) {
      return (
        this.dataview.getUint8(offset) +
        (this.dataview.getUint8(offset + 1) << 8) +
        (this.dataview.getUint8(offset + 2) << 16)
      );
    }
    return (
      this.dataview.getUint8(offset + 2) +
      (this.dataview.getUint8(offset + 1) << 8) +
      (this.dataview.getUint8(offset) << 16)
    );
  }
}
