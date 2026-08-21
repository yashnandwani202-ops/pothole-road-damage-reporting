import { Link } from 'react-router-dom'
import '../App.css'

function Home() {
  return (
    <div className="app">
      <nav className="navbar">
        <div className="logo">
          <span className="logo-icon">🛣️</span>
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
                📸 Report Road Damage
              </Link>

              <Link to="/dashboard" className="secondary-button">
                View Municipal Dashboard →
              </Link>
            </div>
          </div>

          {/* This is now outside hero-content */}
          <div className="hero-visual">
            <div className="ai-card">
              <div className="ai-header">
                <span>🤖</span>
                AI ANALYSIS
                <span className="live-dot"></span>
              </div>

              <div className="road-image-placeholder">
                🕳️
              </div>

              <div className="analysis-row">
                <span>Damage Type</span>
                <strong>Pothole</strong>
              </div>

              <div className="analysis-row">
                <span>Severity</span>
                <strong className="high">HIGH</strong>
              </div>

              <div className="analysis-row">
                <span>Confidence</span>
                <strong>94%</strong>
              </div>

              <div className="priority-box">
                <span>PRIORITY SCORE</span>
                <strong>91/100</strong>
                <span className="critical">● CRITICAL</span>
              </div>
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
              <div className="step-icon">📸</div>
              <h3>Report Damage</h3>
              <p>
                Citizens upload a photo of the pothole or damaged road.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">02</div>
              <div className="step-icon">📍</div>
              <h3>Capture Location</h3>
              <p>
                GPS automatically captures the exact location of the damage.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">03</div>
              <div className="step-icon">🤖</div>
              <h3>AI Analysis</h3>
              <p>
                YOLO-based AI detects road damage and estimates severity.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">04</div>
              <div className="step-icon">🚧</div>
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