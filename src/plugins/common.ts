import { getTextWidth } from 'nkxrb-tools'
import { Column, BaseData, KidarEchartsContext } from '../../types/index'
import { SliderDataZoomComponentOption } from 'echarts'

export const setZoom = (barsWidth: number, ctx: KidarEchartsContext): SliderDataZoomComponentOption => {
  const zoom: SliderDataZoomComponentOption = {}
  const { chart, data } = ctx
  let interval = 10
  const end = chart.getWidth() / (barsWidth + interval)

  zoom.show = end < data.length - 1
  zoom.startValue = 0
  zoom.endValue = end

  return zoom
}

export function omitNum(val: number) {
  if (!Number(val)) {
    return 0
  }
  let res = ''
  let unit = ''

  if (val >= 100000000) {
    res = Number.prototype.toFixed.call(val / 100000000, 1)
    unit = '亿'
  } else if (val >= 10000) {
    res = Number.prototype.toFixed.call(val / 10000, 1)
    unit = '万'
  } else {
    res = val.toString()
  }

  if (res.indexOf('.') > 0 && Number(res.split('.')[1]) === 0) {
    res = res.split('.')[0]
  }

  return res + unit
}

/**
 * 获取一个数的近似整值
 * @param val 
 */
export function approximateNum(val: number) {
  if (!Number(val)) {
    return 0
  }
  let res = val
  let strNum = val.toString()
  const [num, dnum] = strNum.split('.') // 通过小数点进行分割
  if (num.length > 1) {
    res = Math.ceil(Number(num.substring(0, 2)) / 10) * Math.pow(10, num.length - 1)
  } else if (num !== '0') {
    res = Number(num) + Number(dnum[0]) > 4 ? 1 : 0.5
  }
  return res
}


export function getLinearColor(startColor: string, endColor: string) {
  const areaStyle = {
    color: {
      type: 'linear' as 'linear',
      x: 0,
      y: 0,
      x2: 0,
      y2: 1,
      colorStops: [{
        offset: 0, color: startColor // 0% 处的颜色
      }, {
        offset: 1, color: endColor // 100% 处的颜色
      }],
      global: false // 缺省为 false
    }
  }

  return areaStyle
}

export const baseSerie = {
  animationDurationUpdate: 1000,
  universalTransition: true,
}