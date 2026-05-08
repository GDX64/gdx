<template>
  <div class="container">
    <h2>Gray Filter + OCR</h2>

    <div class="upload-area" @dragover.prevent @drop.prevent="onDrop">
      <input ref="fileInput" type="file" accept="image/*" @change="onFileChange" hidden />
      <button @click="fileInput?.click()">Upload Image</button>
      <span>or drag & drop here</span>
    </div>

    <div v-if="original || filtered" class="images">
      <div class="image-box">
        <p>Original</p>
        <img v-if="original" :src="original" />
      </div>
      <div class="image-box">
        <p>Gray pixels only</p>
        <img v-if="filtered" :src="filtered" />
      </div>
    </div>

    <div v-if="filtered" class="ocr-section">
      <button :disabled="ocrRunning" @click="runOcr">
        {{ ocrRunning ? `Extracting text… ${ocrProgress}%` : 'Extract Text' }}
      </button>

      <div v-if="ocrText !== null" class="ocr-result">
        <p><strong>Extracted text</strong></p>
        <pre>{{ ocrText || '(no text found)' }}</pre>

        <template v-if="schedule">
          <hr />
          <table class="schedule-table">
            <tr><td>First clock in</td><td>{{ schedule.firstIn }}</td></tr>
            <tr><td>Last clock out</td><td>{{ schedule.lastOut ?? '—' }}</td></tr>
            <tr><td>Worked so far</td><td>{{ formatDuration(schedule.workedMin) }}</td></tr>
            <tr v-if="schedule.restMin !== null"><td>Rest time</td><td>{{ formatDuration(schedule.restMin) }}</td></tr>
            <tr><td>Go home at</td><td class="go-home">{{ schedule.goHome ?? '—' }}</td></tr>
            <tr v-if="schedule.overtime !== null">
              <td>{{ schedule.overtime >= 0 ? 'Overtime' : 'Missing time' }}</td>
              <td :class="schedule.overtime >= 0 ? 'pos' : 'neg'">{{ formatDuration(Math.abs(schedule.overtime)) }}</td>
            </tr>
          </table>
        </template>
        <p v-else-if="ocrText" class="warn">No valid hh:mm times found in the text.</p>
      </div>
    </div>

    <canvas ref="canvas" hidden />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { createWorker } from 'tesseract.js'

const fileInput = ref<HTMLInputElement>()
const canvas = ref<HTMLCanvasElement>()
const original = ref<string>()
const filtered = ref<string>()
const ocrText = ref<string | null>(null)
const ocrRunning = ref(false)
const ocrProgress = ref(0)

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) processFile(file)
}

function onDrop(e: DragEvent) {
  const file = e.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) processFile(file)
}

function processFile(file: File) {
  ocrText.value = null
  const reader = new FileReader()
  reader.onload = (e) => {
    const src = e.target!.result as string
    original.value = src
    applyGrayFilter(src)
  }
  reader.readAsDataURL(file)
}

function applyGrayFilter(src: string) {
  const img = new Image()
  img.onload = () => {
    const cv = canvas.value!
    cv.width = img.width
    cv.height = img.height
    const ctx = cv.getContext('2d')!
    ctx.drawImage(img, 0, 0)

    const imageData = ctx.getImageData(0, 0, cv.width, cv.height)
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2]
      const tolerance = 100
      const isGray = Math.abs(r - g) <= tolerance && Math.abs(g - b) <= tolerance && Math.abs(r - b) <= tolerance
      if (!isGray) {
        data[i + 3] = 0
      }
      data[i] = 0
      data[i + 1] = 0
      data[i + 2] = 0
    }

    const w = cv.width, h = cv.height
    const snapshot = new Uint8ClampedArray(data)
    const radius = 5

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4
        if (snapshot[idx + 3] === 0) continue

        let blackCount = 0
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            if (dx === 0 && dy === 0) continue
            const nx = x + dx, ny = y + dy
            if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue
            const nIdx = (ny * w + nx) * 4
            if (snapshot[nIdx + 3] > 0) blackCount++
          }
        }

        // if (blackCount >= 40) data[idx + 3] = 0
      }
    }

    ctx.putImageData(imageData, 0, 0)
    filtered.value = cv.toDataURL()
  }
  img.src = src
}

function scaleDataUrl(dataUrl: string, scale: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const cv = document.createElement('canvas')
      cv.width = img.width * scale
      cv.height = img.height * scale
      const ctx = cv.getContext('2d')!
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(img, 0, 0, cv.width, cv.height)
      resolve(cv.toDataURL())
    }
    img.src = dataUrl
  })
}

function parseMinutes(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function formatTime(minutes: number) {
  const h = Math.floor(minutes / 60) % 24
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

const REQUIRED_WORK = 8 * 60   // 8h in minutes

const schedule = computed(() => {
  if (!ocrText.value) return null
  const times = [...ocrText.value.matchAll(/\b([01]?\d|2[0-3]):[0-5]\d\b/g)].map(m => m[0])
  if (times.length === 0) return null

  // Pair up times: [in, out, in, out, ...]
  const pairs: Array<[string, string]> = []
  for (let i = 0; i + 1 < times.length; i += 2)
    pairs.push([times[i], times[i + 1]])

  const workedMin = pairs.reduce((sum, [i, o]) => sum + parseMinutes(o) - parseMinutes(i), 0)
  const overtime = pairs.length * 2 === times.length // only when all periods are closed
    ? workedMin - REQUIRED_WORK
    : null

  // If last period is still open (odd number of times), calculate go-home
  const lastIn = times.length % 2 === 1 ? times[times.length - 1] : null
  let goHome: string | null = null
  if (lastIn) {
    const remaining = REQUIRED_WORK - workedMin
    goHome = formatTime(parseMinutes(lastIn) + remaining)
  } else if (pairs.length > 0) {
    // All periods closed — show go-home based on when they finished
    const lastOut = times[times.length - 1]
    const remaining = Math.max(0, REQUIRED_WORK - workedMin)
    goHome = remaining > 0 ? formatTime(parseMinutes(lastOut) + remaining) : lastOut
  }

  const firstIn = times[0]
  const lastOut = times.length % 2 === 0 ? times[times.length - 1] : null
  const restMin = lastOut
    ? parseMinutes(lastOut) - parseMinutes(firstIn) - workedMin
    : null

  return { firstIn, lastOut, workedMin, restMin, goHome, overtime }
})

async function runOcr() {
  if (!filtered.value) return
  ocrRunning.value = true
  ocrProgress.value = 0
  ocrText.value = null

  const worker = await createWorker('eng', 1, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === 'recognizing text') {
        ocrProgress.value = Math.round(m.progress * 100)
      }
    },
  })

  await worker.setParameters({ tessedit_char_whitelist: '0123456789: ' })

//   const scaled = await scaleDataUrl(filtered.value, 4)
  const { data } = await worker.recognize(filtered.value)

  await worker.terminate()

  ocrText.value = data.text.trim()
  ocrRunning.value = false
}
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem;
  font-family: sans-serif;
}

.upload-area {
  display: flex;
  align-items: center;
  gap: 1rem;
  border: 2px dashed #aaa;
  padding: 1.5rem 2rem;
  border-radius: 8px;
  cursor: pointer;
}

.upload-area button {
  padding: 0.4rem 1rem;
  cursor: pointer;
}

.images {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
  justify-content: center;
}

.image-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.image-box p {
  font-weight: bold;
  margin: 0;
}

.image-box img {
  max-width: 400px;
  max-height: 400px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 0 / 16px 16px;
}

.ocr-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: 100%;
  max-width: 800px;
}

.ocr-section button {
  padding: 0.5rem 1.5rem;
  cursor: pointer;
  font-size: 1rem;
}

.ocr-section button:disabled {
  opacity: 0.6;
  cursor: wait;
}

.ocr-result {
  width: 100%;
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 1rem;
}

.schedule-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 0.5rem;
}

.schedule-table td {
  padding: 0.3rem 0.6rem;
}

.schedule-table td:first-child {
  color: #666;
  width: 140px;
}

.go-home {
  font-weight: bold;
  font-size: 1.1rem;
}

.pos { color: #2a9d2a; font-weight: bold; }
.neg { color: #c0392b; font-weight: bold; }

.warn {
  color: #888;
  font-style: italic;
  margin-top: 0.5rem;
}

.ocr-result pre {
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0.5rem 0 0;
  font-size: 0.9rem;
}
</style>
