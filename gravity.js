
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

function neighbors(rect, f, x, y, clear_color) {
	var h = f.length,
	    w = f[0].length;
	
	var n = 0;
	for (var yo = -1; yo <= 1; ++yo) {
		for (var xo = -1; xo <= 1; ++xo) {
			if (yo == 0 && xo == 0) continue;
			
			var px = x + xo;
			var py = y + yo;
			
			if (py < 0 || px < 0 || px >= w || py >= h) continue;
			
			if (get(rect.x + px, rect.y + py) != clear_color)
				n++;
		}
	}
	
	return n;
}

class Field {
	
	constructor(rect, interval) {
		this.clear_color = 23;
		this.color = 19;
		this.running = false;
		
		this.rect = rect;
		this.clear();
		
		this.draw_ui(true);
		
		setInterval(function () {
			this.check_ui();
			this.draw_ui(false);
			this.update();
		}.bind(this), interval || 200);
	}
	
	draw_ui(btn) {
		sset(this.rect.x, this.rect.y + this.rect.h + 0, 19);
		sset(this.rect.x, this.rect.y + this.rect.h + 1, 19);
		sset(this.rect.x + 3, this.rect.y + this.rect.h + 0, 19);
		sset(this.rect.x + 3, this.rect.y + this.rect.h + 1, 19);
		sset(this.rect.x + 1, this.rect.y + this.rect.h + 1, 19);
		sset(this.rect.x + 2, this.rect.y + this.rect.h + 1, 19);
		/* draw 'play' button */
		if (btn) {
			sset(this.rect.x + 1, this.rect.y + this.rect.h, 12);
			sset(this.rect.x + 2, this.rect.y + this.rect.h, 29);
		}
	}
	
	check_ui() {
		var current_button = get(this.rect.x + 1, this.rect.y + this.rect.h);
		var current_button_clear = get(this.rect.x + 2, this.rect.y + this.rect.h);
		
		if (current_button == 12) {
			this.running = true;
		} else {
			sset(this.rect.x + 1, this.rect.y + this.rect.h, 8);
			this.running = false;
		}
		
		if (current_button_clear != 29) {
			sset(this.rect.x + 2, this.rect.y + this.rect.h, 29);
			this.clear();
		}
	}
	
	clear() {
		area(this.rect.x, this.rect.y, this.rect.w, this.rect.h).forEach(
			function (p) {
				if (get(p.x, p.y) != this.clear_color)
					set(p.x, p.y, this.clear_color);
			}.bind(this)
		);
	}
	
	update() {
		if (this.running == false) return;
		var water = 18;
		var last = copyrect(this.rect);
		var next = emptyrect(this.rect, this.clear_color);
		
		for (var y = 0; y < this.rect.h; ++y) {
			for (var x = 0; x < this.rect.w; ++x) {
				
				var curp = last[y][x];
				var nexp = y + 1 < this.rect.h ? last[y + 1][x] : -1;
				var nexl = x - 1 >= 0 ? last[y][x - 1] : -1;
				var nexr = x + 1 < this.rect.w ? last[y][x + 1] : -1;
				
				if (curp != this.clear_color) {
					if (nexp == this.clear_color) {
						next[y + 1][x] = curp;
					} else {
						var dx = 0;
						if (curp == water) {
							var d = !!Math.round(Math.random());
							
							if (d && nexl == this.clear_color)
								dx = -1;
							if (!d && nexr == this.clear_color)
								dx =  1;
						}
						
						next[y][x + dx] = curp;
					}
				}
			}
		}
		
		blitrect(this.rect, next);
	}
	

};

f = new Field({x: 2, y: 25, w: 16, h: 16});
