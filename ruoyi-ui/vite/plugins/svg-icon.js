import VitePluginSvgSpritemap from '@spiriit/vite-plugin-svg-spritemap'

export default function createSvgIcon() {
  return VitePluginSvgSpritemap('./src/assets/icons/svg/*.svg', {
    prefix: 'icon-',
    route: '/__spritemap',
    oxvg: false,
    styles: false,
    injectSvgOnDev: false,
    output: {
      filename: '[name].[hash][extname]',
      name: 'spritemap.svg',
      view: false,
      use: false
    },
    svgo: {
      plugins: [
        { name: 'removeDimensions' },
        { name: 'removeStyleElement' }
      ]
    }
  })
}
