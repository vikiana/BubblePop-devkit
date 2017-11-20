jsio('import ui.ImageView');
jsio('import ui.TextView');
jsio("import ui.View");
jsio("import src.Ball as Ball");
jsio("import device");

var BUTTON_TITLE_SHADOW_COLOR = '#5fbadd';
var BUTTON_TITLE_COLOR = '#d30000';

exports = Class(ui.ImageView, function (supr) {

	this.init = function (opts) {
		opts = merge(opts, {
			x: 0,
			y: 0,
			image: "resources/images/ui/bg1_center.png"
		});


		supr(this, 'init', [opts]);

		this.build();
	}
	
	this.build = function() {

		var ballIcon = new Ball ();
		ballIcon.build("red", null, {x:145, y:220});
		//TODO --> use view dimensions to center
		this.addSubview (ballIcon);

		var title = new ui.TextView({
			superview: this,
			text: 'Bubble Pop',
			fontFamily: 'Lost Marbles',
			fontWeight: 'bold',
			shadowWidth: 3,
			shadowColor: "white",
			size: 50,
			autoSize: 'false',
			layout: 'box',
			color: '#d30000',
			x: 20,
			y: 80,
			width: 300,//this.view.style.width,
			height: 100,
			wrap: true
		})

		var startBtnTitle = new ui.TextView({
			superview: this,
			text: "Play!",
			fontFamily: "Impact",
			size: 40,
			autoSize: 'false',
			layout: 'box',
			color: BUTTON_TITLE_COLOR,
			shadowWidth: 3,
			shadowColor: BUTTON_TITLE_SHADOW_COLOR,
			x: 20,
			y: 250,
			width: 300,//this.view.style.width,
			height: 100,
			wrap: true
		})
		var startbutton = new ui.View({
			superview: this,
			x: 58,
			y: 250,
			width: 200,
			height: 100
		});

		/*
		CONTROLS
		*/
		startbutton.on('InputSelect', bind(this, function () {
			this.emit('welcomescreen:start');
		}));

		//rollover effect
		startbutton.on('InputOver', bind(this, function () {
			var _newOpts =  {
				color: 'red',
				shadowColor: undefined,
				x: startBtnTitle.style.x+3,
				y: startBtnTitle.style.y+3
			};

			startBtnTitle.updateOpts (_newOpts);
		}));
		startbutton.on('InputOut', bind(this, function () {
			var _newOpts =  {
				color: BUTTON_TITLE_COLOR,
				shadowColor: BUTTON_TITLE_SHADOW_COLOR,
				x: startBtnTitle.style.x-3,
				y: startBtnTitle.style.y-3
			};

			startBtnTitle.updateOpts (_newOpts);

			this.emit('titlescreen:start');
		}));
	};
});
