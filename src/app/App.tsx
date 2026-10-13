import { Backdrop } from '@/components/Backdrop/Backdrop'
import { ExplodedView } from '@/components/ExplodedView/ExplodedView'
import { Features } from '@/components/Features/Features'
import { Finishes } from '@/components/Finishes/Finishes'
import { Footer } from '@/components/Footer/Footer'
import { Header } from '@/components/Header/Header'
import { Hero } from '@/components/Hero/Hero'
import { SurfaceRipple } from '@/components/LivingSurface/SurfaceRipple'
import { LineDraw } from '@/components/LineDraw/LineDraw'
import { Numbers } from '@/components/Numbers/Numbers'
import { Reserve } from '@/components/Reserve/Reserve'
import { StickyCta } from '@/components/StickyCta/StickyCta'
import { headerCopy } from '@/content/copy'
import { usePointerHover } from '@/hooks/usePointerHover'
import styles from './App.module.scss'

export function App() {
  usePointerHover()

  return (
    <>
      <a className={styles.skipLink} href="#main">
        {headerCopy.skipLink}
      </a>
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
    </>
  )
}
