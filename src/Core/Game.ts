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
import { ParticleSystem } from "../Effects/ParticleSystem";

declare const __BUILD_TIMESTAMP__: string;

const HIGH_SCORE_KEY = "skiGame_highScore";
const MAX_TRAIL_LENGTH = 40;

export class Game {
    private canvas!: Canvas;
    private gameWindow!: Rect;
    private gameTime: number = Date.now();
    private imageManager!: ImageManager;
    private obstacleManager!: ObstacleManager;
    private collectibleManager!: CollectibleManager;
    private skier!: Skier;
    private rhino!: Rhino;
    private particles!: ParticleSystem;

    private gameState: GAME_STATES = GAME_STATES.MENU;
    private score: number = 0;
    private coinsCollected: number = 0;
    private highScore: number = 0;
    private currentBiome: BiomeConfig = BIOMES[0];
    private rhinoSpawned: boolean = false;

    // Ski trail
    private trailPositions: Position[] = [];

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

        // Create persistent objects that survive restarts
        this.canvas = new Canvas(GAME_CANVAS, GAME_WIDTH, GAME_HEIGHT);
        this.imageManager = new ImageManager();
        this.particles = new ParticleSystem(GAME_WIDTH, GAME_HEIGHT);

        this.initGame();
        this.setupInputHandling();
        this.setupMenuHandlers();
        this.showMenu(GAME_STATES.MENU);
    }

    /**
     * Create all game objects and set initial biome.
     * Reuses the existing canvas and imageManager so loaded images persist across restarts.
     */
    private initGame() {
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
        this.trailPositions = [];

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

        // Build timestamp — populate all instances across menus
        const date = new Date(__BUILD_TIMESTAMP__);
        const timestampText = `Last updated: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
        document.querySelectorAll(".build-timestamp-display").forEach((el) => {
            el.textContent = timestampText;
        });

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
        this.canvas.fillGradientBackground(this.currentBiome.gradientTop, this.currentBiome.gradientBottom);

        // Always update particles (snow falls even on menus)
        this.particles.update(
            this.gameState === GAME_STATES.PLAYING ? this.skier.speed : 0,
            20
        );

        this.updateGameWindow();
        this.drawGameWindow();

        // Screen-space effects drawn on top
        this.particles.drawBursts(this.canvas.ctx);
        this.particles.drawSpeedLines(this.canvas.ctx);
        this.particles.drawSnow(this.canvas.ctx, this.currentBiome.snowColor, this.currentBiome.snowOpacity);
        this.canvas.drawVignette(this.currentBiome.vignetteIntensity);

        // HUD last (always on top)
        if (this.gameState === GAME_STATES.PLAYING || this.gameState === GAME_STATES.PAUSED) {
            this.drawHUD();
        }

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
        this.updateTrail();

        const previousGameWindow: Rect = this.gameWindow;
        this.calculateGameWindow();

        // Continuous difficulty ramp: start very sparse (mountaintop) and gradually fill in
        const BASE_OBSTACLE_EASE = 60;
        const OBSTACLE_RAMP_RATE = 0.006;
        const BASE_COLLECTIBLE_EASE = 30;
        const COLLECTIBLE_RAMP_RATE = 0.003;

        this.obstacleManager.obstacleChance = Math.max(
            this.currentBiome.obstacleChance,
            Math.round(BASE_OBSTACLE_EASE - this.score * OBSTACLE_RAMP_RATE)
        );
        this.collectibleManager.collectibleChance = Math.max(
            this.currentBiome.collectibleChance,
            Math.round(BASE_COLLECTIBLE_EASE - this.score * COLLECTIBLE_RAMP_RATE)
        );

        this.obstacleManager.placeNewObstacle(this.gameWindow, previousGameWindow);
        this.collectibleManager.placeNewCollectible(this.gameWindow, previousGameWindow, this.currentBiome);

        // Cull off-screen entities to prevent unbounded growth
        this.obstacleManager.cullOffScreen(this.gameWindow);
        this.collectibleManager.cullOffScreen(this.gameWindow);

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

    /**
     * Track skier positions for the ski trail.
     */
    private updateTrail() {
        if (this.skier.state === STATES.STATE_SKIING) {
            const pos = this.skier.getPosition();
            this.trailPositions.push(new Position(pos.x, pos.y));
            if (this.trailPositions.length > MAX_TRAIL_LENGTH) {
                this.trailPositions.shift();
            }
        } else if (this.skier.state === STATES.STATE_CRASHED) {
            this.trailPositions = [];
        }
    }

    drawGameWindow() {
        this.canvas.setDrawOffset(this.gameWindow.left, this.gameWindow.top);

        // Ski trail behind everything
        this.drawTrail();

        this.collectibleManager.drawCollectibles();
        this.obstacleManager.drawObstacles();
        this.skier.draw();
        if (this.rhinoSpawned) {
            this.rhino.draw();
        }
    }

    /**
     * Draw twin ski tracks behind the skier.
     */
    private drawTrail() {
        if (this.trailPositions.length < 2) return;

        const ctx = this.canvas.ctx;
        const skiSpacing = 3 * this.canvas.zoom;

        ctx.save();
        ctx.lineCap = "round";

        for (let i = 1; i < this.trailPositions.length; i++) {
            const alpha = (i / this.trailPositions.length) * 0.3;
            const pos = this.canvas.worldToScreen(this.trailPositions[i].x, this.trailPositions[i].y);
            const prev = this.canvas.worldToScreen(this.trailPositions[i - 1].x, this.trailPositions[i - 1].y);

            ctx.globalAlpha = alpha;
            ctx.strokeStyle = this.currentBiome.trailColor;
            ctx.lineWidth = 1.5 * this.canvas.zoom;

            // Left ski track
            ctx.beginPath();
            ctx.moveTo(prev.x - skiSpacing, prev.y);
            ctx.lineTo(pos.x - skiSpacing, pos.y);
            ctx.stroke();

            // Right ski track
            ctx.beginPath();
            ctx.moveTo(prev.x + skiSpacing, prev.y);
            ctx.lineTo(pos.x + skiSpacing, pos.y);
            ctx.stroke();
        }

        ctx.restore();
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
            if (this.skier.isDead()) return;

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
        if (!this.skier.isDead()) {
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
            this.biomeNotificationTimer = 180;
        }
    }

    /**
     * Check if the skier collects any items. Spawn burst particles on collection.
     */
    private updateCollectibles() {
        const skierBounds = this.skier.getBounds();
        const result = this.collectibleManager.checkCollection(skierBounds);
        if (result.points > 0) {
            this.score += result.points;
            this.coinsCollected += result.collected.length;
            for (const item of result.collected) {
                const screen = this.canvas.worldToScreen(item.x, item.y);
                this.particles.spawnBurst(screen.x, screen.y, item.color, 12);
            }
        }
    }

    /**
     * Draw the in-game HUD with a polished backdrop panel.
     */
    private drawHUD() {
        const ctx = this.canvas.ctx;

        // HUD backdrop (top-left)
        ctx.save();
        const panelW = 170;
        const panelH = 88;
        const panelX = 10;
        const panelY = 10;
        const r = 12;

        ctx.beginPath();
        ctx.moveTo(panelX + r, panelY);
        ctx.lineTo(panelX + panelW - r, panelY);
        ctx.quadraticCurveTo(panelX + panelW, panelY, panelX + panelW, panelY + r);
        ctx.lineTo(panelX + panelW, panelY + panelH - r);
        ctx.quadraticCurveTo(panelX + panelW, panelY + panelH, panelX + panelW - r, panelY + panelH);
        ctx.lineTo(panelX + r, panelY + panelH);
        ctx.quadraticCurveTo(panelX, panelY + panelH, panelX, panelY + panelH - r);
        ctx.lineTo(panelX, panelY + r);
        ctx.quadraticCurveTo(panelX, panelY, panelX + r, panelY);
        ctx.closePath();
        ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
        ctx.fill();
        ctx.restore();

        // Score
        ctx.font = "bold 22px 'Segoe UI', sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "left";
        ctx.fillText(`${this.score}`, panelX + 14, panelY + 28);

        // Score label
        ctx.font = "11px 'Segoe UI', sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.fillText("SCORE", panelX + 14, panelY + 42);

        // Coin icon (small gold circle)
        const coinX = panelX + 22;
        const coinY = panelY + 60;
        ctx.beginPath();
        ctx.arc(coinX, coinY, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#FFD700";
        ctx.fill();
        ctx.font = "bold 7px Arial";
        ctx.fillStyle = "#B8860B";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("$", coinX, coinY);

        // Coins count
        ctx.font = "bold 16px 'Segoe UI', sans-serif";
        ctx.fillStyle = "#FFD700";
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        ctx.fillText(`${this.coinsCollected}`, coinX + 12, coinY + 5);

        // Biome badge (top-right of panel)
        const biomeName = this.currentBiome.name;
        ctx.font = "bold 10px 'Segoe UI', sans-serif";
        const biomeWidth = ctx.measureText(biomeName).width + 12;
        const badgeX = panelX + panelW - biomeWidth - 6;
        const badgeY = panelY + panelH - 18;

        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, biomeWidth, 16, 4);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.textAlign = "center";
        ctx.fillText(biomeName, badgeX + biomeWidth / 2, badgeY + 12);

        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";

        // Biome transition notification
        if (this.biomeNotificationTimer > 0) {
            this.biomeNotificationTimer--;
            const alpha = Math.min(1, this.biomeNotificationTimer / 30);
            ctx.save();
            ctx.globalAlpha = alpha;

            // Notification backdrop
            const notifText = `Entering ${this.biomeNotification}`;
            ctx.font = "bold 28px 'Segoe UI', sans-serif";
            const notifW = ctx.measureText(notifText).width + 40;
            const notifX = (this.canvas.width - notifW) / 2;
            ctx.fillStyle = "rgba(0,0,0,0.4)";
            ctx.beginPath();
            ctx.roundRect(notifX, 95, notifW, 44, 10);
            ctx.fill();

            ctx.fillStyle = "#ffffff";
            ctx.textAlign = "center";
            ctx.fillText(notifText, this.canvas.width / 2, 125);
            ctx.restore();
        }

        // Crash message
        if (this.skier.state === STATES.STATE_CRASHED && this.gameState === GAME_STATES.PLAYING) {
            ctx.save();
            const crashText = "Crashed! Use arrow keys to recover";
            ctx.font = "bold 16px 'Segoe UI', sans-serif";
            const crashW = ctx.measureText(crashText).width + 30;
            const crashX = (this.canvas.width - crashW) / 2;
            const crashY = this.canvas.height - 55;

            ctx.globalAlpha = 0.8;
            ctx.fillStyle = "rgba(180, 30, 30, 0.6)";
            ctx.beginPath();
            ctx.roundRect(crashX, crashY, crashW, 32, 8);
            ctx.fill();

            ctx.globalAlpha = 1;
            ctx.fillStyle = "#ffffff";
            ctx.textAlign = "center";
            ctx.fillText(crashText, this.canvas.width / 2, crashY + 22);
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

                const warnText = "Rhino approaching!";
                ctx.font = "bold 18px 'Segoe UI', sans-serif";
                const warnW = ctx.measureText(warnText).width + 30;
                const warnX = (this.canvas.width - warnW) / 2;

                ctx.fillStyle = "rgba(200, 30, 30, 0.6)";
                ctx.beginPath();
                ctx.roundRect(warnX, 36, warnW, 32, 8);
                ctx.fill();

                ctx.fillStyle = "#ffffff";
                ctx.textAlign = "center";
                ctx.fillText(warnText, this.canvas.width / 2, 58);
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
