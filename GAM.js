{
	'use strict';

	// Fast pseudo gamma correction
	// const encode = (r, g, b) => [
	// 	r * (1 / 128 - r / 65536),
	// 	g * (1 / 128 - g / 65536),
	// 	b * (1 / 128 - b / 65536),
	// ];
	// const decode = (g, a, m) => [
	// 	256 * (1 - Math.sqrt(1 - g)),
	// 	256 * (1 - Math.sqrt(1 - a)),
	// 	256 * (1 - Math.sqrt(1 - m)),
	// ];
	const encode = (r, g, b) => [r / 256, g / 256, b / 256];
	const decode = (g, a, m) => [g * 256, a * 256, m * 256];
	const computeLuminance = (g, a, m) => (1.0 * g + 1.6 * a + 0.5 * m) / 3.1;

	window.GAM = { decode, encode, computeLuminance };
}