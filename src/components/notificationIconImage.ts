export async function normalizeNotificationIcon(file: Blob): Promise<Blob> {
  if (file.size > 1024 * 1024 || !['image/png', 'image/svg+xml', 'image/webp', 'image/jpeg'].includes(file.type)) throw Error('Choose a PNG, SVG, WEBP or JPG icon up to 1 MB.')
  if (file.type === 'image/svg+xml') {
    const document = new DOMParser().parseFromString(await file.text(), 'image/svg+xml')
    if (document.querySelector('parsererror, script, style, foreignObject, image') || document.documentElement.localName !== 'svg') throw Error('Use a standalone SVG icon without scripts or embedded images.')
    for (const node of document.querySelectorAll('*')) {
      for (const attribute of node.attributes) {
        if (/^on/i.test(attribute.name) || (/href$/i.test(attribute.name) && !attribute.value.startsWith('#')) || /url\(\s*['"]?(?!#)/i.test(attribute.value)) throw Error('Use an SVG without external references.')
      }
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth > 4096 || image.naturalHeight > 4096) throw Error('Icon dimensions must be no larger than 4096 x 4096.')
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 96
    const context = canvas.getContext('2d', { willReadFrequently: true })!
    const scale = 72 / Math.max(image.naturalWidth, image.naturalHeight)
    const width = image.naturalWidth * scale, height = image.naturalHeight * scale
    const x = (96 - width) / 2, y = (96 - height) / 2
    context.drawImage(image, x, y, width, height)
    const pixels = context.getImageData(0, 0, 96, 96)
    let transparent = false
    for (let row = Math.ceil(y) + 1; row < Math.floor(y + height) - 1; row++) {
      for (let col = Math.ceil(x) + 1; col < Math.floor(x + width) - 1; col++) {
        if (pixels.data[(row * 96 + col) * 4 + 3] < 240) transparent = true
      }
    }
    let visible = 0
    for (let i = 0; i < pixels.data.length; i += 4) {
      if (!transparent) {
        const brightness = .2126 * pixels.data[i] + .7152 * pixels.data[i + 1] + .0722 * pixels.data[i + 2]
        pixels.data[i + 3] = Math.round(pixels.data[i + 3] * (1 - brightness / 255))
      }
      pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = 255
      if (pixels.data[i + 3] > 32) visible++
    }
    if (visible < 8) throw Error('This image has no visible icon. Use a transparent icon or a dark icon on white.')
    context.putImageData(pixels, 0, 0)
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(Error('Could not convert icon.')), 'image/png'))
  } finally { URL.revokeObjectURL(url) }
}
