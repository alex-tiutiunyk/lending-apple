import type { MouseEvent } from 'react'
import { A11yPanel } from '@/components/A11yPanel/A11yPanel'
import { Backdrop } from '@/components/Backdrop/Backdrop'
import { ExplodedView } from '@/components/ExplodedView/ExplodedView'
import { Features } from '@/components/Features/Features'
import { Finishes } from '@/components/Finishes/Finishes'
import { Footer } from '@/components/Footer/Footer'
import { Header } from '@/components/Header/Header'
import { Hero } from '@/components/Hero/Hero'
import { LineDraw } from '@/components/LineDraw/LineDraw'
import { SurfaceRipple } from '@/components/LivingSurface/SurfaceRipple'
import { MascotSlot } from '@/components/Mascot/MascotSlot'
import { RunawayLettersSlot } from '@/components/RunawayLetters/RunawayLettersSlot'
import { Numbers } from '@/components/Numbers/Numbers'
import { Reserve } from '@/components/Reserve/Reserve'
import { StickyCta } from '@/components/StickyCta/StickyCta'
import { headerCopy } from '@/content/copy'
import { useDocumentProgress } from '@/hooks/useDocumentProgress'
import { usePointerHover } from '@/hooks/usePointerHover'
import styles from './App.module.scss'

function skipToMain(event: MouseEvent<HTMLAnchorElement>) {
  const main = document.getElementById('main')
  if (!main) return
  event.preventDefault()
  main.scrollIntoView({ behavior: 'instant' })
  main.focus({ preventScroll: true })
}

export function App() {
  usePointerHover()
  useDocumentProgress()

  return (
    <>
      <a className={styles.skipLink} href="#main" onClick={skipToMain}>
        {headerCopy.skipLink}
      </a>
      <A11yPanel />
      <Backdrop />
      <Header />
      <main id="main" className={styles.main} tabIndex={-1}>
        <Hero />
        <LineDraw />
        <ExplodedView />
        <Numbers />
        <Features />
        <Finishes />
        <Reserve />
      </main>
      <Footer />
      <StickyCta />
      <SurfaceRipple />
      <MascotSlot />
      <RunawayLettersSlot />
    </>
  )
}
