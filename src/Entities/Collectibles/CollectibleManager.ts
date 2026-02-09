/**
 * Manages all collectible items in the game world. Spawns collectibles as the player moves,
 * checks for collection by the skier, and removes collected items.
 */

import { GAME_WIDTH, GAME_HEIGHT, COLLECTIBLE_TYPE, BiomeConfig } from "../../Constants";
import { Canvas } from "../../Core/Canvas";
import { ImageManager } from "../../Core/ImageManager";
import { Position, randomInt, Rect, intersectTwoRects } from "../../Core/Utils";
import { Collectible } from "./Collectible";

const DISTANCE_BETWEEN_COLLECTIBLES: number = 80;
const STARTING_COLLECTIBLE_GAP: number = 150;

export class CollectibleManager {
    collectibles: Collectible[] = [];
    imageManager: ImageManager;
    canvas: Canvas;
    collectibleChance: number = 10;

    constructor(imageManager: ImageManager, canvas: Canvas) {
        this.imageManager = imageManager;
        this.canvas = canvas;
    }

    setBiome(biome: BiomeConfig) {
        this.collectibleChance = biome.collectibleChance;
    }

    getRandomType(biome: BiomeConfig): COLLECTIBLE_TYPE {
        const totalWeight = biome.coinWeight + biome.starWeight + biome.gemWeight;
        let random = Math.random() * totalWeight;

        if (random < biome.coinWeight) return COLLECTIBLE_TYPE.COIN;
        random -= biome.coinWeight;
        if (random < biome.starWeight) return COLLECTIBLE_TYPE.STAR;
        return COLLECTIBLE_TYPE.GEM;
    }

    placeInitialCollectibles(biome: BiomeConfig) {
        const numCollectibles = Math.ceil((GAME_WIDTH / 400) * (GAME_HEIGHT / 400));
        const placementArea = new Rect(-GAME_WIDTH / 2, STARTING_COLLECTIBLE_GAP, GAME_WIDTH / 2, GAME_HEIGHT / 2);

        for (let i = 0; i < numCollectibles; i++) {
            this.placeRandomCollectible(placementArea, biome);
        }
    }

    placeNewCollectible(gameWindow: Rect, previousGameWindow: Rect, biome: BiomeConfig) {
        const shouldPlace = randomInt(1, this.collectibleChance);
        if (shouldPlace !== this.collectibleChance) {
            return;
        }

        if (gameWindow.left < previousGameWindow.left) {
            this.placeRandomCollectible(
                new Rect(gameWindow.left, gameWindow.top, gameWindow.left, gameWindow.bottom),
                biome
            );
        } else if (gameWindow.left > previousGameWindow.left) {
            this.placeRandomCollectible(
                new Rect(gameWindow.right, gameWindow.top, gameWindow.right, gameWindow.bottom),
                biome
            );
        }

        if (gameWindow.top < previousGameWindow.top) {
            this.placeRandomCollectible(
                new Rect(gameWindow.left, gameWindow.top, gameWindow.right, gameWindow.top),
                biome
            );
        } else if (gameWindow.top > previousGameWindow.top) {
            this.placeRandomCollectible(
                new Rect(gameWindow.left, gameWindow.bottom, gameWindow.right, gameWindow.bottom),
                biome
            );
        }
    }

    private placeRandomCollectible(area: Rect, biome: BiomeConfig) {
        const position = this.calculateOpenPosition(area);
        if (!position) return;

        const type = this.getRandomType(biome);
        const collectible = new Collectible(position.x, position.y, type, this.imageManager, this.canvas);
        this.collectibles.push(collectible);
    }

    private calculateOpenPosition(area: Rect): Position | null {
        const x = randomInt(area.left, area.right);
        const y = randomInt(area.top, area.bottom);

        const tooClose = this.collectibles.find((c) => {
            const cx = c.getPosition().x;
            const cy = c.getPosition().y;
            return (
                x > cx - DISTANCE_BETWEEN_COLLECTIBLES &&
                x < cx + DISTANCE_BETWEEN_COLLECTIBLES &&
                y > cy - DISTANCE_BETWEEN_COLLECTIBLES &&
                y < cy + DISTANCE_BETWEEN_COLLECTIBLES
            );
        });

        return tooClose ? null : new Position(x, y);
    }

    checkCollection(skierBounds: Rect | null): number {
        if (!skierBounds) return 0;

        let points = 0;

        this.collectibles.forEach((collectible) => {
            if (collectible.isCollected()) return;

            const bounds = collectible.getBounds();
            if (!bounds) return;

            if (intersectTwoRects(skierBounds, bounds)) {
                collectible.collect();
                points += collectible.getPoints();
            }
        });

        this.collectibles = this.collectibles.filter((c) => !c.isCollected());

        return points;
    }

    drawCollectibles() {
        this.collectibles.forEach((collectible) => {
            collectible.draw();
        });
    }

    reset() {
        this.collectibles = [];
    }
}
