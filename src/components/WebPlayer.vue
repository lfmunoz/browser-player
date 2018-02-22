<template>
<div>
  <h2>WebAmp</h2>
  <div id="pixi-div"></div>

  <button @click="play">Play</button>
  <button @click="stop">Stop</button>
</div>
</template>

<script>
import * as PIXI from 'pixi.js'
import Rx from 'rxjs/Rx'
import AudioUtils from './AudioUtils'

const interval$ = Rx.Observable.interval(1000)

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

// let audio, uuid
let audioContext
let audioBuffer

const baseVolumeValue = 7.5
const prefixCls = 'vue-sound'
export const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx'.replace(/[xy]/g, function (c) {
    let v, r
    r = (Math.random() * 16) | 0
    v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export const convertTimeHHMMSS = val => {
  let hhmmss = new Date(val * 1000).toISOString().substr(11, 8)
  return hhmmss.indexOf('00:') === 0 ? hhmmss.substr(3) : hhmmss
}

let intervalSubscription

export default {
  name: 'vue-Webplayer',
  data () {
    return {
      isMuted: false,
      loaded: false,
      connected: false,
      playing: false,
      paused: true,
      progressStyle: '',
      currentTime: undefined,
      uuid: '0',
      innerLoop: undefined,
      audio: undefined,
      totalDuration: 0,
      hideVolumeSlider: false,
      volumeValue: baseVolumeValue
    }
  }, // end of data
  computed: {
    duration: function () {
      return this.audio ? convertTimeHHMMSS(this.totalDuration) : ''
    },
    playerId: function () {
      return 'player-' + this.uuid
    },
    classes: function () {
      return prefixCls
    }
  },
  methods: {
    stop: function () {
      this.currentTime = audioContext.currentTime
      console.log('stop() ' + this.totalDuration)
      console.log(this.currentTime)
      audioContext.suspend()
      this.playing = false
      intervalSubscription.unsubscribe()
      // this.paused = true
      // this.audio.pause()
      // this.audio.currentTime = 0
    },
    play: function () {
      // audioCtx.state === 'running'
      // else if(audioCtx.state === 'suspended'

      console.log('play() ' + this.loaded)
      if (this.connected === true) {
        audioContext.resume()
      } else {
        var source = audioContext.createBufferSource() // creates a sound source
        source.buffer = audioBuffer // tell the source which sound to play
        source.connect(audioContext.destination) // connect the source to the context's destination (the speakers)
        source.start(0)
        this.connected = true
      }

      intervalSubscription = interval$.map(() => {
        return audioContext.currentTime
      }).subscribe(event => {
        console.log(event)
      })
      // if (this.playing && !this.paused) return
      // this.paused = false
      // this.audio.play()
      // this.playing = true
    },
    pause: function () {
      this.paused = !this.paused
      this.paused ? this.audio.pause() : this.audio.play()
    },
    getAudio: function () {
      // return this.$el.querySelectorAll("audio")[0];
      var xhr = new XMLHttpRequest()
      xhr.open('GET', 'http://jplayer.org/audio/m4a/Miaow-07-Bubble.m4a')
      xhr.responseType = 'blob'
      // xhr.responseType = 'arraybuffer';
      xhr.onload = () => {
        audioContext = new AudioContext()

        AudioUtils.blob_to_uint8arr(xhr.response).then(result => {
          this.create_lines(result)
        })
        AudioUtils.blob_to_arraybuffer(xhr.response).then(result => {
          audioContext.decodeAudioData(result, (buf) => {
            audioBuffer = buf
            this.totalDuration = buf.duration
            console.log('duration...')
            console.log(buf.duration)
            this.loaded = true
          })
        })
      }
      xhr.send()
    },

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
    this.uuid = generateUUID()

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

    this.getAudio()

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
