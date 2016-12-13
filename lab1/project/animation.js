// *******************************************************
// CS 174a Graphics Example Code
// animation.js - The main file and program start point.  The class definition here describes how to display an Animation and how it will react to key and mouse input.  Right now it has
// very little in it - you will fill it in with all your shape drawing calls and any extra key / mouse controls.

// Now go down to display() to see where the sample shapes are drawn, and to see where to fill in your own code.

"use strict"
var canvas, canvas_size, gl = null, g_addrs,
	movement = vec2(),	thrust = vec3(), 	looking = false, prev_time = 0, animate = false, animation_time = 0;
		var gouraud = false, color_normals = false, solid = false;
function CURRENT_BASIS_IS_WORTH_SHOWING(self, model_transform) { self.m_axis.draw( self.basis_id++, self.graphicsState, model_transform, new Material( vec4( .8,.3,.8,1 ), .5, 1, 1, 40, "" ) ); }


// *******************************************************
// IMPORTANT -- In the line below, add the filenames of any new images you want to include for textures!

var texture_filenames_to_load = [ "stars.png", "text.png", "earth.gif" ];

// *******************************************************
// When the web page's window loads it creates an "Animation" object.  It registers itself as a displayable object to our other class "GL_Context" -- which OpenGL is told to call upon every time a
// draw / keyboard / mouse event happens.

window.onload = function init() {	var anim = new Animation();	}
function Animation()
{
	( function init (self)
	{
		self.context = new GL_Context( "gl-canvas" );
		self.context.register_display_object( self );

		gl.clearColor( .933, .933, .933, 1 );			// Background color

		for( var i = 0; i < texture_filenames_to_load.length; i++ )
			initTexture( texture_filenames_to_load[i], true );

		self.m_cube = new cube();
		self.m_obj = new shape_from_file( "teapot.obj" )
		self.m_axis = new axis();
		self.m_sphere = new sphere( mat4(), 4 );
		self.m_fan = new triangle_fan_full( 10, mat4() );
		self.m_strip = new rectangular_strip( 1, mat4() );
		self.m_cylinder = new cylindrical_strip( 10, mat4() );

		// 1st parameter is camera matrix.  2nd parameter is the projection:  The matrix that determines how depth is treated.  It projects 3D points onto a plane.
		self.graphicsState = new GraphicsState( translation(0, 0,-40), perspective(45, canvas.width/canvas.height, .1, 1000), 0 );

		gl.uniform1i( g_addrs.GOURAUD_loc, gouraud);		gl.uniform1i( g_addrs.COLOR_NORMALS_loc, color_normals);		gl.uniform1i( g_addrs.SOLID_loc, solid);

		self.context.render();
	} ) ( this );

	canvas.addEventListener('mousemove', function(e)	{		e = e || window.event;		movement = vec2( e.clientX - canvas.width/2, e.clientY - canvas.height/2, 0);	});
}

// *******************************************************
// init_keys():  Define any extra keyboard shortcuts here
Animation.prototype.init_keys = function()
{
	shortcut.add( "Space", function() { thrust[1] = -1; } );			shortcut.add( "Space", function() { thrust[1] =  0; }, {'type':'keyup'} );
	shortcut.add( "z",     function() { thrust[1] =  1; } );			shortcut.add( "z",     function() { thrust[1] =  0; }, {'type':'keyup'} );
	shortcut.add( "w",     function() { thrust[2] =  1; } );			shortcut.add( "w",     function() { thrust[2] =  0; }, {'type':'keyup'} );
	shortcut.add( "a",     function() { thrust[0] =  1; } );			shortcut.add( "a",     function() { thrust[0] =  0; }, {'type':'keyup'} );
	shortcut.add( "s",     function() { thrust[2] = -1; } );			shortcut.add( "s",     function() { thrust[2] =  0; }, {'type':'keyup'} );
	shortcut.add( "d",     function() { thrust[0] = -1; } );			shortcut.add( "d",     function() { thrust[0] =  0; }, {'type':'keyup'} );
	shortcut.add( "f",     function() { looking = !looking; } );
	shortcut.add( ",",     ( function(self) { return function() { self.graphicsState.camera_transform = mult( rotation( 3, 0, 0,  1 ), self.graphicsState.camera_transform ); }; } ) (this) ) ;
	shortcut.add( ".",     ( function(self) { return function() { self.graphicsState.camera_transform = mult( rotation( 3, 0, 0, -1 ), self.graphicsState.camera_transform ); }; } ) (this) ) ;

	shortcut.add( "r",     ( function(self) { return function() { self.graphicsState.camera_transform = mat4(); }; } ) (this) );
	shortcut.add( "ALT+s", function() { solid = !solid;					gl.uniform1i( g_addrs.SOLID_loc, solid);
																		gl.uniform4fv( g_addrs.SOLID_COLOR_loc, vec4(Math.random(), Math.random(), Math.random(), 1) );	 } );
	shortcut.add( "ALT+g", function() { gouraud = !gouraud;				gl.uniform1i( g_addrs.GOURAUD_loc, gouraud);	} );
	shortcut.add( "ALT+n", function() { color_normals = !color_normals;	gl.uniform1i( g_addrs.COLOR_NORMALS_loc, color_normals);	} );
	shortcut.add( "ALT+a", function() { animate = !animate; } );

	shortcut.add( "p",     ( function(self) { return function() { self.m_axis.basis_selection++; console.log("Selected Basis: " + self.m_axis.basis_selection ); }; } ) (this) );
	shortcut.add( "m",     ( function(self) { return function() { self.m_axis.basis_selection--; console.log("Selected Basis: " + self.m_axis.basis_selection ); }; } ) (this) );
}

function update_camera( self, animation_delta_time )
	{
		var leeway = 70, border = 50;
		var degrees_per_frame = .0002 * animation_delta_time;
		var meters_per_frame  = .01 * animation_delta_time;
																					// Determine camera rotation movement first
		var movement_plus  = [ movement[0] + leeway, movement[1] + leeway ];		// movement[] is mouse position relative to canvas center; leeway is a tolerance from the center.
		var movement_minus = [ movement[0] - leeway, movement[1] - leeway ];
		var outside_border = false;

		for( var i = 0; i < 2; i++ )
			if ( Math.abs( movement[i] ) > canvas_size[i]/2 - border )	outside_border = true;		// Stop steering if we're on the outer edge of the canvas.

		for( var i = 0; looking && outside_border == false && i < 2; i++ )			// Steer according to "movement" vector, but don't start increasing until outside a leeway window from the center.
		{
			var velocity = ( ( movement_minus[i] > 0 && movement_minus[i] ) || ( movement_plus[i] < 0 && movement_plus[i] ) ) * degrees_per_frame;	// Use movement's quantity unless the &&'s zero it out
			self.graphicsState.camera_transform = mult( rotation( velocity, i, 1-i, 0 ), self.graphicsState.camera_transform );			// On X step, rotate around Y axis, and vice versa.
		}
		self.graphicsState.camera_transform = mult( translation( scale_vec( meters_per_frame, thrust ) ), self.graphicsState.camera_transform );		// Now translation movement of camera, applied in local camera coordinate frame
	}

// *******************************************************
// display(): called once per frame, whenever OpenGL decides it's time to redraw.

Animation.prototype.display = function(time)
	{
		if(!time) time = 0;
		this.animation_delta_time = time - prev_time;
		if(animate) this.graphicsState.animation_time += this.animation_delta_time;
		prev_time = time;

		update_camera( this, this.animation_delta_time );

		this.basis_id = 0;

		var model_transform = mat4();

		// Materials: Declare new ones as needed in every function.
		// 1st parameter:  Color (4 floats in RGBA format), 2nd: Ambient light, 3rd: Diffuse reflectivity, 4th: Specular reflectivity, 5th: Smoothness exponent, 6th: Texture image.
		var purplePlastic = new Material( vec4( .9,.5,.9,1 ), .2, .5, .8, 40 ), // Omit the final (string) parameter if you want no texture
			greyPlastic = new Material( vec4( .5,.5,.5,1 ), .2, .8, .5, 20 ),
			earth = new Material( vec4( .5,.5,.5,1 ), .5, 1, .5, 40, "earth.gif" ),
			stars = new Material( vec4( .5,.5,.5,1 ), .5, 1, 1, 40, "stars.png" ),
			lightBlue = new Material( vec4(.25, .75, .75, 1), .2, .5, .8, 40),
			lightBrown = new Material( vec4( .529, .4, .333, 1), .2, .8, .5, 20),
			beige = new Material( vec4( .933, .8, .66, 1), .7, 1, 1, 40),
			lightpurple = new Material( vec4(.796, .6, .8, 1), .7, .1, .1, 20),
			red = new Material( vec4(1, .33, .33, 1), .7, .1, .1, 20),
			yellow = new Material( vec4(1, 1, .33, 1), .7, .1, .1, 20),
			green = new Material( vec4(.133, .867, .667, 1), .7, .1, .1, 20),
			black = new Material( vec4(.267, .333, .4, 1), .7, .1, .1, 20),
			white = new Material( vec4(.933, .933, .933, 1), .7, .1, .1, 20);


		/**********************************
		Start coding here!!!!
		**********************************/

			/***********************
			Declaration of attributes for easier modifications
			***********************/
			var floorWidth = 50; var floorHeight = .25; var floorOtherThing = 50;
			var trunkWidth = .6, trunkHeight = 1.1, trunkOtherThing = .6;
			var wingWidth = 2.15, wingHeight = .05, wingOther = .45;
			var legOther = .15, legHeight = .85, legWidth = .15;

			function drawFloor(caller, model_transform)
			{
				var stack = [];
				stack.push(model_transform);
				model_transform = mult(model_transform, scale(floorWidth, floorHeight, floorOtherThing));
				caller.m_cube.draw(caller.graphicsState, model_transform, green);
				//CURRENT_BASIS_IS_WORTH_SHOWING(caller, model_transform);
				model_transform = stack.pop();
				//CURRENT_BASIS_IS_WORTH_SHOWING(caller, model_transform);
				return model_transform;
			}
			function drawTrunk(caller, model_transform)
			{
				var stack = [];
				stack.push(model_transform);
				var sway = 2.7 * Math.sin(caller.graphicsState.animation_time /2000);
				model_transform = mult(model_transform, translation(0, floorHeight/2, 0)); //To get to top of the floor
				model_transform = mult(model_transform, rotation(sway, 0, 0, 1)); //make sway
				model_transform = mult(model_transform, scale(trunkWidth, trunkHeight, trunkOtherThing));
				model_transform = mult(model_transform, translation(0, .5, 0)); //To have the bottom of the trunk touch the floor

				caller.m_cube.draw(caller.graphicsState, model_transform, lightBrown);

				for (var nextTrunk = 0; nextTrunk < 7; nextTrunk++)
				{
					model_transform = mult(model_transform, translation(0, .5, 0)); //go up half a chunk for the rotation
					model_transform = mult(model_transform, scale(1/trunkWidth, 1/trunkHeight, 1/trunkOtherThing));
					model_transform = mult(model_transform, rotation(sway, 0, 0, 1));
					model_transform = mult(model_transform, scale(trunkWidth, trunkHeight, trunkOtherThing));
					model_transform = mult(model_transform, translation(0, .5-.13, 0)); //Another half to add the part of the trunk
					//The purpose of subtracting .13 is so that when the chunk rotates, its corners never visibly detach from the other chunks
					caller.m_cube.draw(caller.graphicsState, model_transform, lightBrown);
				}
model_transform = mult(model_transform, translation(0, .5, 0));
				model_transform = mult(model_transform, scale(1/trunkWidth, 1/trunkHeight, 1/trunkOtherThing));
				model_transform = mult(model_transform, scale(2, 2, 2));
				model_transform = mult(model_transform, translation(0, 1, 0));
				caller.m_sphere.draw(caller.graphicsState, model_transform, red);

				model_transform = stack.pop();
				return model_transform;
			}
			function drawBeeBody(caller, model_transform)
			{
				var stack = []
				stack.push(model_transform);
				model_transform = mult(model_transform, rotation(-caller.graphicsState.animation_time / 200, 0, 1, 0)); //rotate around flower
				model_transform = mult(model_transform, translation(0, Math.sin(caller.graphicsState.animation_time/1000) ,0));
				model_transform = mult(model_transform, translation(0, 5, 10));
				stack.push(model_transform);
				model_transform = mult(model_transform, scale(1, .5, .5));
				caller.m_cube.draw(caller.graphicsState, model_transform, black);
				//Wings and legs
				drawWings(caller, model_transform);
				drawLegs(caller, model_transform);
				model_transform = stack.pop();
				//That bulb thing on the wasp
				 stack.push(model_transform);
				model_transform = mult(model_transform, translation(.5, 0, 0));
				model_transform = mult(model_transform, scale(.85, .4, .4));
				model_transform = mult(model_transform, translation(1, 0, 0)); //Go to where bulb will be drawn
				caller.m_sphere.draw(caller.graphicsState, model_transform, yellow);
				model_transform = stack.pop();
				//The head
				model_transform = mult(model_transform, translation(-.5, 0, 0));
					model_transform = mult(model_transform, scale(.25, .25, .25));
				model_transform = mult(model_transform, translation(-1, 0, 0));
				caller.m_sphere.draw(caller.graphicsState, model_transform, black);


			}
			function drawWings(caller, model_transform)
			{
				var stack = [];
				stack.push(model_transform);
				var flap = 60 * Math.sin(caller.graphicsState.animation_time /2000);
				model_transform = mult(model_transform, translation(0, .5, .5));
				model_transform = mult(model_transform, rotation(flap, 1, 0, 0));
				model_transform = mult(model_transform, scale(wingOther, wingHeight, wingWidth));
				model_transform = mult(model_transform, translation(0, 0, .5));
				caller.m_cube.draw(caller.graphicsState, model_transform, greyPlastic);
				model_transform = stack.pop();
				stack.push(model_transform);
				model_transform = mult(model_transform, translation(0, .5, -.5));
				model_transform = mult(model_transform, rotation(-flap, 1, 0, 0));
				model_transform = mult(model_transform, scale(wingOther, wingHeight, wingWidth));
				model_transform = mult(model_transform, translation(0, 0, -.5));
				caller.m_cube.draw(caller.graphicsState, model_transform, greyPlastic);
				model_transform = stack.pop(model_transform);
			}
			function drawLegs(caller, model_transform)
			{
				var stack = [];
				stack.push(model_transform);
				var legSway = 25 * Math.sin(caller.graphicsState.animation_time /850);

				model_transform = mult(model_transform, translation(0, -.5, .5));
				for (var leftSide = -.25; leftSide < .5; leftSide += .25)
				{
					stack.push(model_transform);
					model_transform = mult(model_transform, translation(leftSide, 0, 0));
					model_transform = mult(model_transform, rotation(legSway, 1, 0, 0));
					model_transform = mult(model_transform, scale(legOther, legHeight, legWidth));
					model_transform = mult(model_transform, translation(0, -.5, 0));
					caller.m_cube.draw(caller.graphicsState, model_transform, black);

					model_transform = mult(model_transform, translation(0, -.5, 0));
					//remove the scale, apply the rotation, and reapply the scaling
					model_transform = mult(model_transform, scale(1/legOther, 1/legHeight, 1/legWidth));
					model_transform = mult(model_transform, rotation(legSway, 1, 0, 0));
					model_transform = mult(model_transform, rotation(20, 1, 0, 0));
					model_transform = mult(model_transform, scale(legOther, legHeight, legWidth));
					model_transform = mult(model_transform, translation(0, -.45, 0));
					caller.m_cube.draw(caller.graphicsState, model_transform, black);
					model_transform = stack.pop();
				}

				model_transform = stack.pop();
				stack.push(model_transform);

				model_transform = mult(model_transform, translation(0, -.5, -.5));
				for (var leftSide = -.25; leftSide < .5; leftSide += .25)
				{
					stack.push(model_transform);
					model_transform = mult(model_transform, translation(leftSide, 0, 0));
					model_transform = mult(model_transform, rotation(-legSway, 1, 0, 0));
					model_transform = mult(model_transform, scale(legOther, legHeight, legWidth));
					model_transform = mult(model_transform, translation(0, -.5, 0));
					caller.m_cube.draw(caller.graphicsState, model_transform, black);

					model_transform = mult(model_transform, translation(0, -.5, 0));
					//remove the scale, apply the rotation, and reapply the scaling
					model_transform = mult(model_transform, scale(1/legOther, 1/legHeight, 1/legWidth));
					model_transform = mult(model_transform, rotation(-legSway, 1, 0, 0));
					model_transform = mult(model_transform, rotation(-20, 1, 0, 0));
					model_transform = mult(model_transform, scale(legOther, legHeight, legWidth));
					model_transform = mult(model_transform, translation(0, -.45, 0));
					caller.m_cube.draw(caller.graphicsState, model_transform, black);
					model_transform = stack.pop();
				}
				model_transform = stack.pop();
				// model_transform = mult(model_transform, translation(0, -.5, .5));
				// 				model_transform = mult(model_transform, rotation(legSway, 1, 0, 0));
				// model_transform = mult(model_transform, scale(legOther, legHeight, legWidth));
				// stack.push(model_transform);
				// model_transform = mult(model_transform, translation(0, -.5, 0));
				// caller.m_cube.draw(caller.graphicsState, model_transform, lightBlue);

				// model_transform = mult(model_transform, translation(0, -.5, 0));
				// //remove the scale, apply the rotation, and reapply the scaling
				// model_transform = mult(model_transform, scale(1/legOther, 1/legHeight, 1/legWidth));
				// model_transform = mult(model_transform, rotation(legSway, 1, 0, 0));
				// model_transform = mult(model_transform, rotation(20, 1, 0, 0));
				// model_transform = mult(model_transform, scale(legOther, legHeight, legWidth));
				// model_transform = mult(model_transform, translation(0, -.45, 0));
				// caller.m_cube.draw(caller.graphicsState, model_transform, lightpurple);
			}

			drawFloor(this, model_transform);
			drawTrunk(this, model_transform);
			drawBeeBody(this, model_transform);
// 			function drawTrunk(caller, model_transform)
// 			{
// 				//model_transform = mult(model_transform, rotation(caller.graphicsState.animation_time/20, 0, 1, 0));
// 				model_transform = mult(model_transform, rotation(90, 1, 0, 0));
// 				model_transform = mult(model_transform, scale(1, 1, 2.5));
// 				var y = Math.sin(caller.graphicsState.animation_time / 20 ) / 5;
// model_transform = mult(model_transform, translation(y, 0, 0));
// 				caller.m_cylinder.draw(caller.graphicsState, model_transform, purplePlastic);
// 				return model_transform;
// 			}
// 			drawTrunk(this, model_transform);
			//this.m_cube.draw(this.graphicsState, model_transform, purplePlastic);

		// model_transform = mult( model_transform, translation( 0, 10, -15) );		// Position the next shape by post-multiplying another matrix onto the current matrix product
		// this.m_cube.draw( this.graphicsState, model_transform, purplePlastic );			// Draw a cube, passing in the current matrices
		// CURRENT_BASIS_IS_WORTH_SHOWING(this, model_transform);							// How to draw a set of axes, conditionally displayed - cycle through by pressing p and m
		//
		// model_transform = mult( model_transform, translation( 0, -2, 0 ) );
		// this.m_fan.draw( this.graphicsState, model_transform, greyPlastic );			// Cone
		// CURRENT_BASIS_IS_WORTH_SHOWING(this, model_transform);

		// model_transform = mult( model_transform, translation( 0, -4, 0 ) );
		// this.m_cylinder.draw( this.graphicsState, model_transform, greyPlastic );		// Tube
		// CURRENT_BASIS_IS_WORTH_SHOWING(this, model_transform);

		//
		// model_transform = mult( model_transform, translation( 0, -3, 0 ) );											// Example Translate
		// model_transform = mult( model_transform, rotation( this.graphicsState.animation_time/20, 0, 1, 0 ) );			// Example Rotate. 1st parameter is scalar for angle, last three are axis of rotation.
		// model_transform = mult( model_transform, scale( 5, 1, 5 ) );												// Example Scale
		// this.m_sphere.draw( this.graphicsState, model_transform, earth );				// Sphere
		//
		// model_transform = mult( model_transform, translation( 0, -2, 0 ) );
		// this.m_strip.draw( this.graphicsState, model_transform, stars );				// Rectangle
		// CURRENT_BASIS_IS_WORTH_SHOWING(this, model_transform);
	}



Animation.prototype.update_strings = function( debug_screen_strings )		// Strings this particular class contributes to the UI
{
	debug_screen_strings.string_map["time"] = "Animation Time: " + this.graphicsState.animation_time/1000 + "s";
	debug_screen_strings.string_map["basis"] = "Showing basis: " + this.m_axis.basis_selection;
	debug_screen_strings.string_map["animate"] = "Animation " + (animate ? "on" : "off") ;
	debug_screen_strings.string_map["thrust"] = "Thrust: " + thrust;
}
