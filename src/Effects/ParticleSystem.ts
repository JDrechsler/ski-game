/**
 * Particle system for visual effects: ambient snow, collection bursts, and speed lines.
 * All particles operate in screen-space coordinates.
 */

interface SnowFlake {
    x: number;
    y: number;
    size: number;
    speed: number;
    wobble: number;
    wobbleSpeed: number;
    opacity: number;
}

interface BurstParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    opacity: number;
    color: string;
    life: number;
}

interface SpeedLine {
    x: number;
    y: number;
    length: number;
    opacity: number;
    speed: number;
}

const SNOW_COUNT = 60;

export class ParticleSystem {
    private snow: SnowFlake[] = [];
    private bursts: BurstParticle[] = [];
    private speedLines: SpeedLine[] = [];
    private canvasWidth: number;
    private canvasHeight: number;

    constructor(canvasWidth: number, canvasHeight: number) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.initSnow();
    }

    private initSnow() {
        for (let i = 0; i < SNOW_COUNT; i++) {
            this.snow.push(this.createSnowFlake(true));
        }
    }

    private createSnowFlake(randomY: boolean): SnowFlake {
        return {
            x: Math.random() * this.canvasWidth,
            y: randomY ? Math.random() * this.canvasHeight : -5 - Math.random() * 20,
            size: 1 + Math.random() * 2.5,
            speed: 0.3 + Math.random() * 1.2,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.01 + Math.random() * 0.03,
            opacity: 0.2 + Math.random() * 0.5,
        };
    }

    spawnBurst(screenX: number, screenY: number, color: string, count: number = 12) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;
            const speed = 1.5 + Math.random() * 3;
            this.bursts.push({
                x: screenX,
                y: screenY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1,
                size: 1.5 + Math.random() * 3,
                opacity: 1,
                color,
                life: 25 + Math.random() * 20,
            });
        }
    }

    update(skierSpeed: number = 0, maxSpeed: number = 20) {
        // Snow
        for (const flake of this.snow) {
            flake.y += flake.speed;
            flake.wobble += flake.wobbleSpeed;
            flake.x += Math.sin(flake.wobble) * 0.5;

            if (flake.y > this.canvasHeight + 10) {
                Object.assign(flake, this.createSnowFlake(false));
            }
            if (flake.x < -10) flake.x = this.canvasWidth + 10;
            if (flake.x > this.canvasWidth + 10) flake.x = -10;
        }

        // Bursts
        for (const p of this.bursts) {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.08;
            p.opacity -= 1 / p.life;
            p.size *= 0.98;
            p.life--;
        }
        this.bursts = this.bursts.filter((p) => p.life > 0 && p.opacity > 0);

        // Speed lines
        const intensity = Math.max(0, (skierSpeed - 5) / (maxSpeed - 5));
        if (intensity > 0 && Math.random() < intensity * 0.4) {
            this.speedLines.push({
                x: Math.random() * this.canvasWidth,
                y: -30,
                length: 15 + Math.random() * 35 * intensity,
                opacity: 0.05 + intensity * 0.15,
                speed: 6 + intensity * 10,
            });
        }
        for (const line of this.speedLines) {
            line.y += line.speed;
            line.opacity -= 0.008;
        }
        this.speedLines = this.speedLines.filter(
            (l) => l.y < this.canvasHeight + 50 && l.opacity > 0
        );
    }

    drawSnow(ctx: CanvasRenderingContext2D, color: string = "#ffffff", opacityMult: number = 1) {
        ctx.save();
        for (const flake of this.snow) {
            ctx.globalAlpha = flake.opacity * opacityMult;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    drawBursts(ctx: CanvasRenderingContext2D) {
        if (this.bursts.length === 0) return;
        ctx.save();
        for (const p of this.bursts) {
            ctx.globalAlpha = Math.max(0, p.opacity);
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = p.size * 3;
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(0.5, p.size), 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    drawSpeedLines(ctx: CanvasRenderingContext2D) {
        if (this.speedLines.length === 0) return;
        ctx.save();
        ctx.lineCap = "round";
        for (const line of this.speedLines) {
            ctx.globalAlpha = line.opacity;
            ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(line.x, line.y);
            ctx.lineTo(line.x - 3, line.y + line.length);
            ctx.stroke();
        }
        ctx.restore();
    }

    setCanvasSize(width: number, height: number) {
        this.canvasWidth = width;
        this.canvasHeight = height;
    }
}
