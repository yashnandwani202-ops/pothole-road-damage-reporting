import { useEffect, useState } from 'react'

const STATUS_OPTIONS = ['reported', 'verified', 'in_progress', 'resolved']

const STATUS_COLORS = {
  reported: '#c0392b',
  verified: '#e67e22',
  in_progress: '#2980b9',
  resolved: '#27ae60',
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
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    )
    await updateReportStatus(id, newStatus)
  }

  const visibleReports = reports
    .filter((r) => filterStatus === 'all' || r.status === filterStatus)
    .sort((a, b) => b[sortBy] - a[sortBy])

  if (loading) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <h1>Municipal Dashboard</h1>
        <p>Loading reports…</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem' }}>
      <h1>Municipal Dashboard</h1>
      <p>Priority-ranked road damage reports.</p>

      <div style={{ display: 'flex', gap: '1rem', margin: '1rem 0' }}>
        <label>
          Sort by:{' '}
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="priorityScore">Priority</option>
            <option value="severityScore">Severity</option>
            <option value="reportedCount">Reports count</option>
          </select>
        </label>

        <label>
          Status:{' '}
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
        </label>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '2px solid #444' }}>
            <th style={{ padding: '0.5rem' }}>Photo</th>
            <th style={{ padding: '0.5rem' }}>Priority</th>
            <th style={{ padding: '0.5rem' }}>Severity</th>
            <th style={{ padding: '0.5rem' }}>Road type</th>
            <th style={{ padding: '0.5rem' }}>Reports</th>
            <th style={{ padding: '0.5rem' }}>Location</th>
            <th style={{ padding: '0.5rem' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {visibleReports.map((r) => (
            <tr key={r.id} style={{ borderBottom: '1px solid #333' }}>
              <td style={{ padding: '0.5rem' }}>
                <img src={r.imageUrl} alt="Pothole" style={{ width: 80, borderRadius: 4 }} />
              </td>
              <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>{r.priorityScore}</td>
              <td style={{ padding: '0.5rem', textTransform: 'capitalize' }}>{r.severity}</td>
              <td style={{ padding: '0.5rem', textTransform: 'capitalize' }}>{r.roadType}</td>
              <td style={{ padding: '0.5rem' }}>{r.reportedCount}</td>
              <td style={{ padding: '0.5rem', fontSize: '0.8rem' }}>
                {r.lat.toFixed(3)}, {r.lng.toFixed(3)}
              </td>
              <td style={{ padding: '0.5rem' }}>
                <select
                  value={r.status}
                  onChange={(e) => handleStatusChange(r.id, e.target.value)}
                  style={{ color: STATUS_COLORS[r.status], fontWeight: 'bold' }}
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

      {visibleReports.length === 0 && <p>No reports match this filter.</p>}
    </div>
  )
}

export default Dashboard