const express = require('express')
const cors = require('cors')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

const app = express()
const PORT = 5000

// Make sure the uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir)
}

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(uploadsDir)) // serve uploaded images

// Multer config: store uploaded images on disk with a unique filename
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`
    cb(null, uniqueName)
  },
})
const upload = multer({ storage })

// In-memory store for now. Swap for a real database (MongoDB/Postgres) later.
let reports = []
let nextId = 1

// --- Real severity detection via the Flask/YOLO service ---
const FormDataNode = require('form-data')

async function detectSeverity(imageBuffer, filename) {
  const form = new FormDataNode()
  form.append('image', imageBuffer, filename)

  const bodyBuffer = form.getBuffer()
  const headers = form.getHeaders()
  headers['Content-Length'] = bodyBuffer.length

  const res = await fetch('http://localhost:5001/detect', {
    method: 'POST',
    body: bodyBuffer,
    headers,
  })

  if (!res.ok) {
    throw new Error('Detection service failed')
  }

  const data = await res.json()
  return { severity: data.severity, severityScore: data.severityScore }
}

// --- Real road-type lookup via OpenStreetMap's Overpass API ---
// Maps OSM's detailed 'highway' tag values into our 3 simplified categories.
function mapHighwayTagToRoadType(highwayTag) {
  const highwayMap = {
    motorway: 'highway',
    motorway_link: 'highway',
    trunk: 'highway',
    trunk_link: 'highway',
    primary: 'arterial',
    primary_link: 'arterial',
    secondary: 'arterial',
    secondary_link: 'arterial',
    tertiary: 'arterial',
    tertiary_link: 'arterial',
    residential: 'residential',
    living_street: 'residential',
    unclassified: 'residential',
    service: 'residential',
  }
  return highwayMap[highwayTag] || 'residential' // default fallback
}

async function lookupRoadType(lat, lng) {
  // Search for any tagged road within 50 meters of the report's coordinates
  const query = `[out:json][timeout:10];way(around:50,${lat},${lng})[highway];out tags 5;`
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`

  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error('Overpass request failed')

    const data = await res.json()
    if (!data.elements || data.elements.length === 0) {
      return 'residential' // no road found nearby, safe fallback
    }

    // Among nearby roads, prefer the most significant one found
    // (e.g. if both a residential lane and a highway are within 50m, count the highway)
    const priority = { highway: 3, arterial: 2, residential: 1 }
    let best = 'residential'

    for (const el of data.elements) {
      const tag = el.tags && el.tags.highway
      if (!tag) continue
      const mapped = mapHighwayTagToRoadType(tag)
      if (priority[mapped] > priority[best]) {
        best = mapped
      }
    }

    return best
  } catch (err) {
    console.error('Road type lookup failed, using fallback:', err.message)
    return 'residential' // fail safe — never block report submission over this
  }
}

function computePriorityScore(severityScore, roadType, reportedCount) {
  const roadWeight = { residential: 0.6, arterial: 0.8, highway: 1.0 }[roadType] || 0.6
  const base = severityScore * 70 + roadWeight * 20
  const duplicateBoost = Math.min(reportedCount * 2, 10) // more reports = slightly higher priority, capped
  return Math.round(base + duplicateBoost)
}

// --- Routes ---

// POST /api/reports — citizen submits a new report
app.post('/api/reports', upload.single('image'), async (req, res) => {
  const { lat, lng, timestamp } = req.body

  if (!req.file || !lat || !lng) {
    return res.status(400).json({ error: 'Image, lat, and lng are required.' })
  }

  try {
    const fs = require('fs')
    const imageBuffer = fs.readFileSync(req.file.path)

    const { severity, severityScore } = await detectSeverity(imageBuffer, req.file.filename)
    const roadType = await lookupRoadType(parseFloat(lat), parseFloat(lng))
    const priorityScore = computePriorityScore(severityScore, roadType, 1)

    const newReport = {
      id: nextId++,
      imageUrl: `http://localhost:${PORT}/uploads/${req.file.filename}`,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      severity,
      severityScore: Math.round(severityScore * 100) / 100,
      roadType,
      priorityScore,
      reportedCount: 1,
      status: 'reported',
      timestamp: timestamp || new Date().toISOString(),
    }

    reports.push(newReport)
    res.status(201).json(newReport)
  } catch (err) {
    console.error('Detection failed:', err.message)
    res.status(502).json({ error: 'Pothole detection service is unavailable. Make sure app.py is running on port 5001.' })
  }
})

// GET /api/reports — municipal dashboard fetches all reports
app.get('/api/reports', (req, res) => {
  res.json(reports)
})

// PATCH /api/reports/:id/status — update a report's status
app.patch('/api/reports/:id/status', (req, res) => {
  const id = parseInt(req.params.id, 10)
  const { status } = req.body

  const report = reports.find((r) => r.id === id)
  if (!report) {
    return res.status(404).json({ error: 'Report not found' })
  }

  report.status = status
  res.json(report)
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})