/**
 * A collectible item that the skier can pick up for bonus points.
 * Drawn procedurally (no image assets needed) as coins, stars, or gems.
 */

import { IMAGE_NAMES, COLLECTIBLE_TYPE, CollectibleConfig, COLLECTIBLE_CONFIGS } from "../../Constants";
import { Canvas } from "../../Core/Canvas";
import { ImageManager } from "../../Core/ImageManager";
import { Position, Rect } from "../../Core/Utils";
import { Entity } from "../Entity";

export class Collectible extends Entity {
    imageName: IMAGE_NAMES;
    config: CollectibleConfig;
    collected: boolean = false;
    animationTime: number = 0;

    constructor(x: number, y: number, type: COLLECTIBLE_TYPE, imageManager: ImageManager, canvas: Canvas) {
        super(x, y, imageManager, canvas);
        this.config = COLLECTIBLE_CONFIGS[type];
        this.imageName = this.config.imageName;
    }

    getPoints(): number {
        return this.config.points;
    }

    collect() {
        this.collected = true;
    }

    isCollected(): boolean {
        return this.collected;
    }

    getBounds(): Rect | null {
        const size = this.config.size;
        return new Rect(this.position.x - size, this.position.y - size, this.position.x + size, this.position.y + size);
    }

    draw() {
        if (this.collected) return;

        const screen = this.canvas.worldToScreen(this.position.x, this.position.y);
        const size = this.config.size * this.canvas.zoom;
        const ctx = this.canvas.ctx;

        this.animationTime += 0.05;
        const pulse = 1 + Math.sin(this.animationTime * 3) * 0.15;
        const drawSize = size * pulse;

        ctx.save();

        switch (this.config.type) {
            case COLLECTIBLE_TYPE.COIN:
                this.drawCoin(ctx, screen, drawSize);
                break;
            case COLLECTIBLE_TYPE.STAR:
                this.drawStar(ctx, screen, drawSize);
                break;
            case COLLECTIBLE_TYPE.GEM:
                this.drawGem(ctx, screen, drawSize);
                break;
        }

        ctx.restore();
    }

    private drawCoin(ctx: CanvasRenderingContext2D, pos: Position, size: number) {
        ctx.shadowColor = this.config.glowColor;
        ctx.shadowBlur = size * 0.6;

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
        ctx.fillStyle = this.config.color;
        ctx.fill();
        ctx.strokeStyle = "#B8860B";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(pos.x - size * 0.2, pos.y - size * 0.2, size * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.fill();

        ctx.fillStyle = "#B8860B";
        ctx.font = `bold ${size}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("$", pos.x, pos.y + 1);
    }

    private drawStar(ctx: CanvasRenderingContext2D, pos: Position, size: number) {
        ctx.shadowColor = this.config.glowColor;
        ctx.shadowBlur = size * 0.8;

        const spikes = 5;
        const outerRadius = size;
        const innerRadius = size * 0.45;

        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / spikes - Math.PI / 2;
            const x = pos.x + Math.cos(angle) * radius;
            const y = pos.y + Math.sin(angle) * radius;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fillStyle = this.config.color;
        ctx.fill();
        ctx.strokeStyle = "#CC7000";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, size * 0.25, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.fill();
    }

    private drawGem(ctx: CanvasRenderingContext2D, pos: Position, size: number) {
        ctx.shadowColor = this.config.glowColor;
        ctx.shadowBlur = size * 0.8;

        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y - size * 1.2);
        ctx.lineTo(pos.x + size * 0.8, pos.y);
        ctx.lineTo(pos.x, pos.y + size * 1.2);
        ctx.lineTo(pos.x - size * 0.8, pos.y);
        ctx.closePath();
        ctx.fillStyle = this.config.color;
        ctx.fill();
        ctx.strokeStyle = "#7B1FA2";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y - size * 0.6);
        ctx.lineTo(pos.x + size * 0.3, pos.y);
        ctx.lineTo(pos.x, pos.y + size * 0.3);
        ctx.lineTo(pos.x - size * 0.3, pos.y);
        ctx.closePath();
        ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
        ctx.fill();
    }

    die() {}
}
