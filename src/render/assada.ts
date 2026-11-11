// O interruptor da luz assada (a etapa 3b): o jogo usa a luz que o mapa calcula (maps/luzAssada.ts) no lugar das
// lâmpadas de verdade. Três modos:
//   'nao'    fora do jogo (o editor): as lâmpadas de verdade iluminam tudo, como sempre;
//   'assada' Baixo: nada faz a conta de nenhuma lâmpada de verdade (é onde o celular ganha);
//   'mista'  Médio e Alto: só as lâmpadas que fazem sombra são de verdade (COM_SOMBRA diz quais, pelo número de cada
//            uma); as outras vêm da luz assada. Assim nenhuma lâmpada vaza pela parede: ou tem sombra, ou é assada.
// Vale para dois tipos de material:
//   - o cenário (paredes, pisos, tetos, escadas): a luz vem em cada vértice da malha (aplicarAssada);
//   - os objetos (móveis, portas, janelas, personagens, armas): a luz é uma amostra só para o objeto inteiro, tirada
//     no lugar onde ele está (aplicarLuzObjeto + iluminarObjeto). Sem direção: o objeto clareia por igual.
// A luz das janelas vem sempre daqui. As lâmpadas "falhando" piscam todas juntas no jogo (um número só).
import { ShaderChunk, Vector3, Vector4, type Material, type Mesh, type Object3D } from 'three'
import type { LuzVertice } from '../maps/luzAssada'
import { anotar, clonar } from './remendos'

export type ModoAssada = 'nao' | 'assada' | 'mista'
// indireta: 1 = o cenário e os objetos somam a luz indireta do mapa (o recurso "Luz indireta"); 0 = não
export const ASSADA = { modo: 'nao' as ModoAssada, pisca: { value: 1 }, comSombra: { value: new Vector3() }, indireta: { value: 0 } }
const DEFINE: Record<ModoAssada, string | null> = { nao: null, assada: 'LUZ_ASSADA', mista: 'LUZ_MISTA' }
const materiais = new Set<Material>()

/** O pisca-pisca das lâmpadas que falham, no instante t: 1 = acesa; a maior parte do tempo acesa, com quedas curtas. */
export const piscaEm = (t: number) => (Math.sin(t * 13.1) * Math.sin(t * 7.3 + 1.7) * Math.sin(t * 2.9) > 0.35 ? 0.07 : 1)

// o trecho das luzes do three, mudado em dois lugares: no modo assada pula as luzes pontuais inteiras; no misto, só
// entra a luz pontual que tem sombra (o three põe as que fazem sombra primeiro na lista)
const PONTUAIS = '#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )'
const SOMA = /(getPointShadow\([^\n]*\n\s*#endif\s*\n\s*)(RE_Direct\( directLight, [^\n]*\n)/
const LUZES = ShaderChunk.lights_fragment_begin
  .replace(PONTUAIS, PONTUAIS + ' && ! defined( LUZ_ASSADA )')
  .replace(SOMA, '$1#if ! defined( LUZ_MISTA ) || ( defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) )\n\t\t$2\t\t#endif\n')
if (!LUZES.includes('LUZ_ASSADA') || !LUZES.includes('LUZ_MISTA')) console.error('assada.ts: o trecho das luzes do three mudou; a luz assada não vai funcionar')

// uma das duas lâmpadas mais fortes (do vértice ou do objeto): fora da conta se ela é de verdade agora (tem sombra);
// pisca se está falhando
const LAMPADA = `uniform float uPisca; uniform float uIndireta; uniform vec3 uComSombra; varying vec3 vLuzMalha; varying vec3 vLuzIndireta;
vec3 lampadaDaMalha( vec4 l ) { float id = abs( l.a ); return ( id == uComSombra.x || id == uComSombra.y || id == uComSombra.z ) ? vec3( 0.0 ) : l.rgb * ( l.a < 0.0 ? uPisca : 1.0 ); }
`
interface LuzObjeto { a: { value: Vector4 }; b: { value: Vector4 }; resto: { value: Vector3 }; indireta: { value: Vector3 } }
const doObjeto = new WeakMap<Material, LuzObjeto>()

function remendar(mat: Material, objeto: LuzObjeto | null) {
  const prev = mat.onBeforeCompile
  mat.onBeforeCompile = (s, r) => {
    prev?.call(mat, s, r)
    s.uniforms.uPisca = ASSADA.pisca
    s.uniforms.uComSombra = ASSADA.comSombra
    s.uniforms.uIndireta = ASSADA.indireta
    if (objeto) { s.uniforms.uObjA = objeto.a; s.uniforms.uObjB = objeto.b; s.uniforms.uObjResto = objeto.resto; s.uniforms.uObjIndireta = objeto.indireta }
    const dados = objeto ? 'uniform vec4 uObjA; uniform vec4 uObjB; uniform vec3 uObjResto; uniform vec3 uObjIndireta;\n' : 'attribute vec4 luzA; attribute vec4 luzB; attribute vec3 luzResto; attribute vec3 luzJanela; attribute vec3 luzIndireta;\n'
    const soma = objeto
      ? 'vLuzIndireta = uObjIndireta * uIndireta;\nvLuzMalha = vec3( 0.0 );\n#if defined( LUZ_ASSADA ) || defined( LUZ_MISTA )\nvLuzMalha = uObjResto + lampadaDaMalha( uObjA ) + lampadaDaMalha( uObjB );\n#endif'
      : 'vLuzIndireta = luzIndireta * uIndireta;\nvLuzMalha = luzJanela;\n#if defined( LUZ_ASSADA ) || defined( LUZ_MISTA )\nvLuzMalha += luzResto + lampadaDaMalha( luzA ) + lampadaDaMalha( luzB );\n#endif'
    s.vertexShader = dados + LAMPADA + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n' + soma)
    s.fragmentShader = 'varying vec3 vLuzMalha; varying vec3 vLuzIndireta;\n' + s.fragmentShader
      .replace('#include <lights_fragment_begin>', LUZES)
      .replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\nreflectedLight.directDiffuse += vLuzMalha * BRDF_Lambert( material.diffuseColor );\nreflectedLight.indirectDiffuse += vLuzIndireta * BRDF_Lambert( material.diffuseColor );')
  }
  mat.customProgramCacheKey = () => (objeto ? 'assada-objeto' : 'assada')
  const d = DEFINE[ASSADA.modo]
  if (d) mat.defines = { ...mat.defines, [d]: '' }
  materiais.add(mat)
}

/** Ensina um material do cenário a usar a luz da malha (luzA, luzB, luzResto, luzJanela). */
export function aplicarAssada<M extends Material>(mat: M): M {
  remendar(mat, null)
  return anotar(mat, aplicarAssada as (m: Material) => unknown)
}

/** Ensina um material de objeto (móvel, porta, personagem) a usar a luz assada do lugar dele (iluminarObjeto diz qual). */
export function aplicarLuzObjeto<M extends Material>(mat: M): M {
  const luz: LuzObjeto = { a: { value: new Vector4() }, b: { value: new Vector4() }, resto: { value: new Vector3() }, indireta: { value: new Vector3() } }
  doObjeto.set(mat, luz)
  remendar(mat, luz)
  return anotar(mat, aplicarLuzObjeto as (m: Material) => unknown)
}

/** Dá a este objeto materiais só dele (os modelos repetidos dividem o material, e a luz é de cada lugar). A geometria
 *  e a textura continuam divididas. Devolve como descartar as cópias. */
export function materiaisDoObjeto(raiz: Object3D): () => void {
  const copias = new Map<Material, Material>()
  raiz.traverse((o) => {
    const m = (o as Mesh).material as Material | undefined
    if (!m || Array.isArray(m) || !doObjeto.has(m)) return
    let c = copias.get(m)
    if (!c) copias.set(m, (c = clonar(m)))
    ;(o as Mesh).material = c
  })
  return () => { for (const c of copias.values()) { materiais.delete(c); c.dispose() } }
}

/** A luz assada do lugar onde o objeto está (a amostra de maps/luzAssada.ts), para todos os materiais dele. */
export function iluminarObjeto(raiz: Object3D, luz: LuzVertice) {
  raiz.traverse((o) => {
    const u = doObjeto.get((o as Mesh).material as Material)
    if (!u) return
    u.a.value.fromArray(luz.a); u.b.value.fromArray(luz.b)
    u.resto.value.set(luz.resto[0] + luz.janela[0], luz.resto[1] + luz.janela[1], luz.resto[2] + luz.janela[2])
    u.indireta.value.fromArray(luz.indireta)
  })
}

/** Troca o modo da luz assada em tudo (os materiais são refeitos: é raro, ao entrar no jogo ou trocar o nível). */
export function luzAssada(modo: ModoAssada) {
  if (ASSADA.modo === modo) return
  ASSADA.modo = modo
  ASSADA.comSombra.value.set(0, 0, 0)
  for (const m of materiais) {
    const d = { ...m.defines }
    delete d.LUZ_ASSADA; delete d.LUZ_MISTA
    const novo = DEFINE[modo]
    if (novo) d[novo] = ''
    m.defines = d; m.needsUpdate = true
  }
}
