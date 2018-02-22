<template>
<div>
  <h2>WebAmp</h2>
  <div id="pixi-div"></div>
</div>
</template>

<script>
import * as PIXI from 'pixi.js'
import Rx from 'rxjs/Rx'
import AudioUtils from './AudioUtils'

const maxBarCount = 98

const maxPixelHeight = 50
const canvasPading = 2
const canvasWidth = 400
const canvasHeight = maxPixelHeight + canvasPading * 2
const yStartPosition = canvasHeight - canvasPading
const yTopOffset = canvasPading

const stepSize = 4
const playerLineColor = 0xffffff
const playerLineAlpha = 1
const playerLineWidth = 2

const mouseover$ = Rx.Observable.empty()
const group = new PIXI.Container()

export default {
  name: 'WebPlayer',
  data () {
    return {
      msg: 'Welcome to Your Vue.js App'
    }
  }, // end of data
  methods: {
    click: function (evt) {
      console.log(evt)
      console.log('wtf')
    },

    // https://pixijs.download/v4.5.2/docs/PIXI.Graphics.html#lineStyle
    create_lines: function (data) {
      console.log('ddddddddddddddddddddddddddddddddddddd')
      console.log(`points = ${data.length}`)
      // let points = this.clean_data(data);

      let widthClean = AudioUtils.data_append(data, maxBarCount)
      let points = AudioUtils.to_pixel_height(
        widthClean,
        maxBarCount,
        maxPixelHeight
      )

      let xpos = stepSize
      let mouseoverArr = []
      for (let i = 0; i < points.length; i++) {
        xpos += stepSize
        let line = new PIXI.Graphics()
        line.lineStyle(playerLineWidth, playerLineColor, playerLineAlpha)
        line.moveTo(xpos, yStartPosition)
        line.lineTo(xpos, yStartPosition - points[i])
        line.interactive = true
        line.buttonMode = true
        line.hitArea = new PIXI.Rectangle(
          xpos,
          yTopOffset,
          stepSize,
          maxPixelHeight
        )

        mouseoverArr.push(
          Rx.Observable.fromEvent(line, 'mouseover')
            .map(event => {
              return event.target.parent.getChildIndex(event.target)
            })
            .throttle(val => Rx.Observable.interval(100))
        )

        line.on('click', this.click)
        group.addChild(line)
      } // end of for-loop

      mouseover$
        .merge(...mouseoverArr)
        .distinctUntilChanged()
        .subscribe(index => {
          for (let i = 0; i <= index; i++) {
            let child = group.getChildAt(i)
            child.alpha = 0.5
          }
          for (let i = index + 1; i < group.children.length; i++) {
            let child = group.getChildAt(i)
            child.alpha = 1
          }
        })

      group.interactive = true
      group.buttonMode = true
      group.mouseout = function (mouseData) {
        for (let i = 0; i < group.children.length; i++) {
          let child = group.getChildAt(i)
          child.alpha = 1
        }
      }

      this.app.stage.addChild(group)
    } // end of create_lines
  }, // end of methods()

  mounted () {
    var xhr = new XMLHttpRequest()

    xhr.open('GET', 'http://jplayer.org/audio/m4a/Miaow-07-Bubble.m4a')

    xhr.responseType = 'blob'

    xhr.onload = () => {
      AudioUtils.blob_to_uint8arr(xhr.response).then(result => {
        this.create_lines(result)
      })
    }

    xhr.send()

    console.log(PIXI)

    let type = 'WebGL'

    if (!PIXI.utils.isWebGLSupported()) {
      type = 'canvas'
    }

    PIXI.utils.sayHello(type)
    this.app = new PIXI.Application({
      width: canvasWidth,
      height: canvasHeight,
      antialias: true
    })
    document.getElementById('pixi-div').appendChild(this.app.view)
    /*
    this.create_lines([
      10,
      20,
      30,
      40,
      50,
      60,
      70,
      80,
      90,
      100,
      10,
      20,
      30,
      40,
      50,
      60,
      70,
      80,
      90,
      100,
      10,
      20,
      30,
      40,
      50,
      60,
      70,
      80,
      90,
      100,
      10,
      20,
      30,
      40,
      50,
      60,
      70,
      80,
      90,
      100,
      10,
      20,
      30,
      40,
      50,
      60,
      70,
      80,
      90,
      100
    ]);
    */
  } // end of mounted
}
</script>

<style scoped>
canvas {
  width: 100%;
  height: 100%;
}
</style>
