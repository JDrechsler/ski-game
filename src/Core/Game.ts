/**
 * The main game class. This initializes the game as well as runs the game/render loop and initial handling of input.
 */

import { GAME_CANVAS, GAME_WIDTH, GAME_HEIGHT, IMAGES, KEYS } from "../Constants";
import { Canvas } from "./Canvas";
import { ImageManager } from "./ImageManager";
import { Position, Rect } from "./Utils";
import { ObstacleManager } from "../Entities/Obstacles/ObstacleManager";
import { Rhino } from "../Entities/Rhino";
import { STATES, Skier } from "../Entities/Skier";

export class Game {
    /**
     * The canvas the game will be displayed on
     */
    private canvas!: Canvas;

    /**
     * Coordinates denoting the active rectangular space in the game world
     * */
    private gameWindow!: Rect;

    /**
     * Current game time
     */
    private gameTime: number = Date.now();

    private imageManager!: ImageManager;

    private obstacleManager!: ObstacleManager;

    private paused: boolean;

    private score: number;

    /**
     * The skier player
     */
    private skier!: Skier;

    /**
     * The enemy that chases the skier
     */
    private rhino!: Rhino;

    /**
     * Initialize the game and setup any input handling needed.
     */
    constructor() {
        this.init();
        this.setupInputHandling();
        this.paused = false;
        this.score = 0;
    }

    /**
     * Create all necessary game objects and initialize them as needed.
     */
    init() {
        this.canvas = new Canvas(GAME_CANVAS, GAME_WIDTH, GAME_HEIGHT);
        this.imageManager = new ImageManager();
        this.obstacleManager = new ObstacleManager(this.imageManager, this.canvas);

        this.skier = new Skier(0, 0, this.imageManager, this.obstacleManager, this.canvas);
        this.rhino = new Rhino(-500, -2000, this.imageManager, this.canvas);

        this.calculateGameWindow();
        this.obstacleManager.placeInitialObstacles();
    }

    /**
     * Setup listeners for any input events we might need.
     */
    setupInputHandling() {
        document.addEventListener("keydown", this.handleKeyDown.bind(this));
    }

    /**
     * Load any assets we need for the game to run. Return a promise so that we can wait on something until all assets
     * are loaded before running the game.
     */
    async load(): Promise<void> {
        await this.imageManager.loadImages(IMAGES);
    }

    /**
     * The main game loop. Clear the screen, update the game objects and then draw them.
     */
    run() {
        this.canvas.clearCanvas();

        this.updateGameWindow();
        this.drawGameWindow();

        requestAnimationFrame(this.run.bind(this));
    }

    /**
     * Do any updates needed to the game objects
     */
    updateGameWindow() {
        if (this.paused) {
            return;
        }
        this.gameTime = Date.now();

        this.updateGameScore();

        const previousGameWindow: Rect = this.gameWindow;
        this.calculateGameWindow();

        this.obstacleManager.placeNewObstacle(this.gameWindow, previousGameWindow);

        this.skier.update(this.gameTime);
        this.rhino.update(this.gameTime, this.skier);
    }

    /**
     * Draw all entities to the screen, in the correct order. Also setup the canvas draw offset so that we see the
     * rectangular space denoted by the game window.
     */
    drawGameWindow() {
        this.canvas.setDrawOffset(this.gameWindow.left, this.gameWindow.top);

        this.skier.draw();
        this.rhino.draw();
        this.obstacleManager.drawObstacles();

        this.drawScore();
        this.drawMenuMessages();
    }

    /**
     * Calculate the game window (the rectangular space drawn to the screen). It's centered around the player and must
     * be updated since the player moves position.
     */
    calculateGameWindow() {
        const skierPosition: Position = this.skier.getPosition();
        const left: number = skierPosition.x - GAME_WIDTH / 2;
        const top: number = skierPosition.y - GAME_HEIGHT / 2;

        this.gameWindow = new Rect(left, top, left + GAME_WIDTH, top + GAME_HEIGHT);
    }

    /**
     * Handle key presses and delegate to any game objects that might have key handling of their own.
     */
    handleKeyDown(event: KeyboardEvent) {
        let handled: boolean = this.skier.handleInput(event.key);

        switch (event.key) {
            case KEYS.P:
            case KEYS.ESC:
                this.paused ? this.resume() : this.pause();
            default:
                handled = false;
        }

        if (handled) {
            event.preventDefault();
        }
    }

    /**
     * Pause the game
     */
    pause() {
        if (this.skier.state === STATES.STATE_SKIING) {
            this.paused = true;
        }
    }

    /**
     * Resume the game
     */
    resume() {
        this.paused = false;
    }

    /**
     * Draw a menu message to the screen.
     */
    drawMenuMessage(message: string, menuOpacity: number = 0.5, ctx: CanvasRenderingContext2D = this.canvas.ctx) {
        ctx.fillStyle = `rgba(0, 0, 0, ${menuOpacity})`;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.font = "30px Arial";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText(message, this.canvas.width / 2, this.canvas.height / 2);
    }

    /**
     * Draw the current game score to the screen.
     */
    drawScore(ctx: CanvasRenderingContext2D = this.canvas.ctx) {
        ctx.font = "20px Arial";
        ctx.fillStyle = "black";
        ctx.textAlign = "left";
        ctx.fillText(`Score: ${this.score}`, 10, 30);
    }

    /**
     * Draw any menu messages that need to be displayed.
     */
    drawMenuMessages() {
        if (this.paused) {
            this.drawMenuMessage(`Game paused! Your score is ${this.score}!`);
        }

        if (this.skier.state === STATES.STATE_CRASHED) {
            this.drawMenuMessage(`You crashed! You can keep moving. Be aware of the obstacles!`, 0.2);
        }

        if (this.skier.state === STATES.STATE_DEAD) {
            this.drawMenuMessage(`Game over! Your score was ${this.score}!`, 0.5);
        }
    }

    /**
     * Update the game score based upon the skier's current state.
     */
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
}
