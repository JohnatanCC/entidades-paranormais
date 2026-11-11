// O relevo das texturas do cenário (as etapas 5b e 5c), gerado da própria imagem: ninguém pinta nada.
// O que é claro na textura sobe e o que é escuro afunda (o rejunte, o veio da madeira, a trama do papel).
//   'luz'   (5b) o mapa de normais: cada pixel pega a luz como se tivesse volume. Só as luzes de verdade mostram (o
//           luar, o preenchimento e as lâmpadas com sombra).
//   'fundo' (5c) o relevo de verdade (parallax): além da luz, a textura se desloca conforme o ângulo da câmera, e o
//           pixel que afunda some atrás do que sobe. Custa várias leituras de textura por pixel: só de perto (LONGE).
// A textura do relevo leva as duas coisas: a inclinação (rgb) e a altura (alfa: 1 = o topo, 0 = o fundo).
import * as THREE from 'three'
import { anotar } from './remendos'

/** forca: o quanto a diferença de claro e escuro vira inclinação; fundo: a profundidade do relevo de verdade (m; um
 *  pixel da textura tem 3 cm); passos: as leituras por pixel, olhando de frente e de lado; longe: até onde ele vale (m). */
export type Relevo = 'nao' | 'luz' | 'fundo'
export const RELEVO = { forca: 2.2, fundo: 0.035, passos: [6, 14], longe: 9 }

/** A textura de relevo de uma imagem (lisa até pintar() receber a imagem carregada). */
export function novoRelevo(filtro: number): { textura: THREE.DataTexture; pintar: (img: HTMLImageElement) => void } {
  const textura = new THREE.DataTexture(new Uint8Array([128, 128, 255, 255]), 1, 1, THREE.RGBAFormat)
  textura.magFilter = THREE.NearestFilter; textura.minFilter = THREE.LinearMipmapLinearFilter; textura.generateMipmaps = true
  textura.anisotropy = filtro; textura.wrapS = textura.wrapT = THREE.RepeatWrapping; textura.needsUpdate = true
  const pintar = (img: HTMLImageElement) => {
    const W = img.width, H = img.height
    if (!W || !H) return
    const c = document.createElement('canvas'); c.width = W; c.height = H
    const g = c.getContext('2d', { willReadFrequently: true })!
    g.drawImage(img, 0, 0)
    const px = g.getImageData(0, 0, W, H).data, h = new Float32Array(W * H), saida = new Uint8Array(W * H * 4)
    // a altura de cada pixel é o quanto ele é claro, esticada entre o mais escuro e o mais claro da imagem
    let min = 1, max = 0
    for (let i = 0; i < W * H; i++) { h[i] = (0.2126 * px[i * 4] + 0.7152 * px[i * 4 + 1] + 0.0722 * px[i * 4 + 2]) / 255; min = Math.min(min, h[i]); max = Math.max(max, h[i]) }
    // a textura repete, então a conta dá a volta nas bordas
    const em = (x: number, y: number) => h[((y + H) % H) * W + ((x + W) % W)]
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const nx = -(em(x + 1, y) - em(x - 1, y)) * RELEVO.forca, ny = (em(x, y + 1) - em(x, y - 1)) * RELEVO.forca, k = 1 / Math.hypot(nx, ny, 1)
      const i = ((H - 1 - y) * W + x) * 4 // a imagem começa em cima; a textura de dados, embaixo
      saida[i] = (nx * k * 0.5 + 0.5) * 255; saida[i + 1] = (ny * k * 0.5 + 0.5) * 255; saida[i + 2] = (k * 0.5 + 0.5) * 255
      saida[i + 3] = ((em(x, y) - min) / Math.max(max - min, 1e-3)) * 255
    }
    textura.dispose() // o tamanho muda: a placa refaz a textura
    textura.image = { data: saida, width: W, height: H }; textura.needsUpdate = true
  }
  return { textura, pintar }
}

// ---------- o relevo de verdade: o shader anda pela altura até achar onde o olhar bate ----------
const NORMAL = 'texture2D( normalMap, vNormalMapUv )'
const NORMAIS = THREE.ShaderChunk.normal_fragment_maps.replace(NORMAL, 'RELEVO_NORMAL')
if (NORMAIS === THREE.ShaderChunk.normal_fragment_maps) console.error('relevo.ts: o trecho das normais do three mudou; o relevo de verdade não vai funcionar')
const f = (n: number) => n.toFixed(4)
const CABECALHO = `
#if defined( RELEVO_FUNDO ) && defined( USE_NORMALMAP_TANGENTSPACE ) && defined( USE_MAP )
	#define COM_FUNDO
	#define RELEVO_NORMAL textureGrad( normalMap, vNormalMapUv + relevoDesloc, relevoDx, relevoDy )
#else
	#define RELEVO_NORMAL ${NORMAL}
#endif
`
const ANDAR = `
#ifdef COM_FUNDO
	vec2 relevoDesloc = vec2( 0.0 ), relevoDx = dFdx( vNormalMapUv ), relevoDy = dFdy( vNormalMapUv );
	float relevoPerto = 1.0 - smoothstep( ${f(RELEVO.longe * 0.5)}, ${f(RELEVO.longe)}, length( vViewPosition ) );
	if ( relevoPerto > 0.0 ) {
		// o olhar no espaço da textura (x e y andam com a imagem, z sai da superfície)
		mat3 base = getTangentFrame( - vViewPosition, normalize( vNormal ), vNormalMapUv );
		vec3 olhar = normalize( vViewPosition ) * base;
		float passos = mix( ${f(RELEVO.passos[1])}, ${f(RELEVO.passos[0])}, clamp( olhar.z, 0.0, 1.0 ) ), camada = 1.0 / passos, fundo = 0.0;
		vec2 passo = - olhar.xy / max( olhar.z, 0.3 ) * ( ${f(RELEVO.fundo)} * relevoPerto * camada );
		for ( int i = 0; i < ${RELEVO.passos[1]}; i ++ ) {
			if ( fundo >= 1.0 - textureGrad( normalMap, vNormalMapUv + relevoDesloc, relevoDx, relevoDy ).a ) break;
			relevoDesloc += passo; fundo += camada;
		}
	}
	diffuseColor *= textureGrad( map, vMapUv + relevoDesloc, relevoDx, relevoDy );
#else
	#include <map_fragment>
#endif
`

/** Ensina um material do cenário a fazer o relevo de verdade (liga com a definição RELEVO_FUNDO e o mapa de relevo). */
export function aplicarRelevo<M extends THREE.Material>(mat: M): M {
  const prev = mat.onBeforeCompile, chave = mat.customProgramCacheKey
  mat.onBeforeCompile = (s, r) => {
    prev?.call(mat, s, r)
    s.fragmentShader = CABECALHO + s.fragmentShader.replace('#include <map_fragment>', ANDAR).replace('#include <normal_fragment_maps>', NORMAIS)
  }
  mat.customProgramCacheKey = () => chave.call(mat) + '|relevo'
  return anotar(mat, aplicarRelevo as (m: THREE.Material) => unknown)
}

/** Liga ou desliga o relevo de verdade num material que já tem o remendo. */
export function comFundo(mat: THREE.Material, liga: boolean) {
  if ((mat.defines ? 'RELEVO_FUNDO' in mat.defines : false) === liga) return
  const d = { ...mat.defines }
  if (liga) d.RELEVO_FUNDO = ''; else delete d.RELEVO_FUNDO
  mat.defines = d; mat.needsUpdate = true
}
