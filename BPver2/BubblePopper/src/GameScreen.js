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
import math.geom.intersect as intersect;
import math.geom.Circle as Circle;

//ASSETS
var cannon_base = new Image({url: "resources/images/ui/cannon_base.png"}),
cannon_top = new Image({url: "resources/images/ui/cannon_top.png"}),
background = new Image({url: "resources/images/ui/bg1_center.png"}),
game_header = new Image({url: "resources/images/ui/bg1_header.png"}),
//BUBBLES LAYOUT
bcolors=["red", "blue", "purple", "yellow", "green"],
XLength = YLength = ZLength = 6,
ballimit=3,
//STATES
//GameScreen.GAMESTATES = lib.Enum("GAME_READY", "BALL_SHOT", "BALL_HIT", "REMOVE_BUBBLES"),
// --> Move to the Enum
GAME_READY = 1,
BALL_SHOT = 2,
BALL_HIT = 3,
REMOVE_BUBBLES = 4,
GAMESTATE = GAME_READY,

cell_pos_dirs = {
	right:[1, -1,  0],top_right: [1,  0, -1], top_left:[ 0, 1, -1],
	left:[-1, 1,  0], bottom_left:[-1,  0, 1], bottom_right: [ 0, -1, 1]
},
cell_pos_dirs_bottom = [[-1, 1,  0], [-1,  0, 1],[ 0, -1, 1],[1, -1,  0]],
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
			image: background,
		});

		this.cBall = false;
		this.mouseDown = false;

		supr(this, 'init', [opts]);               

		this.build();
	}
	
	this.build = function() {

		this.on('app:start', start_game.bind(this));
		var W = this.style.width;
		var H = this.style.height;
		var S = device.width/320;//this.style.scale;//define scale in construction
		this.getScale = function (){
			return ;
		}

		this.cannon_base_view = new ImageView ({
			superview: this,
			image: cannon_base,
			x: W/2 - cannon_base.getWidth()/(S*2),
			y: H - cannon_base.getHeight()/S,
			width: cannon_base.getWidth()/S,
			height: cannon_base.getHeight()/S
		})

		/*var cbw = cannon_base.getWidth()/S;
		var cbh = cannon_base.getHeight()/S;
		var cw = this.cannon_base_view.style.width;
		var ch = this.cannon_base_view.style.height;
		var cx = this.cannon_base_view.style.x;
		var cy = this.cannon_base_view.style.y;*/

		this.cannon_top_view = new ImageView ({
			superview: this,
			image: cannon_top,
			x: W/2-cannon_top.getWidth()/(S*2),
			y: H-this.cannon_base_view.style.height/2-cannon_top.getHeight()/S-10,
			anchorX: cannon_top.getWidth()/(S*2),
			anchorY: cannon_top.getHeight()/S-25,
			width: cannon_top.getWidth()/S,
			height: cannon_top.getHeight()/S
		});

		/*var ctbw = cannon_top.getWidth()/S;
		var ctbh = cannon_top.getHeight()/S;
		var ctw = this.cannon_top_view.style.width;
		var cth = this.cannon_top_view.style.height;
		var ctx = this.cannon_top_view.style.x;
		var cty = this.cannon_top_view.style.y;*/

		

		/*this._inputview = new View({
			superview: this,
			clip: true,
			x: 0,
			y: 0,
			width: 320,
			width: 570,
			backgroundColor: "red"
		});*/

		//cannon center				
		this.cp = new Point ({
			x:this.cannon_top_view.style.x+this.cannon_top_view.style.anchorX, 
			y:this.cannon_top_view.style.y+this.cannon_top_view.style.anchorY
		});

		this.cBall;
		this.activeInput = false;
		this.boundingBox = this.getBoundingShape();

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
				this.addBubbleToMap(h, this.getRandomBubbleColor());//text: h.toString()});
		}

		//SHOOTING BALL
		this.cBall = this.loadBall ();

		/*
		/ CONTROLS
		*/
		var W = this.style.width;
		var Y = this.style.height;
		//DOWN
		this.on('InputStart', bind(this, function(event, point){
			this.mouseDown = true;
		}));

		//UP
		this.on('InputSelect', bind(this, function (event, point) {
			if (this.activeInput) {
				this.pt = point;
				GAMESTATE = BALL_SHOT;
				//sample code
				//sound.play('whack');
				//this.emit('gamescreen:hit');
				//this.hitMole();
			}
			this.mouseDown = false;
		}));

		//OUT
		this.on("InputOut", bind(this, function(evt, pt){
			if (this._target_line_view)this.removeSubview(this._target_line_view);
		}))

		//MOVE
		this.on("InputMove",bind(this, function (evt, pt) {
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
		if (this._target_line_view)this.removeSubview(this._target_line_view);
		//new mouse pos
		pt.subtract (this.cp);
		//get angle of target line 
		this.shootingAngle = pt.getAngle();
		//90 degree turn 
		this.shootingAngle += Math.PI/2;
		//draw target line
		var lineLength = 1000;
		this._target_line_view = new View ({
			superview: this,
			r:Math.PI + this.shootingAngle,
			x:this.cp.x,
			y:this.cp.y,
			width: 1,
			height: lineLength,
			backgroundColor: "white"
		});
		//CANNON ROTATE
		this.removeSubview (this.cannon_top_view);
		this.addSubview (this.cannon_top_view);//put back on top of line
		this.cannon_top_view.style.r = this.shootingAngle;//this.rangle;
		//BALL ROTATE
		this.cBall.style.r = this.shootingAngle;//this.rangle;
		//check for target position
		var target_line = this.makeTargetLine();
		var angle = this._target_line_view.style.r;
		//logger.LOG&&console.log("LOG-CUSTOM: angle of target line", angle);

		//target_line.r = Math.PI/2+this.shootingAngle;
		var collisions = this.cBall.getLineToCircleCollisions ("bubbles", target_line);
		if (collisions.length>0){
			//logger.LOG&&console.log("collisions", collisions);
			if (this.targetBubble) {
				this.removeSubview(this.targetBubble);
				this.blayout.pop();
			}

			//chose the lower y connection - not working
			/*var hitball = collisions[0].view;
			logger.LOG&&console.log("START COLLISIONS COMPARISONS LOG");
			if (collisions.length>1){
				for (var j=0; j<collisions.length-1;j++){
					if (collisions[j].view.style.y >= collisions[j+1].view.style.y)
					{
						hitball = collisions[j].view;
					} else {
						hitball = collisions[j+1].view;
					}
				}
			}*/
			hitball = collisions[0].view;
			logger.LOG&&console.log("START COLLISIONS COMPARISONS LOG",hitball );			
			var hb_pos = this.blayout[hitball.layoutId];
			var emptyCells = this.findEmptyCells(hb_pos);
			//logger.LOG&&console.log("emptyCells:",emptyCells);	
			//choose position - COULD BE MORE ACCURATE
			var chosen;
			if (emptyCells.length>1){
				chosen = angle < Math.PI ? 1 : 0;
			} else {
				chosen = 0;
			}
			this.hitballposition = emptyCells[chosen];
			this.blayout.push(this.hitballposition);//idx is blayout.length-1;
			//position of ball in grid
			var coord = this.cube_to_evenr(emptyCells[chosen]);
			//TODO -- COORDS ARE CONSTANTS TO CALCULATE AHEAD
			coord[0]= coord[0]*this.cBall.style.width+(this.cBall.style.width*4.8);
			coord[1]=coord[1]*this.cBall.style.height+(this.cBall.style.height*3);
			var hitballcenter = new Point ({x:coord[0]+20, y:coord[1]+20});
			this.hitballY = hitballcenter.y;
			hitballcenter.subtract (this.cp);
			//adjust angle of target line 
			this.shootingAngle = hitballcenter.getAngle() + Math.PI/2;
			//Debug or show in game =================================
			this.targetBubble = new Ball ();	
			this.targetBubble.build("target");
			this.addSubview(this.targetBubble);
			this.targetBubble.style.x = coord[0];
			this.targetBubble.style.y = coord[1];
			//======================================================
		}
	};

	this.findEmptyCells = function (pos){
		var empty = [];
		for (dir in cell_pos_dirs_bottom){
			//logger.LOG&&console.log("LOG-CUSTOM: Checking dir:",dir);
			var neighborPos = [
				pos[0]+cell_pos_dirs_bottom[dir][0], 
				pos[1]+cell_pos_dirs_bottom[dir][1], 
				pos[2]+cell_pos_dirs_bottom[dir][2]];

			var idx = this.findPosInLayout(neighborPos);
		
			var nBubble = this.findBubbleByIndex(idx);
			if (!nBubble) empty.push(neighborPos);
		}
		return empty;
	}

	this.makeTargetLine = function ()
	{
		var start = new Point (this.cp.x, this.cp.y);
		var a = this._target_line_view.style.height;
		var ang = this._target_line_view.style.r;
		var endY = this.cp.y + a * Math.cos (ang);
		var endX = this.cp.x - a * Math.sin (ang);
		return new Line (start.x, start.y, endX, endY);
	}

	this.addBubbleToMap = function (h, color)
	{
		var debugopts = {
			//text: this.blayout[h][0]+","+this.blayout[h][1]+","+this.blayout[h][2]
			text: h.toString()
		}
		var coord = this.cube_to_evenr(this.blayout[h]);
		var b = this.attachBubble(color, h, null, "bubbles", debugopts);
		this.addSubview (b);
		//position ball in grid
		coord[0]*=b.style.width;
		coord[1]*=b.style.height;
		//screen offsets
		b.style.x = coord[0]+b.style.width*4.8;
		b.style.y = coord[1]+b.style.height*3;
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
			Physics.addToView (b, {group: pgroup, hitbox:new Circle(b.style.width/2, b.style.height/2, b.style.width)});
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
		b.style.x = this.cp.x - b.style.anchorX-2;
		b.style.y = this.cannon_top_view.style.y-10;
		b.style.r = 0;
		b.updateColor (this.getRandomBubbleColor());
		b.updateOpts({anchorY:this.cp.y-b.style.y});
	};

	this.resetGame = function (){
		this.cannon_top_view.style.r = 0;
		this.initBall(this.cBall);
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

	this.findSameColorCells = function (bubble){
		var boh = bubble.layoutId;
		var pos = this.blayout[bubble.layoutId];
		if (!pos) return false;
		var found = false;
		for (dir in cell_pos_dirs){
			//logger.LOG&&console.log("LOG-CUSTOM: Checking dir:",dir);
			var neighborPos = [
				pos[0]+cell_pos_dirs[dir][0], 
				pos[1]+cell_pos_dirs[dir][1], 
				pos[2]+cell_pos_dirs[dir][2]];

			var idx = this.findPosInLayout(neighborPos);
			if (idx == null || this._checked.indexOf(idx)>-1) continue;
			var nBubble = this.findBubbleByIndex(idx);
			if (nBubble) {
				if (nBubble.ballColor === bubble.ballColor){
					this._toRemove.push (nBubble)
					this._checked.push (idx);
					found = true;
					this.findSameColorCells(nBubble);
				}
			}
		}
		return found;
	}

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

	this.removeBubble = function (b){
		this.blayout[b.layoutId] = null;
		this.removeSubview(b);
	}

});


/*GAME FLOW*/
function start_game (){
	logger.LOG&&console.log("LOG-CUSTOM: Game Started");	
	GC.app.engine.on ("Tick", bind(this, function(dt){
		//logger.LOG&&console.log("", GAMESTATE)
		switch (GAMESTATE){
			case GAME_READY:
			this.activeInput = true;
			//waits for player click
			break;
			case BALL_SHOT:
			this.activeInput = false;
			
			if (!this.cBall){
				this.cBall = this.loadBall();
			}
			
			var bv = new Vec2D ({angle:this.shootingAngle + Math.PI/2, magnitude:1});
			this.cBall.style.x -= bv.x*10;
			this.cBall.style.y -= bv.y*10;//10 is the velocity --> Add transition such as decelleration 
			if (this.cBall.style.y+20 <= this.hitballY)
			{
				GAMESTATE = BALL_HIT;
			}
			//Out of Field - Trigger and transition to GAME_READY
			if (this.cBall.style.y < this.boundingBox.getSide(Rect.SIDES.TOP).start.y)
			{
				this.resetGame();
				GAMESTATE = GAME_READY;
			}
			break;
			case BALL_HIT:
				this._toRemove = [];
				this._checked = [];
				var found = false;
				if (this.targetBubble) this.removeSubview(this.targetBubble);
				this.targetBubble = null;
				//place the ball. it will be popped if there is at least one same color adjiacent ball

				var bubble_new = this.addBubbleToMap (this.blayout.length-1, this.cBall.ballColor);

				this.findSameColorCells (bubble_new);

				/*if (bubble_hit.ballColor === this.cBall.ballColor)
				{
					this._toRemove.push()
					this.checkForSameColor (bubble_hit);
				} else {
					var bubble_new = this.addNewBubble (this.collisions[i].view);//new bubble on first collision
					found = this.checkForSameColor(bubble_new);
					if (!found){
						this.resetGame();
						GAMESTATE = GAME_READY;
						continue;
					} else {
						this._toRemove.push(bubble_new);
					}
				}*/

				this.removalCount = 0;
				if (this._toRemove.length>0) {
					this.removeSubview (bubble_new);
				}
				GAMESTATE = REMOVE_BUBBLES;

			break;
			case REMOVE_BUBBLES:
				//--> ? put this on a timer instead than a game state?
				var b;
				this.removalCount++;
				if (this.removalCount==3){
					if (this._toRemove.length > 0){
						b = this._toRemove.splice(0, 1);//--> do pop or splice from last index
						this.removeBubble (b[0]);
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
