<template>
  <canvas
    ref="canvasRef"
    class="particle-bg"
    :style="{ opacity: opacity }"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    particleCount?: number
    excitement?: number
    accentColor?: string
  }>(),
  {
    particleCount: 60,
    excitement: 0,
    accentColor: '#6366F1',
  }
)

const canvasRef = ref<HTMLCanvasElement | null>(null)
const opacity = ref(0.6)

let animFrameId = 0
let particles: Particle[] = []
let width = 0
let height = 0

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  alpha: number
  baseAlpha: number
}

function resize() {
  const canvas = canvasRef.value
  if (!canvas) return
  width = window.innerWidth
  height = window.innerHeight
  canvas.width = width * devicePixelRatio
  canvas.height = height * devicePixelRatio
  canvas.style.width = width + 'px'
  canvas.style.height = height + 'px'
}

function createParticle(): Particle {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.3,
    vy: -(Math.random() * 0.4 + 0.1),
    radius: Math.random() * 2 + 0.5,
    alpha: Math.random() * 0.4 + 0.1,
    baseAlpha: Math.random() * 0.4 + 0.1,
  }
}

function initParticles(count: number) {
  particles = Array.from({ length: count }, () => createParticle())
}

function animate() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.scale(devicePixelRatio, devicePixelRatio)

  const excitementBoost = props.excitement * 1.5

  // Update and draw particles
  for (const p of particles) {
    p.x += p.vx * (1 + excitementBoost)
    p.y += p.vy * (1 + excitementBoost * 2)
    p.alpha = p.baseAlpha + excitementBoost * 0.4

    // Wrap around edges
    if (p.x < -10) p.x = width + 10
    if (p.x > width + 10) p.x = -10
    if (p.y < -10) p.y = height + 10
    if (p.y > height + 10) p.y = -10

    // Draw particle with glow
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.radius + excitementBoost, 0, Math.PI * 2)
    ctx.fillStyle = props.accentColor
      ? `${props.accentColor}${Math.floor(p.alpha * 255)
          .toString(16)
          .padStart(2, '0')}`
      : `rgba(255, 255, 255, ${p.alpha})`
    ctx.fill()
  }

  // Draw connections between nearby particles
  ctx.strokeStyle = `rgba(255, 255, 255, ${0.03 + excitementBoost * 0.05})`
  ctx.lineWidth = 0.5
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x
      const dy = particles[i].y - particles[j].y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 120 + excitementBoost * 60) {
        ctx.beginPath()
        ctx.moveTo(particles[i].x, particles[i].y)
        ctx.lineTo(particles[j].x, particles[j].y)
        ctx.stroke()
      }
    }
  }

  animFrameId = requestAnimationFrame(animate)
}

onMounted(() => {
  resize()
  initParticles(props.particleCount)
  animate()
  window.addEventListener('resize', resize)
})

onUnmounted(() => {
  cancelAnimationFrame(animFrameId)
  window.removeEventListener('resize', resize)
})

watch(
  () => props.particleCount,
  (count) => {
    initParticles(count)
  }
)
</script>

<style scoped>
.particle-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  transition: opacity 0.5s ease;
}
</style>
