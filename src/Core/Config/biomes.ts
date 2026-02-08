import { IMAGE_NAMES } from "../../Constants";
import { iBiome } from "../../Interfaces/iObstacleType";

export const BIOMES: iBiome[] = [
    {
        name: "Alpine Warmup",
        obstacleSpawnChance: 12,
        obstacleTypes: [
            { imageName: IMAGE_NAMES.TREE, weight: 18 },
            { imageName: IMAGE_NAMES.TREE_CLUSTER, weight: 14 },
            { imageName: IMAGE_NAMES.ROCK1, weight: 28 },
            { imageName: IMAGE_NAMES.ROCK2, weight: 22 },
            { imageName: IMAGE_NAMES.JUMP_RAMP, weight: 18 },
        ],
    },
    {
        name: "Rock Garden",
        obstacleSpawnChance: 9,
        obstacleTypes: [
            { imageName: IMAGE_NAMES.TREE, weight: 18 },
            { imageName: IMAGE_NAMES.TREE_CLUSTER, weight: 14 },
            { imageName: IMAGE_NAMES.ROCK1, weight: 28 },
            { imageName: IMAGE_NAMES.ROCK2, weight: 26 },
            { imageName: IMAGE_NAMES.JUMP_RAMP, weight: 14 },
        ],
    },
    {
        name: "Ramp Rush",
        obstacleSpawnChance: 7,
        obstacleTypes: [
            { imageName: IMAGE_NAMES.TREE, weight: 24 },
            { imageName: IMAGE_NAMES.TREE_CLUSTER, weight: 24 },
            { imageName: IMAGE_NAMES.ROCK1, weight: 18 },
            { imageName: IMAGE_NAMES.ROCK2, weight: 16 },
            { imageName: IMAGE_NAMES.JUMP_RAMP, weight: 18 },
        ],
    },
];

export function getBiomeForScore(score: number): iBiome {
    if (score > 45000) {
        return BIOMES[2];
    }

    if (score > 15000) {
        return BIOMES[1];
    }

    return BIOMES[0];
}
