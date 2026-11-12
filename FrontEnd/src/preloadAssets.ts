import daisyImage from './assets/pict/Daisy-result.png'
import blueGlobeThistleImage from './assets/pict/Blue Globe Thistle-result.png'
import peachRoseImage from './assets/pict/Peach Rose-result.png'
import stripedCarnationImage from './assets/pict/Striped Carnation-result.png'
import sunflowerImage from './assets/pict/Sunflower-result.png'

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
  peachRoseImage,
  daisyImage,
  stripedCarnationImage,
  blueGlobeThistleImage,
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
