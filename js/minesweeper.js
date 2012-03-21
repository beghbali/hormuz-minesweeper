//copyright 2012 Bashir Eghbali
//All rights reserved

(function( $ ) {
    $.widget( "games.minesweeper", {
        defaults: {
            map:[   //32x32
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
                [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0],
                [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1],
                [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1],
                [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1],
                [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1]
            ],
            width: 800,
            height: 800,
            scale: 1,
            db:null,
            difficulty: 1,
            mine_density: 0.2,
            score_update: null

        },
        options: {},
        rows:0,
        columns:0,
        active_squares:[],
        cleared: 0,
        scale_changed: false,
        hidden_items: {
            mine:2
        },
        //public methods.
        new_game:function() {
            this.destroy();
            //resized map, set the base to default to interpolate from base
            if (this.scale_changed) {
                this.options.map = this.defaults.map.slice(0);    //reset the base map to the default
            } else {   //otherwise, just cleanout the mines
                this._clean_mines();
            }
            this.options.mine_density = this.defaults.mine_density; //reset density
            this._load_game();
        },
        end_game:function() {
            for (var index = 0; index < this.active_squares.length; index++) {
                this._reveal_square(this.active_squares[index]);
            }
        },
        cheat:function() {
            setTimeout(this._flash_mines(), 1000);
        },
        destroy:function () {
            this.element.empty();
        },
        //private and automatic methods.
        _create:function() {
            this._disable_right_click_menu();
            this.options = $.extend(this.defaults, this.options);
            this.defaults = $.extend(true, {}, this.options);  //overwrite the defaults. the initial options become default
            this._load_game();
        },
        _setOption:function (option, value) {
            switch (option) {
                case "scale":
                    //if we have a scale change mark it so we don't clone the map unnecessarily
                    if (this.options.scale != value) {
                        this.scale_changed = true;
                    }
                    break;
            }
            $.Widget.prototype._setOption.apply(this, arguments);
        },
        _load_game:function() {
            var canvas = this._create_canvas();

            //different size, same map, interpolate
            if (this.scale_changed) {
                this._interpolate_map(this.options.scale);
            }
            this._reset_globals();
            this._update_score();

            if (this._good_map()) {
                this._create_grid(canvas);
                this.element.append(canvas);
                this.options.mine_density *= this.options.difficulty;
                this._generate_game();
            } else {
                alert('There was a problem with the provided map');
            }
        },
        _generate_game:function () {
            var mine_square;
            var mines = 0;
            var number_of_active_squares;

            this._set_active_squares();
            number_of_active_squares = this.active_squares.length;

            //generate enough mines = density * number_of_active_squares
            while (mines < (this.options.mine_density * number_of_active_squares)) {
                mine_square = this.active_squares[Math.floor(Math.random() * number_of_active_squares)];
                this._set_map_at(mine_square, this.hidden_items.mine);
                mines++;
            }
        },
        _set_active_squares:function () {
            this.active_squares = [];

            for (var square = 0; square < (this.rows * this.columns); square++) {
                if (this._get_map_at(square) > 0) {
                    this.active_squares.push(square);
                }
            }
        },
        //so we can use it for flagging
        _disable_right_click_menu:function() {
            $(document)[0].oncontextmenu = function () {
                return false;
            }
        },
        _create_canvas:function () {
            return $("<div>").addClass("canvas")
                    .css("width", this.options.width)
                    .css("height", this.options.height);
        },
        //interpolates active/inactive map regions on resize
        _interpolate_map:function(factor) {
            var original_map;

            if (factor == 1.0) {
                return;
            }

            original_map = this.options.map.slice(0);    //clone original map
            this.options.map = this._create_map(original_map[0].length*factor, original_map.length*factor);
            this._reset_globals();

            for (var i = 0; i < this.rows; i++) {
                for (var j = 0; j < this.columns; j++) {
                    this.options.map[i][j] = this._square_average(original_map, factor, i, j);
                }
            }
            delete(original_map);
        },
        //bilinear interpolation
        _square_average:function(map, factor, x, y) {
            //x,y are coordinates of the interpolated point, p,q are coordinates of known points
            var p = Math.floor(x/factor);
            var q = Math.floor(y/factor);

            return (((this._matrix(map, p, q) + this._matrix(map, p+1, q) +
                    this._matrix(map, p, q+1) + this._matrix(map, p+1, q+1)) >= 2) ? 1 : 0);
        },
        _reset_globals:function() {
            this.rows = this.options.map.length;
            this.columns = this.options.map[0].length;
            this.active_squares = [];
            this.cleared = 0;
            this.scale_changed = false;
        },
        _clean_mines:function() {
            for (var index = 0; index < this.active_squares.length; index++) {
                this._set_map_at(this.active_squares[index], 1);
            }
        },
        _create_map:function(columns, rows) {
            var map = new Array(rows);

            for (var i = 0; i < rows; i++) {
                map[i] = new Array(columns);
            }

            return map;
        },
        //for accessing map with boundary conditions. outbounds samples to zero
        _matrix:function(map, x,y) {
            if ((x < 0) || (y < 0) || (x >= map.length) || (y >= map[0].length)) {
                return 0;
            }
            return map[x][y];
        },
        _good_map:function() {
            //check aspect ratio
            if ((this.options.width != this.options.height)) {
                return false;
            }
            return true;
        },
        //adds the squares grid on the map
        _create_grid:function(element) {
            var row, column, grid_row, grid_square;
            var square_id;
            var square_width = this.options.width / this.columns;
            var square_height = this.options.height / this.rows;

            for (row = 0; row < this.rows; row++) {
                grid_row = $("<ul>").addClass("row")
                                  .attr("id", "row_"+row)
                                  .appendTo(element);

                for (column = 0; column < this.columns; column++) {
                    square_id = row * this.columns + column;
                    grid_square = $("<li>")
                            .addClass("grid-square")
                            .attr("id", "s_" + square_id)
                            .attr("data-square-id", square_id )
                            .css("width", square_width-2) //-2 to compensate for cell border width
                            .css("height", square_height-2);

                    if (this.options.map[row][column] > 0) {
                        grid_square.addClass("active")
                                   .append(this._create_active_square());
                    } else {
                        grid_square.addClass("inactive");
                    }
                    grid_row.append(grid_square);
                }
            }
        },
        _create_active_square:function() {
            var minesweeper = this;
            return $("<a>").attr("href", "#")
                           .addClass("btn")
                           .text(".")
                           .mousedown(function(event) {
                               if (event.which == 3) {//right click
                                   $(this).toggleClass("mark");
                               }
                           })
                           .click(function(event) {
                                event.preventDefault();   //so it doesn't scroll up
                                minesweeper._activate_square(parseInt(this.parentNode.getAttribute("data-square-id")));
                            });
        },
        _activate_square:function(index) {
            //aaah buddy, you were so close
            if (this._get_map_at(index) == this.hidden_items.mine) {
                this.end_game();
                alert("You lost! Best luck next time");
            } else {
                this._reveal_map_for(index);

                //we cleared everything clearable = (total squares - mine squares)
                if (this.cleared == this._number_of_clearable_squares()) {
                    this.end_game();
                    alert("You won!");
                }
            }

        },
        _number_of_clearable_squares:function() {
            return (this.active_squares.length - Math.ceil(this.options.mine_density * this.active_squares.length));
        },
        _reveal_map_for:function(index) {
            var adjacent_squares, square;
            var queue = [];
            var minesweep = this;

            queue.push(index);
            while (queue.length > 0) {
                square = queue.shift();

                this._reveal_square(square);

                //found some mines so not revealing further
                if (this._adjacent_mine_count(square) > 0) {
                    continue;
                }

                //adjacent squares that are active and do not have a hidden item (e.g. mine)
                adjacent_squares = this._adjacent_squares(square,
                        function (neighbor) {
                            return ((neighbor > 0) && (neighbor != minesweep.hidden_items.mine));
                        });

                queue = _.uniq(queue.concat(adjacent_squares));
            }
        },
        _deactivate_square:function(index) {
            if (this._get_map_at(index) == 1) {
                this._set_map_at(index, 0);     //deactivate
            }
        },
        _get_square_element:function(index) {
            return this.element.find("li[data-square-id=" + index + "]");
        },
        //reveal square, mine count == -1 denotes a mine
        _reveal_square:function(index) {
            var adjacent_mine_count;
            var square_element = this._get_square_element(index);
            var square_content = this._get_map_at(index);

            //nothing to reveal for inactive nodes
            if (square_content <= 0) {
                return;
            }

            this.cleared++;

            this._update_score();

            //goodbye good ol clickable times...
            square_element.find("a").filter(":first").remove();

            if (square_content == this.hidden_items.mine) {
                square_element.addClass("mine");
            } else { //numbered or empty square
                //count adjacent mines
                adjacent_mine_count = this._adjacent_mine_count(index);

                if (adjacent_mine_count > 0) {
                    square_element.addClass("close_to_" + adjacent_mine_count)
                            .text(adjacent_mine_count);
                }
            }
            square_element.unbind('click');
            this._deactivate_square(index);
        },
        _update_score:function() {
            //call the score update callback, in case there is one registered
            if (this.options.score_update) {
                this.options.score_update(this.cleared, this._number_of_clearable_squares());
            }
        },
        _flash_mines:function() {
            var square_element;
            var square_content;
            var minesweep = this;
            var flash_count = 0;

            var interval = setInterval(function () {

                //clear interval once we have flashed and unflashed
                if (flash_count++ == 1) {
                    clearInterval(interval);
                }
                //find the mines, flash them for a second
                for (var index = 0; index < minesweep.active_squares.length; index++) {
                    square_content = minesweep._get_map_at(minesweep.active_squares[index]);

                    if (square_content == minesweep.hidden_items.mine) {
                        square_element = minesweep._get_square_element(minesweep.active_squares[index]);
                        square_element.toggleClass("mine");
                        square_element.find("a").filter(":first").toggleClass("invisible");
                    }
                }
            }, 1000);
        },
        _adjacent_mine_count:function(index) {
            var minesweep = this;

            return this._adjacent_squares(index,
                    function (neighbor) {
                        return (neighbor == minesweep.hidden_items.mine);
                    }).length;
        },
        //returns adjacent squares that match the qualify criteria
        _adjacent_squares:function(index, qualify) {
            var good_neighbors = [];

            //8 possible neighbors. starting from 12 o'clock clock-wise
            var neighbors = [index - this.columns, index - this.columns + 1, index + 1, index + this.columns + 1,
                             index + this.columns, index + this.columns -1, index -1, index - this.columns - 1];


            for (var neighbor_index = 0; neighbor_index < neighbors.length; neighbor_index++) {
                if (this._out_of_bounds(neighbors[neighbor_index])) {continue}

                neighbor = this._get_map_at(neighbors[neighbor_index]);
                if (qualify(neighbor)) {
                    good_neighbors.push(neighbors[neighbor_index]);
                }
            }
            return good_neighbors
        },
        //reference the map as a flat array
        _get_map_at:function (index) {
            return this.options.map[Math.floor(index / this.columns)][index % this.columns];
        },
        _set_map_at:function(index, value) {
            this.options.map[Math.floor(index / this.columns)][index % this.columns] = value;
        },
        _out_of_bounds:function(index) {
            return ((index < 0) || (index >= (this.rows * this.columns)));
        }
    });
}(jQuery) );
