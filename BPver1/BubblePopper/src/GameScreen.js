jsio('import ui.ImageView as ImageView');
jsio('import ui.TextView as TextView');
jsio ('import ui.resource.Image as Image');
jsio('import ui.View as View')
jsio('import device');
jsio('import src.Ball as Ball');
jsio('import src.utils.HexGrid as HexGrid');
jsio('import src.utils.Physics as Physics');

import math.geom.Line as Line;
import animate;
import math.geom.Vec2D as Vec2D;
import math.geom.Point as Point;
import math.geom.Rect as Rect;
import animate;

//ASSETS
var cannon_base = new Image({url: "resources/images/ui/cannon_base.png"}),
cannon_top = new Image({url: "resources/images/ui/cannon_top.png"}),
background = new Image({url: "resources/images/ui/bg1_center.png"}),
game_header = new Image({url: "resources/images/ui/bg1_header.png"}),
//BUBBLES LAYOUT
bcolors=["red", "blue", "purple", "yellow", "green"],
XLength = YLength = ZLength = 3,
ballimit=2,
//COORDINATES
gameviewscale = 5.2,
viewMiddle = background.getWidth()/gameviewscale - cannon_top.getWidth()/4+20,//ugly :(
//STATES
//GameScreen.GAMESTATES = lib.Enum("GAME_READY", "BALL_SHOT", "BALL_HIT"),
// --> Move to the Enum
GAME_READY = 1,
BALL_SHOT = 2,
BALL_HIT = 3,
REMOVE_BUBBLES = 4,
GAMESTATE = GAME_READY,

cell_pos_directions = {
	right:[1, -1,  0],top_right: [1,  0, -1], top_left:[ 0, 1, -1],
	left:[-1, 1,  0], bottom_left:[-1,  0, 1], bottom_right: [ 0, -1, 1]
},
bubble_angle_directions = {//-->Express in MATH.PI terms (Math.PI/2, Math.PI/4 etc); 
	//only using bottom pos, so top pos are just a placeholder
	right:[0, 0.8],top_right: [0.8, 1.5], top_left:[1.3, 2.3],
	left:[2.3, 3.14], bottom_left:[1.5, 2.3], bottom_right: [0.8, 1.5]
}
//--> Move to an Enum
RIGHT = "right", 
BOTTOM_RIGHT = "bottom_right", 
BOTTOM_LEFT = "bottom_left", 
LEFT = "left",
TOP_LEFT = "top_left",
TOP_RIGHT = "top_right"


exports = Class(ImageView, function (supr) {

	this.init = function (opts) {
		opts = merge(opts, {
			x: 0,
			y: 0,
			image: "resources/images/ui/bg1_center.png"
		});

		this.cannonBall = false;
		this.mouseDown = false;

		supr(this, 'init', [opts]);               

		this.build();
	}
	
	this.build = function() {
		this.on('app:start', start_game.bind(this));

		this._backgroundView = new ImageView ({
			superview: this,
			x: 0,
			y: -30,
			width: device.width/320,
			image: background
		});
		
		this._inputview = new View({
			superview: this,
			clip: true,
			x: 0,
			y: 0,
			width: background.getWidth(),
			height: background.getHeight()
		});

		
		this.cannon_base_view = new ImageView ({
			superview: this,
			image: cannon_base,
			x: viewMiddle - cannon_base.getWidth()/4+25,
			y: background.getHeight()/2,//cannon_base.getHeight()/gameviewscale,
			width: cannon_base.getWidth()/2,
			height: cannon_base.getHeight()/2
		})

		this.cannon_top_view = new ImageView ({
			superview: this,
			image: cannon_top,
			x: viewMiddle-3,
			y: background.getHeight()/2-cannon_base.getHeight()/2+25,//cannon_base.getHeight()/gameviewscale,
			anchorX: cannon_top.getWidth()/3.6,
			anchorY: cannon_top.getHeight()/3.6+25,
			width: cannon_top.getWidth()/1.8,
			height: cannon_top.getHeight()/1.8
		});

		//cannon center				
		this.cp = new Point ({
			x:this.cannon_top_view.style.x+this.cannon_top_view.style.anchorX, 
			y:this.cannon_top_view.style.y+this.cannon_top_view.style.anchorY
		});

		this.cannonBall;
		this.activeInput = false;
		this.boundingBox = this._inputview.getBoundingShape();

		//HEXGRID LAYOUT - this should come from a level design/builder tool 
		this.blayout = []
		for (i=-ballimit; i<XLength; i++)
		{//x
			for (j=-ballimit; j<YLength; j++)
			{//y
				for (z=-ballimit; z<ZLength; z++)
				{//z
					if (i+j+z==0)
					{
						this.blayout.push ([i, j, z]);
					}
				}	
			}
		}

		//BUBBLES MAP
		this.bubbles = [];
		for (h=0; h<this.blayout.length; h++)
		{
			//added debug text
			//--> Polish:Call this on frame for staggered grid build
				this.addBubbleToMap(h, this.getRandomBubbleColor(), {text: h.toString()});
		}

		//SHOOTING BALL
		this.cannonBall = this.loadBall ();

		/*
		/ CONTROLS
		*/
		//DOWN
		this._inputview.on('InputStart', bind(this, function(event, point){
			this.mouseDown = true;
		}));

		//UP
		this._inputview.on('InputSelect', bind(this, function (event, point) {
			if (this.activeInput) {
				this.pt = point;
				this.addSubview(this.cannonBall)
				this.cannonBall.position.x = this.cannon_top_view.style.x+20;
				this.cannonBall.position.y = this.cannon_top_view.style.y;
				GAMESTATE = BALL_SHOT;
				//sample code
				//sound.play('whack');
				//this.emit('gamescreen:hit');
				//this.hitMole();
			}
			this.mouseDown = false;
		}));

		//OUT
		this._inputview.on("InputOut", bind(this, function(evt, pt){
			if (this._target_line_view)this.removeSubview(this._target_line_view);
		}))

		//MOVE
		this._inputview.on("InputMove",bind(this, function (evt, pt) {
			if (this.activeInput&&this.mouseDown)
			{
				this.activateCannon(pt);
			}
		}));
	};

	/*
	BUILD BUBBLES UTILS
	*/
	this.activateCannon = function (pt){
		//ROTATING ANGLE (draws a target line)
		this.rangle = this.getLineAngle (this.cp, pt, true);
		//CANNON ROTATE
		this.removeSubview (this.cannon_top_view);
		this.addSubview (this.cannon_top_view);//put back on top of line
		this.cannon_top_view.style.r = this.rangle;
		//BALL ROTATE
		this.cannonBall.style.r = this.rangle;
	};

	this.getLineAngle = function (pt1, pt2, draw) {
		//Returns the angle created by a line and the X axis. Draws the line optionally.
		if (this._target_line_view)this.removeSubview(this._target_line_view);
		var lp = new Line (pt1.x, pt1.y, pt2.x, pt2.y);
		vp = new Vec2D ({x:pt2.x-pt1.x, y:pt2.y-pt1.y});
		var langle = Math.PI/2-Math.abs(vp.getAngle());			
		var lineLength = lp.getLength();
		if (draw){
			this._target_line_view = new View ({
				superview: this,
				r: Math.PI + langle,
				x:pt1.x,
				y:pt1.y,
				width: 1,
				height: lineLength,
				backgroundColor: "white"
			});
		}
		return langle;
	};

	this.addBubbleToMap = function (h, color, debugopts)
	{
		var coord = this.cube_to_evenr(this.blayout[h]);
		var b = this.attachBubble(color, h, null, "bubbles", debugopts);
		this.addSubview (b);
		//position ball in grid
		coord[0]*=b.getBallWidth();
		coord[1]*=b.getBallHeight()-4;
		//screen offsets
		b.style.x = coord[0]+viewMiddle;
		b.style.y = coord[1]+200;
		return b;
	};

	this.attachBubble = function (bcolor, layoutId, opts, pgroup, debugopts)
	{
		var b = new Ball ();
		var opts = opts ? opts : null;
		var debugopts = debugopts ? debugopts : null;
		b.build(bcolor, layoutId, opts, debugopts);
		if (pgroup){
			this.bubbles.push(b);
			Physics.addToView (b, {group: pgroup, hitbox:new Rect (0, 0, 35, 35)})
			b.setCollisionEnabled(true);
		}
		return b;
	};

	this.getRandomBubbleColor = function (){
		return bcolors[Math.floor(Math.random()*(bcolors.length-1))];
	};
		
	this.loadBall = function (){
		b = this.attachBubble ("red", null, null ,"ball");	
		this.addSubview(b);
		this.initBall(b);
		return b;
	};

	this.initBall = function (b){
		b.style.x = this.cannon_top_view.style.x+10;
		b.style.y = this.cannon_top_view.style.y-10;
		b.style.r = 0;
		b.updateColor (this.getRandomBubbleColor());
		b.updateOpts({anchorY:this.cp.y-b.style.y});
	};

	this.resetGame = function (){
		this.cannon_top_view.style.r = 0;
		this.initBall(this.cannonBall);
	};
	/*
	UTILS
	*/
	this.cube_to_evenr = function (cube){
		if (cube)
		{
			var dir;
			if(cube[2]&1 == 0) {
				dir = -1;
			} else {
				dir = 1;
			}
			col = cube[0] + (cube[2] * dir) / 2
			row = cube[2];
			return [col, row]
		} else{
			return [0,0]
		}
	};

	this.evenr_to_cube = function (hex){
		if (hex){
			var dir 
			if (hex[1]&1 == 0)
			{    
				dir = -1;
			} else {
				dir = 1;
			}
			x = hex[0] - (hex[1] + dir) / 2
			z = hex[1]
			y = -x-z
			return [x, y, z];
		} else {
			return [0,0,0];
		}
	};
		
	this.addNewBubble = function (bubble_hit){
		//Find Postion
		var ballHitCenter = new Point ({
			x: bubble_hit.style.anchorX+bubble_hit.style.x,
			y: bubble_hit.style.anchorY+bubble_hit.style.y
		});

		var cannonHitCenter = new Point ({
			x:this.cannonBall.style.anchorX+this.cannonBall.style.x, 
			y:this.cannonBall.style.anchorX+this.cannonBall.style.y//using anchorX on purpose
		});

		var angle = this.getLineAngle(cannonHitCenter, ballHitCenter, true)+Math.PI/2;

		logger.LOG&&console.log(angle, "LOG_CUSTOM: angle of direction of hitpoint on hit bubble:", angle);

		//getDirectionFromAngle - LOWER HALF ONLY
		var direction = "";
		for (arr in bubble_angle_directions){
			if (angle > bubble_angle_directions[arr][0] && 
				angle < bubble_angle_directions[arr][1]){
				direction = arr;
			}
		}

		logger.LOG&&console.log(direction, "LOG_CUSTOM: direction:");
		//get corresponding position on hexgrid
		var id = bubble_hit.layoutId;
		for (dir in cell_pos_directions){
			if (dir === direction){
				//compute and push new hex location
				var newPos = [
					this.blayout[id][0]+cell_pos_directions[dir][0],
					this.blayout[id][1]+cell_pos_directions[dir][1],
					this.blayout[id][2]+cell_pos_directions[dir][2]
				];
				this.blayout.push(newPos);
				//make and attach the bubble; 
				var newPos = this.blayout[this.blayout.length-1];
				var newbubble = this.addBubbleToMap (
					this.blayout.length-1, 
					this.cannonBall.ballColor,
					{text:this.blayout.length-1});
				//check for same color neighbor bubbles in new position
				this.blayout[this.blayout.length-1] = null;//this needs to be null in order for the check script to work UGLY 
				if (this.checkNeighbors (newbubble, newPos, true)){
					this.removeSubview (newbubble);//remove bubble since it had neighb
				} else {
					this.blayout[this.blayout.length-1] = newPos;//re-add the pos since there are no neigh UGLY
				}
			};
		};
	};

	//Recursive checking
	this.checkNeighbors = function (bubble, blayout_pos, checkColor){
		for (dir in cell_pos_directions)
		{
			//logger.LOG&&console.log("LOG-CUSTOM: Checking dir:",dir);
			if (blayout_pos == null) continue;//Error - checked bubble is not in layout! empty cell

			var neighborPos = [
				blayout_pos[0]+cell_pos_directions[dir][0], 
				blayout_pos[1]+cell_pos_directions[dir][1], 
				blayout_pos[2]+cell_pos_directions[dir][2]];

			var idx = this.findPosInLayout(neighborPos);
			if (!idx) continue;//empty cell in the current direction
			
			var nBubble = this.findBubbleByIndex(idx);

			if (checkColor){ 
				if (nBubble.ballColor === bubble.ballColor){
					//this.removePosAndCheckNeigh (nBubble);
					this.blayout[idx] = null;
					//--> Particle animation
					//--> Scoreboard event
					this._toRemove.push(nBubble);
					this.checkNeighbors(nBubble, neighborPos, true);

					return true;
				}
			} 

			//if color different, still check if the nball is free to fall now 
			/*this.blayout[idx] = null;//this needs to be null in order for the check script to work UGLY 
			if (!this.checkNeighbors (nBubble, neighborPos, false)){
				//BALL FALLS --> implement animations
				//var animator = animate(nBubble);
				// typical usage is via method chaining
				// moves a view 100px down, then remove.
				//animate(nBubble).now({y: 100}).then.bind(this.removeSubview (nBubble));//start_game.bind(this
				this.removeSubview (nBubble);			
			} else {
				this.blayout[idx] = neighborPos;//re-add the pos since there are no neigh UGLY					
			}
			return true;*/
		}
		//!idx  no bubbles around
		return false;
	};

	this.removePosAndCheckNeigh = function (bubble){
		this._toRemove.push(bubble);
		var pos = this.blayout[bubble.layoutId];
		this.blayout[bubble.layoutId] = null;
		//--> Particle animation
		//--> Scoreboard event
		this.checkNeighbors(bubble, pos, true);
	};

	this.findPosInLayout = function (pos){
		if (pos != null){
			for (i=0; i<this.blayout.length;i++){
				var p = this.blayout[i];
				if (p!=null){
					if ( p.toString() == pos.toString()){
						return i;
					}
				}
			}
		} 
		return null;
	};

	this.findBubbleByIndex = function (idx){
		for (i=0; i<this.bubbles.length;i++){
			var b = this.bubbles[i];
			if (b.layoutId === idx){
				return this.bubbles[i];
			}
		}
		return null;
	};

});


/*GAME FLOW*/
function start_game (){
	logger.LOG&&console.log("LOG-CUSTOM: Game Started");	
	GC.app.engine.on ("Tick", bind(this, function(){
		//logger.LOG&&console.log("", GAMESTATE)
		switch (GAMESTATE){
			case GAME_READY:
			this.activeInput = true;
			//waits for player click
			break;
			case BALL_SHOT:
			this.activeInput = false;
			
			if (!this.cannonBall){
				this.cannonBall = this.loadBall();
			}
			
			var bv = new Vec2D ({angle:Math.PI/2+this.rangle, magnitude:1});
			this.cannonBall.style.x -= bv.x*10;
			this.cannonBall.style.y -= bv.y*10;//10 is the velocity --> Add transition such as decelleration 
			
			this.collisions = this.cannonBall.getCollisions("bubbles");
			if (this.collisions.length>0){
				logger.LOG&&console.log("LOG-CUSTOM: collisions:",this.collisions[0]);
				//Trigger and transition to BALL_HIT
				GAMESTATE = BALL_HIT;
			}

			//Trigger and transition to GAME_READY
			if (this.cannonBall.style.y < this.boundingBox.getSide(Rect.SIDES.TOP).start.y)
			{
				this.resetGame();
				GAMESTATE = GAME_READY;
			}
			break;
			case BALL_HIT:
				this._toRemove = [];
				var noColormatches = true;
				for (i=0; i<this.collisions.length; i++)
				{
					var bubble_hit = this.collisions[i].view;
					logger.LOG&&console.log("LOG-CUSTOM: bubbles colors:",bubble_hit.getBallColor(),this.cannonBall.getBallColor());
					if (bubble_hit.getBallColor() === this.cannonBall.getBallColor())
					{
						this.removePosAndCheckNeigh(bubble_hit);
						noColormatches = false;
					}
				}
				//if none of the bubbles hit matches the ball color
				if (noColormatches === true) {
					this.addNewBubble (bubble_hit);
				}
				this.removalCount = 0;
				GAMESTATE = REMOVE_BUBBLES;
			break;
			case REMOVE_BUBBLES:
				//--> ? put this on a timer instead than a game state?
				var b;
				this.removalCount++;
				if (this.removalCount==3){
					if (this._toRemove.length > 0){
						b = this._toRemove.splice(0, 1);//--> do pop or splice from last index
						this.removeSubview(b[0]);
					} else {
						this.resetGame();
						GAMESTATE = GAME_READY;
					}
					this.removalCount = 0;
				}
			break;
			default:
				logger.LOG&&console.warn("WARN-CUSTOM: Game is running with no known state");
			break;
		}
}))};
