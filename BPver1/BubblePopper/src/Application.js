//sdk imports
jsio('import device');
jsio('import ui.StackView as StackView');
//user imports
jsio('import src.WelcomeScreen as WelcomeScreen');
import src.GameScreen as GameScreen;
jsio('import src.utils.Physics as Physics');
//jsio('import src.soundcontroller as soundcontroller');

/* Your application inherits from GC.Application, which is
 * exported and instantiated when the game is run.
 */
exports = Class(GC.Application, function () {
  
    /* Run after the engine is created and the scene graph is in
     * place, but before the resources have been loaded.
     */
    this.initUI = function () {
      var welcomescreen = new WelcomeScreen(),
          gamescreen = new GameScreen();
  
      this.view.style.backgroundColor = '#aaf7ff';
  
  
		// Create a stackview of size 320x480, then scale it to fit horizontally
		// Add a new StackView to the root of the scene graph
		var rootView = new StackView({
			superview: this,
			// x: device.width / 2 - 160,
			// y: device.height / 2 - 240,
			x: 0,
			y: 0,
			width: 320,
			height: 570,
			clip: true,
			scale: device.width / 320
		});

		rootView.push(welcomescreen);
		//var sound = soundcontroller.getSound();

		/* Listen for an event dispatched by the title screen when
		 * the start button has been pressed. Hide the title screen,
		 * show the game screen, then dispatch a custom event to the
		 * game screen to start the game.
		 */
		welcomescreen.on('welcomescreen:start', function () {
			//sound.play('levelmusic');
			Physics.start();
			rootView.push(gamescreen);
			gamescreen.emit('app:start');
		});

		/* When the game screen has signalled that the game is over,
		 * show the title screen so that the user may play the game again.
		 */
		gamescreen.on('gamescreen:end', function () {
			//sound.stop('levelmusic');
			rootView.pop();
		});
	};

	/* Executed after the asset resources have been loaded.
	 * If there is a splash screen, it's removed.
	 */
	this.launchUI = function () {};
  });
