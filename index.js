'use strict';

const $open = document.getElementById('open');

let image = new Image();
function load($) {
	if(!$.files)
		return;
	const reader = new FileReader();
	reader.onload = e => image.src = e.target.result;
	reader.readAsDataURL($.files[0]);
}
image.onload = function postLoad() {
	//
};
function forceLoad() {
	const e = document.createEvent('MouseEvents');
	e.initEvent('click', true, false);
	$open.dispatchEvent(e);
}
window.addEventListener('keydown', e => {
	if(e.key === 'o' && e.ctrlKey) {
		e.preventDefault();
		forceLoad();
	}
});