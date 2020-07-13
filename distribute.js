{
	'use strict';

	function Distribution(renderer, background) {
		this.renderer = renderer;
		this.background = background;
	}
	Distribution.prototype = {
		render(imajs, $cvs) {
			const ctx = $cvs.getContext('2d');
			ctx.clearRect(0, 0, $cvs.width, $cvs.height);
			this.renderer(imajs, ctx);
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
	function distributeBySaturation(imajs, ctx) {
		for(let i = 0; i < imajs.size; ++i) {
			const gam = GAM.encode(imajs.R[i], imajs.G[i], imajs.B[i]);
			const x = (gam[2] - gam[1]) * INV2OVERSQRT3;
			const y = gam[0] - (gam[1] + gam[2]) / 2;
			putPixel(ctx, gam, x, y);
		}
	}

	function distributeByLuminance(imajs, ctx) {
		for(let i = 0; i < imajs.size; ++i) {
			const gam = GAM.encode(imajs.R[i], imajs.G[i], imajs.B[i]);
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
	const histogram_palette = [
		'#000', '#f00', '#0f0', '#ff0',
		'#00f', '#f0f', '#0ff', '#fff'
	];
	const histogram_color_sequence = [
		[histogram_palette[1], histogram_palette[3]],
		[histogram_palette[1], histogram_palette[5]],
		null,
		[histogram_palette[4], histogram_palette[5]],
		[histogram_palette[2], histogram_palette[3]],
		null,
		[histogram_palette[2], histogram_palette[6]],
		[histogram_palette[4], histogram_palette[6]],
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
	function distributeByHistogram(imajs, ctx) {
		const
			gbucket = new Uint32Array(histogram_width),
			abucket = new Uint32Array(histogram_width),
			mbucket = new Uint32Array(histogram_width);
		for(let i = 0; i < imajs.size; ++i) {
			const [g, a, m] = GAM.encode(imajs.R[i], imajs.G[i], imajs.B[i]);
			++gbucket[Math.round(g * histogram_width)];
			++abucket[Math.round(a * histogram_width)];
			++mbucket[Math.round(m * histogram_width)];
		}
		const x_scale = ctx.canvas.width / histogram_width;
		const y_scale = 3 * histogram_portion * ctx.canvas.width * ctx.canvas.height / imajs.size;
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
			putLine(ctx, histogram_palette[7], x, 0, volumes[0]);
		}
	}

	window.distributions = {
		'Saturation': new Distribution(distributeBySaturation, 'icon/RGB-background.svg'),
		'Luminance': new Distribution(distributeByLuminance, 'icon/RGB-background.svg'),
		'Histogram': new Distribution(distributeByHistogram, 'icon/histogram-background.svg'),
	};
}