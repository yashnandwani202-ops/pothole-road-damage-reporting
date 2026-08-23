import { useState, useRef } from 'react'
import './pages.css'

function CameraIcon() {
  return (
    <svg className="dropzone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z" strokeLinejoin="round"/>
      <circle cx="12" cy="14" r="3.5" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 21s7-6.2 7-11.2A7 7 0 105 9.8C5 14.8 12 21 12 21z" strokeLinejoin="round" />
      <circle cx="12" cy="9.5" r="2.3" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg className="btn-icon spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 3a9 9 0 100 18" strokeLinecap="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="success-panel-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5l2.3 2.3L15.5 9.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Report() {
  const [image, setImage] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [location, setLocation] = useState(null)
  const [locationStatus, setLocationStatus] = useState('idle')
  const [submitStatus, setSubmitStatus] = useState('idle')
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)

  function setImageFile(file) {
    if (!file) return
    setImage(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  function handleImageChange(e) {
    setImageFile(e.target.files[0])
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) setImageFile(file)
  }

  function removeImage(e) {
    e.stopPropagation()
    setImage(null)
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function captureLocation() {
    if (!navigator.geolocation) {
      setLocationStatus('error')
      return
    }
    setLocationStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocationStatus('done')
      },
      () => setLocationStatus('error'),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!image || !location) return

    setSubmitStatus('submitting')

    const formData = new FormData()
    formData.append('image', image)
    formData.append('lat', location.lat)
    formData.append('lng', location.lng)
    formData.append('timestamp', new Date().toISOString())

    try {
      const res = await fetch('http://localhost:5000/api/reports', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error('Upload failed')
      await res.json()
      setSubmitStatus('success')
    } catch (err) {
      console.error(err)
      setSubmitStatus('error')
    }
  }

  return (
    <div className="page">
      <div className="page-inner">
        <span className="page-eyebrow">Field Report</span>
        <h1 className="page-title">
          Spotted a <span className="page-title-accent">pothole?</span>
        </h1>
        <p className="page-subtitle">
          Snap a photo, share where it is, and we'll get it in front of the people who fix roads —
          ranked by how bad it actually is.
        </p>

        <form onSubmit={handleSubmit} className="card">
          <div className="field">
            <label className="field-label">Photo of the damage</label>

            {previewUrl ? (
              <div className="image-preview-wrap">
                <img src={previewUrl} alt="Preview" className="image-preview" />
                <button className="image-preview-remove" onClick={removeImage} type="button">
                  Remove
                </button>
              </div>
            ) : (
              <div
                className={`dropzone ${dragActive ? 'dropzone--active' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
              >
                <CameraIcon />
                <div className="dropzone-title">Drag a photo here, or tap to choose one</div>
                <div className="dropzone-subtitle">JPG or PNG · your phone's camera works great for this</div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageChange}
                />
              </div>
            )}
          </div>

          <div className="field">
            <label className="field-label">Where is it?</label>
            <div className="location-box">
              <button type="button" className="btn btn-secondary location-pin-btn" onClick={captureLocation}>
                {locationStatus === 'loading' ? <SpinnerIcon /> : <PinIcon />}
                {locationStatus === 'loading' ? 'Finding you…' : 'Use my current location'}
              </button>
              {locationStatus === 'done' && location && (
                <span className="location-coords">
                  {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                </span>
              )}
              {locationStatus === 'error' && (
                <span className="status-line status-line--error">
                  Couldn't get your location — check your browser's location permission and try again.
                </span>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={!image || !location || submitStatus === 'submitting'}
          >
            {submitStatus === 'submitting' && <SpinnerIcon />}
            {submitStatus === 'submitting' ? 'Sending it in…' : 'Submit Report'}
          </button>

          {submitStatus === 'success' && (
            <div className="success-panel">
              <CheckIcon />
              <div>
                <p className="success-panel-title">Nice catch — it's on the map.</p>
                <p className="success-panel-text">
                  Your report is now visible to municipal staff, ranked alongside everything else by urgency.
                </p>
              </div>
            </div>
          )}
          {submitStatus === 'error' && (
            <p className="status-line status-line--error">
              Something went wrong on our end. Mind trying again in a moment?
            </p>
          )}
        </form>
      </div>
    </div>
  )
}

export default Report