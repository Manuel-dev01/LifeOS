import { useEffect, useState, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import ChatBox from './components/ChatBox'
import MemoryGraph from './components/MemoryGraph'
import { getDatasets, getHealth } from './api'

export default function App() {
  const [datasets, setDatasets] = useState([])
  const [health, setHealth] = useState(null)
  const [graphData, setGraphData] = useState(null)
  const [showGraph, setShowGraph] = useState(false)

  const refreshDatasets = useCallback(async () => {
    try {
      const { data } = await getDatasets()
      setDatasets(data)
    } catch (e) {
      console.error('Failed to load datasets', e)
    }
  }, [])

  useEffect(() => {
    refreshDatasets()
    getHealth()
      .then(({ data }) => setHealth(data))
      .catch(() => setHealth({ ok: false }))
  }, [refreshDatasets])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-vault-bg">
      <Sidebar
        datasets={datasets}
        health={health}
        onChange={refreshDatasets}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-6 py-4 border-b border-vault-border">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-vault-accent2">◎</span> LifeOS
            </h1>
            <p className="text-xs text-slate-400">
              Your AI that never forgets — piece together every decision, email, and meeting.
            </p>
          </div>
          <button
            onClick={() => setShowGraph((s) => !s)}
            className="text-xs px-3 py-1.5 rounded-lg border border-vault-border text-slate-300 hover:bg-vault-panel transition"
          >
            {showGraph ? 'Hide' : 'Show'} Memory Graph
          </button>
        </header>

        <div className="flex-1 flex min-h-0">
          <div className={showGraph ? 'flex-1 min-w-0' : 'w-full'}>
            <ChatBox onGraph={setGraphData} includeGraph={showGraph} />
          </div>
          {showGraph && (
            <div className="w-[38%] border-l border-vault-border min-w-0">
              <MemoryGraph data={graphData} />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
