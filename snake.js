
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

function area(x, y, w, h) {
	var a = [];
	for (var i = y; i < y+h; ++i)
		for (var j = x; j < x+w; ++j)
			a.push({x:j, y:i});
	
	return a;
}

class Snake {
	constructor(pos, colors) {
		colors = colors || {
			clear: 19,
			fill: this.randomColor(),
			apple: [8, 26]
		};
		this.colors = colors;
		
		// config
		this.APPLE = 8;
		
		this.clear_color = colors.clear;
		this.moves = 0;
		this.alive = true;
		this.grown = 0;
		this.body = [];
		this.dir = {x: 1, y: 0};
		this.color = colors.fill;
		this.body.push({x:pos.x, y:pos.y});
		this.body.push({x:pos.x - 1, y:pos.y});
		this.body.push({x:pos.x - 2, y:pos.y});
		
		set(pos.x, pos.y, this.color);
		set(pos.x - 1, pos.y, this.color);
		set(pos.x - 2, pos.y, this.color);
	}
	
	randomColor() {
		var r = Math.round(Math.random() * 25);
		if (r == 0 || r == 8 || r >= 23) return this.randomColor();
		return r;
	}
	
	removeLast() {
		if (!this.alive) return;
		
		var last = this.body[this.body.length - 1];
		this.body.pop();
		if (this.grown == 0)
			set(last.x, last.y, this.clear_color);
		else
			this.grown--;
	}
	addHead(p) {
		if (!this.alive) return;
		
		this.body.splice(0, 0, p);
		set(p.x, p.y, this.color);
	}
	
	
	move() {
		if (!this.alive) return;
		
		if (this.moves % 4 == 0) {
			if (this.color == 13)
				this.color = 14;
			else
				this.color = 13;
		}
		
		this.removeLast();
		var new_head = {x: this.body[0].x + this.dir.x, y: this.body[0].y + this.dir.y};
		
		/* collision */
		if (this.colors.apple.includes(get(new_head.x, new_head.y))) {
			this.grow();
		} else if (get(new_head.x, new_head.y) == this.color) {
			
		} else if (get(new_head.x, new_head.y) != this.clear_color) {
			this.die();
		}
		
		this.addHead(new_head);
		this.moves++;
	}
	
	grow(count) {
		if (!this.alive) return;
		
		if (count == 0) return;
		count = count || 1;
		
		var l = this.body[this.body.length - 1];
		this.body.push(l);
		this.grown++;
	}
	
	die() {
		this.alive = false;
		
		for (var i = 0; i < this.body.length; ++i) {
			var e = this.body[i];
			set(e.x, e.y, this.clear_color);
		}
		
	}
}

var KEYCODE_UP    = 38,
	KEYCODE_DOWN  = 40,
	KEYCODE_LEFT  = 37,
	KEYCODE_RIGHT = 39;

var KEY_UP = false,
    KEY_DOWN = false,
	KEY_LEFT = false,
	KEY_RIGHT = false;
var KEY = 0;

setTimeout(function () {
	setInterval(function () {
		switch (KEY) {
			case KEYCODE_UP:
				s.dir.x = 0;
				s.dir.y = -1;
				break;
			case KEYCODE_DOWN:
				s.dir.x = 0;
				s.dir.y = +1;
				break;
			case KEYCODE_LEFT:
				s.dir.x = -1;
				s.dir.y = 0;
				break;
			case KEYCODE_RIGHT:
				s.dir.x = +1;
				s.dir.y = 0;
				break;
			default:
				break;
		}
		s.move();
	}, 210);
}, 1500);
	
document.onkeydown = function(e) {
	e = e || window.event;

	switch (e.keyCode) {
		case KEYCODE_UP:
			KEY_UP = true;
			KEY = KEYCODE_UP;
			break;
		case KEYCODE_DOWN:
			KEY_DOWN = true;
			KEY = KEYCODE_DOWN;
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
			s = new Snake({x: 10, y: 24}, {clear: 25, fill: 11, apple: [8, 26]});
			break;
		case 82: // r
			arena.fill();
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

class Arena {

	constructor(rect, colors) {
		this.colors = colors; // fill, border
	
		this.x = rect.x;
		this.y = rect.y;
		this.width = rect.w;
		this.height = rect.h;
		this.xe = rect.x + rect.w - 1;
		this.ye = rect.y + rect.h - 1;
		/* spawner disabled :D
		setInterval(function () {
			var rp = this.randomPointInside();
			set(rp.x, rp.y, 8)
		}.bind(this), 4000);
		*/
	}
	
	get_area() {
		return area(this.x, this.y, this.width, this.height);
	}
	
	randomPointInside() {
		var p = {
			x: Math.round(Math.random() * (this.width  - this.x) + this.x),
			y: Math.round(Math.random() * (this.height - this.y) + this.y)
		};
		
		if (get(p.x, p.y) != this.colors.fill)
			return this.randomPointInside();
		
		return p;
	}
	
	show() {
		where(this.x, this.y);
		where(this.xe, this.y);
		where(this.x, this.ye);
		where(this.xe, this.ye);
	}
	
	fill() {
		var self = this;
		this.get_area().forEach(function (p) {
			var current = get(p.x, p.y);
			if (current != self.colors.border && current != self.colors.fill) {
				if (p.x == self.x || p.y == self.y || p.x == self.xe || p.y == self.ye)
					set(p.x, p.y, self.colors.border);
				else
					set(p.x, p.y, self.colors.fill);
			}
		});
	}

};


//arena = new Arena({x: 2, y: 2, w: 25, h: 30}, {fill: 19, border: 20});
//arena.fill();
s = new Snake({x: 10, y: 24}, {clear: 25, fill: 11, apple: [8, 26]});


