'use strict';

const article = document.getElementsByTagName('article')[0];
const live = document.getElementById('live');
const distribution = document.getElementById('distribution');
const
	granularity = distribution.width = distribution.height = 256,
	half_granularity = granularity / 2;
const _distribution = distribution.getContext('2d');

const image = new Image();

function putImage(image, canvas) {
	const context = canvas.getContext('2d');
	context.drawImage(image, 0, 0, canvas.width, canvas.height);
}
async function downscaleTo(source, destination) {
	const image = new Image();
	const promise = new Promise(resolve => {
		image.onload = resolve;
		image.src = source.toDataURL();
	});
	await promise;
	destination.getContext('2d').drawImage(image, 0, 0, destination.width, destination.height);
}

const computeLuminance = (r, g, b) => 1.26e-3 * r + 1.89e-3 * g + 7.56e-4 * b;
const TWO_OVER_SQRT3 = 1.1547;
const distributeBySaturation = (r, g, b) => {
	const raw = [(b - g) * TWO_OVER_SQRT3, (b + g) / 2 - r];
	const k = half_granularity / 256;
	return [
		Math.floor(half_granularity + raw[0] * k),
		Math.floor(half_granularity + raw[1] * k)
	];
};
const distributeByLuminance = (r, g, b) => {
	const luminance = computeLuminance(r, g, b);
	if(r === g && g === b)
		return;
	const raw = [(b - g) * TWO_OVER_SQRT3, (b + g) / 2 - r];
	const module = Math.sqrt(raw[0] * raw[0] + raw[1] * raw[1]);
	const k = half_granularity * Math.pow(luminance, 3) / module;
	return [
		Math.floor(half_granularity + raw[0] * k),
		Math.floor(half_granularity + raw[1] * k)
	];
};
let distribution_mode = 'Luminance';
const histogram_vertical_amplify = 3;
const histogram_color_sequence = {
	'rgb': ['red', 'yellow', 'white'],
	'rbg': ['red', 'purple', 'white'],
	'grb': ['green', 'yellow', 'white'],
	'gbr': ['green', 'cyan', 'white'],
	'brg': ['blue', 'purple', 'white'],
	'bgr': ['blue', 'cyan', 'white']
};
const distribution_modes = {
	'Saturation': {
		name: 'Saturation',
		distribute(data, opacity) {
			for(let i = 0; i < data.length; i += 4) {
				const [r, g, b] = [
					data[i],
					data[i + 1],
					data[i + 2],
				];
				_distribution.beginPath();
				_distribution.rect(...distributeBySaturation(r, g, b), 1, 1);
				_distribution.fillStyle = `rgba(${r},${g},${b},${opacity})`;
				_distribution.fill();
			}
		},
		background: 'icon/RGB-background.svg'
	},
	'Luminance': {
		name: 'Luminance',
		distribute(data, opacity) {
			for(let i = 0; i < data.length; i += 4) {
				const [r, g, b] = [
					data[i],
					data[i + 1],
					data[i + 2],
				];
				_distribution.beginPath();
				const coordinate = distributeByLuminance(r, g, b);
				if(!coordinate)
					continue;
				_distribution.rect(...coordinate, 1, 1);
				_distribution.fillStyle = `rgba(${r},${g},${b},${opacity})`;
				_distribution.fill();
			}
		},
		background: 'icon/RGB-background.svg'
	},
	'Histogram': {
		name: 'Histogram',
		distribute(data, opacity) {
			opacity *= histogram_vertical_amplify;
			const [br, bg, bb, bl] =
				Array(4).fill(0).map(_ => Array(granularity).fill(0));
			for(let i = 0; i < data.length; i += 4) {
				const [r, g, b] = [
					data[i],
					data[i + 1],
					data[i + 2]
				];
				const luminance = computeLuminance(r, g, b);
				br[Math.floor(luminance * r)] += opacity;
				bg[Math.floor(luminance * g)] += opacity;
				bb[Math.floor(luminance * b)] += opacity;
				bl[Math.floor(luminance * granularity)] += opacity;
			}
			_distribution.lineWidth = 1;
			for(let i = 0; i < granularity; ++i) {
				const column = [
					['r', br[i]],
					['g', bg[i]],
					['b', bb[i]]
				].sort((a, b) => b[1] - a[1]);
				const color_sequence = histogram_color_sequence[
					column[0][0] + column[1][0] + column[2][0]
				];
				const y = [column[0][1], column[1][1], column[2][1], 0];
				for(let j = 0; j < 3; ++j) {
					_distribution.beginPath();
					_distribution.moveTo(i, granularity - y[j]);
					_distribution.lineTo(i, granularity - y[j + 1]);
					_distribution.strokeStyle = color_sequence[j];
					_distribution.stroke();
				}
			}
		},
		background: 'icon/histogram-background.svg'
	},
};
async function renderDistribution(source, downscale_level = 5, opacity_k = 2e3) {
	_distribution.clearRect(0, 0, granularity, granularity);
	const canvas = document.createElement('canvas');
	const [w, h] = [canvas.width, canvas.height] = [
		Math.ceil(source.width / downscale_level),
		Math.ceil(source.height / downscale_level)
	];
	await downscaleTo(source, canvas);
	distribution_modes[distribution_mode].distribute(
		canvas.getContext('2d').getImageData(0, 0, w, h).data,
		opacity_k / w / h
	);
}
function changeDistributionMode(mode_name) {
	if(mode_name === distribution_mode.name)
		return;
	distribution_mode = mode_name;
	document.getElementById('distribution-select').innerText = mode_name;
	document.getElementById('distribution-container').style.backgroundImage =
		`url("${distribution_modes[mode_name].background}")`;
	renderDistribution(live);
}
const distribution_options = document.getElementById('distribution-options');
function onchangeDistributionMode() { changeDistributionMode(this.innerText); }
for(const mode_name in distribution_modes) {
	const label = document.createElement('label');
	label.setAttribute('for', 'distribution-show-options');
	label.classList.add('distribution-option');
	label.innerText = mode_name;
	label.addEventListener('click', onchangeDistributionMode);
	distribution_options.appendChild(label);
}
changeDistributionMode('Saturation');

function load($) {
	if(!$.files)
		return;
	const reader = new FileReader();
	reader.onload = e => image.src = e.target.result;
	reader.readAsDataURL($.files[0]);
}
image.onload = function postLoad() {
	document.body.classList.add('working');
	const scale_ratio = Math.min(
		article.offsetWidth / image.width,
		article.offsetHeight / image.height
	)
	const
		[screen_width, screen_height] =
		[live.width, live.height] = [
			image.width * scale_ratio,
			image.height * scale_ratio
		];
	putImage(image, live);
	renderDistribution(live);
	[live.style.width, live.style.height] = [
		screen_width + 'px',
		screen_height + 'px'
	];
	[live.style.left, live.style.top] = [
		(article.offsetWidth - screen_width) / 2 + 'px',
		(article.offsetHeight - screen_height) / 2 + 'px'
	];
};
function forceLoad() {
	const e = document.createEvent('MouseEvents');
	e.initEvent('click', true, false);
	document.getElementById('open').dispatchEvent(e);
}
window.addEventListener('keydown', e => {
	if(e.key === 'o' && e.ctrlKey) {
		e.preventDefault();
		forceLoad();
	}
});