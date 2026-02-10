import { iImage } from "./Interfaces/iImage";

export const GAME_CANVAS = "skiCanvas";
export const GAME_WIDTH = window.innerWidth;
export const GAME_HEIGHT = window.innerHeight;

export enum KEYS {
    LEFT = "ArrowLeft",
    RIGHT = "ArrowRight",
    UP = "ArrowUp",
    DOWN = "ArrowDown",
    SPACE = " ",
    P = "p",
    R = "r",
    ESC = "Escape",
}

export enum TOUCH {
    LEFT,
    RIGHT,
}

export enum TOUCH_STATES {
    START = "touchstart",
    END = "touchend",
}

export enum KEY_STATES {
    PRESS = "keydown",
    RELEASE = "keyup",
}

export enum GAME_STATES {
    MENU = "menu",
    PLAYING = "playing",
    PAUSED = "paused",
    GAME_OVER = "gameOver",
}

export enum IMAGE_NAMES {
    SKIER_CRASH = "skierCrash",
    SKIER_LEFT = "skierLeft",
    SKIER_LEFTDOWN = "skierLeftDown",
    SKIER_DOWN = "skierDown",
    SKIER_RIGHTDOWN = "skierRightDown",
    SKIER_RIGHT = "skierRight",
    SKIER_JUMP1 = "skierJump1",
    SKIER_JUMP2 = "skierJump2",
    SKIER_JUMP3 = "skierJump3",
    SKIER_JUMP4 = "skierJump4",
    SKIER_JUMP5 = "skierJump5",
    TREE = "tree",
    TREE_CLUSTER = "treeCluster",
    ROCK1 = "rock1",
    ROCK2 = "rock2",
    JUMP_RAMP = "jumpRamp",
    RHINO = "rhino",
    RHINO_RUN1 = "rhinoRun1",
    RHINO_RUN2 = "rhinoRun2",
    RHINO_EAT1 = "rhinoEat1",
    RHINO_EAT2 = "rhinoEat2",
    RHINO_EAT3 = "rhinoEat3",
    RHINO_EAT4 = "rhinoEat4",
    RHINO_CELEBRATE1 = "rhinoCelebrate1",
    RHINO_CELEBRATE2 = "rhinoCelebrate2",
    COLLECTIBLE_COIN = "collectibleCoin",
    COLLECTIBLE_STAR = "collectibleStar",
    COLLECTIBLE_GEM = "collectibleGem",
}

export const SKIER_JUMP_IMAGES = [
    IMAGE_NAMES.SKIER_JUMP1,
    IMAGE_NAMES.SKIER_JUMP2,
    IMAGE_NAMES.SKIER_JUMP3,
    IMAGE_NAMES.SKIER_JUMP4,
    IMAGE_NAMES.SKIER_JUMP5,
];

export const IMAGES: iImage[] = [
    { name: IMAGE_NAMES.SKIER_CRASH, url: "img/skier_crash.png" },
    { name: IMAGE_NAMES.SKIER_LEFT, url: "img/skier_left.png" },
    { name: IMAGE_NAMES.SKIER_LEFTDOWN, url: "img/skier_left_down.png" },
    { name: IMAGE_NAMES.SKIER_DOWN, url: "img/skier_down.png" },
    { name: IMAGE_NAMES.SKIER_RIGHTDOWN, url: "img/skier_right_down.png" },
    { name: IMAGE_NAMES.SKIER_RIGHT, url: "img/skier_right.png" },
    { name: IMAGE_NAMES.SKIER_JUMP1, url: "img/skier_jump_1.png" },
    { name: IMAGE_NAMES.SKIER_JUMP2, url: "img/skier_jump_2.png" },
    { name: IMAGE_NAMES.SKIER_JUMP3, url: "img/skier_jump_3.png" },
    { name: IMAGE_NAMES.SKIER_JUMP4, url: "img/skier_jump_4.png" },
    { name: IMAGE_NAMES.SKIER_JUMP5, url: "img/skier_jump_5.png" },
    { name: IMAGE_NAMES.TREE, url: "img/tree_1.png" },
    { name: IMAGE_NAMES.TREE_CLUSTER, url: "img/tree_cluster.png" },
    { name: IMAGE_NAMES.ROCK1, url: "img/rock_1.png" },
    { name: IMAGE_NAMES.ROCK2, url: "img/rock_2.png" },
    { name: IMAGE_NAMES.JUMP_RAMP, url: "img/jump_ramp.png" },
    { name: IMAGE_NAMES.RHINO, url: "img/rhino_default.png" },
    { name: IMAGE_NAMES.RHINO_RUN1, url: "img/rhino_run_left.png" },
    { name: IMAGE_NAMES.RHINO_RUN2, url: "img/rhino_run_left_2.png" },
    { name: IMAGE_NAMES.RHINO_EAT1, url: "img/rhino_eat_1.png" },
    { name: IMAGE_NAMES.RHINO_EAT2, url: "img/rhino_eat_2.png" },
    { name: IMAGE_NAMES.RHINO_EAT3, url: "img/rhino_eat_3.png" },
    { name: IMAGE_NAMES.RHINO_EAT4, url: "img/rhino_eat_4.png" },
    { name: IMAGE_NAMES.RHINO_CELEBRATE1, url: "img/rhino_celebrate_1.png" },
    { name: IMAGE_NAMES.RHINO_CELEBRATE2, url: "img/rhino_celebrate_2.png" },
];

export const ANIMATION_FRAME_SPEED_MS: number = 250;
export const DIAGONAL_SPEED_REDUCER: number = 1.4142;

export interface BiomeConfig {
    name: string;
    backgroundColor: string;
    gradientTop: string;
    gradientBottom: string;
    snowColor: string;
    snowOpacity: number;
    vignetteIntensity: number;
    trailColor: string;
    scoreThreshold: number;
    obstacleChance: number;
    collectibleChance: number;
    treeWeight: number;
    treeClusterWeight: number;
    rock1Weight: number;
    rock2Weight: number;
    rampWeight: number;
    coinWeight: number;
    starWeight: number;
    gemWeight: number;
    rhinoSpeedMultiplier: number;
}

export const BIOMES: BiomeConfig[] = [
    {
        name: "Summit",
        backgroundColor: "#f0f8ff",
        gradientTop: "#e8f4ff",
        gradientBottom: "#c8dff5",
        snowColor: "#ffffff",
        snowOpacity: 0.7,
        vignetteIntensity: 0.15,
        trailColor: "rgba(140, 170, 210, 0.35)",
        scoreThreshold: 0,
        obstacleChance: 20,
        collectibleChance: 8,
        treeWeight: 15,
        treeClusterWeight: 5,
        rock1Weight: 10,
        rock2Weight: 5,
        rampWeight: 20,
        coinWeight: 75,
        starWeight: 20,
        gemWeight: 5,
        rhinoSpeedMultiplier: 0.6,
    },
    {
        name: "Forest",
        backgroundColor: "#e8f5e9",
        gradientTop: "#d4edda",
        gradientBottom: "#a8d5b8",
        snowColor: "#e8ffe8",
        snowOpacity: 0.5,
        vignetteIntensity: 0.25,
        trailColor: "rgba(120, 160, 120, 0.3)",
        scoreThreshold: 3000,
        obstacleChance: 12,
        collectibleChance: 9,
        treeWeight: 30,
        treeClusterWeight: 20,
        rock1Weight: 15,
        rock2Weight: 10,
        rampWeight: 14,
        coinWeight: 50,
        starWeight: 35,
        gemWeight: 15,
        rhinoSpeedMultiplier: 0.9,
    },
    {
        name: "Ice Cave",
        backgroundColor: "#e1f5fe",
        gradientTop: "#d0ecf9",
        gradientBottom: "#9ac8e8",
        snowColor: "#d4eaff",
        snowOpacity: 0.9,
        vignetteIntensity: 0.3,
        trailColor: "rgba(100, 180, 220, 0.35)",
        scoreThreshold: 8000,
        obstacleChance: 8,
        collectibleChance: 10,
        treeWeight: 15,
        treeClusterWeight: 10,
        rock1Weight: 28,
        rock2Weight: 22,
        rampWeight: 10,
        coinWeight: 30,
        starWeight: 40,
        gemWeight: 30,
        rhinoSpeedMultiplier: 1.1,
    },
    {
        name: "Night",
        backgroundColor: "#1a1a2e",
        gradientTop: "#1a1a2e",
        gradientBottom: "#0d0d1a",
        snowColor: "#4466aa",
        snowOpacity: 0.3,
        vignetteIntensity: 0.45,
        trailColor: "rgba(80, 100, 160, 0.25)",
        scoreThreshold: 15000,
        obstacleChance: 6,
        collectibleChance: 11,
        treeWeight: 25,
        treeClusterWeight: 20,
        rock1Weight: 20,
        rock2Weight: 15,
        rampWeight: 8,
        coinWeight: 20,
        starWeight: 30,
        gemWeight: 50,
        rhinoSpeedMultiplier: 1.4,
    },
];

export const RHINO_SPAWN_SCORE: number = 2500;

export enum COLLECTIBLE_TYPE {
    COIN = "coin",
    STAR = "star",
    GEM = "gem",
}

export interface CollectibleConfig {
    type: COLLECTIBLE_TYPE;
    imageName: IMAGE_NAMES;
    points: number;
    color: string;
    glowColor: string;
    size: number;
}

export const COLLECTIBLE_CONFIGS: { [key in COLLECTIBLE_TYPE]: CollectibleConfig } = {
    [COLLECTIBLE_TYPE.COIN]: {
        type: COLLECTIBLE_TYPE.COIN,
        imageName: IMAGE_NAMES.COLLECTIBLE_COIN,
        points: 50,
        color: "#FFD700",
        glowColor: "#FFF8DC",
        size: 10,
    },
    [COLLECTIBLE_TYPE.STAR]: {
        type: COLLECTIBLE_TYPE.STAR,
        imageName: IMAGE_NAMES.COLLECTIBLE_STAR,
        points: 200,
        color: "#FF8C00",
        glowColor: "#FFDAB9",
        size: 12,
    },
    [COLLECTIBLE_TYPE.GEM]: {
        type: COLLECTIBLE_TYPE.GEM,
        imageName: IMAGE_NAMES.COLLECTIBLE_GEM,
        points: 500,
        color: "#9C27B0",
        glowColor: "#E1BEE7",
        size: 11,
    },
};
