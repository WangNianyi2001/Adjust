'use strict';

const article = document.getElementsByTagName('article')[0];
const live = document.getElementById('live');
const distribution = document.getElementById('distribution');
const
	distribution_size = distribution.width = distribution.height = 256,
	half_granularity = distribution_size / 2;
const _distribution = distribution.getContext('2d');

let file;

function putImage(image, canvas) {
	const context = canvas.getContext('2d');
	context.drawImage(image, 0, 0, canvas.width, canvas.height);
}

const computeLuminance = (g, a, m) => 0.32258 * g + 0.51613 * a + 0.16129 * m;
const TWO_OVER_SQRT3 = 1.1547;
const distributeBySaturation = (r, g, b) => {
	const raw = [(b - g) * TWO_OVER_SQRT3, (b + g) / 2 - r];
	const k = half_granularity / 256;
	return [
		Math.floor(half_granularity + raw[0] * k),
		Math.floor(half_granularity + raw[1] * k)
	];
};
const distributeByLuminance = (g, a, m) => {
	const luminance = computeLuminance(g, a, m);
	if(g === a && a === m) {
		const angle = Math.random() * Math.PI * 2;
		return [
			Math.floor(half_granularity + half_granularity * Math.cos(angle) * luminance),
			Math.floor(half_granularity - half_granularity * Math.sin(angle) * luminance)
		];
	}
	const raw = [(m - a) * TWO_OVER_SQRT3, (m + a) / 2 - g];
	const module = Math.sqrt(raw[0] * raw[0] + raw[1] * raw[1]);
	const k = half_granularity * luminance / module;
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
		distribute(data) {
			for(let i = 0; i < data.length; i += 3) {
				const gam = [data[i], data[i + 1], data[i + 2]];
				const rgb = GAM.decode(...gam);
				_distribution.beginPath();
				_distribution.rect(...distributeBySaturation(...rgb), 1, 1);
				_distribution.fillStyle = `rgb(${rgb.join(',')})`;
				_distribution.fill();
			}
		},
		background: 'icon/RGB-background.svg'
	},
	'Luminance': {
		name: 'Luminance',
		distribute(data) {
			for(let i = 0; i < data.length; i += 3) {
				const gam = [data[i], data[i + 1], data[i + 2]];
				const rgb = GAM.decode(...gam);
				_distribution.beginPath();
				_distribution.rect(...distributeByLuminance(...gam), 1, 1);
				_distribution.fillStyle = `rgb(${rgb.join(',')})`;
				_distribution.fill();
			}
		},
		background: 'icon/RGB-background.svg'
	},
	'Histogram': {
		name: 'Histogram',
		distribute(data) {},
		background: 'icon/histogram-background.svg'
	},
};
function renderDistribution(file) {
	setTimeout(() => {
		_distribution.clearRect(0, 0, distribution_size, distribution_size);
		distribution_modes[distribution_mode].distribute(file.thumbnail.data);
	});
}
function changeDistributionMode(mode_name) {
	if(mode_name === distribution_mode.name)
		return;
	distribution_mode = mode_name;
	document.getElementById('distribution-select').innerText = mode_name;
	document.getElementById('distribution-container').style.backgroundImage =
		`url("${distribution_modes[mode_name].background}")`;
	if(!file)
		return;
	renderDistribution(file);
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
	const image = new Image();
	image.onload = function() {
		document.body.classList.add('working');
		const scale_ratio = Math.min(
			article.offsetWidth / image.width,
			article.offsetHeight / image.height,
			1
		);
		const
			[screen_width, screen_height] =
			[live.width, live.height] = [
				image.width * scale_ratio,
				image.height * scale_ratio
			];
		file = new GAM.File(image, screen_width, screen_height);
		putImage(image, live) ;
		renderDistribution(file);
		[live.style.width, live.style.height] = [
			screen_width + 'px',
			screen_height + 'px'
		];
		[live.style.left, live.style.top] = [
			(article.offsetWidth - screen_width) / 2 + 'px',
			(article.offsetHeight - screen_height) / 2 + 'px'
		];
	};
	reader.onload = e => image.src = e.target.result;
	reader.readAsDataURL($.files[0]);
}
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