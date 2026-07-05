import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import Logo, { Wordmark } from '../components/Logo'
import Sidebar from './Sidebar'
import Onboarding from './Onboarding'
import AskView from './AskView'
import GraphView from './GraphView'
import TimelineView from './TimelineView'
import PeopleView from './PeopleView'
import PersonView from './PersonView'
import SourcesView from './SourcesView'
import SettingsView from './SettingsView'
import { getDatasets, getHealth } from '../api'

export default function Workspace() {
  const [view, setView] = useState('ask')
  const [onboarding, setOnboarding] = useState(true)
  const [datasets, setDatasets] = useState([])
  const [health, setHealth] = useState(null)
  const [activePerson, setActivePerson] = useState(null)
  const [toast, setToast] = useState(null)
  const [identityKey, setIdentityKey] = useState(0)
  const [navOpen, setNavOpen] = useState(false)
  // Chat lives here (not in AskView) so the conversation persists across tabs.
  const [chatMessages, setChatMessages] = useState([])
  const [chatLoading, setChatLoading] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()

  const refreshDatasets = useCallback(async () => {
    try {
      const { data } = await getDatasets()
      setDatasets(data)
    } catch {
      /* offline handled by health dot */
    }
  }, [])

  useEffect(() => {
    refreshDatasets()
    getHealth()
      .then(({ data }) => setHealth(data))
      .catch(() => setHealth({ ok: false }))
  }, [refreshDatasets])

  // Handle the OAuth redirect back from a connector.
  useEffect(() => {
    const connected = searchParams.get('connected')
    const err = searchParams.get('connect_error')
    if (connected) {
      const count = searchParams.get('count')
      setOnboarding(false)
      setView('ask')
      setToast({ ok: true, text: `${connected} connected${count ? ` · ${count} memories imported` : ''}` })
      refreshDatasets()
      setIdentityKey((k) => k + 1)
      setSearchParams({}, { replace: true })
    } else if (err) {
      setToast({ ok: false, text: `Connect failed: ${err}` })
      setSearchParams({}, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(t)
  }, [toast])

  const openPerson = (name) => {
    setActivePerson(name)
    setView('person')
  }

  const nav = (v) => {
    setActivePerson(null)
    setView(v)
    setNavOpen(false)
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-paper-2 text-ink-900">
      {/* mobile drawer backdrop */}
      {navOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setNavOpen(false)} />
      )}

      <Sidebar
        view={view}
        onNav={nav}
        health={health}
        identityKey={identityKey}
        mobileOpen={navOpen}
        onClose={() => setNavOpen(false)}
        onReplayOnboarding={() => {
          setOnboarding(true)
          setNavOpen(false)
        }}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-[#e2e4ea] bg-paper-2 shrink-0">
          <button
            onClick={() => setNavOpen(true)}
            className="p-1.5 -ml-1.5 text-ink-900"
            aria-label="Open menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <Logo size={20} />
            <Wordmark className="text-[15px] text-ink-900" />
          </div>
        </div>

        <main className="flex-1 min-w-0 bg-paper overflow-hidden flex flex-col">
          {view === 'ask' && (
            <AskView
              onOpenGraph={() => nav('graph')}
              messages={chatMessages}
              setMessages={setChatMessages}
              loading={chatLoading}
              setLoading={setChatLoading}
            />
          )}
          {view === 'graph' && <GraphView />}
          {view === 'timeline' && <TimelineView />}
          {view === 'people' && <PeopleView onOpenPerson={openPerson} />}
          {view === 'person' && (
            <PersonView name={activePerson} onBack={() => nav('people')} />
          )}
          {view === 'sources' && (
            <SourcesView datasets={datasets} onChange={refreshDatasets} />
          )}
          {view === 'settings' && <SettingsView onChange={refreshDatasets} />}
        </main>
      </div>

      {onboarding && (
        <Onboarding
          onDone={() => {
            setOnboarding(false)
            refreshDatasets()
            nav('ask')
          }}
          onDatasets={refreshDatasets}
        />
      )}

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-xl px-4 py-3 text-[13px] text-white shadow-lg ${
            toast.ok ? 'bg-meeting-dk' : 'bg-danger'
          }`}
        >
          {toast.text}
        </div>
      )}
    </div>
  )
}
