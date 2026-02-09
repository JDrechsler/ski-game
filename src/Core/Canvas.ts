/**
 * The Canvas class is responsible for managing the HTML Canvas element and anything drawn to it. It incorporates a
 * drawing offset that all drawn entities to be positioned relative to giving the illusion of moving around in the
 * game world. Supports a zoom level that scales the view without affecting game speed.
 */

import { Position } from "./Utils";

export class Canvas {
    canvasId: string;

    width: number;

    height: number;

    canvas: HTMLCanvasElement;

    ctx: CanvasRenderingContext2D;

    drawOffset: Position = new Position(0, 0);

    /**
     * Zoom level for the camera. 1.0 = normal, >1 = zoomed in, <1 = zoomed out.
     */
    zoom: number = 1.0;

    constructor(canvasId: string, width: number, height: number) {
        this.canvasId = canvasId;
        this.width = width;
        this.height = height;
        this.canvas = this.findCanvas();
        this.ctx = this.getCanvasContext();

        this.setupCanvas();
    }

    findCanvas(): HTMLCanvasElement {
        const canvas = document.getElementById(this.canvasId);
        if (!(canvas instanceof HTMLCanvasElement)) {
            throw new Error(`Canvas element ${this.canvasId} not found!`);
        }

        return canvas;
    }

    getCanvasContext(): CanvasRenderingContext2D {
        const ctx = this.canvas.getContext("2d");
        if (!ctx) {
            throw new Error(`Could not retrieve context for canvas ${this.canvasId}`);
        }

        return ctx;
    }

    setupCanvas() {
        this.canvas.width = this.width * window.devicePixelRatio;
        this.canvas.height = this.height * window.devicePixelRatio;
        this.canvas.style.width = this.width + "px";
        this.canvas.style.height = this.height + "px";

        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    fillBackground(color: string) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    setDrawOffset(x: number, y: number) {
        this.drawOffset.x = x;
        this.drawOffset.y = y;
    }

    setZoom(zoom: number) {
        this.zoom = Math.max(0.5, Math.min(2.0, zoom));
    }

    worldToScreen(worldX: number, worldY: number): Position {
        return new Position((worldX - this.drawOffset.x) * this.zoom, (worldY - this.drawOffset.y) * this.zoom);
    }

    drawImage(image: HTMLImageElement, x: number, y: number, width: number, height: number) {
        x = (x - this.drawOffset.x) * this.zoom;
        y = (y - this.drawOffset.y) * this.zoom;

        this.ctx.drawImage(image, x, y, width * this.zoom, height * this.zoom);
    }
}
