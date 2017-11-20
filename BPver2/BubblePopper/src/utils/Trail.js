import ui.View as View;
import ui.ImageView as ImageView;
import animate;


exports = Class(ImageView, function(supr) {
	this.init = function (opts) {
		opts = merge(opts, {
			backgroundColor: "#FF0000",
			opacity: 0.8,
			anchorX: 1.5,
			anchorY: 1.5,
			width: 3,
			height: 3,
            r: 0,
            image: 'resources/images/bubbles/ball_red.png'
		});

		supr(this, "init", [opts]);

		animate(this).now({
			opacity: 0,
			x: opts.x - 15,
			y: opts.y - 15,
			anchorX: 15,
			anchorY: 15,
			width: 30,
			height: 30,
			r: Math.PI * 4
		}, 1500).then(this.removeFromSuperview.bind(this));
	};
});