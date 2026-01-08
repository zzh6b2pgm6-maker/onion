// ============================================
// TIDE POOL - Three Simple Rules
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
const FADE_TIME = 30000; // 30 seconds
const MATCH_THRESHOLD = 0.5; // 50% hashtag overlap needed

// Bubble class
class Bubble {
    constructor(text, x, y) {
        this.text = text;
        this.x = x || Math.random() * canvas.width;
        this.y = y || Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 1.5; // Slower, more graceful
        this.vy = (Math.random() - 0.5) * 1.5;
        this.radius = 50 + Math.random() * 40; // Larger bubbles
        this.hashtags = this.extractHashtags(text);
        this.birthTime = Date.now();
        this.opacity = 1;
        this.merged = false;
        this.connections = [];
        this.hue = Math.random() * 60 + 180; // Blue-cyan range
        this.pulse = Math.random() * Math.PI * 2; // For pulsing animation
        this.mergeFlash = 0; // Flash effect when merging
    }

    extractHashtags(text) {
        const matches = text.match(/#\w+/g);
        return matches ? matches.map(tag => tag.toLowerCase()) : [];
    }

    // Rule 1: Random drift
    update() {
        this.x += this.vx;
        this.y += this.vy;

        // Bounce off walls
        if (this.x - this.radius < 0 || this.x + this.radius > canvas.width) {
            this.vx *= -1;
            this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
        }
        if (this.y - this.radius < 0 || this.y + this.radius > canvas.height) {
            this.vy *= -1;
            this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y));
        }

        // Pulsing animation
        this.pulse += 0.02;

        // Decay merge flash
        if (this.mergeFlash > 0) {
            this.mergeFlash *= 0.95;
        }

        // Rule 3: Fade over time
        const age = Date.now() - this.birthTime;
        const fadeStart = FADE_TIME * (1 + this.connections.length * 0.5); // Popular bubbles last longer
        if (age > fadeStart) {
            this.opacity = Math.max(0, 1 - (age - fadeStart) / FADE_TIME);
        }
    }

    // Rule 2: Check collision
    collidesWith(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.radius + other.radius;
    }

    // Rule 2: Match hashtags
    matchScore(other) {
        if (this.hashtags.length === 0 || other.hashtags.length === 0) return 0;
        const matches = this.hashtags.filter(tag => other.hashtags.includes(tag));
        return matches.length / Math.max(this.hashtags.length, other.hashtags.length);
    }

    // Rule 2: Merge or bounce
    interact(other) {
        const score = this.matchScore(other);

        if (score >= MATCH_THRESHOLD) {
            // Merge - form connection
            if (!this.connections.includes(other)) {
                this.connections.push(other);
                other.connections.push(this);
                mergeCount++;

                // Reset fade time on successful merge
                this.birthTime = Date.now();
                other.birthTime = Date.now();

                // Add visual flash effect
                this.mergeFlash = 1;
                other.mergeFlash = 1;
            }
        } else {
            // Bounce apart
            const dx = this.x - other.x;
            const dy = this.y - other.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const nx = dx / distance;
            const ny = dy / distance;

            // Simple elastic collision
            this.vx += nx * 0.5;
            this.vy += ny * 0.5;
            other.vx -= nx * 0.5;
            other.vy -= ny * 0.5;

            // Separate bubbles
            const overlap = (this.radius + other.radius) - distance;
            this.x += nx * overlap * 0.5;
            this.y += ny * overlap * 0.5;
            other.x -= nx * overlap * 0.5;
            other.y -= ny * overlap * 0.5;
        }
    }

    draw() {
        if (this.opacity <= 0) return;

        ctx.save();
        ctx.globalAlpha = this.opacity;

        // Draw connections with pulsing animation
        this.connections.forEach(other => {
            if (other.opacity > 0) {
                const pulseValue = Math.sin(this.pulse) * 0.3 + 0.7;
                ctx.strokeStyle = `hsla(${this.hue}, 70%, 70%, ${this.opacity * 0.5 * pulseValue})`;
                ctx.lineWidth = 3;
                ctx.setLineDash([5, 5]);
                ctx.lineDashOffset = -this.pulse * 5;
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(other.x, other.y);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        });

        // Pulsing size effect
        const pulseSize = Math.sin(this.pulse) * 3;
        const currentRadius = this.radius + pulseSize;

        // Outer glow (merge flash or connection glow)
        if (this.mergeFlash > 0 || this.connections.length > 0) {
            const glowStrength = Math.max(this.mergeFlash, this.connections.length * 0.15);
            ctx.shadowBlur = 30 * glowStrength;
            ctx.shadowColor = `hsla(${this.hue}, 100%, 70%, ${glowStrength})`;
        }

        // Draw bubble with enhanced gradient
        const gradient = ctx.createRadialGradient(
            this.x - currentRadius * 0.3,
            this.y - currentRadius * 0.3,
            0,
            this.x,
            this.y,
            currentRadius
        );
        gradient.addColorStop(0, `hsla(${this.hue}, 80%, 85%, ${this.opacity * 0.9})`);
        gradient.addColorStop(0.5, `hsla(${this.hue}, 75%, 65%, ${this.opacity * 0.7})`);
        gradient.addColorStop(1, `hsla(${this.hue}, 70%, 45%, ${this.opacity * 0.5})`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();

        // Enhanced outline
        ctx.shadowBlur = 0;
        ctx.strokeStyle = `hsla(${this.hue}, 80%, 95%, ${this.opacity * 0.6})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw text with shadow for readability
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 1;

        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity * 0.95})`;
        ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif';
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

        const lineHeight = 18;
        const startY = this.y - ((lines.length - 1) * lineHeight) / 2;
        lines.forEach((line, i) => {
            ctx.fillText(line, this.x, startY + i * lineHeight);
        });

        ctx.restore();
    }
}

// Background particles for depth
const particles = [];
for (let i = 0; i < 50; i++) {
    particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1,
        opacity: Math.random() * 0.3 + 0.1
    });
}

// Animation loop
function animate() {
    ctx.fillStyle = 'rgba(10, 24, 40, 0.15)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw background particles
    particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.fillStyle = `rgba(224, 244, 255, ${p.opacity})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
    });

    // Update all bubbles (Rule 1 & 3)
    bubbles.forEach(bubble => bubble.update());

    // Check collisions (Rule 2)
    for (let i = 0; i < bubbles.length; i++) {
        for (let j = i + 1; j < bubbles.length; j++) {
            if (bubbles[i].collidesWith(bubbles[j])) {
                bubbles[i].interact(bubbles[j]);
            }
        }
    }

    // Draw all bubbles
    bubbles.forEach(bubble => bubble.draw());

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

// Drop a thought
function dropThought() {
    const text = input.value.trim();
    if (!text) return;

    const bubble = new Bubble(text);
    bubbles.push(bubble);

    input.value = '';
    input.focus();
}

// Event listeners
dropButton.addEventListener('click', dropThought);
input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') dropThought();
});

// Start some initial bubbles
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

// Start animation
animate();

// Console message
console.log('%c🌊 Tide Pool', 'font-size: 20px; color: #4a9eff; font-weight: bold;');
console.log('%cWatch thoughts find each other', 'font-size: 14px; color: #2a7ad1; font-style: italic;');
console.log('%c\nThree simple rules:\n1. Drift randomly\n2. Touch → match hashtags → merge/bounce\n3. Fade over time', 'color: #e0f4ff;');
