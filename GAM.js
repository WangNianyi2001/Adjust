'use strict';

const encodeColor = (r, g, b) => [
	r / 128 - r * r / 65536,
	g / 128 - g * g / 65536,
	b / 128 - b * b / 65536,
];
const decodeColor = (g, a, m) => [
	256 * (1 - Math.sqrt(1 - g)),
	256 * (1 - Math.sqrt(1 - a)),
	256 * (1 - Math.sqrt(1 - m)),
];

function Frame(width, height) {
	this.width = width;
	this.height = height;
	this.data = new Float32Array(width * height * 3);
}
Frame.fromImage = function(source, w, h) {
	const cvs = document.createElement('canvas');
	const width = cvs.width = source.width;
	const height = cvs.height = source.height;
	const ctx = cvs.getContext('2d');
	ctx.drawImage(source, 0, 0);
	const data = ctx.getImageData(0, 0, width, height).data;
	// Sampling
	const frame = new Frame(w, h);
	const size = w * h;
	const bucket = frame.data, count = new Uint16Array(size);
	const kx = width / w, ky = height / h;
	for(let y = 0, i = 0; y < height; ++y) {
		const _yw = ~~(y / ky) * w;
		for(let x = 0; x < width; ++x, ++i) {
			let _i = _yw + ~~(x / kx);
			const gam = encodeColor(data[i++], data[i++], data[i++]);
			++count[_i];
			_i = _i + (_i << 1);
			bucket[_i++] += gam[0];
			bucket[_i++] += gam[1];
			bucket[_i++] += gam[2];
		}
	}
	for(let t = 0, i = 0; t < size; ++t) {
		const ratio = 1 / count[t];
		bucket[i++] *= ratio;
		bucket[i++] *= ratio;
		bucket[i++] *= ratio;
	}
	return frame;
}

function GAMFile(source, screenW, screenH) {
	this.source = source;
	this.screen = Frame.fromImage(source, screenW, screenH);
}