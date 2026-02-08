import { IMAGE_NAMES } from "../Constants";

export interface iObstacleType {
    imageName: IMAGE_NAMES;
    weight: number;
}

export interface iBiome {
    name: string;
    obstacleTypes: iObstacleType[];
    obstacleSpawnChance: number;
}
