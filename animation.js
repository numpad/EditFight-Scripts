
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

function rectarea(rect) {
	var a = [];
	for (var i = rect.y; i < rect.y+rect.h; ++i)
		for (var j = rect.x; j < rect.x+rect.w; ++j)
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
			sset(x, y, f[y - rect.y][x - rect.x]);
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


class Animation {
	
	constructor(rect, colors, speed = 200) {
		this.rect = rect;
		this.colors = colors || {
			clear: 24,
			border: 22
		};
		
		this.frames = [];
		this.index = 0;
		this.running = false;
		
		this.draw();
		setInterval(function () { this.update(); }.bind(this), speed);
	}
	
	draw() {
		rectarea(this.rect).forEach(
			function (p) {
				var color = this.colors.clear;
				if (p.x == this.rect.x || p.y == this.rect.y  || p.x == this.rect.x + this.rect.w - 1 || p.y == this.rect.y + this.rect.h - 1) {
					color = this.colors.border;
				}
				sset(p.x, p.y, color);
			}.bind(this)
		);
	}
	
	update() {
		if (!this.running) return;
		
		blitrect(this.rect, this.frames[this.index]);
		this.index = (this.index + 1) % this.frames.length;
	}
	
	capture() {
		this.frames.push(copyrect(this.rect));
	}
	
	animate() {
		this.running = true;
		this.index = 0;
	}
	
	
}