// *******************************************************
// CS 174a Graphics Example Code
// Shapes.js - Defines a number of objects that inherit from the Shape class.  Each manages lists of its own vertex positions, vertex normals, and texture coordinates per vertex.
// Instantiating a shape automatically calls OpenGL functions to pass each list into a buffer in the graphics card's memory.

function triangle_fan_full( num_tris, points_transform )		// Arrange triangles in a fan.  This version goes all the way around a circle with them.
	{
		shape.call(this);

		this.createCircleVertices = function( recipient, num_tris )
			{
				for( var counter = 0; counter++ <= num_tris;   )
				{
						recipient.vertices.push( vec3( Math.cos(2 * Math.PI * counter/num_tris), Math.sin(2 * Math.PI * counter/num_tris), -1 ) );
						recipient.texture_coords.push( vec2( counter/num_tris, 1 ) );
				}
			}

		this.initFromSequence = function( recipient, center_idx, num_tris, offset )
			{
				for(var index = offset; index <= offset + num_tris;	 )
				{
					recipient.indices.push( index );
					recipient.indices.push( center_idx );
					recipient.indices.push( ++index );
				}
				recipient.indices.pop();
				recipient.indices.push( offset );
			}

		if( !arguments.length) return;	// Pass no arguments if you just want to make a dummy object that inherits everything, for making static calls
		this.populate( this, num_tris, points_transform );
		this.init_buffers();
	}
inherit(triangle_fan_full, shape);

	triangle_fan_full.prototype.populate = function( recipient, num_tris, points_transform, center_idx )
		{
			if( center_idx === undefined )			// Not re-using a point?  Create one.
			{
				center_idx = recipient.vertices.push( vec3( mult_vec( points_transform, vec4( 0,0,1,1 ) ) ) ) - 1;
				recipient.texture_coords.push( vec2( 1, 0 ) );
			}
			var offset = recipient.vertices.length;		var index_offset = recipient.indices.length;

			this.createCircleVertices( recipient, num_tris );
			this.initFromSequence(	   recipient, center_idx, num_tris, offset );

			recipient.flat_normals_from_triples( index_offset );

			for( var i = offset; i < recipient.vertices.length; i++ )
				recipient.vertices[i] = vec3( mult_vec( points_transform, vec4( recipient.vertices[ i ], 1 ) ) );
		};


function triangle_strip()						// Arrange triangles in a strip, where the list of vertices alternates sides.
	{	shape.call(this);	};
inherit(triangle_strip, shape);

	triangle_strip.prototype.init_from_strip_lists = function( recipient, vertices, indices )
		{
			var offset = recipient.vertices.length;
			[].push.apply( recipient.vertices, vertices );

			for( var counter = 0; counter < indices.length - 2; counter++ )
			{
				recipient.indices.push( indices[counter + 2 * ((counter+1) % 2 ) ] + offset );		// The modulus, used as a conditional here, makes face orientations uniform.
				recipient.indices.push( indices[counter + 1] + offset );
				recipient.indices.push( indices[counter + 2 * ( counter    % 2 ) ] + offset );
			}
		};

function rectangular_strip( numRectangles, points_transform )
	{
		triangle_strip.call(this);
		if( !arguments.length) return;	// Pass no arguments if you just want to make a dummy object that inherits everything, for making static calls
		this.populate( this, numRectangles, points_transform );
		this.init_buffers();
	}
inherit(rectangular_strip, triangle_strip);

	rectangular_strip.prototype.populate = function( recipient, numRectangles, points_transform )
				{
					var offset = recipient.vertices.length;		var index_offset = recipient.indices.length;
					var vertices = [];
					var strip_indices = [];
					var topIdx = 0; var bottomIdx = numRectangles + 1;

					for( var i = 0; i <= numRectangles; i++ )
					{
						vertices[topIdx] 	= vec3( 0,  .5, topIdx - .5 * numRectangles );		recipient.texture_coords[ topIdx + offset ]    = vec2( topIdx / numRectangles, 1 );
						vertices[bottomIdx] = vec3( 0, -.5, topIdx - .5 * numRectangles );		recipient.texture_coords[ bottomIdx + offset ] = vec2( topIdx / numRectangles, 0 );
						strip_indices.push(topIdx++);
						strip_indices.push(bottomIdx++);
					}

					this.init_from_strip_lists(recipient, vertices, strip_indices);

					for( var i = offset; i < recipient.vertices.length; i++ )
						recipient.vertices[i] = vec3( mult_vec( points_transform, vec4( recipient.vertices[i], 1 ) ) );
					recipient.flat_normals_from_triples( index_offset );

				}

function cylindrical_strip( numRectangles, points_transform )
	{
		triangle_strip.call(this);
		if( !arguments.length) return;	// Pass no arguments if you just want to make a dummy object that inherits everything, for making static calls
		this.populate( this, numRectangles, points_transform );
		this.init_buffers();
	}
inherit(cylindrical_strip, triangle_strip);

	cylindrical_strip.prototype.populate = function( recipient, numRectangles, points_transform )
				{
					var vertices = [];
					var strip_indices = [];
					var offset = recipient.vertices.length;		var index_offset = recipient.indices.length;
					var topIdx = 0; var bottomIdx = numRectangles;

					for( var i = 0; i < numRectangles; i++ )
					{
						vertices[topIdx] 	= vec3( Math.cos(2 * Math.PI * topIdx / numRectangles), Math.sin(2 * Math.PI * topIdx / numRectangles), .5 );
						recipient.texture_coords[topIdx + offset]    = vec2(0, topIdx / numRectangles );
						vertices[bottomIdx] = vec3( Math.cos(2 * Math.PI * topIdx / numRectangles), Math.sin(2 * Math.PI * topIdx / numRectangles), -.5 );
						recipient.texture_coords[bottomIdx + offset] = vec2(1, topIdx / numRectangles );
						strip_indices.push(topIdx++);
						strip_indices.push(bottomIdx++);
					}
					strip_indices.push(0);
					strip_indices.push( numRectangles );

					this.init_from_strip_lists(recipient, vertices, strip_indices);

					for( var i = offset; i < recipient.vertices.length; i++ )
						recipient.vertices[i] = vec3( mult_vec( points_transform, vec4( recipient.vertices[i], 1 ) ) );
					recipient.flat_normals_from_triples( index_offset );
				}

function shape_from_file(filename)		// Begin downloading the mesh, and once it completes return control to our webGLStart function
	{
		shape.call(this);

		this.draw = function( graphicsState, model_transform, material ) 	{
		 	if( this.ready ) shape.prototype.draw.call(this, graphicsState, model_transform, material );		}

		this.filename = filename;

		this.webGLStart = function(meshes)
			{
				for( var j = 0; j < meshes.mesh.vertices.length/3; j++ )
				{
					this.vertices.push( vec3( meshes.mesh.vertices[ 3*j ], meshes.mesh.vertices[ 3*j + 1 ], meshes.mesh.vertices[ 3*j + 2 ] ) );
					this.texture_coords.push( vec2(meshes.mesh.textures[ 2*j ],meshes.mesh.textures[ 2*j + 1 ]));
				}
				this.indices  = meshes.mesh.indices;
				this.normals  = meshes.mesh.vertexNormals;
				this.init_buffers();
				this.ready = true;
			}
		OBJ.downloadMeshes( { 'mesh' : filename }, (function(self) { return self.webGLStart.bind(self) }(this) ) );
	}
inherit(shape_from_file, shape);


function cube( points_transform )
	{
		shape.call(this);
		this.populate( this, mat4() );
		this.init_buffers();
	}
inherit(cube, shape);

	cube.prototype.populate = function( recipient, points_transform )
	{
			var m_strip = new rectangular_strip();
			for( var i = 0; i < 3; i++ )										// Build a cube by inserting six triangle strips into the lists.
				for( var j = 0; j < 2; j++ )
					m_strip.populate( recipient, 1, mult( points_transform, mult( rotation( 90, vec3( i==0, i==1, i==2 ) ), translation( j - .5, 0, 0 ) ) ) );
	}


function sphere( points_transform, max_subdivisions )		// Build a complicated sphere using subdivision, starting with a simple tetrahedron.
	{
		shape.call(this);
									// From the starting tetrahedron all the way down to the final sphere, we'll store each level-of-detail sphere in separate index lists, so can also draw coarser spheres later.
		this.subdivideTriangle = function( a, b, c, recipient, count )		// This function will recurse through each level of detail by splitting triangle (a,b,c) into four smaller triangles.
		{
			if( count <= 0)	// Base case of recursion - we've hit the finest level of detail we want.  Add the current subdivided triangle's index numbers to the master list of triangles.
			{
				recipient.indices.push(a,b,c);		// Skipping every fourth vertex index in our list takes you down one level of detail, and so on, due to the way we're building it.
				return;
			}
			else if( recipient.indices_LOD && recipient.indices_LOD[count] )		// If we're not at the base case, our current triangle represents a lower (coarser) level of detail.
				recipient.indices_LOD[count].push(a,b,c);							// It goes into a list too, corresponding to that detail level.

			var ab_vert = normalize( mix( recipient.vertices[a], recipient.vertices[b], 0.5) );			// We're not at the base case.  So,
			var ac_vert = normalize( mix( recipient.vertices[a], recipient.vertices[c], 0.5) );			// build 3 new vertices at midpoints, and extrude them out to touch the unit sphere (length 1).
			var bc_vert = normalize( mix( recipient.vertices[b], recipient.vertices[c], 0.5) );

			var ab = recipient.vertices.length;		recipient.vertices.push( ab_vert );			// The indices of the three new vertices
			var ac = recipient.vertices.length;		recipient.vertices.push( ac_vert );
			var bc = recipient.vertices.length;		recipient.vertices.push( bc_vert );

			this.subdivideTriangle( a, ab, ac,  recipient, count - 1 );			// Recurse on four smaller triangles, and we're done.
			this.subdivideTriangle( ab, b, bc,  recipient, count - 1 );
			this.subdivideTriangle( ac, bc, c,  recipient, count - 1 );
			this.subdivideTriangle( ab, bc, ac, recipient, count - 1 );
		}

		if( !arguments.length) return;	// Pass no arguments if you just want to make a dummy object that inherits everything, for making static calls

		this.indices_LOD = [];
		this.index_buffer_LOD = [];
		for( var i = 1; i <= max_subdivisions; i++ )		// Empty index lists for each level-of-detail
			this.indices_LOD[i] = [];

		this.populate( this, points_transform, max_subdivisions );

		for( var i = 1; i <= max_subdivisions; i++ )		// Each index list of every detail-level gets its own index buffer in the graphics card
		{
			this.index_buffer_LOD[i] = gl.createBuffer();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.index_buffer_LOD[ i ] );
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array( this.indices_LOD[ i ] ), gl.STATIC_DRAW);
		}

		this.draw = function( graphicsState, model_transform, material, LOD )
		{
			this.update_uniforms( graphicsState, model_transform, material );

			if( material.texture_filename && textures[ material.texture_filename ].loaded )			// Omit the texture string parameter to signal that we don't want to texture this shape.
			{
				g_addrs.shader_attributes[2].enabled = true;
				gl.uniform1f ( g_addrs.USE_TEXTURE_loc, 1 );
				gl.bindTexture(gl.TEXTURE_2D, textures[ material.texture_filename ].id);
			}
			else
				{	gl.uniform1f ( g_addrs.USE_TEXTURE_loc, 0 );		g_addrs.shader_attributes[2].enabled = false;	}

			for( var i = 0, it = g_addrs.shader_attributes[0]; i < g_addrs.shader_attributes.length, it = g_addrs.shader_attributes[i]; i++ )
				if( it.enabled )
				{
					gl.enableVertexAttribArray( it.index );
					gl.bindBuffer( gl.ARRAY_BUFFER, this.graphics_card_buffers[i] );
					gl.vertexAttribPointer( it.index, it.size, it.type, it.normalized, it.stride, it.pointer );
				}
				else
					gl.disableVertexAttribArray( it.index );

			if( LOD === undefined || LOD < 0 || LOD + 1 >= this.indices_LOD.length )		// Activate the chosen level-of-detail index list and draw it
			{
				gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, this.index_buffer );
				gl.drawElements( gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0 );
			}
			else
			{
				gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, this.index_buffer_LOD[ this.indices_LOD.length - 1 - LOD ] );
				gl.drawElements( gl.TRIANGLES, this.indices_LOD[ this.indices_LOD.length - 1 - LOD ].length, gl.UNSIGNED_SHORT, 0 );
			}
		}
		this.init_buffers();
	}
inherit(sphere, shape);

	sphere.prototype.populate = function ( recipient, points_transform, max_subdivisions )
		{
			var offset = recipient.vertices.length;									// Starting tetrahedron
			recipient.vertices.push(		vec3(0.0, 0.0, -1.0) 				 );
			recipient.vertices.push(		vec3(0.0, 0.942809, 0.333333) 		 );
			recipient.vertices.push(		vec3(-0.816497, -0.471405, 0.333333) );
			recipient.vertices.push(		vec3(0.816497, -0.471405, 0.333333)  );

			this.subdivideTriangle( 0 + offset, 1 + offset, 2 + offset, recipient, max_subdivisions);	// Begin recursion
			this.subdivideTriangle( 3 + offset, 2 + offset, 1 + offset, recipient, max_subdivisions);
			this.subdivideTriangle( 1 + offset, 0 + offset, 3 + offset, recipient, max_subdivisions);
			this.subdivideTriangle( 0 + offset, 2 + offset, 3 + offset, recipient, max_subdivisions);

			for( var i = offset; i < recipient.vertices.length; i++ )
			{
				recipient.spherical_texture_coords( i );
				recipient.normals[i] = recipient.vertices[i].slice();		// On a sphere, we analytically know what the normals should be - the vector from the origin to the vertex.
				recipient.vertices[i] = vec3( mult_vec( points_transform, vec4( recipient.vertices[i], 1 ) ) );
			}
		};
/*******
Custom shape is a heart. Unfortunately, due to the close deadline my good programming practices have gone out the window
So there is a lot of redundant code that I will later put into a single function
*******/
function heart()
{
	shape.call(this);
	this.populate(this, mat4());
	this.init_buffers();
}
function normalVec(a, b, c)
{
	var triangleNormal = normalize(cross(subtract(c, a), subtract(a, b)));
	if(length(add(triangleNormal, a)) < length(a))
		scale_vec(-1, triangleNormal);
		return triangleNormal;
}
inherit(heart, shape);
heart.prototype.populate=function()
{
	var vertex1 = vec3(0, -.07, .55); var vertex2 = vec3(0, -.07, -.55); var vertex3 = vec3(.5, .5, 0);
	var vertex4 = vec3(1., .35, 0); var vertex5 = vec3(1.25, .17, 0); var vertex6 = vec3(1.325, -.25, 0);
	var vertex7 = vec3(0, -1.7, 0); var vertex8 = vec3(-1.325, -.25, 0); var vertex9 = vec3(-1.25, .17, 0);
	var vertex10 = vec3(-1, 0.35, 0); var vertex11 = vec3(-.5, .5, 0);

	this.vertices.push(vertex1, vertex2, vertex3);
	this.vertices.push(vertex1, vertex3, vertex4);
	this.vertices.push(vertex1, vertex4, vertex5);
	this.vertices.push(vertex1, vertex5, vertex6);
	this.vertices.push(vertex1, vertex6, vertex7);
	this.vertices.push(vertex1, vertex7, vertex8);
	this.vertices.push(vertex1, vertex8, vertex9);
	this.vertices.push(vertex1, vertex9, vertex10);
	this.vertices.push(vertex1, vertex10, vertex11);
	this.vertices.push(vertex1, vertex2, vertex11);
	this.vertices.push(vertex2, vertex3, vertex4);
	this.vertices.push(vertex2, vertex4, vertex5);
	this.vertices.push(vertex2, vertex5, vertex6);
	this.vertices.push(vertex2, vertex6, vertex7);
	this.vertices.push(vertex2, vertex7, vertex8);
	this.vertices.push(vertex2, vertex8, vertex9);
	this.vertices.push(vertex2, vertex9, vertex10);
	this.vertices.push(vertex2, vertex10, vertex11);

	var normal123 = normalVec(vertex1, vertex3, vertex2);
	var normal134 = normalVec(vertex1, vertex4, vertex3); var normal145 = normalVec(vertex1, vertex5, vertex4);
	var normal156 = normalVec( vertex1, vertex6, vertex5); var normal167 = normalVec(vertex1, vertex7, vertex6);
	var normal178 = normalVec(vertex1, vertex8, vertex7); var normal189 = normalVec(vertex1, vertex9, vertex8);
	 var normal1910 = normalVec(vertex1, vertex10, vertex9); var normal11011 = normalVec(vertex1, vertex11, vertex10);
	 var normal1211 = normalVec(vertex1, vertex2, vertex11); var normal234 = normalVec(vertex2, vertex3, vertex4);
	 var normal245 = normalVec(vertex2, vertex4, vertex5);
 	var normal256 = normalVec(vertex2, vertex5, vertex6); var normal267 = normalVec(vertex2, vertex6, vertex7);
 	var normal278 = normalVec(vertex2, vertex7, vertex8); var normal289 = normalVec(vertex2, vertex8, vertex9);
 	 var normal2910 = normalVec(vertex2, vertex9, vertex10); var normal21011 = normalVec(vertex2, vertex10, vertex11);

	 this.normals.push(normal123, normal123, normal123);
	 this.normals.push(normal134,normal134,normal134);
	 this.normals.push(normal145,normal145,normal145);
	 this.normals.push(normal156,normal156,normal156);
	 this.normals.push(normal167,normal167,normal167);
	 this.normals.push(normal178,normal178,normal178);
	 this.normals.push(normal189,normal189,normal189);
	 this.normals.push(normal1910,normal1910,normal1910);
	 this.normals.push(normal11011,normal11011,normal11011);
	 this.normals.push(normal1211,normal1211,normal1211);
	 this.normals.push(normal234,normal234,normal234);
	 this.normals.push(normal245,normal245,normal245);
	 this.normals.push(normal256,normal256,normal256);
	 this.normals.push(normal267,normal267,normal267);
	 this.normals.push(normal278,normal278,normal278);
	 this.normals.push(normal289,normal289,normal289);
	 this.normals.push(normal2910,normal2910,normal2910);
	 this.normals.push(normal21011,normal21011,normal21011);

	for(var hi = 0; hi < 18; hi++) {
		this.texture_coords.push(vertex1, vertex2, vertex3);
	}
	this.indices.push(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
	31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53);
};
// //Custom shape
// function octagonalCylinder()
// {
// 	shape.call(this);
// 	this.populate();
// 	this.init_buffers();
// }
// inherit(octagonalCylinder, shape);
// octagonalCylinder.prototype.populate=function()
// {
// 	var diam1 = 2;
// 	var diam2 = 3;
// 	var x1 = diam1 / (2 + Math.sqrt(2));
// 	var x2 = diam2 / (2 + Math.sqrt(2));
// 	var side1 = diam1 - 2*x1;
// 	var side2 = diam2 - 2*x2;
//
// 	var vertex1_1 = vec3(-diam1/2, side1/2, 0); var vertex1_2 = mult(translation(x1, x1, 0), vertex1_1);
// 	var vertex1_3 = mult(translation(side1, 0, 0), vertex1_2); var vertex1_4 = mult(translation(x1, -x1, 0), vertex1_3);
// 	var vertex1_5 = mult(translation(0, -side1, 0), vertex1_4); var vertex1_6 = mult(translation(-x1, -x1, 0), vertex1_5);
// 	var vertex1_7 = mult(translation(-side1, 0, 0), vertex1_6); var vertext1_8 = mult(translation(-x1, x1, 0), vertex1_7);
// 	Math.r
// }

function axis()
	{
		shape.call(this);

		this.basis_selection = 0;
		this.drawOneAxis = function(object_transform)
		{
			var original = object_transform;
			object_transform = mult( object_transform, translation(0, 0, 4));
			object_transform = mult( object_transform, scale(.25, .25, .25));
			this.m_fan.populate ( this, 10, object_transform );
			object_transform = original;
			object_transform = mult( object_transform, translation(1, 1, .5));
			object_transform = mult( object_transform, scale(.1, .1, 1));
			this.m_cube.populate( this, object_transform );
			object_transform = original;
			object_transform = mult( object_transform, translation(1, 0, .5));
			object_transform = mult( object_transform, scale(.1, .1, 1));
			this.m_cube.populate( this, object_transform );
			object_transform = original;
			object_transform = mult( object_transform, translation(0, 1, .5));
			object_transform = mult( object_transform, scale(.1, .1, 1));
			this.m_cube.populate( this, object_transform );
			object_transform = original;
			object_transform = mult( object_transform, translation(0, 0, 2));
			object_transform = mult( object_transform, scale(.1, .1, 4));
			this.m_cylinder.populate( this, 7, object_transform );
		}

		this.populate = ( function (self)
			{
				self.m_sphere = new sphere(); self.m_cube = new cube(); self.m_cylinder = new cylindrical_strip(); self.m_fan = new triangle_fan_full;
				var stack = [];
				var object_transform = mat4();
				object_transform = mult( object_transform, scale(.25, .25, .25));
				self.m_sphere.populate( self, object_transform, 3 );
				object_transform = mat4();
				self.drawOneAxis(object_transform);
				object_transform = mult( object_transform, rotation(-90, vec3(1,0,0)));
				object_transform = mult( object_transform, scale(1, -1, 1));
				self.drawOneAxis(object_transform);
				object_transform = rotation(90, vec3(0,1,0));
				object_transform = mult( object_transform, scale(-1, 1, 1));
				self.drawOneAxis(object_transform);
			} )(this);

																													// Only draw this set of axes if it is the one selected through the user interface.
		this.draw = function( current, graphicsState, model_transform, material ) 	{
			if( this.basis_selection == current ) shape.prototype.draw.call(this, graphicsState, model_transform, material );	}

		this.init_buffers();
	}
inherit(axis, shape);



function text_line( string_size )		// Draws a rectangle textured with images of ASCII characters over each quad, spelling out a string.
	{
		shape.call(this);

		this.populate = ( function ( self, max_size )
			{
				self.max_size = max_size;
				var object_transform = mat4();
				for( var i = 0; i < max_size; i++ )
				{
					rectangular_strip.prototype.populate( self, 1, object_transform );
					object_transform = mult( object_transform, translation( 0, 0, -.7 ));
				}
			} )( this, string_size );

		this.init_buffers();

		this.draw = function( graphicsState, model_transform, heads_up_display, color )
			{
				if( heads_up_display )			{	gl.disable( gl.DEPTH_TEST );	var temp_camera_transform = graphicsState.camera_transform;	graphicsState.camera_transform = mat4();	}
				shape.prototype.draw.call(this, graphicsState, model_transform, new Material( color, 1, 0, 0, 40, "text.png" ) );
				if( heads_up_display )			{	gl.enable(  gl.DEPTH_TEST );		graphicsState.camera_transform = temp_camera_transform;	}
			}

		this.set_string = function( line )
			{
				for( var i = 0; i < this.max_size; i++ )
					{
						var row = Math.floor( ( i < line.length ? line.charCodeAt( i ) : ' '.charCodeAt() ) / 16 ),
							col = Math.floor( ( i < line.length ? line.charCodeAt( i ) : ' '.charCodeAt() ) % 16 );

						var skip = 3, size = 32, sizefloor = size - skip;
						var dim = size * 16, 	left  = (col * size + skip) / dim, 			top    = (row * size + skip) / dim,
												right = (col * size + sizefloor) / dim, 	bottom = (row * size + sizefloor + 5) / dim;

						this.texture_coords[ 4 * i ]	 = vec2( right, 1 - top );
						this.texture_coords[ 4 * i + 1 ] = vec2( left,  1 - top );
						this.texture_coords[ 4 * i + 2 ] = vec2( right, 1 - bottom );
						this.texture_coords[ 4 * i + 3 ] = vec2( left,  1 - bottom );
					}

				gl.bindBuffer( gl.ARRAY_BUFFER, this.graphics_card_buffers[2]);
				gl.bufferData( gl.ARRAY_BUFFER, flatten(this.texture_coords), gl.STATIC_DRAW );
			}

	}
inherit(text_line, shape);
