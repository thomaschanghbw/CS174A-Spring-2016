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

var texture_filenames_to_load = [ "four.jpg", "nine.jpg", "seven.png", "eight.png", "ace.png", "stars.png", "text.png", "earth.gif", "suicideking.png", "alice.png", "sky1.png", "sky2.png", "sky3.png", "sky4.png", "sky5.png", "king1.png", "king2.png", "king3.png", "king4.png", "king5.png", "king6.png", "king7.png", "king8.png", ];

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

		gl.clearColor( 0, 0, 0, 1 );			// Background color

		for( var i = 0; i < texture_filenames_to_load.length; i++ )
			initTexture( texture_filenames_to_load[i], true );

		self.m_cube = new cube();
		self.m_obj = new shape_from_file( "teapot.obj" )
		self.m_axis = new axis();
		self.m_sphere = new sphere( mat4(), 4 );
		self.m_fan = new triangle_fan_full( 10, mat4() );
		self.m_strip = new rectangular_strip( 1, mat4() );
		self.m_cylinder = new cylindrical_strip( 10, mat4() );
		self.m_heart = new heart();

		// 1st parameter is camera matrix.  2nd parameter is the projection:  The matrix that determines how depth is treated.  It projects 3D points onto a plane.
		self.graphicsState = new GraphicsState( translation(0, 20,-50), perspective(45, canvas.width/canvas.height, .1, 1000), 0 );

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


var directions = [];

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
			suicideking = new Material( vec4( .5,.5,.5,1 ), .5, 1, .5, 40, "suicideking.png" ),
			alice = new Material( vec4( .5,.5,.5,1 ), .5, 1, .5, 40, "alice.png" ),
			sky1 = new Material( vec4( .5,.5,.5,1 ), .5, 1, .5, 40, "sky1.png" ),
			sky2 = new Material( vec4( .5,.5,.5,1 ), .5, 1, .5, 40, "sky2.png" ),
			sky3 = new Material( vec4( .5,.5,.5,1 ), .5, 1, .5, 40, "sky3.png" ),
			sky4 = new Material( vec4( .5,.5,.5,1 ), .5, 1, .5, 40, "sky4.png" ),
			sky5 = new Material( vec4( .5,.5,.5,1 ), .5, 1, .5, 40, "sky5.png" ),
			king1 = new Material( vec4( .5,.5,.5,1 ), .5, 1, .5, 40, "king1.png" ),
			king2 = new Material( vec4( .5,.5,.5,1 ), .5, 1, .5, 40, "king2.png" ),
			king3 = new Material( vec4( .5,.5,.5,1 ), .5, 1, .5, 40, "king3.png" ),
			king4 = new Material( vec4( .5,.5,.5,1 ), .5, 1, .5, 40, "king4.png" ),
			king5 = new Material( vec4( .5,.5,.5,1 ), .5, 1, .5, 40, "king5.png" ),
			king6 = new Material( vec4( .5,.5,.5,1 ), .5, 1, .5, 40, "king6.png" ),
			king7 = new Material( vec4( .5,.5,.5,1 ), .5, 1, .5, 40, "king7.png" ),
			king8 = new Material( vec4( .5,.5,.5,1 ), .5, 1, .5, 40, "king8.png" ),
			ace = new Material( vec4( .5,.5,.5,1 ), .5, 1, .5, 40, "ace.png" ),
			eight = new Material( vec4( .5,.5,.5,1 ), .5, 1, .5, 40, "eight.png" ),
			four = new Material( vec4( .5,.5,.5,1 ), .5, 1, .5, 40, "four.jpg" ),
			nine = new Material( vec4( .5,.5,.5,1 ), .5, 1, .5, 40, "nine.jpg" ),
			seven = new Material( vec4( .5,.5,.5,1 ), .5, 1, .5, 40, "seven.png" ),
			pinky = new Material(vec4(.78, 0, .22), .5, 1, 1, 40);


			// if(this.graphicsState.animation_time > 5000 && this.graphicsState.animation_time < 7000)
			// {
			// 	this.graphicsState.camera_transform = lookAt(vec3(1.8, -4.5, .55), vec3(1.8, -4.5, .55), vec3(1.8, -4.5, .55));
			// }
		/**********************************
		Start coding here!!!!
		**********************************/

		  var stack = [];
			var stack2 = [];
			var time1 = this.graphicsState.animation_time - 6000;
			var time2 = this.graphicsState.animation_time - 15000;
			var time3 = this.graphicsState.animation_time - 16000;
			var time4 = this.graphicsState.animation_time - 24800;
			var time5 = this.graphicsState.animation_time - 18000;
			var time6 = this.graphicsState.animation_time - 27800;
			var time7 = this.graphicsState.animation_time - 30800;
			var time8 = this.graphicsState.animation_time - 37600;
			var time9 = this.graphicsState.animation_time - 39000;
			var time10 = this.graphicsState.animation_time - 42000;

			if(this.graphicsState.animation_time >=0 && this.graphicsState.animation_time < 6000)
			{
				this.graphicsState.camera_transform = lookAt(vec3(0, 0, 35), vec3(0, 0, 0), vec3(0, 1, 0));
			}
		//this.graphicsState.camera_transform = lookAt(vec3(0, 0, 45), vec3(0, -(time1/250), 0), vec3(0, 1, 0));

				if(this.graphicsState.animation_time >= 6000 && this.graphicsState.animation_time < 15000)
			{
				this.graphicsState.camera_transform = lookAt(vec3(0, 0, 35), vec3(0, -(time1/250), 0), vec3(0, 1, 0));
			}
			if(this.graphicsState.animation_time >= 16000 && this.graphicsState.animation_time < 18000)
		{
			this.graphicsState.camera_transform = lookAt(vec3(0, Math.sin(time3*.0001)*150, 35-Math.sin(time3*.0001)*150), vec3(0, -(9000/250), 0), vec3(0, 1, 0));
		}
		if(this.graphicsState.animation_time >= 18000 && this.graphicsState.animation_time < 24800 )
	{
		this.graphicsState.camera_transform = lookAt(vec3(0, 29.8+time5/1000, 5.2), vec3(0, -(9000/250), 0-time5/1000), vec3(0, 1, 0));
	}
	if(this.graphicsState.animation_time >= 30800 && this.graphicsState.animation_time < 37600)
	{
		this.graphicsState.camera_transform = lookAt(vec3(0, 36.6-time7/1000, 5.2), vec3(0, -(9000/250), 0-time5/1000), vec3(0, 1, 0));
	}
	if(this.graphicsState.animation_time >= 37600 && this.graphicsState.animation_time < 39000)
	{
		this.graphicsState.camera_transform = lookAt(vec3(0, 29.8-Math.sin(time8*.0001)*100, 5.2), vec3(0, -(9000/250), 0-time5/1000-Math.sin(time8*.0001)*250), vec3(0, 1, 0));
	}




				var skyScale = 100;
				//I can't figure out this skybox thing, so I'm doing it manually
				stack.push(model_transform);
				model_transform=mult(model_transform, translation(0, 0, -skyScale/2-20));
				model_transform = mult(model_transform, scale(skyScale+50, skyScale, .1));
				this.m_cube.draw(this.graphicsState, model_transform, sky2);
				model_transform = stack.pop();

				stack.push(model_transform);
				model_transform=mult(model_transform, rotation(-90, 0, 1, 0));
				model_transform=mult(model_transform, translation(-20, 0, -skyScale/2-25));
				model_transform = mult(model_transform, scale(skyScale, skyScale, .1));
				this.m_cube.draw(this.graphicsState, model_transform, sky3);
				model_transform = stack.pop();

				stack.push(model_transform);
				model_transform=mult(model_transform, rotation(90, 0, 1, 0));
				model_transform=mult(model_transform, translation(20, 0, -skyScale/2-25));
				model_transform = mult(model_transform, scale(skyScale, skyScale, .1));
				this.m_cube.draw(this.graphicsState, model_transform, sky1);
				model_transform = stack.pop();

				stack.push(model_transform);
				model_transform=mult(model_transform, rotation(90, 1, 0, 0));
				model_transform=mult(model_transform, translation(0, -20, -skyScale/2));
				model_transform = mult(model_transform, scale(skyScale+50, skyScale, .1));
				this.m_cube.draw(this.graphicsState, model_transform, sky4);
				model_transform = stack.pop();

				stack.push(model_transform);
				model_transform
				model_transform=mult(model_transform, rotation(-90, 1, 0, 0));
				model_transform=mult(model_transform, translation(0, 20, -skyScale/2));
				model_transform = mult(model_transform, scale(skyScale+55, skyScale+55, .1));
				this.m_cube.draw(this.graphicsState, model_transform, sky5);
				model_transform = stack.pop();
				// model_transform = mult(model_transform, translation(50, 0, 0));
				// model_transform= mult(model_transform, rotation(65, 1, 0, 0));
				// model_transform= mult(model_transform, rotation(90, 0, 1, 0));
				//
				// model_transform = mult(model_transform, scale(100, 1000,2000));
				// this.m_cylinder.draw(this.graphicsState, model_transform, alice);
			//	model_transform = stack.pop();



			// stack.push(model_transform);
			// model_transform = mult(model_transform, scale(8, 2, .25));
			// this.m_cube.draw(this.graphicsState, model_transform, king1);
			// model_transform = stack.pop();
			// stack.push(model_transform);
			//
			// stack.push(model_transform);
			// model_transform = mult(model_transform, translation(0, -2, 0));
			// model_transform = mult(model_transform, scale(8, 2, .25));
			// this.m_cube.draw(this.graphicsState, model_transform, king2);
			// model_transform = stack.pop();
			// stack.push(model_transform);



//card
				 stack.push(model_transform);
				 if(this.graphicsState.animation_time >=6000 && this.graphicsState.animation_time < 15000) {
				model_transform = mult(model_transform, translation(0, -(time1/250), 0));
			}
			else if (this.graphicsState.animation_time >=15000){
				model_transform = mult(model_transform, translation(0, -(9000/250), 0));
			}
			if(this.graphicsState.animation_time >= 24800 && this.graphicsState.animation_time < 27800)
			{
			model_transform = mult(model_transform, translation(0, -8, 0));
			model_transform = mult(model_transform, rotation(time4*33.3/1000, 1, 0, 0));
			model_transform = mult(model_transform, translation(0, 8, 0));
			}
			if(this.graphicsState.animation_time >= 27800 && this.graphicsState.animation_time < 30800)
			{
				model_transform = mult(model_transform, translation(0, -8, 0));
				model_transform = mult(model_transform, rotation(90, 1, 0, 0));
				model_transform = mult(model_transform, translation(0, 8, 0));
			}
			if(this.graphicsState.animation_time >= 30800)
			{
			model_transform = mult(model_transform, translation(0, -8, 0));
			model_transform = mult(model_transform, rotation(90, 1, 0, 0));
			model_transform = mult(model_transform, translation(0, -20, 0));
			model_transform = mult(model_transform, rotation(time7*33.33/250, 0, 0, 1));
			model_transform = mult(model_transform, translation(0, 20, 0));
			model_transform = mult(model_transform, translation(0, Math.pow(time7/500, 1.5), 0));
			model_transform = mult(model_transform, translation(0, 8, 0));
		}
				model_transform = mult(model_transform, scale(8, 16, .25));
				this.m_cube.draw(this.graphicsState, model_transform, suicideking);
			 model_transform = stack.pop();

			 //Hearts
			 stack.push(model_transform);
			 if(this.graphicsState.animation_time >=6000 && this.graphicsState.animation_time < 15000) {
			model_transform = mult(model_transform, translation(0, -(time1/250), 0));
		}
		else if (this.graphicsState.animation_time >=15000){
			model_transform = mult(model_transform, translation(0, -(9000/250), 0));
		}
		if(this.graphicsState.animation_time >= 24800 && this.graphicsState.animation_time < 27800)
		{
		model_transform = mult(model_transform, translation(0, -8, 0));
		model_transform = mult(model_transform, rotation(time4*33.3/1000, 1, 0, 0));
		model_transform = mult(model_transform, translation(0, 8, 0));
		}
		if(this.graphicsState.animation_time >= 27800)
		{
			model_transform = mult(model_transform, scale(1/100, 1/100, 1/100));
			// model_transform = mult(model_transform, translation(0, -8, 0));
			// model_transform = mult(model_transform, rotation(90, 1, 0, 0));
			// model_transform = mult(model_transform, translation(0, -20, 0));
			// model_transform = mult(model_transform, rotation(time7*33.33/250, 0, 0, 1));
			// model_transform = mult(model_transform, translation(0, 20, 0));
			// model_transform = mult(model_transform, translation(0, 8, 0));
		}
				model_transform = mult(model_transform, translation(-2, 5.5, .55));
		 model_transform = mult(model_transform, rotation(this.graphicsState.animation_time/20, 0, 1, 0));
		 model_transform = mult(model_transform, scale(.6, .6, .6));
		this.m_heart.draw(this.graphicsState, model_transform, pinky);
		 model_transform = stack.pop();

		 stack.push(model_transform);
		 if(this.graphicsState.animation_time >=6000 && this.graphicsState.animation_time < 15000) {
		model_transform = mult(model_transform, translation(0, -(time1/250), 0));
	}
	else if (this.graphicsState.animation_time >=15000){
		model_transform = mult(model_transform, translation(0, -(9000/250), 0));
	}
	if(this.graphicsState.animation_time >= 24800 && this.graphicsState.animation_time < 27800)
	{
	model_transform = mult(model_transform, translation(0, -8, 0));
	model_transform = mult(model_transform, rotation(time4*33.3/1000, 1, 0, 0));
	model_transform = mult(model_transform, translation(0, 8, 0));
	}
	if(this.graphicsState.animation_time >= 27800)
	{
		model_transform = mult(model_transform, scale(1/100, 1/100, 1/100));
		// model_transform = mult(model_transform, translation(0, -8, 0));
		// model_transform = mult(model_transform, rotation(90, 1, 0, 0));
		// model_transform = mult(model_transform, translation(0, -20, 0));
		// model_transform = mult(model_transform, rotation(time7*33.33/250, 0, 0, 1));
		// model_transform = mult(model_transform, translation(0, 20, 0));
		// model_transform = mult(model_transform, translation(0, 8, 0));
	}
		 model_transform = mult(model_transform, translation(1.8, -4.5, .55));
		 model_transform = mult(model_transform, rotation(90, 0, 1, 0));
	model_transform = mult(model_transform, rotation(-this.graphicsState.animation_time/20, 0, 1, 0));
	model_transform = mult(model_transform, scale(.6, .6, .6));
        this.m_heart.draw(this.graphicsState, model_transform, pinky);
		model_transform = stack.pop();

//Bendy cards
			stack.push(model_transform);
			model_transform = mult(model_transform, translation(0, -(9000/250)+1, 0));
			model_transform = mult(model_transform, translation(-15, -7, -10)); //position of bottommost card
			if(this.graphicsState.animation_time >= 6000 && this.graphicsState.animation_time < 24800)
			{
				model_transform = mult(model_transform, rotation(2.7 * Math.sin(time1/2000), 1, 0, 0));
			}
			if(this.graphicsState.animation_time >= 24800 && this.graphicsState.animation_time < 27800)
			{
			model_transform = mult(model_transform, translation(0, -8, 0));
			model_transform = mult(model_transform, rotation(time4*33.3/1000-10, 1, 0, 0));
			model_transform = mult(model_transform, translation(0, 8, 0));
			}
			if(this.graphicsState.animation_time >= 27800 && this.graphicsState.animation_time < 30800)
			{
				model_transform = mult(model_transform, translation(0, -8, 0));
				model_transform = mult(model_transform, rotation(90, 1, 0, 0));
				model_transform = mult(model_transform, rotation(time6*16.667/1000, 0, 0, 1));
				model_transform = mult(model_transform, translation(0, 8, 0));
			}
			if(this.graphicsState.animation_time >= 30800)
			{
				model_transform = mult(model_transform, translation(0, -8, 0));
				model_transform = mult(model_transform, rotation(90, 1, 0, 0));
				model_transform = mult(model_transform, rotation(45, 0, 0, 1));
				model_transform = mult(model_transform, translation(0, -18, 0));
				model_transform = mult(model_transform, rotation(time7*33.33/250, 0, 0, 1));
				model_transform = mult(model_transform, translation(0, 15, 0));
				model_transform = mult(model_transform, translation(0, Math.pow(time7/500, 1.5), 0));
				model_transform = mult(model_transform, translation(0, 8, 0));
			}

			model_transform = mult(model_transform, scale(8, 2, .25));
			this.m_cube.draw(this.graphicsState, model_transform, king8);

			model_transform = mult(model_transform, scale(1/8, 1/2, 1/.25));
			model_transform = mult(model_transform, translation(0, 2, 0));
			if(this.graphicsState.animation_time >= 6000 && this.graphicsState.animation_time < 24800)
			{
				model_transform = mult(model_transform, rotation(2.7 * Math.sin(time1 /2000), 1, 0, 0));
			}
			model_transform = mult(model_transform, scale(8, 2, .25));
			this.m_cube.draw(this.graphicsState, model_transform, king7);

			model_transform = mult(model_transform, scale(1/8, 1/2, 1/.25));
			model_transform = mult(model_transform, translation(0, 2, 0));
			if(this.graphicsState.animation_time >= 6000 && this.graphicsState.animation_time < 24800)
			{
				model_transform = mult(model_transform, rotation(2.7 * Math.sin(time1 /2000), 1, 0, 0));
			}
			model_transform = mult(model_transform, scale(8, 2, .25));
			this.m_cube.draw(this.graphicsState, model_transform, king6);

			model_transform = mult(model_transform, scale(1/8, 1/2, 1/.25));
			model_transform = mult(model_transform, translation(0, 2, 0));
			if(this.graphicsState.animation_time >= 6000 && this.graphicsState.animation_time < 24800)
			{
				model_transform = mult(model_transform, rotation(2.7 * Math.sin(time1 /2000), 1, 0, 0));
			}
			model_transform = mult(model_transform, scale(8, 2, .25));
			this.m_cube.draw(this.graphicsState, model_transform, king5);

			model_transform = mult(model_transform, scale(1/8, 1/2, 1/.25));
			model_transform = mult(model_transform, translation(0, 2, 0));
			if(this.graphicsState.animation_time >= 6000 && this.graphicsState.animation_time < 24800)
			{
				model_transform = mult(model_transform, rotation(2.7 * Math.sin(time1 /2000), 1, 0, 0));
			}
			model_transform = mult(model_transform, scale(8, 2, .25));
			this.m_cube.draw(this.graphicsState, model_transform, king4);

			model_transform = mult(model_transform, scale(1/8, 1/2, 1/.25));
			model_transform = mult(model_transform, translation(0, 2, 0));
			if(this.graphicsState.animation_time >= 6000 && this.graphicsState.animation_time < 24800)
			{
				model_transform = mult(model_transform, rotation(2.7 * Math.sin(time1 /2000), 1, 0, 0));
			}
			model_transform = mult(model_transform, scale(8, 2, .25));
			this.m_cube.draw(this.graphicsState, model_transform, king3);

			model_transform = mult(model_transform, scale(1/8, 1/2, 1/.25));
			model_transform = mult(model_transform, translation(0, 2, 0));
			if(this.graphicsState.animation_time >= 6000 && this.graphicsState.animation_time < 24800)
			{
				model_transform = mult(model_transform, rotation(2.7 * Math.sin(time1 /2000), 1, 0, 0));
			}
			model_transform = mult(model_transform, scale(8, 2, .25));
			this.m_cube.draw(this.graphicsState, model_transform, king2);

			model_transform = mult(model_transform, scale(1/8, 1/2, 1/.25));
			model_transform = mult(model_transform, translation(0, 2, 0));
			if(this.graphicsState.animation_time >= 6000 && this.graphicsState.animation_time < 24800)
			{
				model_transform = mult(model_transform, rotation(2.7 * Math.sin(time1 /2000), 1, 0, 0));
			}
			model_transform = mult(model_transform, scale(8, 2, .25));
			this.m_cube.draw(this.graphicsState, model_transform, king1);
			model_transform = stack.pop();


			/*******
			Next Set of bendy cards
			******/

			stack.push(model_transform);
			model_transform = mult(model_transform, translation(0, -(9000/250)+1, 0));
			model_transform = mult(model_transform, translation(15, -7, -10)); //position of bottommost card
			if(this.graphicsState.animation_time >= 6000 && this.graphicsState.animation_time < 24800)
			{
				model_transform = mult(model_transform, rotation(2.7 * Math.sin(time1/2000), 1, 0, 0));
			}

			if(this.graphicsState.animation_time >= 24800 && this.graphicsState.animation_time < 27800)
			{
			model_transform = mult(model_transform, translation(0, -8, 0));
			model_transform = mult(model_transform, rotation(time4*33.3/1000-10, 1, 0, 0));
			model_transform = mult(model_transform, translation(0, 8, 0));
			}
			if(this.graphicsState.animation_time >= 27800 && this.graphicsState.animation_time < 30800)
			{
				model_transform = mult(model_transform, translation(0, -8, 0));
				model_transform = mult(model_transform, rotation(90, 1, 0, 0));
				model_transform = mult(model_transform, rotation(-time6*16.667/1000, 0, 0, 1));
				model_transform = mult(model_transform, translation(0, 8, 0));
			}
			if(this.graphicsState.animation_time >= 30800)
			{
				model_transform = mult(model_transform, translation(0, -8, 0));
				model_transform = mult(model_transform, rotation(90, 1, 0, 0));
				model_transform = mult(model_transform, rotation(-45, 0, 0, 1));
				model_transform = mult(model_transform, translation(0, -18, 0));
				model_transform = mult(model_transform, rotation(time7*33.33/250, 0, 0, 1));
				model_transform = mult(model_transform, translation(0, 15, 0));
				model_transform = mult(model_transform, translation(0, Math.pow(time7/500, 1.5), 0));
				model_transform = mult(model_transform, translation(0, 8, 0));
			}
			model_transform = mult(model_transform, scale(8, 2, .25));
			this.m_cube.draw(this.graphicsState, model_transform, king8);

			model_transform = mult(model_transform, scale(1/8, 1/2, 1/.25));
			model_transform = mult(model_transform, translation(0, 2, 0));
			if(this.graphicsState.animation_time >= 6000 && this.graphicsState.animation_time < 24800)
			{
				model_transform = mult(model_transform, rotation(2.7 * Math.sin(time1 /2000), 1, 0, 0));
			}
			model_transform = mult(model_transform, scale(8, 2, .25));
			this.m_cube.draw(this.graphicsState, model_transform, king7);

			model_transform = mult(model_transform, scale(1/8, 1/2, 1/.25));
			model_transform = mult(model_transform, translation(0, 2, 0));
			if(this.graphicsState.animation_time >= 6000 && this.graphicsState.animation_time < 24800)
			{
				model_transform = mult(model_transform, rotation(2.7 * Math.sin(time1 /2000), 1, 0, 0));
			}
			model_transform = mult(model_transform, scale(8, 2, .25));
			this.m_cube.draw(this.graphicsState, model_transform, king6);

			model_transform = mult(model_transform, scale(1/8, 1/2, 1/.25));
			model_transform = mult(model_transform, translation(0, 2, 0));
			if(this.graphicsState.animation_time >= 6000 && this.graphicsState.animation_time < 24800)
			{
				model_transform = mult(model_transform, rotation(2.7 * Math.sin(time1 /2000), 1, 0, 0));
			}
			model_transform = mult(model_transform, scale(8, 2, .25));
			this.m_cube.draw(this.graphicsState, model_transform, king5);

			model_transform = mult(model_transform, scale(1/8, 1/2, 1/.25));
			model_transform = mult(model_transform, translation(0, 2, 0));
			if(this.graphicsState.animation_time >= 6000 && this.graphicsState.animation_time < 24800)
			{
				model_transform = mult(model_transform, rotation(2.7 * Math.sin(time1 /2000), 1, 0, 0));
			}
			model_transform = mult(model_transform, scale(8, 2, .25));
			this.m_cube.draw(this.graphicsState, model_transform, king4);

			model_transform = mult(model_transform, scale(1/8, 1/2, 1/.25));
			model_transform = mult(model_transform, translation(0, 2, 0));
			if(this.graphicsState.animation_time >= 6000 && this.graphicsState.animation_time < 24800)
			{
				model_transform = mult(model_transform, rotation(2.7 * Math.sin(time1 /2000), 1, 0, 0));
			}
			model_transform = mult(model_transform, scale(8, 2, .25));
			this.m_cube.draw(this.graphicsState, model_transform, king3);

			model_transform = mult(model_transform, scale(1/8, 1/2, 1/.25));
			model_transform = mult(model_transform, translation(0, 2, 0));
			if(this.graphicsState.animation_time >= 6000 && this.graphicsState.animation_time < 24800)
			{
				model_transform = mult(model_transform, rotation(2.7 * Math.sin(time1 /2000), 1, 0, 0));
			}
			model_transform = mult(model_transform, scale(8, 2, .25));
			this.m_cube.draw(this.graphicsState, model_transform, king2);

			model_transform = mult(model_transform, scale(1/8, 1/2, 1/.25));
			model_transform = mult(model_transform, translation(0, 2, 0));
			if(this.graphicsState.animation_time >= 6000 && this.graphicsState.animation_time < 24800)
			{
				model_transform = mult(model_transform, rotation(2.7 * Math.sin(time1 /2000), 1, 0, 0));
			}
			model_transform = mult(model_transform, scale(8, 2, .25));
			this.m_cube.draw(this.graphicsState, model_transform, king1);
			model_transform = stack.pop();

			/*******
			Non-bendy cards
			*******/
			stack.push(model_transform);
			model_transform = mult(model_transform, translation(0, -(9000/250)+1, 0));

			model_transform = mult(model_transform, translation(-25, 0, -20)); //position of bottommost card
			if(this.graphicsState.animation_time >= 24800 && this.graphicsState.animation_time < 27800)
			{
			model_transform = mult(model_transform, translation(0, -8, 0));
			model_transform = mult(model_transform, rotation(time4*33.3/1000, 1, 0, 0));
			model_transform = mult(model_transform, translation(0, 8, 0));
			}
			if(this.graphicsState.animation_time >= 27800 && this.graphicsState.animation_time < 30800)
			{
				model_transform = mult(model_transform, translation(0, -8, 0));
				model_transform = mult(model_transform, rotation(90, 1, 0, 0));
				model_transform = mult(model_transform, rotation(time6*33.33/1000, 0, 0, 1));
				model_transform = mult(model_transform, translation(0, 8, 0));
			}
			if(this.graphicsState.animation_time >= 30800)
			{
				model_transform = mult(model_transform, translation(0, -8, 0));
				model_transform = mult(model_transform, rotation(90, 1, 0, 0));
				model_transform = mult(model_transform, rotation(90, 0, 0, 1));
				model_transform = mult(model_transform, translation(0, -25, 0));
				model_transform = mult(model_transform, rotation(time7*33.33/250, 0, 0, 1));
				model_transform = mult(model_transform, translation(0, 20, 0));
				model_transform = mult(model_transform, translation(0, Math.pow(time7/500, 1.5), 0));
				model_transform = mult(model_transform, translation(0, 8, 0));
			}
			model_transform = mult(model_transform, scale(8, 16, .25));
			this.m_cube.draw(this.graphicsState, model_transform, ace);


		// if(this.graphicsState.animation_time >=24800)
		// {
		// 	model_transform = mult(model_transform, translation(-25, 0, -20));
		// 	model_transform = mult(model_transform, translation(0, -8, 0));
		//
		//
		// }
			model_transform = stack.pop();

			stack.push(model_transform);
			model_transform = mult(model_transform, translation(0, -(9000/250)+1, 0));
			model_transform = mult(model_transform, translation(25, 0, -20)); //position of bottommost card
			if(this.graphicsState.animation_time >= 24800 && this.graphicsState.animation_time < 27800)
			{
			model_transform = mult(model_transform, translation(0, -8, 0));
			model_transform = mult(model_transform, rotation(time4*33.3/1000, 1, 0, 0));
			model_transform = mult(model_transform, translation(0, 8, 0));
			}
			if(this.graphicsState.animation_time >= 27800 && this.graphicsState.animation_time < 30800)
			{
				model_transform = mult(model_transform, translation(0, -8, 0));
				model_transform = mult(model_transform, rotation(90, 1, 0, 0));
				model_transform = mult(model_transform, rotation(-time6*33.33/1000, 0, 0, 1));
				model_transform = mult(model_transform, translation(0, 8, 0));
			}
			if(this.graphicsState.animation_time >= 30800)
			{
				model_transform = mult(model_transform, translation(0, -8, 0));
				model_transform = mult(model_transform, rotation(90, 1, 0, 0));
				model_transform = mult(model_transform, rotation(-90, 0, 0, 1));
				model_transform = mult(model_transform, translation(0, -25, 0));
				model_transform = mult(model_transform, rotation(time7*33.33/250, 0, 0, 1));
				model_transform = mult(model_transform, translation(0, 20, 0));
				model_transform = mult(model_transform, translation(0, Math.pow(time7/500, 1.5), 0));
				model_transform = mult(model_transform, translation(0, 8, 0));
			}
			model_transform = mult(model_transform, scale(8, 16, .25));
			this.m_cube.draw(this.graphicsState, model_transform, eight);
			model_transform = stack.pop();


			stack.push(model_transform);
			model_transform = mult(model_transform, translation(0, -(9000/250)+1, 0));
			model_transform = mult(model_transform, translation(15, 0, -30)); //position of bottommost card
			if(this.graphicsState.animation_time >= 24800 && this.graphicsState.animation_time < 27800)
			{
			model_transform = mult(model_transform, translation(0, -8, 0));
			model_transform = mult(model_transform, rotation(time4*33.3/1000, 1, 0, 0));
			model_transform = mult(model_transform, translation(0, 8, 0));
			}
			if(this.graphicsState.animation_time >= 27800 && this.graphicsState.animation_time < 30800)
			{
				model_transform = mult(model_transform, translation(0, -8, 0));
				model_transform = mult(model_transform, rotation(90, 1, 0, 0));
				model_transform = mult(model_transform, rotation(-time6*(33.33+16.667)/1000, 0, 0, 1));
				model_transform = mult(model_transform, translation(0, 8, 0));
			}
			if(this.graphicsState.animation_time >= 30800)
			{
				model_transform = mult(model_transform, translation(0, -8, 0));
				model_transform = mult(model_transform, rotation(90, 1, 0, 0));
				model_transform = mult(model_transform, rotation(-135, 0, 0, 1));
				model_transform = mult(model_transform, translation(0, -18, 0));
				model_transform = mult(model_transform, rotation(time7*33.33/250, 0, 0, 1));
				model_transform = mult(model_transform, translation(0, 18, 0));
				model_transform = mult(model_transform, translation(0, Math.pow(time7/500, 1.5), 0));
				model_transform = mult(model_transform, translation(0, 8, 0));
			}
			model_transform = mult(model_transform, scale(8, 16, .25));
			this.m_cube.draw(this.graphicsState, model_transform, seven);
			model_transform = stack.pop();



			stack.push(model_transform);
			model_transform = mult(model_transform, translation(0, -(9000/250)+1, 0));
			model_transform = mult(model_transform, translation(-15, 0, -30)); //position of bottommost card
			if(this.graphicsState.animation_time >= 24800 && this.graphicsState.animation_time < 27800)
			{
			model_transform = mult(model_transform, translation(0, -8, 0));
			model_transform = mult(model_transform, rotation(time4*33.3/1000, 1, 0, 0));
			model_transform = mult(model_transform, translation(0, 8, 0));
			}
			if(this.graphicsState.animation_time >= 27800 && this.graphicsState.animation_time < 30800)
			{
				model_transform = mult(model_transform, translation(0, -8, 0));
				model_transform = mult(model_transform, rotation(90, 1, 0, 0));
				model_transform = mult(model_transform, rotation(time6*(16.667+33.33)/1000, 0, 0, 1));
				model_transform = mult(model_transform, translation(0, 8, 0));
			}
			if(this.graphicsState.animation_time >= 30800)
			{
				model_transform = mult(model_transform, translation(0, -8, 0));
				model_transform = mult(model_transform, rotation(90, 1, 0, 0));
				model_transform = mult(model_transform, rotation(135, 0, 0, 1));
				model_transform = mult(model_transform, translation(0, -18, 0));
				model_transform = mult(model_transform, rotation(time7*33.33/250, 0, 0, 1));
				model_transform = mult(model_transform, translation(0, 18, 0));
				model_transform = mult(model_transform, translation(0, Math.pow(time7/500, 1.5), 0));
				model_transform = mult(model_transform, translation(0, 8, 0));
			}
			model_transform = mult(model_transform, scale(8, 16, .25));
			this.m_cube.draw(this.graphicsState, model_transform, four);
			model_transform = stack.pop();



			stack.push(model_transform);
			model_transform = mult(model_transform, translation(0, -(9000/250)+1, 0));
			model_transform = mult(model_transform, translation(0, 0, -40)); //position of bottommost card
			if(this.graphicsState.animation_time >= 24800 && this.graphicsState.animation_time < 27800)
			{
			model_transform = mult(model_transform, translation(0, -8, 0));
			model_transform = mult(model_transform, rotation(time4*33.3/1000, 1, 0, 0));
			model_transform = mult(model_transform, translation(0, 8, 0));
			}
			if(this.graphicsState.animation_time >= 27800 && this.graphicsState.animation_time < 30800)
			{
				model_transform = mult(model_transform, translation(0, -8, 0));
				model_transform = mult(model_transform, rotation(90, 1, 0, 0));
				model_transform = mult(model_transform, rotation(-time6*(33.33+33.33)/1000, 0, 0, 1));
				model_transform = mult(model_transform, translation(0, 8, 0));
			}
			if(this.graphicsState.animation_time >= 30800)
			{
				model_transform = mult(model_transform, translation(0, -8, 0));
				model_transform = mult(model_transform, rotation(90, 1, 0, 0));
				model_transform = mult(model_transform, rotation(180, 0, 0, 1));
				model_transform = mult(model_transform, translation(0, -20, 0));
				model_transform = mult(model_transform, rotation(time7*33.33/250, 0, 0, 1));
				model_transform = mult(model_transform, translation(0, 20, 0));
				model_transform = mult(model_transform, translation(0, Math.pow(time7/500, 1.5), 0));
				model_transform = mult(model_transform, translation(0, 8, 0));
			}
			model_transform = mult(model_transform, scale(8, 16, .25));
			this.m_cube.draw(this.graphicsState, model_transform, nine);
			model_transform = stack.pop();


			/*******
			House of cards
			********/
			stack.push(model_transform);
			model_transform = mult(model_transform, translation(0, 0, -20));
			if(this.graphicsState.animation_time < 30800)
			{
				model_transform = mult(model_transform, translation(0, -55, 0));
			}
			if(this.graphicsState.animation_time >= 30800 && this.graphicsState.animation_time < 36300)
			{
				model_transform = mult(model_transform, translation(0, -55+time7/100, 0));
			}

			model_transform = mult(model_transform, scale(1.2, 1.2, 1.2));
			if(this.graphicsState.animation_time >= 39000 && this.graphicsState.animation_time < 42000)
			{
				model_transform = mult(model_transform, scale(1/Math.pow(time9, 1/4), 1/Math.pow(time9, 1/4), 1/Math.pow(time9, 1/4)));
			}
			if(this.graphicsState.animation_time >= 42000 )
			{
				model_transform = mult(model_transform, scale(1/100, 1/100, 1/100));
			}
			this.m_heart.draw(this.graphicsState, model_transform, earth);
			if(this.graphicsState.animation_time >= 39000 && this.graphicsState.animation_time < 42000)
			{
				model_transform = mult(model_transform, scale(Math.pow(time9, 1/4), Math.pow(time9, 1/4), Math.pow(time9, 1/4)));
			}
			if(this.graphicsState.animation_time >= 42000 )
			{
				model_transform = mult(model_transform, scale(100, 100, 100));
			}

			if(this.graphicsState.animation_time == 0)
			{

				for(var thomas = 0; thomas<20; thomas++)
				{
					 directions[thomas] = {x: Math.random(), y: Math.random(), z: Math.random()};
					// direction[thomas] = Math.random();
					// directions[thomas] = Math.random();
				}
			}
			if(this.graphicsState.animation_time > 42000)
			{
				for (var thomas1 =0; thomas1<20; thomas1++)
				{
				stack.push(model_transform);
				model_transform = mult(model_transform, translation(directions[thomas1].x  * time10 / 1000 + (0.5 *3.5 * Math.pow(time10 / 1000, 2)),directions[thomas1].y  * time10 / 1000 + (0.5 *3.5 * Math.pow(time10 / 1000, 2)),directions[thomas1].z  * time10 / 1000 + (0.5 *3.5 * Math.pow(time10 / 1000, 2)) ));
				model_transform = mult(model_transform, scale(1/10, 1/10, 1/10));
				this.m_heart.draw(this.graphicsState, model_transform, pinky);
				model_transform = stack.pop();
			}
			}


			// if(this.graphicsState.animation_time == 42000)
			// {
			// 	var directions = [];
			// 	for(var thomas = 0; thomas<20; thomas++)
			// 	{
			// 		directions[thomas].x = Math.random();
			// 		direction[thomas].y = Math.random();
			// 		directions[thomas].z = Math.random();
			// 	}
			// }
			// if(this.graphicsState.animation_time > 42000)
			// {
			// 	for (var thomas1 =0; thomas1<20; thomas1++)
			// 	stack.push(model_transform);
			// 	model_transform = mult(model_transform, translation(directions[thomas1].x * time10 + (0.5 *3.5 * Math.pow(time10, 2)),directions[thomas1].y * time10 + (0.5 *3.5 * Math.pow(time10, 2)),directions[thomas1].z * time10 + (0.5 *3.5 * Math.pow(time10, 2)) ))
			// 	model_transform = mult(model_transform, scale(1/10, 1/10, 1/10));
			// 	this.m_heart.draw(this.graphicsState, model_transform, pinky);
			// 	model_transform = stack.pop();
			// }
			model_transform = mult(model_transform, translation( 0, -1.7, 0));
			model_transform = mult(model_transform, scale(1/2, 1/2, 1/2));
			stack.push(model_transform);

			model_transform = mult(model_transform, rotation(30, 0, 0, 1));
			model_transform = mult(model_transform, translation(0, -8, 0));
			model_transform = mult(model_transform, rotation(90, 0, 1, 0));
			model_transform = mult(model_transform, scale(8, 16, .25));
			this.m_cube.draw(this.graphicsState, model_transform, ace);

			model_transform = stack.pop();
			model_transform = mult(model_transform, rotation(-30, 0, 0, 1));
			model_transform = mult(model_transform, translation(0, -8, 0));
			model_transform = mult(model_transform, rotation(90, 0, 1, 0));
			model_transform = mult(model_transform, scale(8, 16, .25));
			this.m_cube.draw(this.graphicsState, model_transform, four);
			model_transform = mult(model_transform, scale(1/8, 1/16, 1/.25));
			model_transform = mult(model_transform, translation(0, -8, 0));
			model_transform = mult(model_transform, rotation(60, 1, 0, 0));
			model_transform = mult(model_transform, translation(0, 8, 0));
			model_transform = mult(model_transform, scale(8, 16, .25));
			this.m_cube.draw(this.graphicsState, model_transform, four);


			// for(var inc = -8; inc <=8; inc+=8)
			// {
			// 	stack.push(model_transform);
			// 	model_transform = mult(model_transform, scale(1/8, 1/16, 1/.25));
			// 	model_transform = mult(model_transform, rotation(90, 1, 0, 0));
			// 	model_transform = mult(model_transform, translation(0, 8, inc));
			// 	model_transform = mult(model_transform, scale(8, 16, .25));
			// 	this.m_cube.draw(this.graphicsState, model_transform, four);
			// 	model_transform = stack.pop()
			// }
			for(var inc =-1; inc <=1; inc+=2)
			{
				stack.push(model_transform);
				model_transform = mult(model_transform, scale(1/8, 1/16, 1/.25));
				model_transform = mult(model_transform, translation(0, inc * 4, 0));
				stack.push(model_transform);
				model_transform = mult(model_transform, rotation(inc * 75, 1, 0, 0));
				model_transform = mult(model_transform, translation(0, inc * 8, 0));
				model_transform = mult(model_transform, scale(8, 16, .25));
				this.m_cube.draw(this.graphicsState, model_transform, seven);
				model_transform = stack.pop();
				model_transform = mult(model_transform, rotation(-inc * 75, 1, 0, 0));
				model_transform = mult(model_transform, translation(0, -inc * 8, 0));
				model_transform = mult(model_transform, scale(8, 16, .25));

				this.m_cube.draw(this.graphicsState, model_transform, eight);

				model_transform = mult(model_transform, scale(1/8, 1/16, 1/.25));
				model_transform = mult(model_transform, translation(0, -inc * 8, 0));
				model_transform = mult(model_transform, rotation(inc * 75, 1, 0, 0));
				model_transform = mult(model_transform, translation(0, -inc * 8, 0));
				stack2.push(model_transform);
				model_transform = mult(model_transform, scale(8, 16, .25));
this.m_cube.draw(this.graphicsState, model_transform, nine);
model_transform = stack.pop();
}

	for(var inc2 = 0; inc2 <2; inc2++)
	{
		model_transform = stack2.pop();
	for(var inc3 = -1; inc3 <=1; inc3+=2)
	{
		stack2.push(model_transform);
		 model_transform = mult(model_transform, translation(0, inc3 * 4, 0));
	model_transform = mult(model_transform, rotation(inc3 * 75, 1, 0, 0));
		model_transform = mult(model_transform, translation(0, inc3 * 8, 0));
		model_transform = mult(model_transform, scale(8, 16, .25));
		 this.m_cube.draw(this.graphicsState, model_transform, nine);
		 model_transform = mult(model_transform, scale(1/8, 1/16, 1/.25));
		 model_transform = mult(model_transform, translation(0, -inc3 * 8, 0));
		 model_transform = mult(model_transform, rotation(-inc3 * 150, 1, 0, 0));
		 model_transform = mult(model_transform, translation(0, -inc3 * 8, 0));
 		model_transform = mult(model_transform, scale(8, 16, .25));
 		 this.m_cube.draw(this.graphicsState, model_transform, seven);
		 model_transform = stack2.pop();

	}
}




			model_transform = stack.pop();

        // stack.push(model_transform);
        // model_transform = mult(model_transform, translation(0, 0, 2));
        //     model_transform = mult(model_transform, scale(.3, .3, 1));
        //         this.m_fan.draw(this.graphicsState, model_transform, greyPlastic);
        // model_transform = stack.pop();
				//
        // model_transform = mult(model_transform, translation(0, -3, 0));
        // model_transform = mult(model_transform, scale(2, 2, 2));
        // this.m_sphere.draw(this.graphicsState, model_transform, earth);
				//
        // stack.push(model_transform);
        // model_transform = mult(model_transform, rotation(90, 0, 1, 0));
        //     model_transform = mult(model_transform, translation(0, 0, 2));
        //         model_transform = mult(model_transform, scale(.1, .1, 2));
        //             this.m_cylinder.draw(this.graphicsState, model_transform, greyPlastic);
        // model_transform = stack.pop();
				//
        // stack.push(model_transform);
        // model_transform = mult(model_transform, rotation(-90, 0, 1, 0));
        //     model_transform = mult(model_transform, translation(0, 0, 2));
        //         model_transform = mult(model_transform, scale(.1, .1, 2));
        //             this.m_cylinder.draw(this.graphicsState, model_transform, greyPlastic);
        // model_transform = stack.pop();
				//
        // model_transform = mult(model_transform, translation(0, -3, 0));
        // model_transform = mult(model_transform, scale(2, 2, 2));
        // this.m_sphere.draw(this.graphicsState, model_transform, earth);

        /*
		model_transform = mult( model_transform, translation( 0, 10, -15) );		// Position the next shape by post-multiplying another matrix onto the current matrix product
		this.m_cube.draw( this.graphicsState, model_transform, purplePlastic );			// Draw a cube, passing in the current matrices
		CURRENT_BASIS_IS_WORTH_SHOWING(this, model_transform);							// How to draw a set of axes, conditionally displayed - cycle through by pressing p and m

		model_transform = mult( model_transform, translation( 0, -2, 0 ) );
		this.m_fan.draw( this.graphicsState, model_transform, greyPlastic );			// Cone
		CURRENT_BASIS_IS_WORTH_SHOWING(this, model_transform);

		model_transform = mult( model_transform, translation( 0, -4, 0 ) );
		this.m_cylinder.draw( this.graphicsState, model_transform, greyPlastic );		// Tube
		CURRENT_BASIS_IS_WORTH_SHOWING(this, model_transform);


		model_transform = mult( model_transform, translation( 0, -3, 0 ) );											// Example Translate
		model_transform = mult( model_transform, rotation( this.graphicsState.animation_time/20, 0, 1, 0 ) );			// Example Rotate. 1st parameter is scalar for angle, last three are axis of rotation.
		model_transform = mult( model_transform, scale( 5, 1, 5 ) );												// Example Scale
		this.m_sphere.draw( this.graphicsState, model_transform, earth );				// Sphere

		model_transform = mult( model_transform, translation( 0, -2, 0 ) );
		this.m_strip.draw( this.graphicsState, model_transform, stars );				// Rectangle
		CURRENT_BASIS_IS_WORTH_SHOWING(this, model_transform);
        */
	}



Animation.prototype.update_strings = function( debug_screen_strings )		// Strings this particular class contributes to the UI
{
	debug_screen_strings.string_map["time"] = "Animation Time: " + this.graphicsState.animation_time/1000 + "s";
	debug_screen_strings.string_map["basis"] = "Showing basis: " + this.m_axis.basis_selection;
	debug_screen_strings.string_map["animate"] = "Animation " + (animate ? "on" : "off") ;
	//debug_screen_strings.string_map["thrust"] = "Thrust: " + thrust;
	debug_screen_strings.string_map["FPS"] = "FPS: " + 1000 / this.animation_delta_time;
}
