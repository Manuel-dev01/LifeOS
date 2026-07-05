import axios from 'axios'

const api = axios.create({ baseURL: 'http://localhost:8000' })

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

// Dynamic insight endpoints (extracted from real memories)
export const getPeople = () => api.get('/people')
export const getPerson = (name) => api.get(`/people/${encodeURIComponent(name)}`)
export const getTimeline = () => api.get('/timeline')
export const getGraph = () => api.get('/graph')

// Settings
export const deleteVault = () => api.delete('/vault')
export const exportVault = () => api.get('/export')

export default api
