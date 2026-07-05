import axios from 'axios'

// Base URL of the deployed FastAPI backend. Set VITE_API_BASE_URL in the Vercel
// project (e.g. https://lifeos-backend.onrender.com); falls back to localhost.
export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const api = axios.create({ baseURL: API_BASE })

export const ingestText = (text, datasetName) =>
  api.post('/ingest/text', { text, dataset_name: datasetName })

export const ingestFile = (file, datasetName = 'upload') => {
  const form = new FormData()
  form.append('file', file)
  return api.post(`/ingest/file?dataset_name=${encodeURIComponent(datasetName)}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const ingestCalendar = (icsText, datasetName = 'calendar') =>
  api.post('/ingest/calendar', { ics_text: icsText, dataset_name: datasetName })

export const queryMemory = (question, includeGraph = false) =>
  api.post('/query', { question, include_graph: includeGraph })

export const improveMemory = () => api.post('/improve', {})

export const forgetDataset = (name) => api.delete(`/forget/${encodeURIComponent(name)}`)

export const getDatasets = () => api.get('/datasets')

export const getHealth = () => api.get('/health')

// Real account identity (from connected accounts), for the sidebar
export const getMe = () => api.get('/me')

// Dynamic insight endpoints (extracted from real memories)
export const getPeople = () => api.get('/people')
export const getPerson = (name) => api.get(`/people/${encodeURIComponent(name)}`)
export const getTimeline = () => api.get('/timeline')
export const getGraph = () => api.get('/graph')

// Settings
export const deleteVault = () => api.delete('/vault')
export const exportVault = () => api.get('/export')

// Connectors / OAuth
export const getConnectors = () => api.get('/connectors')
export const connectUrl = (provider) => `${API_BASE}/auth/${provider}/login`
export const syncConnector = (provider) => api.post(`/connectors/${provider}/sync`)

export default api
