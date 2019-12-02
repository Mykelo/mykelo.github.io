let img = new Image()
img.src = "./images/1.jpg"
img.width = 1600
img.height = 1600

const canvas = document.getElementById("canvas")
var board = document.getElementById("board")
var width = board.offsetWidth > 1200 ? board.offsetWidth * 0.6 : board.offsetWidth * 0.9

canvas.setAttribute('width', width)
canvas.setAttribute('height', width)

const ctx = canvas.getContext("2d")

var newGameButton = document.getElementById("newGameButton")
var widthInput = document.getElementById("widthInput")
var heightInput = document.getElementById("heightInput")
var widthLabel = document.getElementById("widthLabel")
var heightLabel = document.getElementById("heightLabel")

widthInput.onchange = () => {
    widthLabel.innerHTML = widthInput.value
}

heightInput.onchange = () => {
    heightLabel.innerHTML = heightInput.value
}

newGameButton.onclick = () => {
    var xTiles = parseInt(widthInput.value) || 1
    var yTiles = parseInt(heightInput.value) || 1

    if (xTiles > 1 && yTiles > 1) {
        newGame(width, width, xTiles, yTiles, img)
    }
}

img.onload = () => {
    newGame(width, width, 3, 3, img)
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        let img = new Image();
        img.addEventListener('load', e => { resolve(img) });
        img.addEventListener('error', () => {
            reject(new Error(`Failed to load image: ${src}`));
        });
        img.src = src;
    });
}

function pickImage(src) {
    var fullImgSrc = src.replace("min", "")
    loadImage(fullImgSrc).then(image => {
        var xTiles = parseInt(widthInput.value) || 1
        var yTiles = parseInt(heightInput.value) || 1

        img = image
        if (xTiles > 1 && yTiles > 1) {
            newGame(width, width, xTiles, yTiles, image)
        }
        document.body.scrollTop = document.documentElement.scrollTop = 0;
    })
        .catch(error => {
            console.log(error.message)
        })
}

function newGame(width, height, xTiles, yTiles, img) {
    var grid = new Grid(width, height, xTiles, yTiles, img)
    grid.render(ctx)

    var mouseTile = { x: 0, y: 0 }
    canvas.onmousemove = (e) => {
        var pos = getMousePos(canvas, e)
        mouseTile.x = Math.floor(pos.x / grid.tileWidth)
        mouseTile.y = Math.floor(pos.y / grid.tileHeight)

        if (!grid.isSolved) {
            grid.highlightTile(mouseTile.x, mouseTile.y)
            grid.render(ctx)
        }
    }

    canvas.onclick = (e) => {
        // No need for calculating the position on the grid
        // Use the value calculated in onmousemove

        if (!grid.isSolved && grid.highlightedTileX === mouseTile.x && grid.highlightedTileY === mouseTile.y) {
            grid.swapEmptyTile(mouseTile.x, mouseTile.y)
            grid.render(ctx)

            if (grid.checkSolved()) {
                ctx.globalAlpha = 0.7;
                ctx.fillStyle = "#BEBEBE";
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.font = "40px Comic Sans MS";
                ctx.fillStyle = "green";
                ctx.textAlign = "center";
                ctx.fillText("You solved it", canvas.width / 2, canvas.height / 2);
            } else {
                grid.highlightTile(-1, -1)
                grid.render(ctx)
            }
        }
    }
}

function createArray(length) {
    var arr = new Array(length || 0),
        i = length;

    if (arguments.length > 1) {
        var args = Array.prototype.slice.call(arguments, 1);
        while (i--) arr[length - 1 - i] = createArray.apply(this, args);
    }

    return arr;
}

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
        y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
    };
}

class Grid {
    constructor(width, height, xTiles, yTiles, img) {
        this.width = width
        this.height = height
        this.tiles = []
        this.img = img
        this.isSolved = false

        this.tileWidth = width / xTiles
        this.tileHeight = height / yTiles
        this.imgTileWidth = img.width / xTiles
        this.imgTileHeight = img.height / yTiles

        for (var x = 0; x < xTiles; x++) {
            this.tiles.push([])
            for (var y = 0; y < yTiles; y++) {
                this.tiles[x].push(new Tile(x, y))
            }
        }

        this.shuffle()

        var xLen = this.tiles.length
        var yLen = this.tiles[0].length

        // Find the empty tile position
        var emptyTileNum = this.tiles.length * this.tiles[0].length - 1
        this.tiles.forEach((row, x) => {
            row.forEach((tile, y) => {
                if (tile.initY * xLen + tile.initX === emptyTileNum) {
                    this.emptyTileX = x
                    this.emptyTileY = y
                }
            })
        })
        if (!this.isSolvable()) {
            if (this.emptyTileY === 0 && this.emptyTileX <= 1) {
                this.swapTiles(xLen - 2, yLen - 1, xLen - 1, yLen - 1)
            } else {
                this.swapTiles(0, 0, 1, 0);
            }
        }

        // Set the highlighted tile
        this.highlightedTileX = -1
        this.highlightedTileY = -1
    }

    highlightTile(x, y) {
        var xAbs = Math.abs(this.emptyTileX - x)
        var yAbs = Math.abs(this.emptyTileY - y)
        var xCond = xAbs === 1 && yAbs === 0
        var yCond = yAbs === 1 && xAbs === 0

        // xCond xor yCond
        if ((xCond && !yCond) || (!xCond && yCond)) {
            this.highlightedTileX = x
            this.highlightedTileY = y
        } else {
            this.highlightedTileX = -1
            this.highlightedTileY = -1
        }
    }

    shuffle() {
        var xLen = this.tiles.length
        var yLen = this.tiles[0].length
        var i = xLen * yLen - 1

        while (i > 0) {
            var j = Math.floor(Math.random() * i)
            var xi = i % xLen
            var yi = Math.floor(i / xLen)
            var xj = j % xLen
            var yj = Math.floor(j / xLen)
            this.swapTiles(xi, yi, xj, yj)
            --i
        }
    }

    swapTiles(i, j, k, l) {
        var temp = this.tiles[i][j];
        this.tiles[i][j] = this.tiles[k][l];
        this.tiles[k][l] = temp;
    }

    swapEmptyTile(x, y) {
        this.swapTiles(x, y, this.emptyTileX, this.emptyTileY)
        this.emptyTileX = x
        this.emptyTileY = y
    }

    checkSolved() {
        for (var x = 0; x < this.tiles.length; x++) {
            for (var y = 0; y < this.tiles[0].length; y++) {
                if (this.tiles[x][y].initX != x || this.tiles[x][y].initY !== y) {
                    return false
                }
            }
        }
        this.isSolved = true;
        return true
    }

    countInversions(i, j) {
        var inversions = 0;
        var xLen = this.tiles.length
        var yLen = this.tiles[0].length
        var tileNum = j * xLen + i;
        var lastTile = xLen * yLen;
        var tileValue = this.tiles[i][j].initY * xLen + this.tiles[i][j].initX;
        for (var q = tileNum + 1; q < lastTile; ++q) {
            var k = q % xLen;
            var l = Math.floor(q / xLen);

            var compValue = this.tiles[k][l].initY * xLen + this.tiles[k][l].initX;
            if (tileValue > compValue && tileValue != (lastTile - 1)) {
                ++inversions;
            }
        }
        return inversions;
    }

    sumInversions() {
        var inversions = 0;
        for (var j = 0; j < this.tiles.length; ++j) {
            for (var i = 0; i < this.tiles[0].length; ++i) {
                inversions += this.countInversions(j, i);
            }
        }
        return inversions;
    }

    isSolvable() {
        if (this.tiles[0].length % 2 === 1) {
            return (this.sumInversions() % 2 === 0)
        } else {
            return ((this.sumInversions() + this.tiles.length - this.emptyTileY + 1) % 2 === 0)
        }
    }

    render(ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.tiles.forEach((xTiles, x) => {
            xTiles.forEach((tile, y) => {
                var xPos = x * this.tileWidth
                var yPos = y * this.tileHeight
                ctx.globalAlpha = 1.0;
                if (x === this.emptyTileX && y === this.emptyTileY) {
                    ctx.fillStyle = "#FF0000";
                    ctx.fillRect(xPos, yPos, this.tileWidth, this.tileHeight);
                } else {
                    ctx.drawImage(this.img, this.imgTileWidth * tile.initX, this.imgTileHeight * tile.initY, this.imgTileWidth, this.imgTileHeight,
                        xPos, yPos, this.tileWidth, this.tileHeight)
                    ctx.strokeRect(xPos, yPos, this.tileWidth, this.tileHeight)
                }

                if (x === this.highlightedTileX && y === this.highlightedTileY) {
                    ctx.globalAlpha = 0.6;
                    ctx.fillStyle = "#BEBEBE";
                    ctx.fillRect(xPos, yPos, this.tileWidth, this.tileHeight);
                }
            })
        })
    }

}

class Tile {
    constructor(initX, initY) {
        this.initX = initX
        this.initY = initY
    }
}