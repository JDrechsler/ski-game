/**
 * The main game class. This initializes the game as well as runs the game/render loop and initial handling of input.
 */

import {
  GAME_CANVAS,
  GAME_WIDTH,
  GAME_HEIGHT,
  IMAGES,
  KEYS,
  KEY_STATES,
} from "../Constants";
import { Canvas } from "./Canvas";
import { ImageManager } from "./ImageManager";
import { intersectTwoRects, Position, Rect } from "./Utils";
import { ObstacleManager } from "../Entities/Obstacles/ObstacleManager";
import { Rhino } from "../Entities/Rhino";
import { STATES, Skier } from "../Entities/Skier";
import { getBiomeForScore } from "./Config/biomes";
import { iBiome } from "../Interfaces/iObstacleType";
import { PowerupManager } from "../Entities/Powerups/PowerupManager";
import { POWERUP_TYPES } from "../Entities/Powerups/Powerup";

export class Game {
  private static readonly MIN_ZOOM = 1;

  private static readonly MAX_ZOOM = 1.8;

  private static readonly ZOOM_STEP = 0.2;

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

  private powerupManager!: PowerupManager;

  private paused: boolean;

  private score: number;

  private activeBiome!: iBiome;

  private activeEventName: string = "";

  private eventEndsAt: number = 0;

  private nextEventAt: number = 0;

  private boostEndsAt: number = 0;

  private zoomLevel: number = 1.4;

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
    this.setupZoomControls();
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
    this.powerupManager = new PowerupManager(this.imageManager, this.canvas);

    this.skier = new Skier(
      0,
      0,
      this.imageManager,
      this.obstacleManager,
      this.canvas
    );
    this.rhino = new Rhino(-500, -2000, this.imageManager, this.canvas);

    this.calculateGameWindow();
    this.obstacleManager.placeInitialObstacles();
    this.powerupManager.placeInitialPowerups();
    this.activeBiome = getBiomeForScore(0);
    this.obstacleManager.setBiome(this.activeBiome);
    this.nextEventAt = Date.now() + 12000;
    this.applyZoomSettings();
  }

  setupZoomControls() {
    const zoomInButton = document.getElementById("zoomIn");
    const zoomOutButton = document.getElementById("zoomOut");

    zoomInButton?.addEventListener("click", () => {
      this.adjustZoom(Game.ZOOM_STEP);
    });

    zoomOutButton?.addEventListener("click", () => {
      this.adjustZoom(-Game.ZOOM_STEP);
    });
  }

  adjustZoom(delta: number) {
    const newZoom = Math.max(
      Game.MIN_ZOOM,
      Math.min(Game.MAX_ZOOM, this.zoomLevel + delta)
    );

    if (newZoom === this.zoomLevel) {
      return;
    }

    this.zoomLevel = newZoom;
    this.applyZoomSettings();
  }

  applyZoomSettings() {
    this.canvas.setZoom(this.zoomLevel);

    const movementScale = 1 / this.zoomLevel;
    this.skier.setMovementScale(movementScale);
    this.rhino.setMovementScale(movementScale);
  }

  /**
   * Setup listeners for any input events we might need.
   */
  setupInputHandling() {
    document.addEventListener("keydown", (e) => {
      this.handleKeyEvents(e, KEY_STATES.PRESS);
    });

    document.addEventListener("keyup", (e) => {
      this.handleKeyEvents(e, KEY_STATES.RELEASE);
    });

    document.addEventListener("touchstart", (e) => {
      const touchX = e.touches[0].clientX;
      const touchSide = touchX < window.innerWidth / 2 ? "left" : "right";
      this.handleKeyEvents(
        new KeyboardEvent("keydown", {
          key: touchSide === "left" ? KEYS.LEFT : KEYS.RIGHT,
        }),
        KEY_STATES.PRESS
      );
    });

    document.addEventListener("touchend", () => {
      this.handleKeyEvents(
        new KeyboardEvent("keyup", {
          key: KEYS.LEFT,
        }),
        KEY_STATES.RELEASE
      );
    });

    document.oncontextmenu = function () {
      return false;
    };
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
    this.powerupManager.placeNewPowerup(this.gameWindow, previousGameWindow);
    this.collectPowerups();

    this.updateBiome();
    this.updateEventState();
    this.updateBoost();

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
    this.powerupManager.drawPowerups();

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
  handleKeyEvents(keyEvent: KeyboardEvent, keyState: KEY_STATES) {
    if (this.skier.isDead() || this.skier.isInAir()) {
      return;
    }
    if (keyState === KEY_STATES.PRESS) {
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
        case KEYS.P:
        case KEYS.ESC:
          this.paused ? this.resume() : this.pause();
          break;
        default:
          break;
      }
    }

    if (keyState === KEY_STATES.RELEASE) {
      switch (keyEvent.key) {
        case KEYS.LEFT:
          this.skier.turnDown();
          break;
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
  drawMenuMessage(
    message: string,
    menuOpacity: number = 0.5,
    ctx: CanvasRenderingContext2D = this.canvas.ctx
  ) {
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
    ctx.fillText(`Zoom: ${this.zoomLevel.toFixed(1)}x`, 10, 155);

    ctx.fillText(`Combo x${this.skier.getComboMultiplier()}`, 10, 55);
    if (this.skier.getComboRemainingMs() > 0) {
      ctx.fillText(`Combo timer: ${(this.skier.getComboRemainingMs() / 1000).toFixed(1)}s`, 10, 80);
    }

    ctx.fillText(`Biome: ${this.activeBiome.name}`, 10, 105);

    if (this.activeEventName) {
      ctx.fillText(`Event: ${this.activeEventName}`, 10, 130);
    }
  }

  /**
   * Draw any menu messages that need to be displayed.
   */
  drawMenuMessages() {
    if (this.paused) {
      this.drawMenuMessage(`Game paused! Your score is ${this.score}!`);
    }

    if (this.skier.state === STATES.STATE_CRASHED) {
      this.drawMenuMessage(
        `You crashed! You can keep moving. Be aware of the obstacles!`,
        0.2
      );
    }

    if (this.skier.state === STATES.STATE_DEAD) {
      this.drawMenuMessage(`Game over! Your score was ${this.score}!`, 0.5);
    }
  }

  /**
   * Update the game score based upon the skier's current state.
   */
  updateGameScore() {
    const comboMultiplier = this.skier.getComboMultiplier();

    switch (this.skier.state) {
      case STATES.STATE_SKIING:
        this.score += Math.floor(1 * comboMultiplier);
        break;
      case STATES.STATE_JUMPING:
        this.score += Math.floor(10 * comboMultiplier);
        break;
      case STATES.STATE_FLIPPING:
        this.score += Math.floor(100 * comboMultiplier);
        break;
      default:
        break;
    }
  }

  updateBiome() {
    const biome = getBiomeForScore(this.score);
    if (biome.name !== this.activeBiome.name) {
      this.activeBiome = biome;
      this.obstacleManager.setBiome(biome);
    }
  }

  updateEventState() {
    if (this.eventEndsAt > 0 && Date.now() >= this.eventEndsAt) {
      this.activeEventName = "";
      this.eventEndsAt = 0;
      this.obstacleManager.setSpawnChanceModifier(0);
      this.rhino.setSpeedMultiplier(1);
    }

    if (this.eventEndsAt === 0 && Date.now() >= this.nextEventAt) {
      const isFrenzy = Math.random() > 0.5;
      if (isFrenzy) {
        this.activeEventName = "Rhino Frenzy";
        this.rhino.setSpeedMultiplier(1.5);
      } else {
        this.activeEventName = "Dense Forest";
        this.obstacleManager.setSpawnChanceModifier(-2);
      }

      this.eventEndsAt = Date.now() + 6000;
      this.nextEventAt = Date.now() + 18000;
    }
  }

  updateBoost() {
    if (this.boostEndsAt > 0 && Date.now() >= this.boostEndsAt) {
      this.boostEndsAt = 0;
    }
  }

  collectPowerups() {
    const skierBounds = this.skier.getBounds();
    if (!skierBounds) {
      return;
    }

    this.powerupManager.getPowerups().forEach((powerup) => {
      const powerupBounds = powerup.getBounds();
      if (!powerupBounds) {
        return;
      }

      if (intersectTwoRects(skierBounds, powerupBounds)) {
        this.applyPowerup(powerup.type);
        this.powerupManager.removePowerup(powerup);
      }
    });
  }

  applyPowerup(powerupType: POWERUP_TYPES) {
    switch (powerupType) {
      case POWERUP_TYPES.BOOST:
        this.skier.increaseSpeedBy(2);
        this.boostEndsAt = Date.now() + 3000;
        break;
      case POWERUP_TYPES.RHINO_CHILL:
        this.rhino.setSpeedMultiplier(0.6, 3500);
        break;
      case POWERUP_TYPES.COMBO_BURST:
        this.skier.addCombo(2);
        break;
      default:
        break;
    }
  }
}
