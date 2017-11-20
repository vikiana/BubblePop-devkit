import animate;
import ui.View as View;
import ui.ImageView as ImageView;
import ui.resource.Image as Image;
import ui.TextView as TextView;
//import src.soundcontroller as soundcontroller; 

var bubble_red = new Image({url: "resources/images/bubbles/ball_red.png"}),
bubble_yellow = new Image({url: "resources/images/bubbles/ball_yellow.png"}),
bubble_blue = new Image({url: "resources/images/bubbles/ball_blue.png"}),
bubble_green = new Image({url: "resources/images/bubbles/ball_green.png"}),
bubble_purple = new Image({url: "resources/images/bubbles/ball_purple.png"});

exports = Class(View, function (supr) {

	this.init = function (opts) {
		opts = merge(opts, {
			x: 0,
            y: 0,
            ballColor: "red",
            layoutId: 0,
			width: bubble_red.getWidth()/2,
            height: bubble_red.getHeight()/2,
            anchorX: bubble_red.getWidth()/4,
            anchorY: bubble_red.getHeight()/4
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
			width: bubble_red.getWidth()/2,
			height: bubble_red.getHeight()/2
        });

        this.ballColor = ballColor;
        if (lId!=null) this.layoutId = lId;
        
        if (debugopts) { 
            //DEBUG/////////////////
            var copy;
            if (debugopts.hasOwnProperty("text")){
                copy: debugopts.text
            } else {
                copy: this.style.x+","+this.style.y
            }
            this._coordinates = new TextView ({
                superview: this,
                text: copy,//this.uid,//pos[0]+","+pos[1],
                fontFamily: 'Verdana',
                fontWeight: 'bold',
                size: 14,
                autoSize: 'false',
                layout: 'box',
                color: 'blue',
                x: 0,
                y: 0,
                width: bubble_red.getWidth()/2,
                height: bubble_red.getHeight()/2,
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
        return  bubble_red.getHeight()/2-4;
    }
    this.getBallWidth = function (){
        return  bubble_red.getWidth()/2-4;
    }
    
    this.destroyBall = function (){
        //here goes the ball exploding (particles?)
    }
});
