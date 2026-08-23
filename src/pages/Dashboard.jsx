import { useEffect, useState } from 'react'
import './pages.css'

const STATUS_OPTIONS = ['reported', 'verified', 'in_progress', 'resolved']

function MapIcon() {
  return (
    <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 4l-5 2v14l5-2 6 2 5-2V4l-5 2-6-2z" strokeLinejoin="round" />
      <path d="M9 4v14M15 6v14" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg className="btn-icon spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 24, height: 24 }}>
      <path d="M12 3a9 9 0 100 18" strokeLinecap="round" />
    </svg>
  )
}

async function fetchReports() {
  const res = await fetch('http://localhost:5000/api/reports')
  if (!res.ok) throw new Error('Failed to load reports')
  return res.json()
}

async function updateReportStatus(id, status) {
  await fetch(`http://localhost:5000/api/reports/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  return true
}

function Dashboard() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('priorityScore')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    fetchReports().then((data) => {
      setReports(data)
      setLoading(false)
    })
  }, [])

  async function handleStatusChange(id, newStatus) {
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)))
    await updateReportStatus(id, newStatus)
  }

  const visibleReports = reports
    .filter((r) => filterStatus === 'all' || r.status === filterStatus)
    .sort((a, b) => b[sortBy] - a[sortBy])

  const severeCount = reports.filter((r) => r.severity === 'severe').length
  const unresolvedCount = reports.filter((r) => r.status !== 'resolved').length
  const avgPriority = reports.length
    ? Math.round(reports.reduce((sum, r) => sum + r.priorityScore, 0) / reports.length)
    : 0

  return (
    <div className="page">
      <div className="page-inner page-inner--wide">
        <span className="page-eyebrow">Municipal Log</span>
        <h1 className="page-title">
          What needs <span className="page-title-accent">fixing first</span>
        </h1>
        <p className="page-subtitle">
          Every report below has been scored by an AI model and cross-checked against the road it's
          on — so the worst damage on the busiest roads rises to the top.
        </p>

        {loading ? (
          <div className="card loading-state">
            <SpinnerIcon />
            Pulling in the latest reports…
          </div>
        ) : (
          <>
            <div className="stats-row">
              <div className="stat-card">
                <div className="stat-value stat-value--default">{reports.length}</div>
                <div className="stat-label">Total Reports</div>
              </div>
              <div className="stat-card">
                <div className="stat-value stat-value--severe">{severeCount}</div>
                <div className="stat-label">Severe</div>
              </div>
              <div className="stat-card">
                <div className="stat-value stat-value--accent">{unresolvedCount}</div>
                <div className="stat-label">Awaiting Repair</div>
              </div>
              <div className="stat-card">
                <div className="stat-value stat-value--default">{avgPriority || '—'}</div>
                <div className="stat-label">Avg. Priority</div>
              </div>
            </div>

            <div className="controls-row">
              <div className="control-group">
                <span>Sort by</span>
                <select className="select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="priorityScore">Priority</option>
                  <option value="severityScore">Severity</option>
                  <option value="reportedCount">Reports count</option>
                </select>
              </div>

              <div className="control-group">
                <span>Status</span>
                <select className="select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="all">All</option>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="table-wrap">
              {visibleReports.length === 0 ? (
                <div className="empty-state">
                  <MapIcon />
                  <div className="empty-state-title">Nothing here yet</div>
                  <p className="empty-state-text">
                    {reports.length === 0
                      ? "Once citizens start submitting reports, they'll show up here — ranked by urgency automatically."
                      : "No reports match this filter. Try a different status."}
                  </p>
                </div>
              ) : (
                <table className="reports-table">
                  <thead>
                    <tr>
                      <th>Photo</th>
                      <th>Priority</th>
                      <th>Severity</th>
                      <th>Road type</th>
                      <th>Reports</th>
                      <th>Location</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleReports.map((r) => (
                      <tr key={r.id}>
                        <td><img src={r.imageUrl} alt="Pothole" className="thumb" /></td>
                        <td>
                          <span className={`priority-score priority-score--${r.severity}`}>
                            {r.priorityScore}
                          </span>
                        </td>
                        <td><span className={`badge badge-${r.severity}`}>{r.severity}</span></td>
                        <td style={{ textTransform: 'capitalize' }}>{r.roadType}</td>
                        <td>{r.reportedCount}</td>
                        <td className="location-text">{r.lat.toFixed(3)}, {r.lng.toFixed(3)}</td>
                        <td>
                          <select
                            className={`status-select status-${r.status}`}
                            value={r.status}
                            onChange={(e) => handleStatusChange(r.id, e.target.value)}
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>{s.replace('_', ' ')}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Dashboard