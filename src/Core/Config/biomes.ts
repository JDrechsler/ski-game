import { IMAGE_NAMES } from "../../Constants";
import { iBiome } from "../../Interfaces/iObstacleType";

export const BIOMES: iBiome[] = [
    {
        name: "Alpine Warmup",
        obstacleSpawnChance: 8,
        obstacleTypes: [
            { imageName: IMAGE_NAMES.TREE, weight: 30 },
            { imageName: IMAGE_NAMES.TREE_CLUSTER, weight: 25 },
            { imageName: IMAGE_NAMES.ROCK1, weight: 20 },
            { imageName: IMAGE_NAMES.ROCK2, weight: 15 },
            { imageName: IMAGE_NAMES.JUMP_RAMP, weight: 10 },
        ],
    },
    {
        name: "Rock Garden",
        obstacleSpawnChance: 6,
        obstacleTypes: [
            { imageName: IMAGE_NAMES.TREE, weight: 15 },
            { imageName: IMAGE_NAMES.TREE_CLUSTER, weight: 10 },
            { imageName: IMAGE_NAMES.ROCK1, weight: 30 },
            { imageName: IMAGE_NAMES.ROCK2, weight: 30 },
            { imageName: IMAGE_NAMES.JUMP_RAMP, weight: 15 },
        ],
    },
    {
        name: "Ramp Rush",
        obstacleSpawnChance: 5,
        obstacleTypes: [
            { imageName: IMAGE_NAMES.TREE, weight: 20 },
            { imageName: IMAGE_NAMES.TREE_CLUSTER, weight: 20 },
            { imageName: IMAGE_NAMES.ROCK1, weight: 15 },
            { imageName: IMAGE_NAMES.ROCK2, weight: 15 },
            { imageName: IMAGE_NAMES.JUMP_RAMP, weight: 30 },
        ],
    },
];

export function getBiomeForScore(score: number): iBiome {
    if (score > 10000) {
        return BIOMES[2];
    }

    if (score > 4000) {
        return BIOMES[1];
    }

    return BIOMES[0];
}
