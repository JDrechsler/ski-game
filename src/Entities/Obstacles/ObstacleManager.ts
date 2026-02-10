/**
 * Manages all of the obstacles that exist in the game world. It sets the initial world up with a random placement of
 * obstacles, places new obstacles as the skier moves throughout the world and displays them all to the screen.
 * Supports biome-based difficulty scaling via configurable obstacle spawn chance.
 */

import { GAME_WIDTH, GAME_HEIGHT, BiomeConfig } from "../../Constants";
import { Canvas } from "../../Core/Canvas";
import { ImageManager } from "../../Core/ImageManager";
import { Position, randomInt, Rect } from "../../Core/Utils";
import { Obstacle } from "./Obstacle";

const DISTANCE_BETWEEN_OBSTACLES: number = 50;
const STARTING_OBSTACLE_GAP: number = 300;
const STARTING_OBSTACLE_REDUCER: number = 1000;

export class ObstacleManager {
    obstacles: Obstacle[] = [];
    imageManager: ImageManager;
    canvas: Canvas;
    obstacleChance: number = 8;

    constructor(imageManager: ImageManager, canvas: Canvas) {
        this.imageManager = imageManager;
        this.canvas = canvas;
    }

    setBiome(biome: BiomeConfig) {
        this.obstacleChance = biome.obstacleChance;
    }

    getObstacles(): Obstacle[] {
        return this.obstacles;
    }

    drawObstacles() {
        this.obstacles.forEach((obstacle: Obstacle) => {
            obstacle.draw();
        });
    }

    placeInitialObstacles() {
        const numberObstacles = Math.ceil(
            (GAME_WIDTH / STARTING_OBSTACLE_REDUCER) * (GAME_HEIGHT / STARTING_OBSTACLE_REDUCER)
        );

        const placementArea = new Rect(-GAME_WIDTH / 2, STARTING_OBSTACLE_GAP, GAME_WIDTH / 2, GAME_HEIGHT / 2);

        for (let i = 0; i < numberObstacles; i++) {
            this.placeRandomObstacle(placementArea);
        }

        this.obstacles.sort((obstacle1: Obstacle, obstacle2: Obstacle) => {
            return obstacle1.getPosition().y - obstacle2.getPosition().y;
        });
    }

    placeNewObstacle(gameWindow: Rect, previousGameWindow: Rect) {
        const shouldPlaceObstacle = randomInt(1, this.obstacleChance);
        if (shouldPlaceObstacle !== this.obstacleChance) {
            return;
        }

        if (gameWindow.left < previousGameWindow.left) {
            this.placeObstacleLeft(gameWindow);
        } else if (gameWindow.left > previousGameWindow.left) {
            this.placeObstacleRight(gameWindow);
        }

        if (gameWindow.top < previousGameWindow.top) {
            this.placeObstacleTop(gameWindow);
        } else if (gameWindow.top > previousGameWindow.top) {
            this.placeObstacleBottom(gameWindow);
        }
    }

    placeObstacleLeft(gameWindow: Rect) {
        const placementArea = new Rect(gameWindow.left, gameWindow.top, gameWindow.left, gameWindow.bottom);
        this.placeRandomObstacle(placementArea);
    }

    placeObstacleRight(gameWindow: Rect) {
        const placementArea = new Rect(gameWindow.right, gameWindow.top, gameWindow.right, gameWindow.bottom);
        this.placeRandomObstacle(placementArea);
    }

    placeObstacleTop(gameWindow: Rect) {
        const placementArea = new Rect(gameWindow.left, gameWindow.top, gameWindow.right, gameWindow.top);
        this.placeRandomObstacle(placementArea);
    }

    placeObstacleBottom(gameWindow: Rect) {
        const placementArea = new Rect(gameWindow.left, gameWindow.bottom, gameWindow.right, gameWindow.bottom);
        this.placeRandomObstacle(placementArea);
    }

    placeRandomObstacle(placementArea: Rect) {
        let position: Position | null;
        do {
            position = this.calculateOpenPosition(placementArea);
        } while (!position);

        const newObstacle = new Obstacle(position.x, position.y, this.imageManager, this.canvas);
        this.obstacles.push(newObstacle);
    }

    calculateOpenPosition(placementArea: Rect): Position | null {
        const placementX = randomInt(placementArea.left, placementArea.right);
        const placementY = randomInt(placementArea.top, placementArea.bottom);

        const foundCollision = this.obstacles.find((obstacle: Obstacle) => {
            const obstacleX = obstacle.getPosition().x;
            const obstacleY = obstacle.getPosition().y;

            return (
                placementX > obstacleX - DISTANCE_BETWEEN_OBSTACLES &&
                placementX < obstacleX + DISTANCE_BETWEEN_OBSTACLES &&
                placementY > obstacleY - DISTANCE_BETWEEN_OBSTACLES &&
                placementY < obstacleY + DISTANCE_BETWEEN_OBSTACLES
            );
        });

        if (foundCollision) {
            return null;
        } else {
            return new Position(placementX, placementY);
        }
    }

    reset() {
        this.obstacles = [];
    }
}
