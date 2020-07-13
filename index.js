'use strict';

for(const $icon of document.getElementsByClassName('tool-icon')) {
	const name = $icon.getAttribute('name');
	$icon.style.backgroundImage = `url("icon/${name}.svg")`;
}

const $live = document.getElementById('live')
const _live = $live.getContext('2d');
const $distribution = document.getElementById('distribution');

let thumbnail, distribution;

function setDistribution(name) {
	if(distributions[name] === distribution)
		return;
	distribution = distributions[name];
	document.getElementById('distribution-select').innerText = name;
	document.getElementById('distribution-container').style.backgroundImage
		= `url("${distribution.background}")`;
	setTimeout(distribution.render.bind(distribution, thumbnail, $distribution));
}
const $distribution_options = document.getElementById('distribution-options');
function onchangeDistributionMode() { setDistribution(this.innerText); }
for(const name in distributions) {
	const label = document.createElement('label');
	label.setAttribute('for', 'distribution-show-options');
	label.classList.add('distribution-option');
	label.innerText = name;
	label.addEventListener('click', onchangeDistributionMode);
	$distribution_options.appendChild(label);
}
setDistribution('Saturation');

function onImageLoad() {
	document.body.classList.add('working');
	const $article = document.getElementsByTagName('article')[0];
	const ratio = Math.min(1,
		$article.offsetWidth / this.width,
		$article.offsetHeight / this.height
	);
	const [screenW, screenH] = [$live.width, $live.height] = [
		this.width * ratio,
		this.height * ratio
	];
	[$live.style.width, $live.style.height] = [screenW + 'px', screenH + 'px'];
	[$live.style.left, $live.style.top] = [
		($article.offsetWidth - screenW) / 2 + 'px',
		($article.offsetHeight - screenH) / 2 + 'px'
	];
	_live.drawImage(this, 0, 0, screenW, screenH);
	thumbnail = ImaJs.fromImage(this, Math.min(256, this.width), Math.min(256, this.height));
	distribution.render(thumbnail, $distribution);
}
document.getElementById('open').addEventListener('change', function() {
	const file = this.files[0];
	if(!file)
		return;
	const reader = new FileReader();
	const image = new Image();
	image.onload = onImageLoad;
	reader.onload = e => image.src = e.target.result;
	reader.readAsDataURL(file);
});
function triggerLoad() {
	const e = document.createEvent('MouseEvents');
	e.initEvent('click', true, false);
	document.getElementById('open').dispatchEvent(e);
}
window.addEventListener('keydown', e => {
	if((e.key === 'o' || e.key === 'O') && e.ctrlKey) {
		e.preventDefault();
		triggerLoad();
	}
});