{
	'use strict';

	function Distribution(renderer, background) {
		this.renderer = renderer;
		this.background = background;
	}
	Distribution.prototype = {
		render(frame, $cvs) {
			const ctx = $cvs.getContext('2d');
			ctx.clearRect(0, 0, $cvs.width, $cvs.height);
			this.renderer(frame.data, ctx);
		},
	}

	const scr = (ctx, x, y) => [
		ctx.canvas.width * (1 + x) / 2,
		ctx.canvas.height * (1 - y) / 2
	];
	const putPixel = (ctx, gam, x, y) => {
		ctx.fillStyle = `rgb(${GAM.decode(...gam).join(',')})`;
		ctx.beginPath();
		ctx.rect(...scr(ctx, x, y), 1, 1);
		ctx.fill();
	};
	const INV2OVERSQRT3 = 2 / Math.sqrt(3);
	function distributeBySaturation(data, ctx) {
		for(let t = 0, i = 0; t < data.length; ++t) {
			const gam = [data[i++], data[i++], data[i++]];
			const x = (gam[2] - gam[1]) * INV2OVERSQRT3;
			const y = gam[0] - (gam[1] + gam[2]) / 2;
			putPixel(ctx, gam, x, y);
		}
	}

	function distributeByLuminance(data, ctx) {
		for(let t = 0, i = 0; t < data.length; ++t) {
			const gam = [data[i++], data[i++], data[i++]];
			const luminance = GAM.computeLuminance(...gam);
			if(gam[0] === gam[1] && gam[1] === gam[2]) {
				const angle = Math.random() * 2 * Math.PI;
				putPixel(ctx, gam, luminance * Math.cos(angle), luminance * Math.sin(angle));
				continue;
			}
			const x = (gam[2] - gam[1]) * INV2OVERSQRT3;
			const y = gam[0] - (gam[1] + gam[2]) / 2;
			const mod = Math.sqrt(x * x + y * y);
			const scale = luminance / mod;
			putPixel(ctx, gam, x * scale, y * scale);
		}
	}

	const histogram_width = 256;
	const histogram_color_sequence = [
		['red', 'yellow'],
		['red', 'purple'],
		null,
		['blue', 'purple'],
		['green', 'yellow'],
		null,
		['green', 'cyan'],
		['blue', 'cyan'],
	];
	const putLine = (ctx, color, x, y1, y2) => {
		if(y1 === y2)
			return;
		ctx.strokeStyle = color;
		ctx.beginPath();
		const height = ctx.canvas.height;
		ctx.moveTo(x, height - y1);
		ctx.lineTo(x, height - y2);
		ctx.stroke();
	};
	const histogram_portion = 0.1;
	function distributeByHistogram(data, ctx) {
		const
			gbucket = new Uint32Array(histogram_width),
			abucket = new Uint32Array(histogram_width),
			mbucket = new Uint32Array(histogram_width);
		for(let t = 0, i = 0; t < data.length; ++t) {
			++gbucket[Math.round(data[i++] * histogram_width)];
			++abucket[Math.round(data[i++] * histogram_width)];
			++mbucket[Math.round(data[i++] * histogram_width)];
		}
		const x_scale = ctx.canvas.width / histogram_width;
		const y_scale = 3 * histogram_portion * ctx.canvas.width * ctx.canvas.height / data.length;
		for(let i = 0; i < histogram_width; ++i) {
			const x = i * x_scale;
			const gvolume = gbucket[i], avolume = abucket[i], mvolume = mbucket[i];
			const color_sequence = histogram_color_sequence[
				(+(gvolume > avolume) << 2) +
				(+(gvolume > mvolume) << 1) +
				(avolume > mvolume)
			];
			const volumes = [gvolume, avolume, mvolume].map(y => y * y_scale);
			volumes.sort();
			putLine(ctx, color_sequence[0], x, volumes[1], volumes[2]);
			putLine(ctx, color_sequence[1], x, volumes[0], volumes[1]);
			putLine(ctx, 'white', x, 0, volumes[0]);
		}
	}

	window.distributions = {
		'Saturation': new Distribution(distributeBySaturation, 'icon/RGB-background.svg'),
		'Luminance': new Distribution(distributeByLuminance, 'icon/RGB-background.svg'),
		'Histogram': new Distribution(distributeByHistogram, 'icon/histogram-background.svg'),
	};
}