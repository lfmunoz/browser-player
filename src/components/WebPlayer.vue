<template>
<div>
  <h2>WebAmp</h2><i class="mi mi-face"></i>

<hr>

<div class="audio-player">
  <div class="audio-title"> {{title}} </div>
  <div class="audio-subtitle"> {{subtitle}} </div>
  <div class="audio-canvas">
    <div id="pixi-div"></div>
  </div>
  <div class="audio-controls">
    <img src="/static/ic_repeat_black_24px.svg">
    <img v-bind:src="this.playBtnSrc" @click='play'>
    <span> {{duration}} / {{currentAudioTime}}</span>
  </div>
</div>

<hr>

<p> currentTime: {{currentTime}} </p>
<p> currentPosition: {{currentPosition}}</p>
<p> Loaded: {{loaded}} </p>
<p> Playing: {{playing}} </p>
</div>
</template>

<script>
import * as PIXI from 'pixi.js'
import Rx from 'rxjs/Rx'
import AudioUtils from './AudioUtils'

// import 'material-icons/css/material-icons.css'

const interval$ = Rx.Observable.interval(1000)

const maxBarCount = 100

// const controlsHeight = 24;
const maxPixelHeight = 50
const canvasPading = 2
const canvasWidth = 408
const canvasHeight = maxPixelHeight + canvasPading * 2
const yStartPosition = canvasHeight - canvasPading
const yTopOffset = canvasPading

const stepSize = 4
const playerLineColor = 0xffffff
const playerLineAlpha = 1
const playerLineWidth = 2

const mouseover$ = Rx.Observable.empty()
const click$ = Rx.Observable.empty()
const group = new PIXI.Container()
const controlsGroup = new PIXI.Container()

// let audio, uuid
var audioContext
var audioBuffer
var source

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

const playSvg = '/static/ic_play_arrow_black_24px.svg'
const pauseSvg = '/static/ic_pause_black_24px.svg'

export default {
  name: 'vue-Webplayer',
  // a child component needs to explicitly declare props it expects to receive
  props: ['srcAttr', 'title', 'subtitle'],
  data () {
    return {
      playBtnSrc: playSvg,
      loaded: false,
      isMuted: false,
      audioConext: undefined,
      connected: false,
      playing: false,
      paused: true,
      uuid: '0',
      innerLoop: undefined,
      audio: undefined,
      totalDuration: 0,
      currentTime: 0,
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
    },
    currentPosition: function () {
      return Math.floor(this.currentTime / this.totalDuration * maxBarCount)
    },
    currentAudioTime: function () {
      return this.audio ? convertTimeHHMMSS(this.currentTime) : ''
    }
  },
  methods: {
    get_position: function (time) {
      return Math.floor(time / this.totalDuration * maxBarCount)
    },
    get_time: function (position) {
      let time = Math.floor(position / maxBarCount * this.totalDuration)
      console.log('get_time(' + position + ') => ' + time)
      return time
    },
    play: function () {
      if (this.playing === false) {
        this.exec_play()
      } else {
        this.exec_pause()
      }
    },
    exec_pause: function () {
      this.playBtnSrc = playSvg
      this.audio.pause()
      if (this.playing === true) {
        intervalSubscription.unsubscribe()
      }
      this.playing = false
    },
    exec_play: function () {
      this.playBtnSrc = pauseSvg
      this.audio.play()
      intervalSubscription = interval$
        .map(() => {
          return this.audio.currentTime
        })
        .subscribe(currentTime => {
          this.currentTime = Math.floor(currentTime)
          this.set_histogram_alpha(this.get_position(this.currentTime))
        })
      this.playing = true
    },
    // https://pixijs.download/v4.5.2/docs/PIXI.Graphics.html#lineStyle
    create_lines: function (data) {
      let widthClean = AudioUtils.data_append(data, maxBarCount)
      let points = AudioUtils.to_pixel_height(
        widthClean,
        maxBarCount,
        maxPixelHeight
      )

      let xpos = stepSize
      let mouseoverArr = []
      let clickArr = []
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
        clickArr.push(
          Rx.Observable.fromEvent(line, 'click').map(event => {
            return event.target.parent.getChildIndex(event.target)
          })
        )

        // line.on('click', this.click)
        group.addChild(line)
      } // end of for-loop

      mouseover$
        .merge(...mouseoverArr)
        .distinctUntilChanged()
        .subscribe(index => {
          this.set_histogram_alpha(index)
        })
      click$
        .merge(...clickArr)
        .distinctUntilChanged()
        .subscribe(index => {
          // this.exec_stop();
          // don't repeat yourself vialation

          this.exec_pause()
          // this.timeOffset = this.get_time(index);
          this.currentTime = this.get_time(index)
          this.audio.currentTime = this.currentTime
          this.exec_play()
          // console.log(index);
        })

      group.interactive = true
      group.buttonMode = true

      /*
      group.mouseout = function(mouseData) {
        for (let i = 0; i < group.children.length; i++) {
          let child = group.getChildAt(i);
          child.alpha = 1;
        }
      };
      */

      this.app.stage.addChild(group)
    }, // end of create_lines
    set_histogram_alpha: function (index) {
      for (let i = 0; i <= index; i++) {
        let child = group.getChildAt(i)
        child.alpha = 0.5
      }
      for (let i = index + 1; i < group.children.length; i++) {
        let child = group.getChildAt(i)
        child.alpha = 1
      }
    },
    /*
      Once we have audio data, we configure our player
    */
    configure_audio: function (blob) {
      this.audio.onloadeddata = event => {
        this.totalDuration = this.audio.duration
      }
      AudioUtils.blob_to_uint8arr(blob).then(result => {
        this.create_lines(result)
        this.loaded = true
      })
      this.audio.addEventListener('timeupdate', this._handle_time_update)
    },

    /*
    Given a URL we pull the music file using an ajax request and we
    receive a blob which we use to create a histrogram and is also
    the source of the audio
    */
    pull_xhr: function (url) {
      let xhr = new XMLHttpRequest()
      //  xhr.open("GET", "http://jplayer.org/audio/m4a/Miaow-07-Bubble.m4a");
      xhr.open('GET', url)
      xhr.responseType = 'blob'

      xhr.onload = () => {
        this.audio = new Audio()
        let url = URL.createObjectURL(xhr.response)
        // this.audio.src = 'http://jplayer.org/audio/m4a/Miaow-07-Bubble.m4a';
        this.audio.src = url
        this.audio.controls = true
        this.audio.autoplay = false
        document.body.appendChild(this.audio)
        this.configure_audio(xhr.response)
      }
      xhr.send()
    },
    /*
      Function callback when time is updated
    */
    _handle_time_update: function (evt) {
      this.currentTime = Math.floor(evt.target.currentTime)
    }
  }, // end of methods()

  mounted () {
    this.uuid = generateUUID()
    let type = 'WebGL'
    if (!PIXI.utils.isWebGLSupported()) {
      type = 'canvas'
    }
    this.app = new PIXI.Application({
      width: canvasWidth,
      height: canvasHeight,
      antialias: true
    })
    this.app.renderer.backgroundColor = 0x000fff
    document.getElementById('pixi-div').appendChild(this.app.view)
    // process audio data
    if (typeof this.srcAttr === 'string') {
      this.pull_xhr(this.srcAttr)
    }
  } // end of mounted
}
</script>

<style scoped>
canvas {
  width: 100%;
  height: 100%;
}

.audio-player {
  display: flex;
  flex-direction: column;
  background-color: grey;
}

</style>
