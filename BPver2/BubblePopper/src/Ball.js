import animate;
import ui.View as View;
import ui.ImageView as ImageView;
import ui.resource.Image as Image;
import ui.TextView as TextView;
import device;
//import src.soundcontroller as soundcontroller; 

var bubble_red = new Image({url: "resources/images/bubbles/ball_red.png"}),
bubble_yellow = new Image({url: "resources/images/bubbles/ball_yellow.png"}),
bubble_blue = new Image({url: "resources/images/bubbles/ball_blue.png"}),
bubble_green = new Image({url: "resources/images/bubbles/ball_green.png"}),
bubble_purple = new Image({url: "resources/images/bubbles/ball_purple.png"}),
bubble_target = new Image ({url: "resources/images/bubbles/ball_target.png"})

exports = Class(View, function (supr) {
    this.S = device.width/320;
	this.init = function (opts) {
		opts = merge(opts, {
			x: 0,
            y: 0,
            ballColor: "red",
            layoutId: 0,
			width: bubble_red.getWidth()/this.S-4,
			height: bubble_red.getHeight()/this.S-7,
            anchorX: (bubble_red.getWidth()/this.S-4)/2,
            anchorY: (bubble_red.getHeight()/this.S-7)/2
		});

        supr(this, 'init', [opts]);
	}
    
    this.updateColor = function (color){
        this.ballColor = color;
        this._ballview.updateOpts ({image:eval ("bubble_"+color)});
    }
    //the bubble color is decided by the gamescreen
    this.build = function (ballColor, lId, opts, debugopts){
        //initialize the ball view                        
        this._ballview = new ImageView({
			superview: this,//this._inputview,
			image: eval ("bubble_"+ballColor),
			x: 0,
            y: 0,
			width: bubble_red.getWidth()/this.S,
			height: bubble_red.getHeight()/this.S
        });

        this.ballColor = ballColor;
        if (lId!=null) this.layoutId = lId;
        
        if (debugopts) { 
            this._coordinates = new TextView ({
                superview: this,
                fontFamily: 'Verdana',
                //fontWeight: 'bold',
                size: 12,
                autoSize: 'false',
                layout: 'box',
                color: 'black',
                x: 0,
                y: 0,
                width: bubble_red.getWidth()/this.S,
                height: bubble_red.getHeight()/this.S,
                wrap: true
            });
            //////////////////////
            this._coordinates.updateOpts (debugopts);
        }
        if (opts) this.updateOpts(opts);
    }

    this.getBallColor = function ()
    {
        return this.ballColor; //--> return only part of the string
    }
    this.getBallHeight = function (){
        return  this.style.height;
    }
    this.getBallWidth = function (){
        return  this.style.width;
    }
    
    this.destroyBall = function (){
        //here goes the ball exploding (particles?)
    }
});
