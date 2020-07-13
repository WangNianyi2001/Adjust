{
	'use strict';

	const toPosInt = x => Math.ceil(x) || 1;

	function getImageDataFromImage(image, width, height) {
		const cvs = document.createElement('canvas');
		width = cvs.width = toPosInt(width || image.width);
		height = cvs.height = toPosInt(height || image.height);
		const ctx = cvs.getContext('2d');
		ctx.drawImage(image, 0, 0, width, height);
		return ctx.getImageData(0, 0, width, height);
	}

	function ImaJs(width, height) {
		width = this.width = toPosInt(width);
		height = this.height = toPosInt(height);
		const size = this.size = width * height;
		this.R = new Uint8ClampedArray(size);
		this.G = new Uint8ClampedArray(size);
		this.B = new Uint8ClampedArray(size);
		this.A = new Uint8ClampedArray(size);
	}
	ImaJs.prototype = {
		computeImageData() {
			const image_data = new ImageData(this.width, this.height);
			const data = image_data.data;
			for(let i = 0, j = 0; i < this.size; ++i) {
				data[j++] = this.R[i];
				data[j++] = this.G[i];
				data[j++] = this.B[i];
				data[j++] = this.A[i];
			}
			return image_data;
		},
		downsample(width, height) {
			width = toPosInt(width);
			height = toPosInt(height);
			if(width > this.width || height > this.height)
				throw "Cannot downsample to a bigger size";
			const downsampled = new ImaJs(width, height);
			const y_scale = this.height / height;
			const x_scale = this.width / width;
			for(let y = 0; y < height; ++y) {
				const _y = Math.round(y_scale * y);
				const offset = y * width;
				const _offset = _y * this.width;
				for(let x = 0; x < width; ++x) {
					const _x = Math.round(x_scale * x);
					const i = offset + x;
					const _i = _offset + _x;
					downsampled.R[i] = this.R[_i];
					downsampled.G[i] = this.G[_i];
					downsampled.B[i] = this.B[_i];
					downsampled.A[i] = this.A[_i];
				}
			}
			return downsampled;
		}
	};
	ImaJs.fromImage = function(image, width, height) {
		if(!(image instanceof Image))
			throw "Cannot create from non-image object";
		width = toPosInt(width || image.width);
		height = toPosInt(height || image.height);
		const size = width * height;
		const data = getImageDataFromImage(image, width, height).data;
		const imajs = new ImaJs(width, height);
		for(let i = 0, j = 0; i < size; ++i) {
			imajs.R[i] = data[j++];
			imajs.G[i] = data[j++];
			imajs.B[i] = data[j++];
			imajs.A[i] = data[j++];
		}
		return imajs;
	};

	window.ImaJs = ImaJs;
}