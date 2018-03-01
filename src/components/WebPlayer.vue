<template>
<div>
  <h2>WebAmp</h2><i class="mi mi-face"></i>


  <img src="/static/ic_repeat_black_24px.svg">
  <img v-bind:src="this.playBtnSrc" @click='play'>
  <span> Title: {{title}} </span>
  <span> Subtitle: {{subtitle}} </span>


<p> Loaded: {{loaded}} </p>
<p> Playing: {{playing}} </p>
<p> totalDuration : {{totalDuration}} </p>
<p> currentTime: {{currentTime}} </p>
<p> currentPosition: {{currentPosition}}
  <div id="pixi-div"></div>


</div>
</template>

<script>
import * as PIXI from "pixi.js";
import Rx from "rxjs/Rx";
import AudioUtils from "./AudioUtils";

// import 'material-icons/css/material-icons.css'

const interval$ = Rx.Observable.interval(1000);

const maxBarCount = 100;

// const controlsHeight = 24;
const maxPixelHeight = 50;
const canvasPading = 2;
const canvasWidth = 408;
const canvasHeight = maxPixelHeight + canvasPading * 2;
const yStartPosition = canvasHeight - canvasPading;
const yTopOffset = canvasPading;

const stepSize = 4;
const playerLineColor = 0xffffff;
const playerLineAlpha = 1;
const playerLineWidth = 2;

const mouseover$ = Rx.Observable.empty();
const click$ = Rx.Observable.empty();
const group = new PIXI.Container();
const controlsGroup = new PIXI.Container();

// let audio, uuid
var audioContext;
var audioBuffer;
var source;

const baseVolumeValue = 7.5;
const prefixCls = "vue-sound";
export const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx".replace(/[xy]/g, function(c) {
    let v, r;
    r = (Math.random() * 16) | 0;
    v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const convertTimeHHMMSS = val => {
  let hhmmss = new Date(val * 1000).toISOString().substr(11, 8);
  return hhmmss.indexOf("00:") === 0 ? hhmmss.substr(3) : hhmmss;
};

/*
var beeSvg = "https://s3-us-west-2.amazonaws.com/s.cdpn.io/106114/bee.svg";
var beeTexture = new PIXI.Texture.fromImage(beeSvg, undefined, undefined, 1.0)
var bee = new PIXI.Sprite(beeTexture)
app.stage.addChild(bee)
*/

let intervalSubscription;

const playSvg = "/static/ic_play_arrow_black_24px.svg";
const pauseSvg = "/static/ic_pause_black_24px.svg";

export default {
  name: "vue-Webplayer",
  // a child component needs to explicitly declare props it expects to receive
  props: ["title", "subtitle"],
  data() {
    return {
      playBtnSrc: playSvg,
      loaded: false,
      isMuted: false,
      audioConext: undefined,
      connected: false,
      playing: false,
      paused: true,
      progressStyle: "",
      uuid: "0",
      innerLoop: undefined,
      audio: undefined,
      totalDuration: 0,
      currentTime: 0,
      hideVolumeSlider: false,
      volumeValue: baseVolumeValue
    };
  }, // end of data
  computed: {
    duration: function() {
      return this.audio ? convertTimeHHMMSS(this.totalDuration) : "";
    },
    playerId: function() {
      return "player-" + this.uuid;
    },
    classes: function() {
      return prefixCls;
    },
    currentPosition: function() {
      return Math.floor(this.currentTime / this.totalDuration * maxBarCount);
    }
  },
  methods: {
    test: function() {
      console.log("test clicked");
    },
    get_position: function(time) {
      return Math.floor(time / this.totalDuration * maxBarCount);
    },
    get_time: function(position) {
      let time = Math.floor(position / maxBarCount * this.totalDuration);
      console.log("get_time(" + position + ") => " + time);
      return time;
    },
    play: function() {
      console.log("this.playing " + this.playing);
      console.log("druation" + this.totalDuration);
      if (false === this.playing) {
        this.exec_play();
      } else {
        this.exec_stop();
      }
    },
    exec_stop: function() {
      this.playBtnSrc = playSvg;
      this.currentTime = audioContext.currentTime;
      console.log("set by stop " + this.currentTime);
      if (true === this.playing) {
        source.stop();
        console.log("unsubscribe")
        // intervalSubscription.unsubscribe();
      }
      this.playing = false;
    },
    exec_play: function() {
      this.playBtnSrc = pauseSvg;
      source = audioContext.createBufferSource(); // creates a sound source
      source.buffer = audioBuffer; // tell the source which sound to play
      source.connect(audioContext.destination); // connect the source to the context's destination (the speakers)
      source.start(0, this.currentTime);

      source.onended = () => {
        console.log("sound ended");
      };
      source.oncomplete = () => {
        console.log("sound comple");
      };
 
      this.playing = true;
    },
    getAudio: function() {
      // return this.$el.querySelectorAll("audio")[0];
      var xhr = new XMLHttpRequest();
      xhr.open("GET", "http://jplayer.org/audio/m4a/Miaow-07-Bubble.m4a");
      xhr.responseType = "blob";
      // xhr.responseType = 'arraybuffer';
      xhr.onload = () => {
        audioContext = new AudioContext();

     intervalSubscription = interval$
        .map(() => {
          return audioContext.currentTime;
        })
        .subscribe(currentTime => {
          // console.log(event);
          this.currentTime = currentTime;
          console.log("set by internval " + this.currentTime);
          // this.set_histogram_alpha(this.get_position(currentTime));
        });


        AudioUtils.blob_to_uint8arr(xhr.response).then(result => {
          this.create_lines(result);
        });
        AudioUtils.blob_to_arraybuffer(xhr.response).then(result => {
          audioContext.decodeAudioData(result, buf => {
            audioBuffer = buf;
            this.totalDuration = buf.duration;
            console.log("duration...");
            console.log(buf.duration);
            this.loaded = true;
          });
        });
      };
      xhr.send();
    },

    click: function(evt) {
      console.log(evt);
      console.log("wtf");
    },

    // https://pixijs.download/v4.5.2/docs/PIXI.Graphics.html#lineStyle
    create_lines: function(data) {
      console.log("ddddddddddddddddddddddddddddddddddddd");
      console.log(`points = ${data.length}`);
      // let points = this.clean_data(data);

      let widthClean = AudioUtils.data_append(data, maxBarCount);
      let points = AudioUtils.to_pixel_height(
        widthClean,
        maxBarCount,
        maxPixelHeight
      );

      let xpos = stepSize;
      let mouseoverArr = [];
      let clickArr = [];
      for (let i = 0; i < points.length; i++) {
        xpos += stepSize;
        let line = new PIXI.Graphics();
        line.lineStyle(playerLineWidth, playerLineColor, playerLineAlpha);
        line.moveTo(xpos, yStartPosition);
        line.lineTo(xpos, yStartPosition - points[i]);
        line.interactive = true;
        line.buttonMode = true;
        line.hitArea = new PIXI.Rectangle(
          xpos,
          yTopOffset,
          stepSize,
          maxPixelHeight
        );

        mouseoverArr.push(
          Rx.Observable.fromEvent(line, "mouseover")
            .map(event => {
              return event.target.parent.getChildIndex(event.target);
            })
            .throttle(val => Rx.Observable.interval(100))
        );
        clickArr.push(
          Rx.Observable.fromEvent(line, "click").map(event => {
            return event.target.parent.getChildIndex(event.target);
          })
        );

        // line.on('click', this.click)
        group.addChild(line);
      } // end of for-loop

      mouseover$
        .merge(...mouseoverArr)
        .distinctUntilChanged()
        .subscribe(index => {
          this.set_histogram_alpha(index);
        });
      click$
        .merge(...clickArr)
        .distinctUntilChanged()
        .subscribe(index => {
          //this.exec_stop();
          // don't repeat yourself vialation

          this.exec_stop();
          this.currentTime = this.get_time(index);
          console.log("set by button click" + this.currentTime);
          this.exec_play();
          // console.log(index);
        });

      group.interactive = true;
      group.buttonMode = true;
      group.mouseout = function(mouseData) {
        for (let i = 0; i < group.children.length; i++) {
          let child = group.getChildAt(i);
          child.alpha = 1;
        }
      };

      this.app.stage.addChild(group);
    }, // end of create_lines
    set_histogram_alpha: function(index) {
      for (let i = 0; i <= index; i++) {
        let child = group.getChildAt(i);
        child.alpha = 0.5;
      }
      for (let i = index + 1; i < group.children.length; i++) {
        let child = group.getChildAt(i);
        child.alpha = 1;
      }
    },
    create_controls: function() {
      let pause = "/static/ic_pause_black_24px.svg";
      let play = "/static/ic_play_arrow_black_24px.svg";
      let repeat = "/static/ic_repeat_black_24px.svg";
      let volume = "/static/ic_volume_down_black_24px.svg";
      let voloff = "/static/ic_volume_off_black_24px.svg";
      // let stop = '/static/ic_stop_black_24px.svg'

      this.create_svg_sprite(pause, 0, controlsGroup, this.click);
      this.create_svg_sprite(play, 20, controlsGroup, this.click);
      this.create_svg_sprite(repeat, 40, controlsGroup, this.click);
      this.create_svg_sprite(volume, 60, controlsGroup, this.click);
      this.create_svg_sprite(voloff, 80, controlsGroup, this.click);
      // imageUrl, crossorigin, scaleMode, sourceScale
      /* eslint new-cap: ["error", { "newIsCap": false }] */

      this.app.stage.addChild(controlsGroup);
    }, // end of create_controls
    create_svg_sprite(svg, xposition, group, onClick) {
      let texture = new PIXI.Texture.fromImage(svg, undefined, undefined, 0.8);
      let sprite = new PIXI.Sprite(texture);
      sprite.position.x = xposition;
      sprite.position.y = yStartPosition;
      sprite.interactive = true;
      sprite.buttonMode = true;
      sprite.on("click", onClick);
      group.addChild(sprite);
    }
  }, // end of methods()

  mounted() {
    this.uuid = generateUUID();

    console.log(PIXI);

    let type = "WebGL";

    if (!PIXI.utils.isWebGLSupported()) {
      type = "canvas";
    }

    PIXI.utils.sayHello(type);
    this.app = new PIXI.Application({
      width: canvasWidth,
      height: canvasHeight,
      antialias: true
    });

    this.app.renderer.backgroundColor = 0x000fff;
    console.log(this.app.renderer.backgroundColor);
    document.getElementById("pixi-div").appendChild(this.app.view);

    this.create_controls();
    this.getAudio();
  } // end of mounted
};
</script>

<style scoped>
canvas {
  width: 100%;
  height: 100%;
}
</style>
