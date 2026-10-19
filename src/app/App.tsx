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
import { MascotSlot } from '@/components/Mascot/MascotSlot'
import { RunawayLettersSlot } from '@/components/RunawayLetters/RunawayLettersSlot'
import { Numbers } from '@/components/Numbers/Numbers'
import { ProjectDetailsSlot } from '@/components/ProjectDetails/ProjectDetailsSlot'
import { ProjectDetailsTab } from '@/components/ProjectDetails/ProjectDetailsTab'
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

  // Plan 11 §2: the size container is `.page`, never an ancestor of a fixed layer, because
  // WebKit 18 places `position: fixed` against its container. The fixed layers sit in `.under`
  // and `.over`, viewport-sized containers that their `bp.*` queries still find. One `.over`, not
  // two: each paints a window-sized drawing layer in Chromium. The skip link needs no query and
  // stays first.
  return (
    <>
      <a className={styles.skipLink} href="#main" onClick={skipToMain}>
        {headerCopy.skipLink}
      </a>
      <div className={styles.over} data-fixed-layer>
        <A11yPanel />
        <ProjectDetailsTab />
        <StickyCta />
        <MascotSlot />
        <RunawayLettersSlot />
        <ProjectDetailsSlot />
      </div>
      <div className={styles.under}>
        <Backdrop />
      </div>
      <div className={styles.page}>
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
      </div>
    </>
  )
}
