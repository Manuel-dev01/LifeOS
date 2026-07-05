import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'

const Landing = lazy(() => import('./landing/Landing'))
const Workspace = lazy(() => import('./app/Workspace'))

export default function App() {
  return (
    <Suspense fallback={<div className="h-screen w-screen bg-ink" />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/app" element={<Workspace />} />
      </Routes>
    </Suspense>
  )
}
