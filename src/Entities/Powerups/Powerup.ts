import { IMAGE_NAMES } from "../../Constants";
import { Canvas } from "../../Core/Canvas";
import { ImageManager } from "../../Core/ImageManager";
import { Entity } from "../Entity";

export enum POWERUP_TYPES {
    BOOST = "boost",
    RHINO_CHILL = "rhinoChill",
    COMBO_BURST = "comboBurst",
}

const POWERUP_IMAGES: { [key in POWERUP_TYPES]: IMAGE_NAMES } = {
    [POWERUP_TYPES.BOOST]: IMAGE_NAMES.SKIER_JUMP5,
    [POWERUP_TYPES.RHINO_CHILL]: IMAGE_NAMES.RHINO_CELEBRATE1,
    [POWERUP_TYPES.COMBO_BURST]: IMAGE_NAMES.RHINO_EAT1,
};

export class Powerup extends Entity {
    imageName: IMAGE_NAMES;

    type: POWERUP_TYPES;

    constructor(x: number, y: number, imageManager: ImageManager, canvas: Canvas, type: POWERUP_TYPES) {
        super(x, y, imageManager, canvas);
        this.type = type;
        this.imageName = POWERUP_IMAGES[type];
    }

    die() {}
}
