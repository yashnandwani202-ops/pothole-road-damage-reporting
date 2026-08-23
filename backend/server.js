const express = require('express')
const cors = require('cors')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const pool = require('./db')

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
  return highwayMap[highwayTag] || 'residential'
}

async function lookupRoadType(lat, lng) {
  const query = `[out:json][timeout:10];way(around:50,${lat},${lng})[highway];out tags 5;`
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`

  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error('Overpass request failed')

    const data = await res.json()
    if (!data.elements || data.elements.length === 0) {
      return 'residential'
    }

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
    return 'residential'
  }
}

function computePriorityScore(severityScore, roadType, reportedCount) {
  const roadWeight = { residential: 0.6, arterial: 0.8, highway: 1.0 }[roadType] || 0.6
  const base = severityScore * 70 + roadWeight * 20
  const duplicateBoost = Math.min(reportedCount * 2, 10)
  return Math.round(base + duplicateBoost)
}

// Convert a DB row (snake_case) into the shape the frontend expects (camelCase)
function formatReport(row) {
  return {
    id: row.id,
    imageUrl: row.image_url,
    lat: row.lat,
    lng: row.lng,
    severity: row.severity,
    severityScore: row.severity_score,
    roadType: row.road_type,
    priorityScore: row.priority_score,
    reportedCount: row.reported_count,
    status: row.status,
    timestamp: row.created_at,
  }
}

// --- Routes ---

// POST /api/reports — citizen submits a new report
app.post('/api/reports', upload.single('image'), async (req, res) => {
  const { lat, lng } = req.body

  if (!req.file || !lat || !lng) {
    return res.status(400).json({ error: 'Image, lat, and lng are required.' })
  }

  try {
    const imageBuffer = fs.readFileSync(req.file.path)

    const { severity, severityScore } = await detectSeverity(imageBuffer, req.file.filename)
    const roadType = await lookupRoadType(parseFloat(lat), parseFloat(lng))
    const priorityScore = computePriorityScore(severityScore, roadType, 1)
    const imageUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`

    const result = await pool.query(
      `INSERT INTO reports
        (image_url, location, lat, lng, severity, severity_score, road_type, priority_score, reported_count, status)
       VALUES
        ($1, ST_SetSRID(ST_MakePoint($3, $2), 4326)::geography, $2, $3, $4, $5, $6, $7, 1, 'reported')
       RETURNING *`,
      [imageUrl, parseFloat(lat), parseFloat(lng), severity, severityScore, roadType, priorityScore]
    )

    res.status(201).json(formatReport(result.rows[0]))
  } catch (err) {
    console.error('Report submission failed:', err.message)
    res.status(502).json({ error: 'Something went wrong while processing the report. Check that the ML service and database are running.' })
  }
})

// GET /api/reports — municipal dashboard fetches all reports
app.get('/api/reports', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM reports ORDER BY priority_score DESC`)
    res.json(result.rows.map(formatReport))
  } catch (err) {
    console.error('Failed to fetch reports:', err.message)
    res.status(500).json({ error: 'Failed to fetch reports' })
  }
})

// PATCH /api/reports/:id/status — update a report's status
app.patch('/api/reports/:id/status', async (req, res) => {
  const id = parseInt(req.params.id, 10)
  const { status } = req.body

  try {
    const result = await pool.query(
      `UPDATE reports SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' })
    }

    res.json(formatReport(result.rows[0]))
  } catch (err) {
    console.error('Failed to update status:', err.message)
    res.status(500).json({ error: 'Failed to update status' })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})