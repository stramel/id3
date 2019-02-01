import id3 from 'id3js'

id3({ file:'./track.mp3', type: 'local' }, (err, tags) => {
	/*
	 * 'local' type causes the file to be read from the local file-system
	 */
	console.log(tags);
});
