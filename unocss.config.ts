import { defineConfig } from 'unocss'
import presetUno from '@unocss/preset-uno'

export default defineConfig({
  presets: [
    presetUno(),
  ],
  shortcuts: {
    'flex-center': 'flex items-center justify-center',
    'flex-between': 'flex items-center justify-between',
    'text-ellipsis': 'truncate overflow-hidden whitespace-nowrap',
  },
  theme: {
    colors: {
      primary: {
        DEFAULT: '#3B82F6',
        light: '#60A5FA',
        dark: '#2563EB'
      }
    }
  }
})
