/**
 * An obstacle that appears on the mountain. Randomly created as one of the types defined in the OBSTACLE_TYPES array.
 */

import { IMAGE_NAMES } from "../../Constants";
import { Canvas } from "../../Core/Canvas";
import { ImageManager } from "../../Core/ImageManager";
import { iObstacleType } from "../../Interfaces/iObstacleType";
import { Entity } from "../Entity";

/**
 * The different types of obstacles that can be placed in the game.
 */
const OBSTACLE_TYPES: iObstacleType[] = [
    { imageName: IMAGE_NAMES.TREE, weight: 30 },
    { imageName: IMAGE_NAMES.TREE_CLUSTER, weight: 30 },
    { imageName: IMAGE_NAMES.ROCK1, weight: 20 },
    { imageName: IMAGE_NAMES.ROCK2, weight: 10 },
    { imageName: IMAGE_NAMES.JUMP_RAMP, weight: 10 },
];

export class Obstacle extends Entity {
    /**
     * The name of the current image being displayed for the obstacle.
     */
    imageName: IMAGE_NAMES;

    /**
     * The weight / chance of the current image being displayed for the obstacle.
     */
    weight: number = 0;

    /**
     * Initialize an obstacle and make it a random type.
     */
    constructor(x: number, y: number, imageManager: ImageManager, canvas: Canvas) {
        super(x, y, imageManager, canvas);

        const typeIdx = this.getRandomObstacleType();
        this.imageName = OBSTACLE_TYPES[typeIdx].imageName;
    }

    /**
     * Determines a random obstacle type using the obstacle weight.
     */
    getRandomObstacleType(): number {
        let totalWeight = 0;
        const weights = OBSTACLE_TYPES.map((type) => {
            const weight = type.weight;
            totalWeight += weight;
            return weight;
        });

        let randomNum = Math.random() * totalWeight;
        for (let i = 0; i < weights.length; i++) {
            if (randomNum < weights[i]) {
                return i;
            }
            randomNum -= weights[i];
        }

        return OBSTACLE_TYPES.length - 1; // default to the last type if no match
    }

    /**
     * Obstacles can't be destroyed
     */
    die() {}
}
