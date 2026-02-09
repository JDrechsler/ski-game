/**
 * The main game class. Manages game state, menus, biomes, collectibles, zoom, and the core game loop.
 */

import {
    GAME_CANVAS,
    GAME_WIDTH,
    GAME_HEIGHT,
    IMAGES,
    KEYS,
    KEY_STATES,
    GAME_STATES,
    BIOMES,
    BiomeConfig,
    RHINO_SPAWN_SCORE,
} from "../Constants";
import { Canvas } from "./Canvas";
import { ImageManager } from "./ImageManager";
import { Position, Rect } from "./Utils";
import { ObstacleManager } from "../Entities/Obstacles/ObstacleManager";
import { CollectibleManager } from "../Entities/Collectibles/CollectibleManager";
import { Rhino } from "../Entities/Rhino";
import { STATES, Skier } from "../Entities/Skier";

const HIGH_SCORE_KEY = "skiGame_highScore";

export class Game {
    private canvas!: Canvas;
    private gameWindow!: Rect;
    private gameTime: number = Date.now();
    private imageManager!: ImageManager;
    private obstacleManager!: ObstacleManager;
    private collectibleManager!: CollectibleManager;
    private skier!: Skier;
    private rhino!: Rhino;

    private gameState: GAME_STATES = GAME_STATES.MENU;
    private score: number = 0;
    private coinsCollected: number = 0;
    private highScore: number = 0;
    private currentBiome: BiomeConfig = BIOMES[0];
    private rhinoSpawned: boolean = false;

    // Biome transition notification
    private biomeNotification: string = "";
    private biomeNotificationTimer: number = 0;

    // Menu DOM references
    private menuOverlay!: HTMLElement;
    private startMenu!: HTMLElement;
    private pauseMenu!: HTMLElement;
    private gameOverMenu!: HTMLElement;
    private optionsMenu!: HTMLElement;
    private previousMenuId: string = "startMenu";

    // Mobile touch tracking
    private isMobile: boolean = false;
    private touchStartY: number = 0;

    constructor() {
        this.highScore = this.loadHighScore();
        this.isMobile = "ontouchstart" in window || navigator.maxTouchPoints > 0;
        this.initGame();
        this.setupInputHandling();
        this.setupMenuHandlers();
        this.showMenu(GAME_STATES.MENU);
    }

    /**
     * Create all game objects and set initial biome.
     */
    private initGame() {
        this.canvas = new Canvas(GAME_CANVAS, GAME_WIDTH, GAME_HEIGHT);
        this.imageManager = new ImageManager();
        this.obstacleManager = new ObstacleManager(this.imageManager, this.canvas);
        this.collectibleManager = new CollectibleManager(this.imageManager, this.canvas);

        this.skier = new Skier(0, 0, this.imageManager, this.obstacleManager, this.canvas);
        this.rhino = new Rhino(-500, -2000, this.imageManager, this.canvas);

        this.score = 0;
        this.coinsCollected = 0;
        this.rhinoSpawned = false;
        this.currentBiome = BIOMES[0];
        this.biomeNotification = "";
        this.biomeNotificationTimer = 0;

        // Apply initial biome
        this.obstacleManager.setBiome(this.currentBiome);
        this.collectibleManager.setBiome(this.currentBiome);

        this.calculateGameWindow();
        this.obstacleManager.placeInitialObstacles();
        this.collectibleManager.placeInitialCollectibles(this.currentBiome);
    }

    /**
     * Reset game state for a restart.
     */
    private restart() {
        this.obstacleManager.reset();
        this.collectibleManager.reset();
        this.initGame();
        this.gameState = GAME_STATES.PLAYING;
        this.hideAllMenus();
        if (this.isMobile) {
            this.showMobileControls(true);
        }
    }

    setupInputHandling() {
        document.addEventListener("keydown", (e) => {
            this.handleKeyEvents(e, KEY_STATES.PRESS);
        });

        document.addEventListener("keyup", (e) => {
            this.handleKeyEvents(e, KEY_STATES.RELEASE);
        });

        // Touch: left/right steering
        document.addEventListener(
            "touchstart",
            (e) => {
                if (this.gameState !== GAME_STATES.PLAYING) return;

                // Ignore touches on UI elements
                const target = e.target as HTMLElement;
                if (target.closest(".menu-overlay") || target.closest(".mobile-controls")) return;

                this.touchStartY = e.touches[0].clientY;

                const touchX = e.touches[0].clientX;
                const touchSide = touchX < window.innerWidth / 2 ? "left" : "right";
                this.handleKeyEvents(
                    new KeyboardEvent("keydown", {
                        key: touchSide === "left" ? KEYS.LEFT : KEYS.RIGHT,
                    }),
                    KEY_STATES.PRESS
                );
            },
            { passive: true }
        );

        document.addEventListener(
            "touchend",
            (e) => {
                if (this.gameState !== GAME_STATES.PLAYING) return;

                const target = e.target as HTMLElement;
                if (target.closest(".menu-overlay") || target.closest(".mobile-controls")) return;

                // Detect swipe up for jump
                if (e.changedTouches.length > 0) {
                    const touchEndY = e.changedTouches[0].clientY;
                    if (this.touchStartY - touchEndY > 40) {
                        if (!this.skier.isDead() && !this.skier.isInAir()) {
                            this.skier.jump();
                        }
                    }
                }

                this.handleKeyEvents(
                    new KeyboardEvent("keyup", { key: KEYS.LEFT }),
                    KEY_STATES.RELEASE
                );
            },
            { passive: true }
        );

        document.oncontextmenu = function () {
            return false;
        };
    }

    /**
     * Wire up all menu button click handlers and options.
     */
    private setupMenuHandlers() {
        this.menuOverlay = document.getElementById("menuOverlay")!;
        this.startMenu = document.getElementById("startMenu")!;
        this.pauseMenu = document.getElementById("pauseMenu")!;
        this.gameOverMenu = document.getElementById("gameOverMenu")!;
        this.optionsMenu = document.getElementById("optionsMenu")!;

        // Start
        document.getElementById("startBtn")!.addEventListener("click", () => this.startGame());

        // Pause menu
        document.getElementById("resumeBtn")!.addEventListener("click", () => this.resume());
        document.getElementById("restartBtnPause")!.addEventListener("click", () => this.restart());

        // Game over
        document.getElementById("restartBtn")!.addEventListener("click", () => this.restart());

        // Options (from start and pause)
        document.getElementById("optionsBtnStart")!.addEventListener("click", () => {
            this.previousMenuId = "startMenu";
            this.showOptionsMenu();
        });
        document.getElementById("optionsBtnPause")!.addEventListener("click", () => {
            this.previousMenuId = "pauseMenu";
            this.showOptionsMenu();
        });
        document.getElementById("optionsBackBtn")!.addEventListener("click", () => this.hideOptionsMenu());

        // Zoom slider
        const zoomSlider = document.getElementById("zoomSlider") as HTMLInputElement;
        const zoomValue = document.getElementById("zoomValue")!;
        zoomSlider.addEventListener("input", () => {
            const zoom = parseFloat(zoomSlider.value);
            this.canvas.setZoom(zoom);
            zoomValue.textContent = zoom.toFixed(1) + "x";
        });

        // Mobile jump button
        const mobileJumpBtn = document.getElementById("mobileJumpBtn");
        if (mobileJumpBtn) {
            mobileJumpBtn.addEventListener("touchstart", (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (this.gameState === GAME_STATES.PLAYING && !this.skier.isDead() && !this.skier.isInAir()) {
                    this.skier.jump();
                }
            });
        }
    }

    async load(): Promise<void> {
        await this.imageManager.loadImages(IMAGES);
    }

    /**
     * Start the game from the menu.
     */
    private startGame() {
        this.gameState = GAME_STATES.PLAYING;
        this.hideAllMenus();
        if (this.isMobile) {
            this.showMobileControls(true);
        }
    }

    run() {
        this.canvas.clearCanvas();
        this.canvas.fillBackground(this.currentBiome.backgroundColor);

        this.updateGameWindow();
        this.drawGameWindow();

        requestAnimationFrame(this.run.bind(this));
    }

    updateGameWindow() {
        if (this.gameState !== GAME_STATES.PLAYING) {
            return;
        }

        this.gameTime = Date.now();

        this.updateBiome();
        this.updateGameScore();
        this.updateCollectibles();

        const previousGameWindow: Rect = this.gameWindow;
        this.calculateGameWindow();

        this.obstacleManager.placeNewObstacle(this.gameWindow, previousGameWindow);
        this.collectibleManager.placeNewCollectible(this.gameWindow, previousGameWindow, this.currentBiome);

        this.skier.update(this.gameTime);

        // Spawn rhino after score threshold
        if (!this.rhinoSpawned && this.score >= RHINO_SPAWN_SCORE) {
            this.rhinoSpawned = true;
            const skierPos = this.skier.getPosition();
            this.rhino = new Rhino(skierPos.x - 500, skierPos.y - 2000, this.imageManager, this.canvas);
        }

        if (this.rhinoSpawned) {
            this.rhino.update(this.gameTime, this.skier);
        }

        // Check for game over
        if (this.skier.isDead() && this.gameState === GAME_STATES.PLAYING) {
            this.gameOver();
        }
    }

    drawGameWindow() {
        this.canvas.setDrawOffset(this.gameWindow.left, this.gameWindow.top);

        this.collectibleManager.drawCollectibles();
        this.obstacleManager.drawObstacles();
        this.skier.draw();
        if (this.rhinoSpawned) {
            this.rhino.draw();
        }

        this.drawHUD();
    }

    /**
     * Calculate the game window accounting for zoom level.
     */
    calculateGameWindow() {
        const skierPosition: Position = this.skier.getPosition();
        const viewWidth = GAME_WIDTH / this.canvas.zoom;
        const viewHeight = GAME_HEIGHT / this.canvas.zoom;
        const left: number = skierPosition.x - viewWidth / 2;
        const top: number = skierPosition.y - viewHeight / 2;

        this.gameWindow = new Rect(left, top, left + viewWidth, top + viewHeight);
    }

    handleKeyEvents(keyEvent: KeyboardEvent, keyState: KEY_STATES) {
        if (this.gameState === GAME_STATES.MENU) {
            if (keyState === KEY_STATES.PRESS && keyEvent.key === KEYS.SPACE) {
                this.startGame();
                keyEvent.preventDefault();
            }
            return;
        }

        if (this.gameState === GAME_STATES.GAME_OVER) {
            if (keyState === KEY_STATES.PRESS && keyEvent.key === KEYS.R) {
                this.restart();
                keyEvent.preventDefault();
            }
            return;
        }

        if (this.gameState !== GAME_STATES.PLAYING && this.gameState !== GAME_STATES.PAUSED) {
            return;
        }

        if (keyState === KEY_STATES.PRESS) {
            // Handle pause/resume first (works even when paused)
            if (keyEvent.key === KEYS.P || keyEvent.key === KEYS.ESC) {
                if (this.gameState === GAME_STATES.PAUSED) {
                    this.resume();
                } else {
                    this.pause();
                }
                keyEvent.preventDefault();
                return;
            }

            // Game input only when playing
            if (this.gameState !== GAME_STATES.PLAYING) return;
            if (this.skier.isDead() || this.skier.isInAir()) return;

            switch (keyEvent.key) {
                case KEYS.LEFT:
                    this.skier.turnLeft();
                    break;
                case KEYS.RIGHT:
                    this.skier.turnRight();
                    break;
                case KEYS.SPACE:
                    this.skier.jump();
                    break;
                default:
                    break;
            }
        }

        if (keyState === KEY_STATES.RELEASE) {
            if (this.gameState !== GAME_STATES.PLAYING) return;
            if (this.skier.isDead() || this.skier.isInAir()) return;

            switch (keyEvent.key) {
                case KEYS.LEFT:
                case KEYS.RIGHT:
                    this.skier.turnDown();
                    break;
                default:
                    break;
            }
        }

        keyEvent.preventDefault();
    }

    /**
     * Pause the game and show pause menu.
     */
    pause() {
        if (this.skier.state === STATES.STATE_SKIING || this.skier.state === STATES.STATE_CRASHED) {
            this.gameState = GAME_STATES.PAUSED;
            this.showMenu(GAME_STATES.PAUSED);
            if (this.isMobile) this.showMobileControls(false);
        }
    }

    /**
     * Resume the game from pause.
     */
    resume() {
        this.gameState = GAME_STATES.PLAYING;
        this.hideAllMenus();
        if (this.isMobile) this.showMobileControls(true);
    }

    /**
     * Handle game over state.
     */
    private gameOver() {
        this.gameState = GAME_STATES.GAME_OVER;
        this.updateHighScore();
        this.showMenu(GAME_STATES.GAME_OVER);
        if (this.isMobile) this.showMobileControls(false);
    }

    /**
     * Update which biome the player is in based on score.
     */
    private updateBiome() {
        let newBiome = BIOMES[0];
        for (let i = BIOMES.length - 1; i >= 0; i--) {
            if (this.score >= BIOMES[i].scoreThreshold) {
                newBiome = BIOMES[i];
                break;
            }
        }

        if (newBiome !== this.currentBiome) {
            this.currentBiome = newBiome;
            this.obstacleManager.setBiome(newBiome);
            this.collectibleManager.setBiome(newBiome);
            this.biomeNotification = newBiome.name;
            this.biomeNotificationTimer = 180; // ~3 seconds at 60fps
        }
    }

    /**
     * Check if the skier collects any items.
     */
    private updateCollectibles() {
        const skierBounds = this.skier.getBounds();
        const points = this.collectibleManager.checkCollection(skierBounds);
        if (points > 0) {
            this.score += points;
            this.coinsCollected++;
        }
    }

    /**
     * Draw the in-game HUD (score, biome, warnings).
     */
    private drawHUD() {
        const ctx = this.canvas.ctx;
        const isNightBiome = this.currentBiome.name === "Night";
        const textColor = isNightBiome ? "#e0e0e0" : "#1a1a2e";

        // Score
        ctx.font = "bold 20px 'Segoe UI', sans-serif";
        ctx.fillStyle = textColor;
        ctx.textAlign = "left";
        ctx.fillText(`Score: ${this.score}`, 16, 32);

        // Coins collected
        ctx.font = "16px 'Segoe UI', sans-serif";
        ctx.fillStyle = "#FFD700";
        ctx.fillText(`Coins: ${this.coinsCollected}`, 16, 56);

        // Biome indicator
        ctx.font = "14px 'Segoe UI', sans-serif";
        ctx.fillStyle = isNightBiome ? "#aaa" : "#888";
        ctx.fillText(this.currentBiome.name, 16, 76);

        // Biome transition notification
        if (this.biomeNotificationTimer > 0) {
            this.biomeNotificationTimer--;
            const alpha = Math.min(1, this.biomeNotificationTimer / 30);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.font = "bold 32px 'Segoe UI', sans-serif";
            ctx.fillStyle = isNightBiome ? "#fff" : "#333";
            ctx.textAlign = "center";
            ctx.fillText(`Entering ${this.biomeNotification}`, this.canvas.width / 2, 120);
            ctx.restore();
        }

        // Crash message
        if (this.skier.state === STATES.STATE_CRASHED && this.gameState === GAME_STATES.PLAYING) {
            ctx.save();
            ctx.globalAlpha = 0.7;
            ctx.font = "bold 18px 'Segoe UI', sans-serif";
            ctx.fillStyle = isNightBiome ? "#ff8888" : "#cc3333";
            ctx.textAlign = "center";
            ctx.fillText("Crashed! Use arrow keys to recover", this.canvas.width / 2, this.canvas.height - 40);
            ctx.restore();
        }

        // Rhino warning
        if (this.rhinoSpawned && this.gameState === GAME_STATES.PLAYING && !this.skier.isDead()) {
            const rhinoPos = this.rhino.getPosition();
            const skierPos = this.skier.getPosition();
            const dist = Math.hypot(rhinoPos.x - skierPos.x, rhinoPos.y - skierPos.y);
            if (dist < 600) {
                const urgency = Math.max(0.3, 1 - dist / 600);
                ctx.save();
                ctx.globalAlpha = urgency;
                ctx.font = "bold 20px 'Segoe UI', sans-serif";
                ctx.fillStyle = "#ff4444";
                ctx.textAlign = "center";
                ctx.fillText("Rhino approaching!", this.canvas.width / 2, 50);
                ctx.restore();
            }
        }
    }

    /**
     * Show/hide DOM menus based on game state.
     */
    private showMenu(state: GAME_STATES) {
        this.hideAllMenus();
        this.menuOverlay.classList.add("active");

        switch (state) {
            case GAME_STATES.MENU:
                this.startMenu.classList.remove("hidden");
                break;
            case GAME_STATES.PAUSED:
                document.getElementById("pauseScore")!.textContent = `Score: ${this.score}`;
                document.getElementById("pauseBiome")!.textContent = `Biome: ${this.currentBiome.name}`;
                this.pauseMenu.classList.remove("hidden");
                break;
            case GAME_STATES.GAME_OVER:
                document.getElementById("finalScore")!.textContent = `Final Score: ${this.score}`;
                document.getElementById("highScore")!.textContent = `High Score: ${this.highScore}`;
                document.getElementById("coinsCollected")!.textContent =
                    `Collected ${this.coinsCollected} item${this.coinsCollected !== 1 ? "s" : ""} | Reached: ${this.currentBiome.name}`;
                this.gameOverMenu.classList.remove("hidden");
                break;
        }
    }

    private showOptionsMenu() {
        this.hideAllPanels();
        this.optionsMenu.classList.remove("hidden");
    }

    private hideOptionsMenu() {
        this.optionsMenu.classList.add("hidden");
        if (this.previousMenuId === "startMenu") {
            this.startMenu.classList.remove("hidden");
        } else {
            this.pauseMenu.classList.remove("hidden");
        }
    }

    private hideAllPanels() {
        this.startMenu.classList.add("hidden");
        this.pauseMenu.classList.add("hidden");
        this.gameOverMenu.classList.add("hidden");
        this.optionsMenu.classList.add("hidden");
    }

    private hideAllMenus() {
        this.menuOverlay.classList.remove("active");
        this.hideAllPanels();
    }

    private showMobileControls(show: boolean) {
        const el = document.getElementById("mobileControls");
        if (el) {
            if (show && this.isMobile) {
                el.classList.remove("hidden");
            } else {
                el.classList.add("hidden");
            }
        }
    }

    updateGameScore() {
        switch (this.skier.state) {
            case STATES.STATE_SKIING:
                this.score += 1;
                break;
            case STATES.STATE_JUMPING:
                this.score += 10;
                break;
            case STATES.STATE_FLIPPING:
                this.score += 100;
                break;
            default:
                break;
        }
    }

    private loadHighScore(): number {
        try {
            return parseInt(localStorage.getItem(HIGH_SCORE_KEY) || "0", 10);
        } catch {
            return 0;
        }
    }

    private updateHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            try {
                localStorage.setItem(HIGH_SCORE_KEY, String(this.highScore));
            } catch {
                // localStorage not available
            }
        }
    }
}
