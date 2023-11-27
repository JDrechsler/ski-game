/**
 * The skier is the entity controlled by the player in the game. The skier skis down the hill, can move at different
 * angles, and crashes into obstacles they run into. If caught by the rhino, the skier will get eaten and die.
 */

import { IMAGE_NAMES, DIAGONAL_SPEED_REDUCER, KEYS, ANIMATION_FRAME_SPEED_MS, IMAGES } from "../Constants";
import { Entity } from "./Entity";
import { Canvas } from "../Core/Canvas";
import { ImageManager } from "../Core/ImageManager";
import { intersectTwoRects, Rect } from "../Core/Utils";
import { ObstacleManager } from "./Obstacles/ObstacleManager";
import { Obstacle } from "./Obstacles/Obstacle";
import { Animation } from "../Core/Animation";

/**
 * The skier starts running at this speed. Saved in case speed needs to be reset at any point.
 */
const STARTING_SPEED: number = 4;

/**
 * The skier jumps for this amount of time in ms before returning to skiing.
 */
const JUMPING_TIME: number = 500;

/**
 * The skier's max speed.
 */
const MAX_SPEED: number = 20;

/**
 * The skier's speed increment. With every jump over a ramp the skier's speed increases by this amount.
 */
const SPEED_INCREMENT: number = 0.5;

/**
 * The different states the skier can be in.
 */
export enum STATES {
    STATE_SKIING = "skiing",
    STATE_JUMPING = "jumping",
    STATE_FLIPPING = "flipping",
    STATE_CRASHED = "crashed",
    STATE_DEAD = "dead",
}

/**
 * Sequences of images that comprise the animations for the different jump states of the skier.
 */
const IMAGES_FLIP: IMAGE_NAMES[] = [
    IMAGE_NAMES.SKIER_JUMP1,
    IMAGE_NAMES.SKIER_JUMP2,
    IMAGE_NAMES.SKIER_JUMP3,
    IMAGE_NAMES.SKIER_JUMP4,
    IMAGE_NAMES.SKIER_JUMP5,
];

/**
 * The different directions the skier can be facing.
 */
const DIRECTION_LEFT: number = 0;
const DIRECTION_LEFT_DOWN: number = 1;
const DIRECTION_DOWN: number = 2;
const DIRECTION_RIGHT_DOWN: number = 3;
const DIRECTION_RIGHT: number = 4;

/**
 * The different jump directions the skier can be facing.
 */
const JUMP_DIRECTION1: number = 0;
const JUMP_DIRECTION2: number = 1;
const JUMP_DIRECTION3: number = 2;
const JUMP_DIRECTION4: number = 3;
const JUMP_DIRECTION5: number = 4;

/**
 * Mapping of the image to display for the skier based upon which direction they're facing.
 */
const DIRECTION_IMAGES: { [key: number]: IMAGE_NAMES } = {
    [DIRECTION_LEFT]: IMAGE_NAMES.SKIER_LEFT,
    [DIRECTION_LEFT_DOWN]: IMAGE_NAMES.SKIER_LEFTDOWN,
    [DIRECTION_DOWN]: IMAGE_NAMES.SKIER_DOWN,
    [DIRECTION_RIGHT_DOWN]: IMAGE_NAMES.SKIER_RIGHTDOWN,
    [DIRECTION_RIGHT]: IMAGE_NAMES.SKIER_RIGHT,
};

/**
 * Mapping of the image to display for the skier based upon which jump direction they're facing.
 */
const JUMP_DIRECTION_IMAGES: { [key: number]: IMAGE_NAMES } = {
    [JUMP_DIRECTION1]: IMAGE_NAMES.SKIER_JUMP1,
    [JUMP_DIRECTION2]: IMAGE_NAMES.SKIER_JUMP2,
    [JUMP_DIRECTION3]: IMAGE_NAMES.SKIER_JUMP3,
    [JUMP_DIRECTION4]: IMAGE_NAMES.SKIER_JUMP4,
    [JUMP_DIRECTION5]: IMAGE_NAMES.SKIER_JUMP5,
};

export class Skier extends Entity {
    /**
     * The name of the current image being displayed for the skier.
     */
    imageName: IMAGE_NAMES = IMAGE_NAMES.SKIER_DOWN;

    /**
     * What state the skier is currently in.
     */
    state: STATES = STATES.STATE_SKIING;

    /**
     * What direction the skier is currently facing.
     */
    direction: number = DIRECTION_DOWN;

    /**
     * What jump direction the skier is currently facing.
     */
    jumpDirection: number = DIRECTION_DOWN;

    /**
     * How fast the skier is currently moving in the game world.
     */
    speed: number = STARTING_SPEED;

    /**
     * Stores all of the animations available for the different states of the skier.
     */
    animations: { [key: string]: Animation } = {};

    /**
     * The animation that the skier is currently using. Typically matches the state the skier is in.
     */
    curAnimation: Animation | null = null;

    /**
     * The current frame of the current animation the skier is on.
     */
    curAnimationFrame: number = 0;

    /**
     * The time in ms of the last frame change. Used to provide a consistent framerate.
     */
    curAnimationFrameTime: number = Date.now();

    /**
     * Stored reference to the ObstacleManager
     */
    obstacleManager: ObstacleManager;

    /**
     * Init the skier.
     */
    constructor(x: number, y: number, imageManager: ImageManager, obstacleManager: ObstacleManager, canvas: Canvas) {
        super(x, y, imageManager, canvas);

        this.obstacleManager = obstacleManager;
        this.setupAnimations();
        this.setAnimation();
    }

    /**
     * Create and store the animations.
     */
    setupAnimations() {
        this.animations[STATES.STATE_FLIPPING] = new Animation(IMAGES_FLIP, false, this.ski.bind(this, DIRECTION_DOWN));
    }

    /**
     * Reset the current animation to null.
     */
    resetCurrentAnimation() {
        this.curAnimation = null;
        this.curAnimationFrame = 0;
        this.curAnimationFrameTime = Date.now();
    }

    /**
     * Set the state and then set a new current animation based upon that state.
     */
    setState(newState: STATES) {
        this.state = newState;
        this.setAnimation();
    }

    /**
     * Is the skier currently in the crashed state
     */
    isCrashed(): boolean {
        return this.state === STATES.STATE_CRASHED;
    }

    /**
     * Is the skier currently in the skiing state
     */
    isSkiing(): boolean {
        return this.state === STATES.STATE_SKIING;
    }

    /**
     * Is the skier currently in the jumping state
     */
    isJumping(): boolean {
        return this.state === STATES.STATE_JUMPING;
    }

    /**
     * Is the skier currently in the air
     */
    isInAir(): boolean {
        return this.state === STATES.STATE_JUMPING || this.state === STATES.STATE_FLIPPING;
    }

    /**
     * Is the skier currently in the dead state
     */
    isDead(): boolean {
        return this.state === STATES.STATE_DEAD;
    }

    /**
     * Set the current direction the skier is facing and update the image accordingly
     */
    setDirection(direction: number) {
        this.direction = direction;
        this.setDirectionalImage();
    }

    /**
     * Set the skier's image based upon the direction they're facing.
     */
    setDirectionalImage() {
        this.imageName = DIRECTION_IMAGES[this.direction];
    }

    /**
     * Set the current jump direction the skier is facing and update the image accordingly
     */
    setJumpDirection(jumpDirection: number) {
        this.jumpDirection = jumpDirection;
        this.setDirectionalJumpImage();
    }

    /**
     * Set the skier's image based upon the direction they're facing.
     */
    setDirectionalJumpImage() {
        this.imageName = JUMP_DIRECTION_IMAGES[this.jumpDirection];
    }

    /**
     * Move the skier and check to see if they've hit an obstacle if the skier is not dead.
     */
    update(gameTime: number) {
        if (this.isDead()) {
            return;
        }
        this.move();
        this.checkIfHitObstacle();
        this.animate(gameTime);
    }

    /**
     * Draw the skier if they aren't dead
     */
    draw() {
        if (this.isDead()) {
            return;
        }

        super.draw();
    }

    /**
     * Move the skier based upon the direction they're currently facing. This handles frame update movement.
     */
    move() {
        switch (this.direction) {
            case DIRECTION_LEFT_DOWN:
                this.moveSkierLeftDown();
                break;
            case DIRECTION_DOWN:
                this.moveSkierDown();
                break;
            case DIRECTION_RIGHT_DOWN:
                this.moveSkierRightDown();
                break;
            case DIRECTION_LEFT:
            case DIRECTION_RIGHT:
                // Specifically calling out that we don't move the skier each frame if they're facing completely horizontal.
                break;
        }
    }

    /**
     * Move the skier left. Since completely horizontal movement isn't frame based, just move incrementally based upon
     * the starting speed.
     */
    moveSkierLeft() {
        this.position.x -= STARTING_SPEED;
    }

    /**
     * Move the skier diagonally left in equal amounts down and to the left. Use the current speed, reduced by the scale
     * of a right triangle hypotenuse to ensure consistent traveling speed at an angle.
     */
    moveSkierLeftDown() {
        this.position.x -= this.speed / DIAGONAL_SPEED_REDUCER;
        this.position.y += this.speed / DIAGONAL_SPEED_REDUCER;
    }

    /**
     * Move the skier down at the speed they're traveling.
     */
    moveSkierDown() {
        this.position.y += this.speed;
    }

    /**
     * Move the skier diagonally right in equal amounts down and to the right. Use the current speed, reduced by the scale
     * of a right triangle hypotenuse to ensure consistent traveling speed at an angle.
     */
    moveSkierRightDown() {
        this.position.x += this.speed / DIAGONAL_SPEED_REDUCER;
        this.position.y += this.speed / DIAGONAL_SPEED_REDUCER;
    }

    /**
     * Move the skier right. Since completely horizontal movement isn't frame based, just move incrementally based upon
     * the starting speed.
     */
    moveSkierRight() {
        this.position.x += STARTING_SPEED;
    }

    /**
     * Move the skier up. Since moving up isn't frame based, just move incrementally based upon
     * the starting speed.
     */
    moveSkierUp() {
        this.position.y -= STARTING_SPEED;
    }

    /**
     * Handle keyboard input. If the skier is jumping or dead, don't handle any input.
     */
    handleInput(inputKey: string) {
        if (this.isDead() || this.isInAir()) {
            return false;
        }

        let handled: boolean = true;

        switch (inputKey) {
            case KEYS.LEFT:
                this.turnLeft();
                break;
            case KEYS.RIGHT:
                this.turnRight();
                break;
            case KEYS.UP:
                this.turnUp();
                break;
            case KEYS.DOWN:
                this.turnDown();
                break;
            case KEYS.SPACE:
                this.jump();
            default:
                handled = false;
        }

        return handled;
    }

    /**
     * Turn the skier left. If they're already completely facing left, move them left. Otherwise, change their direction
     * one step left. If they're in the crashed state, then first recover them from the crash.
     */
    turnLeft() {
        if (this.isCrashed()) {
            this.ski(DIRECTION_LEFT, STARTING_SPEED);
        }

        if (this.direction === DIRECTION_LEFT) {
            this.moveSkierLeft();
        } else {
            this.setDirection(this.direction - 1);
        }
    }

    /**
     * Turn the skier right. If they're already completely facing right, move them right. Otherwise, change their direction
     * one step right. If they're in the crashed state, then first recover them from the crash.
     */
    turnRight() {
        if (this.isCrashed()) {
            this.ski(DIRECTION_RIGHT, STARTING_SPEED);
        }

        if (this.direction === DIRECTION_RIGHT) {
            this.moveSkierRight();
        } else {
            this.setDirection(this.direction + 1);
        }
    }

    /**
     * Turn the skier up which basically means if they're facing left or right, then move them up a bit in the game world.
     * If they're in the crashed state, do nothing as you can't move up if you're crashed.
     */
    turnUp() {
        if (this.isCrashed()) {
            return;
        }

        if (this.direction === DIRECTION_LEFT || this.direction === DIRECTION_RIGHT) {
            this.moveSkierUp();
        }
    }

    /**
     * Turn the skier to face straight down. If they're crashed don't do anything to require them to move left or right
     * to escape an obstacle before skiing down again.
     */
    turnDown() {
        if (this.isCrashed()) {
            return;
        }

        this.setDirection(DIRECTION_DOWN);
    }

    /**
     * Let the skier jump. If they're crashed don't do anything to require them to move left or right
     * to escape an obstacle before skiing down again. If they're already jumping, don't let them jump again.
     */
    jump() {
        if (this.isCrashed() && this.isJumping()) {
            return;
        }

        this.state = STATES.STATE_JUMPING;
        this.setJumpDirection(JUMP_DIRECTION1);

        setTimeout(() => {
            this.ski(DIRECTION_DOWN);
        }, JUMPING_TIME);
    }

    /**
     * Let the skier do a flip in the air.
     */
    flip() {
        if (this.isCrashed()) {
            return;
        }
        this.setState(STATES.STATE_FLIPPING);
    }

    /**
     * The skier has a bit different bounds calculating than a normal entity to make the collision with obstacles more
     * natural. We want te skier to end up in the obstacle rather than right above it when crashed, so move the bottom
     * boundary up.
     */
    getBounds(): Rect | null {
        const image = this.imageManager.getImage(this.imageName);
        if (!image) {
            return null;
        }

        return new Rect(
            this.position.x - image.width / 2,
            this.position.y - image.height / 2,
            this.position.x + image.width / 2,
            this.position.y - image.height / 4
        );
    }

    /**
     * Go through all the obstacles in the game and see if the skier collides with any of them.
     * If the skier colides with an obstacle while skiing make the skier crash.
     * If the skier is jumping make the skier crash if he colides with a tree art type.
     */
    checkIfHitObstacle() {
        const skierBounds = this.getBounds();
        if (!skierBounds) {
            return;
        }

        const collision = this.obstacleManager.getObstacles().find((obstacle: Obstacle): boolean => {
            const obstacleBounds = obstacle.getBounds();
            if (!obstacleBounds) {
                return false;
            }

            return intersectTwoRects(skierBounds, obstacleBounds);
        });

        if (collision) {
            if (this.state === STATES.STATE_SKIING) {
                if (collision.imageName === IMAGE_NAMES.JUMP_RAMP) {
                    this.flip();
                    this.increaseSpeed();
                } else {
                    this.crash();
                }
            }
            if (this.isInAir()) {
                if (collision.imageName === IMAGE_NAMES.TREE || collision.imageName === IMAGE_NAMES.TREE_CLUSTER) {
                    this.crash();
                }
            }
        }
    }

    /**
     * Crash the skier. Set the state to crashed, set the speed to zero cause you can't move when crashed and update the
     * image.
     */
    crash() {
        this.resetCurrentAnimation();
        this.state = STATES.STATE_CRASHED;
        this.speed = 0;
        this.imageName = IMAGE_NAMES.SKIER_CRASH;
    }

    /**
     * Change the skier to the skiing state, get them moving at the starting speed and set them facing
     * whichever direction they're set to.
     */
    ski(newDirection: number, newSpeed: number = this.speed) {
        this.state = STATES.STATE_SKIING;
        this.speed = newSpeed;
        this.setDirection(newDirection);
    }

    /**
     * Set the current animation, reset to the beginning of the animation and set the proper image to display.
     */
    setAnimation() {
        this.curAnimation = this.animations[this.state];
        if (!this.curAnimation) {
            return;
        }

        this.curAnimationFrame = 0;

        const animateImages = this.curAnimation.getImages();
        this.imageName = animateImages[this.curAnimationFrame];
    }

    /**
     * Advance to the next frame in the current animation if enough time has elapsed since the previous frame.
     */
    animate(gameTime: number) {
        if (!this.curAnimation) {
            return;
        }

        if (gameTime - this.curAnimationFrameTime > ANIMATION_FRAME_SPEED_MS) {
            this.nextAnimationFrame(gameTime);
        }
    }

    /**
     * Increase the current animation frame and update the image based upon the sequence of images for the animation.
     * If the animation isn't looping, then finish the animation instead.
     */
    nextAnimationFrame(gameTime: number) {
        if (!this.curAnimation) {
            return;
        }

        const animationImages = this.curAnimation.getImages();

        this.curAnimationFrameTime = gameTime;
        this.curAnimationFrame++;
        if (this.curAnimationFrame >= animationImages.length) {
            if (!this.curAnimation.getLooping()) {
                this.finishAnimation();
                return;
            }

            this.curAnimationFrame = 0;
        }

        this.imageName = animationImages[this.curAnimationFrame];
    }

    /**
     * The current animation wasn't looping, so finish it by clearing out the current animation and firing the callback.
     */
    finishAnimation() {
        if (!this.curAnimation) {
            return;
        }

        const animationCallback = this.curAnimation.getCallback();
        this.curAnimation = null;

        if (animationCallback) {
            animationCallback.apply(null);
        }
    }

    /**
     * Kill the skier by putting them into the "dead" state and stopping their movement.
     */
    die() {
        this.state = STATES.STATE_DEAD;
        this.speed = 0;
    }

    /**
     * Increase the skier speed by the speed increment. If the skier is already at the max speed, don't increase it.
     */
    increaseSpeed() {
        if (this.speed < MAX_SPEED) {
            this.speed += SPEED_INCREMENT;
        }
    }
}
