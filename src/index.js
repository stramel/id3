import Reader from 'readerjs';
import * as ID3Tag from './id3tag.js';

const id3 = function(opts, cb) {
  /*
   * Initialise ID3
   */
  const options = {
    type: id3.OPEN_URI,
  };

  if (typeof opts === 'string') {
    opts = { file: opts, type: id3.OPEN_URI };
  } else if (typeof window !== 'undefined' && window.File && opts instanceof window.File) {
    opts = { file: opts, type: id3.OPEN_FILE };
  }

  for (const k in opts) {
    if (opts.hasOwnProperty(k)) {
      options[k] = opts[k];
    }
  }

  if (!options.file) {
    return cb('No file was set');
  }

  if (options.type === id3.OPEN_FILE) {
    if (
      typeof window === 'undefined' ||
      !window.File ||
      !window.FileReader ||
      typeof ArrayBuffer === 'undefined'
    ) {
      return cb('Browser does not have support for the File API and/or ArrayBuffers');
    }
  } else if (options.type === id3.OPEN_LOCAL) {
    if (typeof require !== 'function') {
      return cb('Local paths may not be read within a browser');
    }
  } else {
  }

  /*
   * Read the file
   */

  const handle = new Reader(options.type);

  handle.open(options.file, function(err) {
    if (err) {
      return cb('Could not open specified file');
    }
    ID3Tag.parse(handle, function(err, tags) {
      cb(err, tags);
      handle.close();
    });
  });
};

id3.OPEN_FILE = Reader.OPEN_FILE;
id3.OPEN_URI = Reader.OPEN_URI;
id3.OPEN_LOCAL = Reader.OPEN_LOCAL;

export default id3;
