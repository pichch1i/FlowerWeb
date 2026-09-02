import daisyImage from './assets/pict/daisy-transparent.webp'
import dandelionImage from './assets/pict/dandelion-transparent.webp'
import lavenderImage from './assets/pict/lavender-transparent.webp'
import stripedCarnationImage from './assets/pict/striped-carnation-transparent.webp'
import sunflowerImage from './assets/pict/sunflower-transparent.webp'

const publicAsset = (path: string) => `${import.meta.env.BASE_URL}${path}`

const backgroundAssets = [
  publicAsset('flower-grid-pixel-bg.webp'),
  publicAsset('q1-pixel-garden-bg.webp'),
  publicAsset('q2-pixel-garden-bg.webp'),
  publicAsset('q3-pixel-garden-bg.webp'),
  publicAsset('q4-pixel-garden-bg.webp'),
  publicAsset('q5-pixel-garden-bg.webp'),
  publicAsset('q6-pixel-garden-bg.webp'),
  publicAsset('q7-pixel-garden-bg.webp'),
]

const resultFlowerAssets = [
  sunflowerImage,
  lavenderImage,
  daisyImage,
  stripedCarnationImage,
  dandelionImage,
]

const seenAssets = new Set<string>()

function preloadImage(src: string) {
  if (seenAssets.has(src)) {
    return
  }

  seenAssets.add(src)

  const image = new Image()
  image.decoding = 'async'
  image.src = src
}

export function preloadExperienceAssets() {
  backgroundAssets.forEach(preloadImage)
  resultFlowerAssets.forEach(preloadImage)
}
