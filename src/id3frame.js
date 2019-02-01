/*
 * ID3Frame
 */

import DataviewHelper from './dataviewHelper.js';

/*
 * ID3v2.3 and later frame types
 */
export const types = {
  /*
   * Textual frames
   */
  TALB: 'album',
  TBPM: 'bpm',
  TCOM: 'composer',
  TCON: 'genre',
  TCOP: 'copyright',
  TDEN: 'encoding-time',
  TDLY: 'playlist-delay',
  TDOR: 'original-release-time',
  TDRC: 'recording-time',
  TDRL: 'release-time',
  TDTG: 'tagging-time',
  TENC: 'encoder',
  TEXT: 'writer',
  TFLT: 'file-type',
  TIPL: 'involved-people',
  TIT1: 'content-group',
  TIT2: 'title',
  TIT3: 'subtitle',
  TKEY: 'initial-key',
  TLAN: 'language',
  TLEN: 'length',
  TMCL: 'credits',
  TMED: 'media-type',
  TMOO: 'mood',
  TOAL: 'original-album',
  TOFN: 'original-filename',
  TOLY: 'original-writer',
  TOPE: 'original-artist',
  TOWN: 'owner',
  TPE1: 'artist',
  TPE2: 'band',
  TPE3: 'conductor',
  TPE4: 'remixer',
  TPOS: 'set-part',
  TPRO: 'produced-notice',
  TPUB: 'publisher',
  TRCK: 'track',
  TRSN: 'radio-name',
  TRSO: 'radio-owner',
  TSOA: 'album-sort',
  TSOP: 'performer-sort',
  TSOT: 'title-sort',
  TSRC: 'isrc',
  TSSE: 'encoder-settings',
  TSST: 'set-subtitle',
  /*
   * Textual frames (<=2.2)
   */
  TAL: 'album',
  TBP: 'bpm',
  TCM: 'composer',
  TCO: 'genre',
  TCR: 'copyright',
  TDY: 'playlist-delay',
  TEN: 'encoder',
  TFT: 'file-type',
  TKE: 'initial-key',
  TLA: 'language',
  TLE: 'length',
  TMT: 'media-type',
  TOA: 'original-artist',
  TOF: 'original-filename',
  TOL: 'original-writer',
  TOT: 'original-album',
  TP1: 'artist',
  TP2: 'band',
  TP3: 'conductor',
  TP4: 'remixer',
  TPA: 'set-part',
  TPB: 'publisher',
  TRC: 'isrc',
  TRK: 'track',
  TSS: 'encoder-settings',
  TT1: 'content-group',
  TT2: 'title',
  TT3: 'subtitle',
  TXT: 'writer',
  /*
   * URL frames
   */
  WCOM: 'url-commercial',
  WCOP: 'url-legal',
  WOAF: 'url-file',
  WOAR: 'url-artist',
  WOAS: 'url-source',
  WORS: 'url-radio',
  WPAY: 'url-payment',
  WPUB: 'url-publisher',
  /*
   * URL frames (<=2.2)
   */
  WAF: 'url-file',
  WAR: 'url-artist',
  WAS: 'url-source',
  WCM: 'url-commercial',
  WCP: 'url-copyright',
  WPB: 'url-publisher',
  /*
   * Comment frame
   */
  COMM: 'comments',
  /*
   * Image frame
   */
  APIC: 'image',
  PIC: 'image',
};

/*
 * ID3 image types
 */
export const imageTypes = [
  'other',
  'file-icon',
  'icon',
  'cover-front',
  'cover-back',
  'leaflet',
  'media',
  'artist-lead',
  'artist',
  'conductor',
  'band',
  'composer',
  'writer',
  'location',
  'during-recording',
  'during-performance',
  'screen',
  'fish',
  'illustration',
  'logo-band',
  'logo-publisher',
];

/*
 * ID3v2.3 and later
 */
export const parse = function(buffer, major, minor) {
  minor = minor || 0;
  major = major || 4;

  const result = { tag: null, value: null };
  const dv = new DataView(buffer);
  const dvHelper = new DataviewHelper(dv);
  let encoding;
  let i;
  let variableStart;
  let variableLength;

  if (major < 3) {
    return ID3Frame.parseLegacy(buffer);
  }

  const header = {
    id: dvHelper.getString(4),
    type: dvHelper.getString(1),
    size: dvHelper.getUint32Synch(4),
    flags: [dv.getUint8(8), dv.getUint8(9)],
  };

  /*
   * No support for compressed, unsychronised, etc frames
   */
  if (header.flags[1] !== 0) {
    return false;
  }
  if (!(header.id in ID3Frame.types)) {
    return false;
  }

  result.tag = ID3Frame.types[header.id];

  if (header.type === 'T') {
    encoding = dv.getUint8(10);
    /*
     * TODO: Implement UTF-8, UTF-16 and UTF-16 with BOM properly?
     */
    if (encoding === 0 || encoding === 3) {
      result.value = dvHelper.getString(-11, 11);
    } else if (encoding === 1) {
      result.value = dvHelper.getStringUtf16(-11, 11, true);
    } else if (encoding === 2) {
      result.value = dvHelper.getStringUtf16(-11, 11);
    } else {
      return false;
    }
    if (header.id === 'TCON' && !!parseInt(result.value)) {
      result.value = Genres[parseInt(result.value)];
    }
  } else if (header.type === 'W') {
    result.value = dvHelper.getString(-10, 10);
  } else if (header.id === 'COMM') {
    /*
     * TODO: Implement UTF-8, UTF-16 and UTF-16 with BOM properly?
     */
    encoding = dv.getUint8(10);

    variableStart = 14;
    variableLength = 0;

    /*
     * Skip the comment description and retrieve only the comment its self
     */
    for (i = variableStart; ; i++) {
      if (encoding === 1 || encoding === 2) {
        if (dv.getUint16(i) === 0x0000) {
          variableStart = i + 2;
          break;
        }
        i++;
      } else {
        if (dv.getUint8(i) === 0x00) {
          variableStart = i + 1;
          break;
        }
      }
    }
    if (encoding === 0 || encoding === 3) {
      result.value = dvHelper.getString(-1 * variableStart, variableStart);
    } else if (encoding === 1) {
      result.value = dvHelper.getStringUtf16(-1 * variableStart, variableStart, true);
    } else if (encoding === 2) {
      result.value = dvHelper.getStringUtf16(-1 * variableStart, variableStart);
    } else {
      return false;
    }
  } else if (header.id === 'APIC') {
    encoding = dv.getUint8(10);

    const image = {
      type: null,
      mime: null,
      description: null,
      data: null,
    };

    variableStart = 11;
    variableLength = 0;

    for (i = variableStart; ; i++) {
      if (dv.getUint8(i) === 0x00) {
        variableLength = i - variableStart;
        break;
      }
    }

    image.mime = dvHelper.getString(variableLength, variableStart);
    image.type = ID3Frame.imageTypes[dv.getUint8(variableStart + variableLength + 1)] || 'other';
    variableStart += variableLength + 2;
    variableLength = 0;

    for (i = variableStart; ; i++) {
      if (dv.getUint8(i) === 0x00) {
        variableLength = i - variableStart;
        break;
      }
    }

    image.description = variableLength === 0 ? null : dv.getString(variableLength, variableStart);
    image.data = buffer.slice(variableStart + 1);
    result.value = image;
  }
  return result.tag ? result : false;
};

/*
 * ID3v2.2 and earlier
 */
export const parseLegacy = function(buffer) {
  const result = { tag: null, value: null },
    dv = new DataView(buffer),
    dvHelper = new DataviewHelper(dv),
    header = {
      id: dvHelper.getString(3),
      type: dvHelper.getString(1),
      size: dvHelper.getUint24(3),
    };
  let encoding, i, variableStart, variableLength;

  if (!(header.id in ID3Frame.types)) {
    return false;
  }

  result.tag = ID3Frame.types[header.id];

  if (header.type === 'T') {
    encoding = dv.getUint8(7);

    /*
     * TODO: Implement UTF-8, UTF-16 and UTF-16 with BOM properly?
     */
    result.value = dvHelper.getString(-7, 7);

    if (header.id === 'TCO' && !!parseInt(result.value)) {
      result.value = Genres[parseInt(result.value)];
    }
  } else if (header.type === 'W') {
    result.value = dvHelper.getString(-7, 7);
  } else if (header.id === 'COM') {
    /*
     * TODO: Implement UTF-8, UTF-16 and UTF-16 with BOM properly?
     */
    encoding = dv.getUint8(6);
    result.value = dvHelper.getString(-10, 10);

    if (result.value.indexOf('\x00') !== -1) {
      result.value = result.value.substr(result.value.indexOf('\x00') + 1);
    }
  } else if (header.id === 'PIC') {
    encoding = dv.getUint8(6);

    const image = {
      type: null,
      mime: 'image/' + dvHelper.getString(3, 7).toLowerCase(),
      description: null,
      data: null,
    };

    image.type = ID3Frame.imageTypes[dv.getUint8(11)] || 'other';

    variableStart = 11;
    variableLength = 0;

    for (i = variableStart; ; i++) {
      if (dv.getUint8(i) === 0x00) {
        variableLength = i - variableStart;
        break;
      }
    }

    image.description =
      variableLength === 0 ? null : dvHelper.getString(variableLength, variableStart);
    image.data = buffer.slice(variableStart + 1);
    result.value = image;
  }
  return result.tag ? result : false;
};
