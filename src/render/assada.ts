// O interruptor da luz assada (a etapa 3b): o jogo usa a luz que o mapa calcula (maps/luzAssada.ts) no lugar das
// lâmpadas de verdade. Três modos:
//   'nao'    sem mapa (o Ver modelos): nada da malha;
//   'assada' o editor e o Baixo: nada faz a conta de nenhuma lâmpada de verdade (é onde o celular ganha);
//   'mista'  Médio e Alto: só as lâmpadas que fazem sombra são de verdade (COM_SOMBRA diz quais, pelo número de cada
//            uma); as outras vêm da luz assada. Assim nenhuma lâmpada vaza pela parede: ou tem sombra, ou é assada.
// Vale para dois tipos de material:
//   - o cenário (paredes, pisos, tetos, escadas): a luz vem da malha (aplicarAssada): as duas lâmpadas mais fortes de
//     cada face são contadas em cada pixel; o resto, as janelas e a indireta, em cada vértice;
//   - os objetos (móveis, portas, janelas, personagens, armas): a luz é uma amostra só para o objeto inteiro, tirada
//     no lugar onde ele está (aplicarLuzObjeto + iluminarObjeto). Sem direção: o objeto clareia por igual;
//   - os objetos repetidos juntados numa malha só, no jogo (render/instancias.ts): a amostra de cada cópia vem com
//     ela, nos atributos da instância (aplicarLuzInstancias).
// A luz das janelas vem sempre daqui. As lâmpadas "falhando" piscam todas juntas no jogo (um número só).
// E a lamparina do agente (18/nov: game/player/lamparina.ts), a única luz que anda: não dá para assar, e uma luz de
// verdade do three não entraria (o modo assada pula as pontuais). Ela vem aqui, na conta de cada pixel: a luz em volta
// (a face virada para longe dela fica escura: a parede não deixa passar pelo lado de trás) e o feixe em cone quando
// erguida. Sem sombra (só nos níveis altos, depois): o raio curto esconde o que vazaria.
import { ShaderChunk, Vector3, Vector4, type Material, type Mesh, type Object3D } from 'three'
import { DECAIMENTO, type LuzVertice } from '../maps/luzAssada'
import { anotar, clonar } from './remendos'

export type ModoAssada = 'nao' | 'assada' | 'mista'
// indireta: 1 = o cenário e os objetos somam a luz indireta do mapa (o recurso "Luz indireta"); 0 = não
export const ASSADA = { modo: 'nao' as ModoAssada, pisca: { value: 1 }, comSombra: { value: new Vector3() }, indireta: { value: 0 } }
/** A lamparina: pos = onde (xyz) e o alcance (w, m); cor = a cor × a força (0 = apagada); feixe = para onde (xyz) e o
 *  cosseno da metade da abertura (w); feixeCor = a cor × a força do feixe (0 = abaixada); feixeAlcance = m. */
export const LAMPARINA = { pos: { value: new Vector4(0, -99, 0, 1) }, cor: { value: new Vector3() }, feixe: { value: new Vector4(0, 0, 1, 1) }, feixeCor: { value: new Vector3() }, feixeAlcance: { value: 8 } }
const UNIFORMS_LAMPARINA = 'uniform vec4 uLampPos; uniform vec3 uLampCor; uniform vec4 uLampFeixe; uniform vec3 uLampFeixeCor; uniform float uLampFeixeAlc;\n'
const LUZ_LAMPARINA = `
{
  vec3 pv = - vViewPosition, lv = ( viewMatrix * vec4( uLampPos.xyz, 1.0 ) ).xyz - pv;
  float d = max( length( lv ), 0.05 ); vec3 L = lv / d;
  float nl = max( dot( normal, L ), 0.0 );
  vec3 c = uLampCor * pow( clamp( 1.0 - d / uLampPos.w, 0.0, 1.0 ), 2.0 ) * nl;
  vec3 fv = normalize( ( viewMatrix * vec4( uLampFeixe.xyz, 0.0 ) ).xyz );
  float cone = smoothstep( uLampFeixe.w, mix( uLampFeixe.w, 1.0, 0.35 ), dot( - L, fv ) );
  c += uLampFeixeCor * cone * pow( clamp( 1.0 - d / uLampFeixeAlc, 0.0, 1.0 ), 1.3 ) * nl;
  reflectedLight.directDiffuse += c * BRDF_Lambert( material.diffuseColor );
}
`
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
float pesoDaLampada( float num ) { float id = abs( num ); return ( id == uComSombra.x || id == uComSombra.y || id == uComSombra.z ) ? 0.0 : ( num < 0.0 ? uPisca : 1.0 ); }
vec3 lampadaDaMalha( vec4 l ) { return l.rgb * pesoDaLampada( l.a ); }
`
// O cenário (19/nov): as duas lâmpadas mais fortes de cada face são contadas em cada pixel, e não mais de vértice a
// vértice (a poça de luz no teto saía em losango, e só a lâmpada com sombra, a mais perto do agente, ficava redonda).
// O vértice manda o caminho até cada lâmpada (no espaço da câmera: entre os vértices ele é exato), o peso (se o canto a
// vê; zero se ela é de verdade agora; o pisca) e a cor com o alcance; o pixel faz a queda e o ângulo, a mesma conta de
// maps/luzAssada.ts.
const LAMPADAS_DA_FACE = 'varying vec4 vLampA; varying vec4 vLampB; varying vec4 vLampCorA; varying vec4 vLampCorB;\n'
const LAMPADA_NO_PIXEL = `vec3 lampadaNoPixel( vec4 v, vec4 cor, vec3 n ) {
  float d = max( length( v.xyz ), 0.0001 ), q = d / cor.a, corte = max( 0.0, 1.0 - q * q * q * q );
  return cor.rgb * ( v.w * max( dot( n, v.xyz / d ), 0.0 ) * corte * corte / max( pow( d, ${DECAIMENTO.toFixed(2)} ), 0.01 ) );
}
`
const SOMA_DO_CENARIO = `vLuzIndireta = luzIndireta * uIndireta;
vLuzMalha = luzJanela; vLampA = vec4( 0.0 ); vLampB = vec4( 0.0 ); vLampCorA = vec4( 0.0, 0.0, 0.0, 1.0 ); vLampCorB = vec4( 0.0, 0.0, 0.0, 1.0 );
#if defined( LUZ_ASSADA ) || defined( LUZ_MISTA )
vLuzMalha += luzResto;
vec3 pontoLuz = ( modelViewMatrix * vec4( position, 1.0 ) ).xyz;
vLampA = vec4( ( viewMatrix * vec4( luzPosA.xyz, 1.0 ) ).xyz - pontoLuz, luzPosA.w * pesoDaLampada( luzA.a ) ); vLampCorA = vec4( luzA.rgb, luzAlc.x );
vLampB = vec4( ( viewMatrix * vec4( luzPosB.xyz, 1.0 ) ).xyz - pontoLuz, luzPosB.w * pesoDaLampada( luzB.a ) ); vLampCorB = vec4( luzB.rgb, luzAlc.y );
#endif`
const LUZ_DA_FACE = `
#if defined( LUZ_ASSADA ) || defined( LUZ_MISTA )
reflectedLight.directDiffuse += ( lampadaNoPixel( vLampA, vLampCorA, normal ) + lampadaNoPixel( vLampB, vLampCorB, normal ) ) * BRDF_Lambert( material.diffuseColor );
#endif`
interface LuzObjeto { a: { value: Vector4 }; b: { value: Vector4 }; resto: { value: Vector3 }; indireta: { value: Vector3 } }
const doObjeto = new WeakMap<Material, LuzObjeto>()

// de onde vem a luz: a malha do cenário (cada vértice), um objeto (os uniforms dele) ou as cópias juntadas (os
// atributos de cada instância)
type Fonte = LuzObjeto | 'instancias' | null
const somaDoObjeto = (a: string, b: string, resto: string, indireta: string) =>
  `vLuzIndireta = ${indireta} * uIndireta;\nvLuzMalha = vec3( 0.0 );\n#if defined( LUZ_ASSADA ) || defined( LUZ_MISTA )\nvLuzMalha = ${resto} + lampadaDaMalha( ${a} ) + lampadaDaMalha( ${b} );\n#endif`

function remendar(mat: Material, objeto: Fonte) {
  const prev = mat.onBeforeCompile
  mat.onBeforeCompile = (s, r) => {
    prev?.call(mat, s, r)
    s.uniforms.uPisca = ASSADA.pisca
    s.uniforms.uComSombra = ASSADA.comSombra
    s.uniforms.uIndireta = ASSADA.indireta
    s.uniforms.uLampPos = LAMPARINA.pos; s.uniforms.uLampCor = LAMPARINA.cor; s.uniforms.uLampFeixe = LAMPARINA.feixe
    s.uniforms.uLampFeixeCor = LAMPARINA.feixeCor; s.uniforms.uLampFeixeAlc = LAMPARINA.feixeAlcance
    if (objeto && objeto !== 'instancias') { s.uniforms.uObjA = objeto.a; s.uniforms.uObjB = objeto.b; s.uniforms.uObjResto = objeto.resto; s.uniforms.uObjIndireta = objeto.indireta }
    const dados = objeto === 'instancias' ? 'attribute vec4 iLuzA; attribute vec4 iLuzB; attribute vec3 iLuzResto; attribute vec3 iLuzIndireta;\n'
      : objeto ? 'uniform vec4 uObjA; uniform vec4 uObjB; uniform vec3 uObjResto; uniform vec3 uObjIndireta;\n'
      : 'attribute vec4 luzA; attribute vec4 luzB; attribute vec4 luzPosA; attribute vec4 luzPosB; attribute vec2 luzAlc; attribute vec3 luzResto; attribute vec3 luzJanela; attribute vec3 luzIndireta;\n' + LAMPADAS_DA_FACE
    const soma = objeto === 'instancias' ? somaDoObjeto('iLuzA', 'iLuzB', 'iLuzResto', 'iLuzIndireta')
      : objeto ? somaDoObjeto('uObjA', 'uObjB', 'uObjResto', 'uObjIndireta')
      : SOMA_DO_CENARIO
    s.vertexShader = dados + LAMPADA + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n' + soma)
    s.fragmentShader = 'varying vec3 vLuzMalha; varying vec3 vLuzIndireta;\n' + (objeto ? '' : LAMPADAS_DA_FACE + LAMPADA_NO_PIXEL) + UNIFORMS_LAMPARINA + s.fragmentShader
      .replace('#include <lights_fragment_begin>', LUZES)
      .replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\nreflectedLight.directDiffuse += vLuzMalha * BRDF_Lambert( material.diffuseColor );\nreflectedLight.indirectDiffuse += vLuzIndireta * BRDF_Lambert( material.diffuseColor );' + (objeto ? '' : LUZ_DA_FACE) + LUZ_LAMPARINA)
  }
  mat.customProgramCacheKey = () => (objeto === 'instancias' ? 'assada-instancias' : objeto ? 'assada-objeto' : 'assada')
  const d = DEFINE[ASSADA.modo]
  if (d) mat.defines = { ...mat.defines, [d]: '' }
  materiais.add(mat)
}

/** Ensina um material do cenário a usar a luz da malha (luzA, luzB, luzPosA, luzPosB, luzAlc, luzResto, luzJanela). */
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

/** Ensina o material das cópias juntadas numa malha só (render/instancias.ts) a usar a luz de cada cópia: os atributos
 *  iLuzA, iLuzB, iLuzResto e iLuzIndireta da instância (a mesma amostra de iluminarObjeto, uma por cópia). */
export function aplicarLuzInstancias<M extends Material>(mat: M): M {
  remendar(mat, 'instancias')
  return anotar(mat, aplicarLuzInstancias as (m: Material) => unknown)
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
