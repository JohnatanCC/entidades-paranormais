// A câmera do editor, no estilo do modo construção do The Sims: gira em volta de um ponto no chão do andar,
// aproxima e afasta, e arrasta. O botão esquerdo fica livre para as ferramentas.
//   botão direito arrasta = gira · botão do meio (ou Shift + direito) arrasta = move · rodinha = aproxima
//   WASD ou setas = move · Q / E = gira · + / − = aproxima
//   duplo clique com o botão DIREITO (ou F com o mouse em cima) = centraliza no ponto · Home = volta ao começo do mapa
//   (o esquerdo é das ferramentas: um duplo clique esquerdo poria piso ou objeto sem querer)
// A cada quadro ela também passa para o corte das paredes (render/corte.ts) o ponto que olha e de que lado está.
import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { CORTE } from '../render/corte'

interface Props {
  ativa?: boolean // false = parada (o Testar está usando a câmera); guarda onde estava para voltar igual
  y: number // a altura do chão do andar escolhido (a câmera sobe e desce junto, suave)
  inicio: [number, number] // onde a câmera começa (x, z); mudou = recentra (abrir outro mapa)
}

const PITCH_MIN = 0.2, PITCH_MAX = 1.5, DIST_MIN = 3, DIST_MAX = 90

export function EditorCamera({ y, inicio, ativa = true }: Props) {
  const { camera, gl } = useThree()
  const st = useRef({ tx: inicio[0], tz: inicio[1], ty: y, yaw: Math.PI / 4, pitch: 0.85, dist: 22, foco: null as [number, number] | null })
  const ativaRef = useRef(ativa)
  ativaRef.current = ativa
  const yRef = useRef(y)
  yRef.current = y
  const teclas = useRef(new Set<string>())

  const [ix, iz] = inicio
  useEffect(() => { st.current.tx = ix; st.current.tz = iz; st.current.foco = null }, [ix, iz])

  useEffect(() => {
    const el = gl.domElement
    let modo: 'girar' | 'mover' | null = null, lx = 0, ly = 0, mx = 0, my = 0
    // o ponto do chão do andar sob o mouse (para centralizar a câmera nele)
    const ray = new THREE.Raycaster(), plano = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), p = new THREE.Vector3()
    const pontoNoChao = (cx: number, cy: number) => {
      const r = el.getBoundingClientRect()
      ray.setFromCamera(new THREE.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1), camera)
      plano.constant = -yRef.current
      return ray.ray.intersectPlane(plano, p) ? ([p.x, p.z] as [number, number]) : null
    }
    const centrar = (cx: number, cy: number) => { const q = pontoNoChao(cx, cy); if (q) st.current.foco = q }
    // o duplo clique direito: dois cliques do botão direito sem arrastar, em menos de 0,35 s
    let dx0 = 0, dy0 = 0, ultimoDireito = 0
    const direitoSoltou = (e: PointerEvent) => {
      if (e.button !== 2 || Math.hypot(e.clientX - dx0, e.clientY - dy0) > 4) return
      const agora = performance.now()
      if (agora - ultimoDireito < 350) { centrar(e.clientX, e.clientY); ultimoDireito = 0 } else ultimoDireito = agora
    }
    const onde = (e: PointerEvent) => { mx = e.clientX; my = e.clientY }
    const down = (e: PointerEvent) => {
      if (!ativaRef.current) return
      if (e.button === 1 || (e.button === 2 && e.shiftKey)) modo = 'mover'
      else if (e.button === 2) modo = 'girar'
      else return
      lx = e.clientX; ly = e.clientY; dx0 = e.clientX; dy0 = e.clientY
      el.setPointerCapture(e.pointerId)
      e.preventDefault()
    }
    const move = (e: PointerEvent) => {
      if (!modo) return
      const dx = e.clientX - lx, dy = e.clientY - ly, s = st.current
      lx = e.clientX; ly = e.clientY
      st.current.foco = null // mexeu na câmera: cancela a ida até o ponto
      if (modo === 'girar') {
        s.yaw -= dx * 0.006
        s.pitch = Math.min(PITCH_MAX, Math.max(PITCH_MIN, s.pitch + dy * 0.005))
      } else {
        // pega o chão e arrasta: o ponto sob o mouse acompanha o mouse
        const kk = s.dist * 0.0016, sy = Math.sin(s.yaw), cy = Math.cos(s.yaw)
        s.tx += -cy * dx * kk - sy * dy * kk
        s.tz += sy * dx * kk - cy * dy * kk
      }
    }
    const up = (e: PointerEvent) => { if (modo) { modo = null; if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId) } }
    const wheel = (e: WheelEvent) => {
      if (!ativaRef.current) return
      e.preventDefault()
      const s = st.current
      s.dist = Math.min(DIST_MAX, Math.max(DIST_MIN, s.dist * Math.exp(e.deltaY * 0.0012)))
    }
    const menu = (e: Event) => e.preventDefault()
    const campo = (e: KeyboardEvent) => e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement
    const kd = (e: KeyboardEvent) => {
      if (!ativaRef.current || campo(e) || e.ctrlKey || e.metaKey || e.altKey) return
      teclas.current.add(e.code)
      if (e.code === 'KeyF') centrar(mx, my)
      if (e.code === 'Home') st.current.foco = [ix, iz]
    }
    const ku = (e: KeyboardEvent) => teclas.current.delete(e.code)
    const blur = () => teclas.current.clear()
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointermove', onde)
    el.addEventListener('pointerup', direitoSoltou)
    el.addEventListener('pointerup', up)
    el.addEventListener('wheel', wheel, { passive: false })
    el.addEventListener('contextmenu', menu)
    window.addEventListener('keydown', kd)
    window.addEventListener('keyup', ku)
    window.addEventListener('blur', blur)
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointermove', onde)
      el.removeEventListener('pointerup', direitoSoltou)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('wheel', wheel)
      el.removeEventListener('contextmenu', menu)
      window.removeEventListener('keydown', kd)
      window.removeEventListener('keyup', ku)
      window.removeEventListener('blur', blur)
    }
  }, [gl, camera, ix, iz])

  useFrame((_, dtRaw) => {
    if (!ativaRef.current) { teclas.current.clear(); return }
    const dt = Math.min(dtRaw, 0.1), s = st.current, t = teclas.current
    const fwd = (t.has('KeyW') || t.has('ArrowUp') ? 1 : 0) - (t.has('KeyS') || t.has('ArrowDown') ? 1 : 0)
    const dir = (t.has('KeyD') || t.has('ArrowRight') ? 1 : 0) - (t.has('KeyA') || t.has('ArrowLeft') ? 1 : 0)
    const gira = (t.has('KeyE') ? 1 : 0) - (t.has('KeyQ') ? 1 : 0)
    const zoom = (t.has('Minus') || t.has('NumpadSubtract') ? 1 : 0) - (t.has('Equal') || t.has('NumpadAdd') ? 1 : 0)
    if (fwd || dir) s.foco = null
    if (s.foco) { // indo até o ponto escolhido, suave
      const k = 1 - Math.exp(-7 * dt)
      s.tx += (s.foco[0] - s.tx) * k; s.tz += (s.foco[1] - s.tz) * k
      if (Math.hypot(s.foco[0] - s.tx, s.foco[1] - s.tz) < 0.01) s.foco = null
    }
    if (fwd || dir) {
      const v = s.dist * 0.8 * dt, sy = Math.sin(s.yaw), cy = Math.cos(s.yaw)
      s.tx += (-sy * fwd + cy * dir) * v
      s.tz += (-cy * fwd - sy * dir) * v
    }
    if (gira) s.yaw += gira * 1.6 * dt
    if (zoom) s.dist = Math.min(DIST_MAX, Math.max(DIST_MIN, s.dist * Math.exp(zoom * 1.5 * dt)))
    s.ty += (y - s.ty) * (1 - Math.exp(-8 * dt))
    const h = Math.cos(s.pitch) * s.dist
    camera.position.set(s.tx + Math.sin(s.yaw) * h, s.ty + Math.sin(s.pitch) * s.dist, s.tz + Math.cos(s.yaw) * h)
    camera.lookAt(s.tx, s.ty, s.tz)
    // o corte das paredes: o que fica entre a câmera e este ponto abaixa (no modo recortadas)
    CORTE.alvo.value.set(s.tx, s.tz)
    CORTE.dir.value.set(Math.sin(s.yaw), Math.cos(s.yaw))
    CORTE.base.value = y
  })

  return null
}
