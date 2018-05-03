
function P(x, y) {
	return {x: x, y: y};
}
function P_EQ(p1, p2) {
	return (p1.x == p2.x && p1.y == p2.y);
}
function P_CONTAINS(arr, p) {
	for (var i = 0; i < arr.length; ++i) {
		if (P_EQ(arr[i], p)) return true;
	}
	return false;
}


function get(x, y) {
	return grid[y][x];
}

function set(x, y, c) {
	c = c || 25;
	socket.send({
		paint: {
			x: x,
			y: y,
			c: c
		}
	});
}

function where(x, y) {
	set(x, y, get(x, y));
}

/* efficient set, only updates if necessary */
function sset(x, y, c) {
	if (get(x, y) != c)
		set(x, y, c);
}

function area(x, y, w, h) {
	var a = [];
	for (var i = y; i < y+h; ++i)
		for (var j = x; j < x+w; ++j)
			a.push({x:j, y:i});
	
	return a;
}

function emptyrect(rect, color) {
	var a = new Array(rect.h);
	for (var i = 0; i < rect.h; ++i) {
		a[i] = new Array(rect.w);
		a[i].fill(color);
	}
	
	return a;
}

function copyrect(rect) {
	var a = new Array(rect.h);
	for (var i = 0; i < rect.h; ++i) {
		a[i] = new Array(rect.w);
	}
	
	for (var y = 0; y < rect.h; ++y) {
		for (var x = 0; x < rect.w; ++x) {
			a[y][x] = get(rect.x + x, rect.y + y);
		}
	}
	
	return a;
}

function blitrect(rect, f) {
	for (var y = rect.y; y < rect.y + rect.h; ++y) {
		for (var x = rect.x; x < rect.x + rect.w; ++x) {
			if (get(x, y) != f[y - rect.y][x - rect.x])
				set(x, y, f[y - rect.y][x - rect.x]);
		}
	}
}

function rot_point(p, dir) {
	if (!dir) return p;
	var xn = Math.cos(dir * Math.PI * 0.5) * p.x - Math.sin(dir * Math.PI * 0.5) * p.y;
	var yn = Math.sin(dir * Math.PI * 0.5) * p.x + Math.cos(dir * Math.PI * 0.5) * p.y;
	return P(Math.round(xn), Math.round(yn));
}

function pick_random(arr) {
	return arr[parseInt(Math.random() * arr.length)];
}

class TetrisArea {
	
	constructor(rect, colors) {
		this.rect = rect;
		this.colors = colors || {
			clear: 19,
			border: 20
		};
		
		this.spawn_point = P(
			this.rect.x + this.rect.w * 0.5,
			this.rect.y + 3
		);
		
		this.draw();
	}
	
	draw() {
		area(this.rect.x, this.rect.y, this.rect.w, this.rect.h).forEach(
		function (p) {
			var color = this.colors.clear;
			if (p.x == this.rect.x || p.y == this.rect.y  || p.x == this.rect.x + this.rect.w - 1 || p.y == this.rect.y + this.rect.h - 1) {
				color = this.colors.border;
			}
			sset(p.x, p.y, color);
		}.bind(this));
	}
	
	random_tile_colors() {
		return {
			clear: this.colors.clear,
			fill: pick_random([10, 11, 12, 13, 14, 17, 18, 23, 27, 28, 29])
		};
	}
	
	random_tile() {
		var tiles = [
			[P( 0,  0), P(-1,  0), P( 1,  0), P( 0, -1)], // T
			[P( 0,  0), P( 0, -1), P( 0,  1), P( 1,  1)], // L
			[P( 0,  0), P( 0, -1), P( 0,  1), P(-1,  1)], // J
			[P( 0,  0), P( 0,  1), P( 1,  0), P( 1,  1)], // O
			[P( 0,  0), P( 0, -1), P( 0,  1), P( 0,  2)], // I
			
		];
		return pick_random(tiles);
	}
	
	spawn_tile(pixels) {
		pixels = pixels || this.random_tile();
		this.tile = new TetrisTile(
			this.spawn_point,
			pixels,
			this.random_tile_colors()
		);
		this.tile.draw()
	}
	
	update(dir, rot) {
		if (this.tile.alive) {
			this.tile.update(dir, rot);
		} else {
			this.remove_full_rows();
			this.spawn_tile(this.random_tile());
		}
	}
	
	row_is_complete(row_i) {
		var wx = this.rect.x;
		var wy = this.rect.y + this.rect.h - 1 - row_i;
		
		for (var xo = 0; xo < this.rect.w; ++xo) {
			if (get(wx + xo, wy) == this.colors.clear) {
				return false;
			}
		}
		
		return true;
	}
	
	find_complete_rows() {
		var rows = [];
		for (var y = 1; y < this.rect.h - 1; ++y) {
			if (this.row_is_complete(y)) rows.push(y);
		}
		return rows;
	}
	
	clear_row(data, row_i) {
		for (var i = 1; i < this.rect.w - 1; ++i) {
			data[this.rect.h - 1 - row_i][i] = this.colors.clear;
		}
		return data;
	}
	
	delete_row(data, row_i) {
		var l = data[row_i];
		data.splice(row_i, 1);
		data.splice(1, 0, l);
		return data;
	}
	
	remove_full_rows() {
		var data = copyrect(this.rect);
		
		var full_rows = this.find_complete_rows().map(
			function (i) {
				return i; // -1 sure???
			}.bind(this)
		);
		var full_rows_r = this.find_complete_rows().map(
			function (i) {
				return this.rect.h - i - 1; // -1 sure???
			}.bind(this)
		);
		for (var i = 0; i < full_rows.length; ++i) {
			data = this.clear_row(data, full_rows[i]);
			data = this.delete_row(data, full_rows_r[i]);
		}
		
		blitrect(this.rect, data);
	}
};

class TetrisTile {
	constructor(pos, pixels, colors) {
		this.pos = pos;
		this.pixels = pixels;
		this.colors = colors || {
			clear: 19,
			fill: 10
		};
		this.alive = true;
	}
	
	/* pixels in world space */
	wspixels(off, rot) {
		off = off || P(0, 0);
		rot = rot || 0;
		var ps = [];
		this.pixels.forEach(function (p) {
			p = rot_point(p, rot);
			ps.push(P(off.x + this.pos.x + p.x, off.y + this.pos.y + p.y));
		}.bind(this));
		return ps;
	}
	
	draw(c, old) {
		if (!this.alive) return;
		
		c = c || this.colors.fill;
		old = old || this.wspixels();
		
		old.forEach(function (p) {
			sset(p.x, p.y, c);
		}.bind(this));
	}
	
	collides(dir, rot) {
		rot = rot || 0;
		var ps = this.wspixels(dir, rot);
		
		var collided = false;
		ps.forEach(function (p) {
			if (get(p.x, p.y) != this.colors.clear && !P_CONTAINS(this.wspixels(), p))
				collided = true;
		}.bind(this));
		
		return collided;
	}
	
	rotate(dir) {
		dir = dir || 0;
		this.pixels = this.pixels.map(
			function (p) {
				return rot_point(p, dir);
			}
		);
	}
	
	update(dir, rot) {
		if (!this.alive) return;
		
		rot = rot || 0;
		
		/* collision */
		if (this.collides(dir, rot)) {
			if (this.collides(P(0, 1), 0))
				this.alive = false;
			
			return;
		}
		var lastpos = this.pos;
		var lastpixels = this.wspixels();
		
		this.pos = P(this.pos.x + dir.x, this.pos.y + dir.y);
		this.rotate(rot);
		var curpixels = this.wspixels();
		
		var oldpixels = lastpixels.filter(function (p) {
			if (!P_CONTAINS(curpixels, p)) return true;
			return false;
		});
		
		this.draw();
		this.draw(this.colors.clear, oldpixels);
		
		
	}
};

t = new TetrisArea({x:1, y:80, w:14, h:20});
t.spawn_tile();



var KEYCODE_UP    = 38,
	KEYCODE_DOWN  = 40,
	KEYCODE_LEFT  = 37,
	KEYCODE_RIGHT = 39;

var KEY_UP = false,
    KEY_DOWN = false,
	KEY_LEFT = false,
	KEY_RIGHT = false;
var KEY = 0;
var KEY_ROT = 0;

setTimeout(function () {
	setInterval(function () {
		var dx = 0;
		var dy = 0;
		var rot = 0;
		switch (KEY) {
			case KEYCODE_LEFT:
				dx = -1;
				dy = 0;
				KEY = 0;
				break;
			case KEYCODE_RIGHT:
				dx = 1;
				dy = 0;
				KEY = 0;
				break;
			default:
				break;
		}
		switch (KEY_ROT) {
			case KEYCODE_UP:
				rot = 1;
				KEY_ROT = 0;
				break;
			case KEYCODE_DOWN:
				rot = -1;
				KEY_ROT = 0;
				break;
			default:
				break;
		}
		t.update(P(dx, 1), rot);
	}, 300);
}, 1500);
	
document.onkeydown = function(e) {
	e = e || window.event;

	switch (e.keyCode) {
		case KEYCODE_UP:
			KEY_UP = true;
			KEY_ROT = KEYCODE_UP;
			break;
		case KEYCODE_DOWN:
			KEY_DOWN = true;
			KEY_ROT = KEYCODE_DOWN;
			break;
		case KEYCODE_LEFT:
			KEY_LEFT = true;
			KEY = KEYCODE_LEFT;
			break;
		case KEYCODE_RIGHT:
			KEY_RIGHT = true;
			KEY = KEYCODE_RIGHT;
			break;
		case 32: // space
			t.draw();
			break;
		default:
			console.log(e.keyCode);
			break;
	}
	
};

document.onkeyup = function(e) {
	e = e || window.event;

	switch (e.keyCode) {
		case KEYCODE_UP:
			KEY_UP = false;
			break;
		case KEYCODE_DOWN:
			KEY_DOWN = false;
			break;
		case KEYCODE_LEFT:
			KEY_LEFT = false;
			break;
		case KEYCODE_RIGHT:
			KEY_RIGHT = false;
			break;
		default:
			break;
	}
	
};