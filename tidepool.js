// ============================================
// TIDE POOL 3D - Three Simple Rules in Space
// ============================================
// Rule 1: Random drift
// Rule 2: Collision → hashtag match → merge/bounce
// Rule 3: Fade over time

const canvas = document.getElementById('tidepool');
const ctx = canvas.getContext('2d');
const input = document.getElementById('thoughtInput');
const dropButton = document.getElementById('dropButton');
const bubbleCountEl = document.getElementById('bubbleCount');
const mergeCountEl = document.getElementById('mergeCount');

// Resize canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// State
const bubbles = [];
let mergeCount = 0;
const FADE_TIME = 30000;
const MATCH_THRESHOLD = 0.5;

// Camera system
const camera = {
    x: 0,
    y: 0,
    z: -500,
    targetX: 0,
    targetY: 0,
    targetZ: -500,
    lockedBubble: null,
    fov: 800,
    speed: 0.05
};

// Mouse/touch controls
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

// Bubble class with 3D
class Bubble {
    constructor(text, x, y, z) {
        this.text = text;
        // Spawn in 3D space
        this.x = x !== undefined ? x : (Math.random() - 0.5) * 2000;
        this.y = y !== undefined ? y : (Math.random() - 0.5) * 2000;
        this.z = z !== undefined ? z : (Math.random() - 0.5) * 2000;

        this.vx = (Math.random() - 0.5) * 1;
        this.vy = (Math.random() - 0.5) * 1;
        this.vz = (Math.random() - 0.5) * 1;

        this.radius = 50 + Math.random() * 40;
        this.hashtags = this.extractHashtags(text);
        this.birthTime = Date.now();
        this.opacity = 1;
        this.connections = [];
        this.hue = Math.random() * 60 + 180;
        this.pulse = Math.random() * Math.PI * 2;
        this.mergeFlash = 0;
    }

    extractHashtags(text) {
        const matches = text.match(/#\w+/g);
        return matches ? matches.map(tag => tag.toLowerCase()) : [];
    }

    update() {
        // 3D drift
        this.x += this.vx;
        this.y += this.vy;
        this.z += this.vz;

        // Wrap around space
        const boundary = 1500;
        if (Math.abs(this.x) > boundary) this.x = -this.x * 0.9;
        if (Math.abs(this.y) > boundary) this.y = -this.y * 0.9;
        if (Math.abs(this.z) > boundary) this.z = -this.z * 0.9;

        this.pulse += 0.02;
        if (this.mergeFlash > 0) this.mergeFlash *= 0.95;

        // Fade over time
        const age = Date.now() - this.birthTime;
        const fadeStart = FADE_TIME * (1 + this.connections.length * 0.5);
        if (age > fadeStart) {
            this.opacity = Math.max(0, 1 - (age - fadeStart) / FADE_TIME);
        }
    }

    // 3D distance
    distanceTo(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const dz = this.z - other.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    collidesWith(other) {
        return this.distanceTo(other) < (this.radius + other.radius);
    }

    matchScore(other) {
        if (this.hashtags.length === 0 || other.hashtags.length === 0) return 0;
        const matches = this.hashtags.filter(tag => other.hashtags.includes(tag));
        return matches.length / Math.max(this.hashtags.length, other.hashtags.length);
    }

    interact(other) {
        const score = this.matchScore(other);

        if (score >= MATCH_THRESHOLD) {
            if (!this.connections.includes(other)) {
                this.connections.push(other);
                other.connections.push(this);
                mergeCount++;
                this.birthTime = Date.now();
                other.birthTime = Date.now();
                this.mergeFlash = 1;
                other.mergeFlash = 1;
            }
        } else {
            // 3D bounce
            const dx = this.x - other.x;
            const dy = this.y - other.y;
            const dz = this.z - other.z;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            const nx = dx / distance;
            const ny = dy / distance;
            const nz = dz / distance;

            this.vx += nx * 0.5;
            this.vy += ny * 0.5;
            this.vz += nz * 0.5;
            other.vx -= nx * 0.5;
            other.vy -= ny * 0.5;
            other.vz -= nz * 0.5;
        }
    }

    // Project 3D to 2D
    project() {
        const dx = this.x - camera.x;
        const dy = this.y - camera.y;
        const dz = this.z - camera.z;

        if (dz <= 0) return null; // Behind camera

        const scale = camera.fov / dz;
        return {
            x: canvas.width / 2 + dx * scale,
            y: canvas.height / 2 + dy * scale,
            radius: this.radius * scale,
            distance: dz,
            scale: scale
        };
    }

    draw() {
        if (this.opacity <= 0) return;

        const proj = this.project();
        if (!proj || proj.radius < 1) return;

        ctx.save();

        // Fade based on distance
        const distanceOpacity = Math.min(1, 1000 / proj.distance);
        ctx.globalAlpha = this.opacity * distanceOpacity;

        // Draw connections
        this.connections.forEach(other => {
            if (other.opacity > 0) {
                const otherProj = other.project();
                if (otherProj) {
                    const pulseValue = Math.sin(this.pulse) * 0.3 + 0.7;
                    ctx.strokeStyle = `hsla(${this.hue}, 70%, 70%, ${this.opacity * 0.5 * pulseValue * distanceOpacity})`;
                    ctx.lineWidth = Math.max(1, 3 * proj.scale);
                    ctx.setLineDash([5, 5]);
                    ctx.lineDashOffset = -this.pulse * 5;
                    ctx.beginPath();
                    ctx.moveTo(proj.x, proj.y);
                    ctx.lineTo(otherProj.x, otherProj.y);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }
            }
        });

        // Pulsing size
        const pulseSize = Math.sin(this.pulse) * 3;
        const currentRadius = proj.radius + pulseSize * proj.scale;

        // Glow effect
        if (this.mergeFlash > 0 || this.connections.length > 0) {
            const glowStrength = Math.max(this.mergeFlash, this.connections.length * 0.15);
            ctx.shadowBlur = 30 * glowStrength * proj.scale;
            ctx.shadowColor = `hsla(${this.hue}, 100%, 70%, ${glowStrength})`;
        }

        // Draw bubble
        const gradient = ctx.createRadialGradient(
            proj.x - currentRadius * 0.3,
            proj.y - currentRadius * 0.3,
            0,
            proj.x,
            proj.y,
            currentRadius
        );
        gradient.addColorStop(0, `hsla(${this.hue}, 80%, 85%, ${this.opacity * 0.9})`);
        gradient.addColorStop(0.5, `hsla(${this.hue}, 75%, 65%, ${this.opacity * 0.7})`);
        gradient.addColorStop(1, `hsla(${this.hue}, 70%, 45%, ${this.opacity * 0.5})`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();

        // Outline
        ctx.shadowBlur = 0;
        ctx.strokeStyle = `hsla(${this.hue}, 80%, 95%, ${this.opacity * 0.6})`;
        ctx.lineWidth = Math.max(1, 2 * proj.scale);
        ctx.stroke();

        // Text (only if close enough)
        if (proj.distance < 800 && currentRadius > 20) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 4;
            ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity * 0.95})`;

            const fontSize = Math.max(10, Math.min(20, 14 * proj.scale));
            ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const maxWidth = currentRadius * 1.5;
            const words = this.text.split(' ');
            const lines = [];
            let currentLine = '';

            words.forEach(word => {
                const testLine = currentLine ? `${currentLine} ${word}` : word;
                const metrics = ctx.measureText(testLine);
                if (metrics.width > maxWidth && currentLine) {
                    lines.push(currentLine);
                    currentLine = word;
                } else {
                    currentLine = testLine;
                }
            });
            if (currentLine) lines.push(currentLine);

            const lineHeight = fontSize * 1.3;
            const startY = proj.y - ((lines.length - 1) * lineHeight) / 2;
            lines.forEach((line, i) => {
                ctx.fillText(line, proj.x, startY + i * lineHeight);
            });
        }

        ctx.restore();
    }
}

// Background particles
const particles = [];
for (let i = 0; i < 100; i++) {
    particles.push({
        x: (Math.random() - 0.5) * 3000,
        y: (Math.random() - 0.5) * 3000,
        z: (Math.random() - 0.5) * 3000,
        radius: Math.random() * 2 + 1,
        opacity: Math.random() * 0.3 + 0.1
    });
}

// Update camera
function updateCamera() {
    if (camera.lockedBubble && camera.lockedBubble.opacity > 0) {
        // Follow locked bubble
        camera.targetX = camera.lockedBubble.x;
        camera.targetY = camera.lockedBubble.y;
        camera.targetZ = camera.lockedBubble.z - 300;
    }

    // Smooth camera movement
    camera.x += (camera.targetX - camera.x) * camera.speed;
    camera.y += (camera.targetY - camera.y) * camera.speed;
    camera.z += (camera.targetZ - camera.z) * camera.speed;
}

// Animation loop
function animate() {
    ctx.fillStyle = 'rgba(10, 24, 40, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    updateCamera();

    // Draw particles
    particles.forEach(p => {
        const dx = p.x - camera.x;
        const dy = p.y - camera.y;
        const dz = p.z - camera.z;

        if (dz > 0) {
            const scale = camera.fov / dz;
            const x = canvas.width / 2 + dx * scale;
            const y = canvas.height / 2 + dy * scale;
            const radius = p.radius * scale;

            if (radius > 0.5) {
                ctx.fillStyle = `rgba(224, 244, 255, ${p.opacity * Math.min(1, 500 / dz)})`;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    });

    // Update bubbles
    bubbles.forEach(bubble => bubble.update());

    // Check collisions
    for (let i = 0; i < bubbles.length; i++) {
        for (let j = i + 1; j < bubbles.length; j++) {
            if (bubbles[i].collidesWith(bubbles[j])) {
                bubbles[i].interact(bubbles[j]);
            }
        }
    }

    // Sort by distance (draw far to near)
    const visibleBubbles = bubbles.filter(b => b.opacity > 0);
    visibleBubbles.sort((a, b) => {
        const distA = Math.sqrt((a.x - camera.x) ** 2 + (a.y - camera.y) ** 2 + (a.z - camera.z) ** 2);
        const distB = Math.sqrt((b.x - camera.x) ** 2 + (b.y - camera.y) ** 2 + (b.z - camera.z) ** 2);
        return distB - distA;
    });

    // Draw bubbles
    visibleBubbles.forEach(bubble => bubble.draw());

    // Remove faded bubbles
    for (let i = bubbles.length - 1; i >= 0; i--) {
        if (bubbles[i].opacity <= 0) {
            bubbles.splice(i, 1);
        }
    }

    // Update UI
    bubbleCountEl.textContent = `${bubbles.length} thoughts floating`;
    mergeCountEl.textContent = `${mergeCount} connections formed`;

    requestAnimationFrame(animate);
}

// Controls
canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
});

canvas.addEventListener('mousemove', (e) => {
    if (isDragging) {
        const dx = e.clientX - lastMouseX;
        const dy = e.clientY - lastMouseY;

        camera.targetX -= dx * 2;
        camera.targetY -= dy * 2;

        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        camera.lockedBubble = null;
    }
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
});

canvas.addEventListener('click', (e) => {
    if (isDragging) return;

    // Find clicked bubble
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let closest = null;
    let closestDist = Infinity;

    bubbles.forEach(bubble => {
        const proj = bubble.project();
        if (proj) {
            const dist = Math.sqrt((proj.x - x) ** 2 + (proj.y - y) ** 2);
            if (dist < proj.radius && dist < closestDist) {
                closest = bubble;
                closestDist = dist;
            }
        }
    });

    if (closest) {
        camera.lockedBubble = camera.lockedBubble === closest ? null : closest;
    } else {
        camera.lockedBubble = null;
    }
});

// Keyboard controls
document.addEventListener('keydown', (e) => {
    const speed = 50;
    if (e.key === 'w' || e.key === 'W') camera.targetZ += speed;
    if (e.key === 's' || e.key === 'S') camera.targetZ -= speed;
    if (e.key === 'a' || e.key === 'A') camera.targetX -= speed;
    if (e.key === 'd' || e.key === 'D') camera.targetX += speed;
    if (e.key === 'q' || e.key === 'Q') camera.targetY -= speed;
    if (e.key === 'e' || e.key === 'E') camera.targetY += speed;
    if (e.key === 'Escape') camera.lockedBubble = null;
});

// Touch controls
canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
        isDragging = true;
        lastMouseX = e.touches[0].clientX;
        lastMouseY = e.touches[0].clientY;
    }
});

canvas.addEventListener('touchmove', (e) => {
    if (isDragging && e.touches.length === 1) {
        const dx = e.touches[0].clientX - lastMouseX;
        const dy = e.touches[0].clientY - lastMouseY;

        camera.targetX -= dx * 2;
        camera.targetY -= dy * 2;

        lastMouseX = e.touches[0].clientX;
        lastMouseY = e.touches[0].clientY;
        camera.lockedBubble = null;
    }
});

canvas.addEventListener('touchend', () => {
    isDragging = false;
});

// Mouse wheel zoom
canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    camera.targetZ += e.deltaY * 0.5;
});

// Drop thought
function dropThought() {
    const text = input.value.trim();
    if (!text) return;

    // Spawn near camera
    const bubble = new Bubble(
        text,
        camera.x + (Math.random() - 0.5) * 200,
        camera.y + (Math.random() - 0.5) * 200,
        camera.z + 500 + Math.random() * 100
    );
    bubbles.push(bubble);

    input.value = '';
    input.focus();
}

dropButton.addEventListener('click', dropThought);
input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') dropThought();
});

// Initial bubbles
const starters = [
    'exploring new ideas #creativity #innovation',
    'what makes us human #philosophy #consciousness',
    'the future of AI #technology #ai #future',
    'art and expression #creativity #art',
    'finding meaning in chaos #philosophy #meaning',
    'building something beautiful #innovation #design',
];

starters.forEach(text => {
    bubbles.push(new Bubble(text));
});

// Start
animate();

console.log('%c🌊 Tide Pool 3D', 'font-size: 20px; color: #4a9eff; font-weight: bold;');
console.log('%cNavigate: Click+Drag or WASD keys | Click bubble to lock | Scroll to zoom', 'color: #e0f4ff;');
