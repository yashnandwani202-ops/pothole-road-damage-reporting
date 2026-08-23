import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import heroImage from '../assets/hero.png'
import '../App.css'

function RoadIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1c1c1c" strokeWidth="2">
      <path d="M9 3L4 21M15 3l5 18" strokeLinecap="round" />
      <path d="M12 6v2M12 11v2M12 16v2" strokeLinecap="round" />
    </svg>
  )
}

function ChipIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="7" y="7" width="10" height="10" rx="1" />
      <path d="M9 3v2M12 3v2M15 3v2M9 19v2M12 19v2M15 19v2M3 9h2M3 12h2M3 15h2M19 9h2M19 12h2M19 15h2" strokeLinecap="round" />
    </svg>
  )
}

function CameraIcon({ size = 32, color = '#1c1c1c' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
      <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z" strokeLinejoin="round" />
      <circle cx="12" cy="14" r="3.2" />
    </svg>
  )
}

function PinIcon({ size = 32, color = '#1c1c1c' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
      <path d="M12 21s7-6.2 7-11.2A7 7 0 105 9.8C5 14.8 12 21 12 21z" strokeLinejoin="round" />
      <circle cx="12" cy="9.5" r="2.3" />
    </svg>
  )
}

function ScanIcon({ size = 32, color = '#1c1c1c' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
      <path d="M4 8V5a1 1 0 011-1h3M20 8V5a1 1 0 00-1-1h-3M4 16v3a1 1 0 001 1h3M20 16v3a1 1 0 01-1 1h-3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3.2" />
    </svg>
  )
}

function BarrierIcon({ size = 32, color = '#1c1c1c' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
      <rect x="3" y="7" width="18" height="4" rx="0.5" />
      <rect x="3" y="14" width="18" height="4" rx="0.5" />
      <path d="M6 11v3M12 11v3M18 11v3" strokeLinecap="round" />
    </svg>
  )
}

function PotholeIcon({ size = 56 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#1c1c1c" strokeWidth="1.6">
      <ellipse cx="12" cy="12" rx="8" ry="5.5" />
      <ellipse cx="12" cy="12" rx="4.5" ry="2.8" fill="#1c1c1c" fillOpacity="0.15" />
    </svg>
  )
}

function Home() {
  const [analysis, setAnalysis] = useState(null)
  const [analysisState, setAnalysisState] = useState('loading') // loading | done | error

  useEffect(() => {
    async function runLiveDetection() {
      try {
        const imgRes = await fetch(heroImage)
        const imgBlob = await imgRes.blob()

        const formData = new FormData()
        formData.append('image', imgBlob, 'hero.png')

        const res = await fetch('http://localhost:5001/detect', {
          method: 'POST',
          body: formData,
        })
        if (!res.ok) throw new Error('Detection service unavailable')

        const data = await res.json()
        const topConfidence = data.detections.length
          ? Math.max(...data.detections.map((d) => d.confidence))
          : 0

        setAnalysis({
          potholeCount: data.pothole_count,
          severity: data.severity,
          confidence: topConfidence,
          priorityScore: Math.round(data.severityScore * 100),
        })
        setAnalysisState('done')
      } catch (err) {
        console.error('Live AI analysis failed:', err.message)
        setAnalysisState('error')
      }
    }

    runLiveDetection()
  }, [])

  return (
    <div className="app">
      <nav className="navbar">
        <div className="logo">
          <span className="logo-icon"><RoadIcon /></span>
          RoadWatch AI
        </div>

        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#about">About</a>

          <Link to="/report" className="nav-button">
            Report Damage
          </Link>
        </div>
      </nav>

      <main>
        <section className="hero" id="home">
          <div className="hero-content">
            <div className="badge">
              AI-Powered Road Safety Platform
            </div>

            <h1>
              Smarter Roads.
              <br />
              <span>Safer Journeys.</span>
            </h1>

            <p>
              Report potholes and road damage in seconds. Our AI-powered
              system analyzes the damage and automatically prioritizes
              critical issues for faster municipal action.
            </p>

            <div className="hero-buttons">
              <Link to="/report" className="primary-button">
                <CameraIcon size={16} /> Report Road Damage
              </Link>

              <Link to="/dashboard" className="secondary-button">
                View Municipal Dashboard →
              </Link>
            </div>
          </div>

          <div className="hero-visual">
            <div className="ai-card">
              <div className="ai-header">
                <ChipIcon size={14} />
                AI ANALYSIS
                <span className="live-dot"></span>
              </div>

              <div className="road-image-placeholder">
                <img src={heroImage} alt="Road damage example" className="road-image" />
              </div>

              <div className="analysis-row">
                <span>Damage Type</span>
                <strong>Pothole</strong>
              </div>

              <div className="analysis-row">
                <span>Severity</span>
                <strong className="high">
                  {analysisState === 'loading' && 'Analyzing…'}
                  {analysisState === 'error' && 'Offline'}
                  {analysisState === 'done' && analysis.severity.toUpperCase()}
                </strong>
              </div>

              <div className="analysis-row">
                <span>Confidence</span>
                <strong>
                  {analysisState === 'done' ? `${Math.round(analysis.confidence * 100)}%` : '—'}
                </strong>
              </div>

              {analysisState === 'error' ? (
                <div className="priority-box">
                  <span>PRIORITY SCORE</span>
                  <strong>—</strong>
                  <span className="critical">● AI SERVICE OFFLINE — START ml-service/app.py</span>
                </div>
              ) : (
                <div className="priority-box">
                  <span>PRIORITY SCORE</span>
                  <strong>{analysisState === 'done' ? `${analysis.priorityScore}/100` : '···'}</strong>
                  <span className="critical">
                    {analysisState === 'done' ? '● LIVE AI RESULT' : '● RUNNING MODEL…'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="stats">
          <div className="stat-card">
            <h2>10K+</h2>
            <p>Road Reports</p>
          </div>

          <div className="stat-card">
            <h2>94%</h2>
            <p>AI Detection Accuracy</p>
          </div>

          <div className="stat-card">
            <h2>60%</h2>
            <p>Faster Prioritization</p>
          </div>

          <div className="stat-card">
            <h2>24/7</h2>
            <p>Citizen Reporting</p>
          </div>
        </section>

        <section className="how-it-works" id="how-it-works">
          <div className="section-heading">
            <span>HOW IT WORKS</span>
            <h2>From Report to Repair</h2>

            <p>
              An intelligent workflow that transforms citizen reports into
              actionable municipal tasks.
            </p>
          </div>

          <div className="steps">
            <div className="step-card">
              <div className="step-number">01</div>
              <div className="step-icon"><CameraIcon /></div>
              <h3>Report Damage</h3>
              <p>
                Citizens upload a photo of the pothole or damaged road.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">02</div>
              <div className="step-icon"><PinIcon /></div>
              <h3>Capture Location</h3>
              <p>
                GPS automatically captures the exact location of the damage.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">03</div>
              <div className="step-icon"><ScanIcon /></div>
              <h3>AI Analysis</h3>
              <p>
                YOLO-based AI detects road damage and estimates severity.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">04</div>
              <div className="step-icon"><BarrierIcon /></div>
              <h3>Auto-Prioritize</h3>
              <p>
                Severity, traffic density and location determine repair
                priority.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Home