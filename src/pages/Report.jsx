import { useState } from 'react'

function Report() {
  const [image, setImage] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [location, setLocation] = useState(null)
  const [locationStatus, setLocationStatus] = useState('idle') // idle | loading | done | error
  const [submitStatus, setSubmitStatus] = useState('idle') // idle | submitting | success | error

  function handleImageChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setImage(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  function captureLocation() {
    if (!navigator.geolocation) {
      setLocationStatus('error')
      return
    }
    setLocationStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        })
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

      const data = await res.json()
      console.log('Server response:', data)

      setSubmitStatus('success')
    } catch (err) {
      console.error(err)
      setSubmitStatus('error')
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '1.5rem' }}>
      <h1>Report Road Damage</h1>
      <p>Upload a photo of the pothole and share your location.</p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>
            Photo
          </label>
          <input type="file" accept="image/*" capture="environment" onChange={handleImageChange} />
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Preview"
              style={{ marginTop: '0.75rem', width: '100%', borderRadius: 8 }}
            />
          )}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>
            Location
          </label>
          <button type="button" onClick={captureLocation}>
            {locationStatus === 'loading' ? 'Getting location…' : 'Capture current location'}
          </button>
          {locationStatus === 'done' && location && (
            <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
              Lat: {location.lat.toFixed(5)}, Lng: {location.lng.toFixed(5)}
            </p>
          )}
          {locationStatus === 'error' && (
            <p style={{ fontSize: '0.85rem', color: 'crimson', marginTop: '0.5rem' }}>
              Couldn't get location. Please allow location access and try again.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={!image || !location || submitStatus === 'submitting'}
        >
          {submitStatus === 'submitting' ? 'Submitting…' : 'Submit Report'}
        </button>

        {submitStatus === 'success' && (
          <p style={{ color: 'green', marginTop: '0.75rem' }}>
            Report submitted! Thank you for helping improve the roads.
          </p>
        )}
        {submitStatus === 'error' && (
          <p style={{ color: 'crimson', marginTop: '0.75rem' }}>
            Something went wrong. Please try again.
          </p>
        )}
      </form>
    </div>
  )
}

export default Report