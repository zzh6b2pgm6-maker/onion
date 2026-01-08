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
        this.vx = (Math.random() - 0.5) * 2; // Random velocity
        this.vy = (Math.random() - 0.5) * 2;
        this.radius = 40 + Math.random() * 30;
        this.hashtags = this.extractHashtags(text);
        this.birthTime = Date.now();
        this.opacity = 1;
        this.merged = false;
        this.connections = [];
        this.hue = Math.random() * 60 + 180; // Blue-cyan range
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

        // Draw connections
        ctx.strokeStyle = `hsla(${this.hue}, 70%, 70%, ${this.opacity * 0.3})`;
        ctx.lineWidth = 2;
        this.connections.forEach(other => {
            if (other.opacity > 0) {
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(other.x, other.y);
                ctx.stroke();
            }
        });

        // Draw bubble
        const gradient = ctx.createRadialGradient(
            this.x - this.radius * 0.3,
            this.y - this.radius * 0.3,
            0,
            this.x,
            this.y,
            this.radius
        );
        gradient.addColorStop(0, `hsla(${this.hue}, 70%, 80%, ${this.opacity * 0.8})`);
        gradient.addColorStop(0.7, `hsla(${this.hue}, 70%, 60%, ${this.opacity * 0.6})`);
        gradient.addColorStop(1, `hsla(${this.hue}, 70%, 40%, ${this.opacity * 0.4})`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Outline
        ctx.strokeStyle = `hsla(${this.hue}, 70%, 90%, ${this.opacity * 0.5})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw text
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity * 0.9})`;
        ctx.font = '13px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const maxWidth = this.radius * 1.6;
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

        const lineHeight = 16;
        const startY = this.y - ((lines.length - 1) * lineHeight) / 2;
        lines.forEach((line, i) => {
            ctx.fillText(line, this.x, startY + i * lineHeight);
        });

        ctx.restore();
    }
}

// Animation loop
function animate() {
    ctx.fillStyle = 'rgba(10, 24, 40, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

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
