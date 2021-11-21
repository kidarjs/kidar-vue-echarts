import { computed, defineComponent, h, install, nextTick, onMounted, PropType, ref, toRefs, watch, onUnmounted, App } from 'vue-demi'
import { EchartsPlugin, Column, BaseData, KidarEchartsContext } from '../types/index'
import * as echarts from 'echarts'
import { removeListenElResize, listenElResize } from 'nkxrb-tools'
import { kidarDarkTheme } from './theme/index'
import { kidarLightTheme } from './theme/kidarLightTheme'

install()

declare type rendererType = 'canvas' | 'svg'
const __DEV__ = process.env.NODE_ENV === 'development'
const LAZY_LOAD_PLUGINS = import.meta.glob('./plugins/*.ts')
const PLUGINS: Map<string, EchartsPlugin> = new Map()

echarts.registerTheme('light', kidarLightTheme)
echarts.registerTheme('dark', kidarDarkTheme)

const KidarEcharts = defineComponent({
  template: `<div ref="KidarEchartsEl"></div>`,
  props: {
    omit: { type: Number, default: 0 },
    rotate: { type: Number, default: 0 },
    zoomNum: { type: Number, default: 7 },
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    type: { type: String, default: 'pie' },
    cols: { type: Array as PropType<Column[]>, default: () => [] },
    data: { type: Array as PropType<BaseData[]>, default: () => [] },
    theme: { type: [String, Object] as PropType<string | Object>, default: 'dark' },
    locale: { type: String, default: 'zh-cn' },
    renderer: { type: String as PropType<rendererType>, default: 'canvas' },
    useDirtyRect: { type: Boolean, default: false },
    devicePixelRatio: { type: Number, default: window.devicePixelRatio },
  },
  setup(props: KidarEchartsContext, { emit, attrs }: any) {
    const KidarEchartsEl = ref()
    const { theme, type, cols, data } = toRefs(props)
    let chart: echarts.ECharts | null = null
    const opts = computed(() => {
      return {
        locale: props.locale,
        renderer: props.renderer,
        devicePixelRatio: props.devicePixelRatio,
        useDirtyRect: props.useDirtyRect
      }
    })
    const init = () => {
      let themeName: string | Object = 'light'
      if (theme && theme.value) {
        themeName = theme.value
      }
      chart = echarts.init(KidarEchartsEl.value, themeName, opts.value)
      chart.on('click', 'series', params => {
        emit('click', params)
      })

      listenElResize(KidarEchartsEl.value, () => {
        resetOption()
        chart && chart.resize()
      })
      resetOption()
    }

    onUnmounted(() => {
      removeListenElResize(KidarEchartsEl.value)
      chart?.dispose()
    })
    onMounted(() => {
      KidarEchartsEl.value ? init() : nextTick(() => init())
    })

    const resetOption = async () => {
      if (!chart || !type.value) return

      if (!PLUGINS.has(type.value)) {
        try {
          let importPlugin = await LAZY_LOAD_PLUGINS[`./plugins/${type.value}.ts`]()
          PLUGINS.set(type.value, importPlugin.default.default || importPlugin.default || importPlugin)
        } catch (error) {
          throw new Error(`未找到【${type.value}】类型, 目前KidarEcharts仅支持pie,line,bar,dybar,multi-line-bar-x
          若没有满意的类型，可自定义类型plugin，并使用KidarEcharts.use(plugin)添加自定义类型。
          自定义类型可参考技术文档：https://github.com/kidarjs/kidar-echarts
          ：${error}`)
        }
      }
      chart.setOption({}, false) // 用于初始化option，确保chart.getOption可以拿到默认配置
      const option = PLUGINS.get(type.value)?.resetOption(cols.value, data.value, { ...props, chart, init })

      try {
        option && chart.setOption(option, true)
      } catch (error: any) {
        if (error.message && error.message.indexOf('not be called during main process') > 0) {
          chart.dispose()
          option && chart.setOption(option, true)
        } else {
          throw new Error(error)
        }
      }
    }

    watch([type, cols, data], resetOption, { deep: true })
    watch([theme], () => {
      chart?.dispose()
      init()
    })

    return {
      KidarEchartsEl
    }
  },
  render: () => h('div', { style: 'overflow:hidden !important;' }, [
    h('div', { ref: 'KidarEchartsEl', style: 'height: 100%; width: 100%;' })
  ])
})

const defineConfig = (config: EchartsPlugin) => {
  return config
}

const addKidarEchartsPlugin = (plugin: EchartsPlugin) => {
  if (PLUGINS.has(plugin.name)) {
    __DEV__ && console.warn(`pluginName is exist 【${plugin.name}】 该插件名已存在, 重复注册将覆盖已有的插件！`)
  }
  PLUGINS.set(plugin.name, plugin)
}

const installKidarEcharts = (app: App) => {
  app.component('KidarEcharts', KidarEcharts)
}


export { KidarEcharts, addKidarEchartsPlugin, defineConfig, installKidarEcharts as install }
