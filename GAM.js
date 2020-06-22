{
		'use strict';

	const encode = (r, g, b) => [
		r / 128 - r * r / 65536,
		g / 128 - g * g / 65536,
		b / 128 - b * b / 65536,
	];
	const decode = (g, a, m) => [
		256 * (1 - Math.sqrt(1 - g)),
		256 * (1 - Math.sqrt(1 - a)),
		256 * (1 - Math.sqrt(1 - m)),
	];

	function Frame(width, height) {
		this.width = width;
		this.height = height;
		this.data = new Float32Array(width * height * 3);
	}
	Frame.fromImage = function(source, w, h, fast) {
		const cvs = document.createElement('canvas');
		const width = cvs.width = source.width;
		const height = cvs.height = source.height;
		const ctx = cvs.getContext('2d');
		ctx.drawImage(source, 0, 0);
		const image_data = ctx.getImageData(0, 0, width, height);
		return Frame[['fromImageData', 'fromImageDataFast'][+fast]](image_data, w, h);
	};
	Frame.fromImageData = function(image_data, w, h) {
		const data = image_data.data;
		const width = image_data.width, height = image_data.height;
		const frame = new Frame(w, h);
		const size = w * h;
		const bucket = frame.data, count = new Uint16Array(size);
		const kx = width / w, ky = height / h;
		for(let y = 0, i = 0; y < height; ++y) {
			const _offset = Math.round(y / ky) * w;
			for(let x = 0; x < width; ++x, ++i) {
				let _i = _offset + Math.round(x / kx);
				const gam = encode(data[i++], data[i++], data[i++]);
				++count[_i];
				_i = _i + (_i << 1);
				bucket[_i++] += gam[0];
				bucket[_i++] += gam[1];
				bucket[_i++] += gam[2];
			}
		}
		for(let t = 0, i = 0; t < size; ++t) {
			if(count[t] === 0)
				continue;
			bucket[i++] /= count[t];
			bucket[i++] /= count[t];
			bucket[i++] /= count[t];
		}
		return frame;
	};
	Frame.fromImageDataFast = function(image_data, w, h) {
		const data = image_data.data;
		const width = image_data.width, height = image_data.height;
		const frame = new Frame(w, h);
		const bucket = frame.data;
		const kx = width / w, ky = height / h;
		for(let _y = 0; _y < h; ++_y) {
			const _offset = _y * w;
			const y = Math.round(_y * ky);
			const offset = y * width;
			for(let _x = 0; _x < w; ++_x) {
				const x = Math.round(_x * kx);
				const i = (offset + x) << 2;
				const _i = (_offset + _x) * 3;
				const gam = encode(data[i + 0], data[i + 1], data[i + 2]);
				bucket[_i + 0] = gam[0];
				bucket[_i + 1] = gam[1];
				bucket[_i + 2] = gam[2];
			}
		}
		return frame;
	};
	Frame.prototype = {
		underSample(w, h) {
			const frame = new Frame(w, h);
			const bucket = frame.data;
			const kx = this.width / w, ky = this.height / h;
			for(let _y = 0; _y < h; ++_y) {
				const _offset = _y * w;
				const y = Math.round(_y * ky);
				const offset = y * this.width;
				for(let _x = 0; _x < w; ++_x) {
					let _i = (_offset + _x) * 3;
					const x = Math.round(_x * kx);
					let i = (offset + x) * 3;
					bucket[_i++] += this.data[i++];
					bucket[_i++] += this.data[i++];
					bucket[_i] += this.data[i];
				}
			}
			return frame;
		},
	};

	function File(source, screenW, screenH) {
		this.source = source;
		const fast = source.width * source.height > File.fast_threshole;
		this.screen = Frame.fromImage(source, screenW, screenH, fast);
		const thumbnailW = Math.min(File.thumbnail_size, screenW);
		const thumbnailH = Math.min(File.thumbnail_size, screenH);
		this.thumbnail = this.screen.underSample(thumbnailW, thumbnailH);
	}
	File.fast_threshole = 5e6;
	File.thumbnail_size = 100;

	window.GAM = { File, decode, encode };
}