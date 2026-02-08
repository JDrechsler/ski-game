import { GAME_HEIGHT, GAME_WIDTH } from "../../Constants";
import { Canvas } from "../../Core/Canvas";
import { ImageManager } from "../../Core/ImageManager";
import { Position, randomInt, Rect } from "../../Core/Utils";
import { Powerup, POWERUP_TYPES } from "./Powerup";

const NEW_POWERUP_CHANCE: number = 120;
const MAX_POWERUPS: number = 6;

const POWERUP_POOL: POWERUP_TYPES[] = [POWERUP_TYPES.BOOST, POWERUP_TYPES.RHINO_CHILL, POWERUP_TYPES.COMBO_BURST];

export class PowerupManager {
    powerups: Powerup[] = [];

    imageManager: ImageManager;

    canvas: Canvas;

    constructor(imageManager: ImageManager, canvas: Canvas) {
        this.imageManager = imageManager;
        this.canvas = canvas;
    }

    getPowerups(): Powerup[] {
        return this.powerups;
    }

    drawPowerups() {
        this.powerups.forEach((powerup: Powerup) => powerup.draw());
    }

    placeInitialPowerups() {
        const placementArea = new Rect(-GAME_WIDTH / 2, 50, GAME_WIDTH / 2, GAME_HEIGHT / 2);
        for (let i = 0; i < 2; i++) {
            this.placeRandomPowerup(placementArea);
        }
    }

    placeNewPowerup(gameWindow: Rect, previousGameWindow: Rect) {
        if (this.powerups.length >= MAX_POWERUPS) {
            return;
        }

        const shouldPlacePowerup = randomInt(1, NEW_POWERUP_CHANCE);
        if (shouldPlacePowerup !== NEW_POWERUP_CHANCE) {
            return;
        }

        if (gameWindow.top > previousGameWindow.top) {
            this.placeRandomPowerup(new Rect(gameWindow.left, gameWindow.bottom, gameWindow.right, gameWindow.bottom));
        }
    }

    removePowerup(powerup: Powerup) {
        this.powerups = this.powerups.filter((activePowerup: Powerup) => activePowerup !== powerup);
    }

    private placeRandomPowerup(placementArea: Rect) {
        const position = this.calculatePosition(placementArea);
        const randomType = POWERUP_POOL[randomInt(0, POWERUP_POOL.length - 1)];
        this.powerups.push(new Powerup(position.x, position.y, this.imageManager, this.canvas, randomType));
    }

    private calculatePosition(placementArea: Rect): Position {
        const placementX = randomInt(placementArea.left, placementArea.right);
        const placementY = randomInt(placementArea.top, placementArea.bottom);
        return new Position(placementX, placementY);
    }
}
