class TetrisGame {
    constructor() {
        this.canvas = document.getElementById('gameBoard');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextPiece');
        this.nextCtx = this.nextCanvas.getContext('2d');
        
        this.BOARD_WIDTH = 10;
        this.BOARD_HEIGHT = 20;
        this.BLOCK_SIZE = 30;
        
        // Set canvas size to exactly match the game area
        this.canvas.width = this.BOARD_WIDTH * this.BLOCK_SIZE;
        this.canvas.height = this.BOARD_HEIGHT * this.BLOCK_SIZE;
        
        // Initialize audio manager
        this.audioManager = new AudioManager();
        
        this.board = this.createBoard();
        this.currentPiece = null;
        this.nextPiece = null;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameRunning = false;
        this.gamePaused = false;
        this.dropTime = 0;
        this.dropInterval = 1000;
        
        this.colors = [
            '#FFD700', // 노란색
            '#FFA500', // 주황색
            '#FF6B6B', // 빨간색
            '#4ECDC4', // 청록색
            '#45B7D1', // 파란색
            '#96CEB4', // 연두색
            '#FFEAA7'  // 연노란색
        ];
        
        this.pieces = [
            // I 모양
            [[1, 1, 1, 1]],
            // O 모양
            [[1, 1], [1, 1]],
            // T 모양
            [[0, 1, 0], [1, 1, 1]],
            // S 모양
            [[0, 1, 1], [1, 1, 0]],
            // Z 모양
            [[1, 1, 0], [0, 1, 1]],
            // J 모양
            [[1, 0, 0], [1, 1, 1]],
            // L 모양
            [[0, 0, 1], [1, 1, 1]]
        ];
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.showOverlay('Game Start', 'Press SPACE to start');
        this.drawBoard();
        this.drawNextPiece();
    }
    
    createBoard() {
        return Array(this.BOARD_HEIGHT).fill().map(() => Array(this.BOARD_WIDTH).fill(0));
    }
    
    bindEvents() {
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        document.getElementById('startButton').addEventListener('click', () => this.startGame());
        
        // Bind sound controls
        document.getElementById('muteButton').addEventListener('click', () => {
            const isMuted = this.audioManager.toggleMute();
            const button = document.getElementById('muteButton');
            const icon = button.querySelector('.sound-icon');
            const text = button.querySelector('.sound-text');
            
            if (isMuted) {
                icon.textContent = '🔇';
                text.textContent = 'UNMUTE';
                button.classList.add('muted');
            } else {
                icon.textContent = '🔊';
                text.textContent = 'MUTE';
                button.classList.remove('muted');
            }
        });
    }
    
    handleKeyPress(e) {
        if (!this.gameRunning) return;
        
        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                this.movePiece(-1, 0);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.movePiece(1, 0);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.hardDrop();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.rotatePiece();
                break;
            case ' ':
                e.preventDefault();
                this.togglePause();
                break;
        }
    }
    
    startGame() {
        this.gameRunning = true;
        this.gamePaused = false;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.board = this.createBoard();
        this.dropInterval = 1000;
        
        this.hideOverlay();
        this.spawnPiece();
        this.gameLoop();
        this.updateUI();
    }
    
    togglePause() {
        if (!this.gameRunning) return;
        
        this.gamePaused = !this.gamePaused;
        if (this.gamePaused) {
            this.showOverlay('PAUSED', 'Press SPACE to continue');
        } else {
            this.hideOverlay();
        }
    }
    
    spawnPiece() {
        if (this.nextPiece === null) {
            this.nextPiece = this.createRandomPiece();
        }
        
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.createRandomPiece();
        
        if (this.isCollision(this.currentPiece)) {
            this.gameOver();
        }
        
        this.drawNextPiece();
    }
    
    createRandomPiece() {
        const pieceIndex = Math.floor(Math.random() * this.pieces.length);
        const colorIndex = Math.floor(Math.random() * this.colors.length);
        
        return {
            shape: this.pieces[pieceIndex],
            x: Math.floor(this.BOARD_WIDTH / 2) - Math.floor(this.pieces[pieceIndex][0].length / 2),
            y: 0,
            color: this.colors[colorIndex]
        };
    }
    
    movePiece(dx, dy) {
        if (!this.gameRunning || this.gamePaused) return;
        
        const newX = this.currentPiece.x + dx;
        const newY = this.currentPiece.y + dy;
        
        if (!this.isCollision({...this.currentPiece, x: newX, y: newY})) {
            this.currentPiece.x = newX;
            this.currentPiece.y = newY;
            this.drawBoard();
            
            // Play move sound for horizontal movement
            if (dx !== 0) {
                this.audioManager.playSound('move');
            }
            return true;
        }
        
        if (dy > 0) {
            this.placePiece();
            this.audioManager.playSound('drop');
            this.clearLines();
            this.spawnPiece();
        }
        
        return false;
    }
    
    rotatePiece() {
        if (!this.gameRunning || this.gamePaused) return;
        
        const rotated = this.rotateMatrix(this.currentPiece.shape);
        const rotatedPiece = {...this.currentPiece, shape: rotated};
        
        if (!this.isCollision(rotatedPiece)) {
            this.currentPiece.shape = rotated;
            this.drawBoard();
            this.audioManager.playSound('rotate');
        }
    }
    
    hardDrop() {
        if (!this.gameRunning || this.gamePaused) return;
        
        // Move piece down until it collides
        while (this.movePiece(0, 1)) {
            // Continue moving down until collision
        }
    }
    
    rotateMatrix(matrix) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const rotated = Array(cols).fill().map(() => Array(rows).fill(0));
        
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                rotated[j][rows - 1 - i] = matrix[i][j];
            }
        }
        
        return rotated;
    }
    
    isCollision(piece) {
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const boardX = piece.x + x;
                    const boardY = piece.y + y;
                    
                    if (boardX < 0 || boardX >= this.BOARD_WIDTH || 
                        boardY >= this.BOARD_HEIGHT ||
                        (boardY >= 0 && this.board[boardY][boardX])) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    placePiece() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const boardX = this.currentPiece.x + x;
                    const boardY = this.currentPiece.y + y;
                    
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.color;
                    }
                }
            }
        }
    }
    
    clearLines() {
        let linesCleared = 0;
        
        for (let y = this.BOARD_HEIGHT - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                this.board.splice(y, 1);
                this.board.unshift(Array(this.BOARD_WIDTH).fill(0));
                linesCleared++;
                y++;
            }
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.score += linesCleared * 100 * this.level;
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
            this.updateUI();
            
            // Play line clear sound
            this.audioManager.playSound('lineClear');
        }
    }
    
    gameLoop() {
        if (!this.gameRunning) return;
        
        if (!this.gamePaused) {
            this.dropTime += 16; // 약 60fps
            
            if (this.dropTime >= this.dropInterval) {
                this.movePiece(0, 1);
                this.dropTime = 0;
            }
        }
        
        this.drawBoard();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    drawBoard() {
        // Calculate the actual game area dimensions
        const gameAreaWidth = this.BOARD_WIDTH * this.BLOCK_SIZE;
        const gameAreaHeight = this.BOARD_HEIGHT * this.BLOCK_SIZE;
        
        // Clear entire canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw game area background with border
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, gameAreaWidth, gameAreaHeight);
        
        // Draw thick border around playable area
        this.ctx.strokeStyle = '#ffd700';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(0, 0, gameAreaWidth, gameAreaHeight);
        
        // Draw grid lines only within the game area
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x <= this.BOARD_WIDTH; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.BLOCK_SIZE, 0);
            this.ctx.lineTo(x * this.BLOCK_SIZE, gameAreaHeight);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.BOARD_HEIGHT; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.BLOCK_SIZE);
            this.ctx.lineTo(gameAreaWidth, y * this.BLOCK_SIZE);
            this.ctx.stroke();
        }
        
        // Draw blocks on the board
        for (let y = 0; y < this.BOARD_HEIGHT; y++) {
            for (let x = 0; x < this.BOARD_WIDTH; x++) {
                if (this.board[y][x]) {
                    this.drawBlock(x, y, this.board[y][x]);
                }
            }
        }
        
        // Draw current piece
        if (this.currentPiece) {
            for (let y = 0; y < this.currentPiece.shape.length; y++) {
                for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                    if (this.currentPiece.shape[y][x]) {
                        const boardX = this.currentPiece.x + x;
                        const boardY = this.currentPiece.y + y;
                        
                        if (boardY >= 0) {
                            this.drawBlock(boardX, boardY, this.currentPiece.color);
                        }
                    }
                }
            }
        }
        
        // The canvas is now exactly the size of the game area, so no out-of-bounds areas
    }
    
    drawBlock(x, y, color) {
        const pixelX = x * this.BLOCK_SIZE;
        const pixelY = y * this.BLOCK_SIZE;
        
        // 메인 블록
        this.ctx.fillStyle = color;
        this.ctx.fillRect(pixelX + 1, pixelY + 1, this.BLOCK_SIZE - 2, this.BLOCK_SIZE - 2);
        
        // 하이라이트
        this.ctx.fillStyle = this.lightenColor(color, 0.3);
        this.ctx.fillRect(pixelX + 1, pixelY + 1, this.BLOCK_SIZE - 2, 3);
        this.ctx.fillRect(pixelX + 1, pixelY + 1, 3, this.BLOCK_SIZE - 2);
        
        // 그림자
        this.ctx.fillStyle = this.darkenColor(color, 0.3);
        this.ctx.fillRect(pixelX + this.BLOCK_SIZE - 4, pixelY + 1, 3, this.BLOCK_SIZE - 2);
        this.ctx.fillRect(pixelX + 1, pixelY + this.BLOCK_SIZE - 4, this.BLOCK_SIZE - 2, 3);
    }
    
    drawNextPiece() {
        this.nextCtx.fillStyle = '#000';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        if (this.nextPiece) {
            const blockSize = 20;
            const offsetX = (this.nextCanvas.width - this.nextPiece.shape[0].length * blockSize) / 2;
            const offsetY = (this.nextCanvas.height - this.nextPiece.shape.length * blockSize) / 2;
            
            for (let y = 0; y < this.nextPiece.shape.length; y++) {
                for (let x = 0; x < this.nextPiece.shape[y].length; x++) {
                    if (this.nextPiece.shape[y][x]) {
                        const pixelX = offsetX + x * blockSize;
                        const pixelY = offsetY + y * blockSize;
                        
                        this.nextCtx.fillStyle = this.nextPiece.color;
                        this.nextCtx.fillRect(pixelX + 1, pixelY + 1, blockSize - 2, blockSize - 2);
                        
                        // 하이라이트
                        this.nextCtx.fillStyle = this.lightenColor(this.nextPiece.color, 0.3);
                        this.nextCtx.fillRect(pixelX + 1, pixelY + 1, blockSize - 2, 2);
                        this.nextCtx.fillRect(pixelX + 1, pixelY + 1, 2, blockSize - 2);
                        
                        // 그림자
                        this.nextCtx.fillStyle = this.darkenColor(this.nextPiece.color, 0.3);
                        this.nextCtx.fillRect(pixelX + blockSize - 3, pixelY + 1, 2, blockSize - 2);
                        this.nextCtx.fillRect(pixelX + 1, pixelY + blockSize - 3, blockSize - 2, 2);
                    }
                }
            }
        }
    }
    
    lightenColor(color, amount) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * amount * 100);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }
    
    darkenColor(color, amount) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * amount * 100);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return "#" + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
            (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
            (B > 255 ? 255 : B < 0 ? 0 : B)).toString(16).slice(1);
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score.toLocaleString();
        document.getElementById('level').textContent = this.level;
        document.getElementById('lines').textContent = this.lines;
    }
    
    showOverlay(title, message) {
        document.getElementById('overlayTitle').textContent = title;
        document.getElementById('overlayMessage').textContent = message;
        document.getElementById('gameOverlay').style.display = 'flex';
    }
    
    hideOverlay() {
        document.getElementById('gameOverlay').style.display = 'none';
    }
    
    gameOver() {
        this.gameRunning = false;
        this.showOverlay('GAME OVER', `Final Score: ${this.score.toLocaleString()}`);
        document.getElementById('startButton').textContent = 'RESTART';
        
        // Play game over sound
        this.audioManager.playSound('gameOver');
    }
}

// 게임 시작
document.addEventListener('DOMContentLoaded', () => {
    new TetrisGame();
}); 