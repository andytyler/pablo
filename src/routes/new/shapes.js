/**
 * @typedef {Object} Rectangle
 * @property {'rectangle'} type
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 */

/**
 * @typedef {Object} Circle
 * @property {'circle'} type
 * @property {number} x
 * @property {number} y
 * @property {number} radius
 */

/**
 * @typedef {Object} TextBox
 * @property {'text'} type
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 * @property {string} text
 * @property {string} fontFamily
 * @property {number} fontSize
 * @property {string} textAlign
 * @property {string} fontWeight
 * @property {string} fontStyle
 * @property {string} color
 */

/**
 * @typedef {Rectangle|Circle|TextBox} Shape
 */

/**
 * Create a rectangle shape
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} width - Width of rectangle
 * @param {number} height - Height of rectangle
 * @returns {Rectangle} Rectangle object
 */
export function createRect(x, y, width, height) {
	return {
		type: 'rectangle',
		x,
		y,
		width,
		height
	};
}

/**
 * Create a circle shape
 * @param {number} x - X coordinate of center
 * @param {number} y - Y coordinate of center
 * @param {number} radius - Radius of circle
 * @returns {Circle} Circle object
 */
export function createCircle(x, y, radius) {
	return {
		type: 'circle',
		x: x - radius,
		y: y - radius,
		radius
	};
}

/**
 * Create a text box shape
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} width - Width of text box
 * @param {number} height - Height of text box
 * @param {string} text - Initial text content
 * @returns {TextBox} Text box object
 */
export function createTextBox(x, y, width, height, text = 'Text') {
	return {
		type: 'text',
		x,
		y,
		width,
		height,
		text,
		fontFamily: 'Arial, sans-serif',
		fontSize: 16,
		textAlign: 'left',
		fontWeight: 'normal',
		fontStyle: 'normal',
		color: '#000000'
	};
}

/**
 * Check if a point is inside a shape
 * @param {Shape} shape - The shape to check
 * @param {number} x - X coordinate to check
 * @param {number} y - Y coordinate to check
 * @returns {boolean} True if point is inside shape
 */
export function isPointInShape(shape, x, y) {
	if (shape.type === 'rectangle' || shape.type === 'text') {
		return (
			x >= shape.x && x <= shape.x + shape.width && y >= shape.y && y <= shape.y + shape.height
		);
	} else if (shape.type === 'circle') {
		const dx = x - (shape.x + shape.radius);
		const dy = y - (shape.y + shape.radius);
		return Math.sqrt(dx * dx + dy * dy) <= shape.radius;
	}
	return false;
}
