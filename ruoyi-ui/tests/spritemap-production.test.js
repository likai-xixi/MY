import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { build } from 'vite'
import createSvgIcon from '../vite/plugins/svg-icon.js'

const UI_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ICON_ROOT = path.join(UI_ROOT, 'src/assets/icons/svg')
const COMPONENT_ENTRY = path.join(UI_ROOT, 'src/components/SvgIcon/index.vue')

function outputItems(result) {
  const results = Array.isArray(result) ? result : [result]
  return results.flatMap((item) => item.output || [])
}

function attribute(tag, name) {
  return tag.match(new RegExp(`\\b${name}=["']([^"']*)["']`, 'i'))?.[1]
}

test('the real Vite plugin emits the complete safe production spritemap', async () => {
  const result = await build({
    root: UI_ROOT,
    configFile: false,
    logLevel: 'silent',
    plugins: [vue(), ...createSvgIcon()],
    build: {
      write: false,
      minify: false,
      rollupOptions: {
        input: COMPONENT_ENTRY
      }
    }
  })

  const output = outputItems(result)
  const spritemaps = output.filter(
    (item) => item.type === 'asset' && /^assets\/spritemap\.[A-Za-z0-9_-]+\.svg$/.test(item.fileName)
  )
  assert.equal(spritemaps.length, 1, 'the build must emit exactly one hashed spritemap asset')

  const source = typeof spritemaps[0].source === 'string'
    ? spritemaps[0].source
    : new TextDecoder().decode(spritemaps[0].source)
  const symbolTags = source.match(/<symbol\b[^>]*>/gi) || []
  const actualIds = symbolTags.map((tag) => attribute(tag, 'id')).sort()
  const expectedIds = fs.readdirSync(ICON_ROOT)
    .filter((file) => file.endsWith('.svg'))
    .map((file) => `icon-${path.basename(file, '.svg')}`)
    .sort()

  assert.equal(expectedIds.length, 90)
  assert.equal(symbolTags.length, 90)
  assert.equal(new Set(actualIds).size, 90, 'symbol ids must be unique')
  assert.deepEqual(actualIds, expectedIds)

  for (const tag of symbolTags) {
    const viewBox = attribute(tag, 'viewBox')
    const values = viewBox?.trim().split(/[\s,]+/).map(Number) || []
    assert.equal(values.length, 4, `${attribute(tag, 'id')} must have a four-number viewBox`)
    assert.equal(values.every(Number.isFinite), true, `${attribute(tag, 'id')} has an invalid viewBox`)
  }

  assert.doesNotMatch(source, /<use\b|<view\b|<style\b|<script\b|\son[a-z]+\s*=/i)
  assert.doesNotMatch(
    source,
    /(?:href|xlink:href)\s*=\s*["'](?:https?:|chrome-extension:|\/\/)|url\(\s*["']?(?:https?:|chrome-extension:|\/\/)/i
  )

  const bundle = output
    .filter((item) => item.type === 'chunk')
    .map((item) => item.code)
    .join('\n')
  assert.match(bundle, /\/assets\/spritemap\.[A-Za-z0-9_-]+\.svg#icon-/)
  assert.doesNotMatch(bundle, /\/__spritemap#icon-|virtual:svg-icons-register/)
})
