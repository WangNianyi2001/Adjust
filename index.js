'use strict';

const article = document.getElementsByTagName('article')[0];
const live = document.getElementById('live');
const distribution = document.getElementById('distribution');
const
	distribution_size = distribution.width = distribution.height = 128,
	half_ds = distribution_size / 2;
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
const distributionByLuminance = (r, g, b) => {
	const luminance = computeLuminance(r, g, b);
	if(r === g && g === b)
		return [half_ds, half_ds * (1 - luminance)];
	const raw = [(b - g) * TWO_OVER_SQRT3, (b + g) / 2 - r];
	const module = Math.sqrt(raw[0] * raw[0] + raw[1] * raw[1]);
	const k = half_ds * Math.pow(luminance, 3) / module;
	return [
		Math.floor(half_ds + raw[0] * k),
		Math.floor(half_ds + raw[1] * k)
	];
};
const distributionBySaturation = (r, g, b) => {
	const raw = [(b - g) * TWO_OVER_SQRT3, (b + g) / 2 - r];
	const k = half_ds / 256;
	return [
		Math.floor(half_ds + raw[0] * k),
		Math.floor(half_ds + raw[1] * k)
	];
};
let distribution_mode = 'Luminance';
const distribution_modes = {
	'Saturation': {
		name: 'Saturation',
		projection: distributionBySaturation,
		background: 'icon/RGB-background.svg'
	},
	'Luminance': {
		name: 'Luminance',
		projection: distributionByLuminance,
		background: 'icon/RGB-background.svg'
	},
	'Histogram': {
		name: 'Histogram',
		projection: distributionByLuminance,
		background: 'icon/histogram-background.svg'
	},
};
async function renderDistribution(source, downscale_level = 5, saturate_portion = 2e3) {
	const projection = distribution_modes[distribution_mode].projection;
	const canvas = document.createElement('canvas');
	const [w, h]
		= [canvas.width, canvas.height]
		= [Math.ceil(source.width / downscale_level), Math.ceil(source.height / downscale_level)];
	await downscaleTo(source, canvas);
	const context = canvas.getContext('2d');
	const opacity = saturate_portion / w / h;
	const data = context.getImageData(0, 0, w, h).data;
	_distribution.clearRect(0, 0, distribution_size, distribution_size);
	for(let y = 0; y < h; ++y) {
		for(let x = 0; x < w; ++x) {
			const i = (y * h + x) << 2;
			const [r, g, b] = [
				data[i],
				data[i + 1],
				data[i + 2],
			];
			_distribution.beginPath();
			_distribution.rect(...projection(r, g, b), 1, 1);
			_distribution.fillStyle = `rgba(${r},${g},${b},${opacity})`;
			_distribution.fill();
		}
	}
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