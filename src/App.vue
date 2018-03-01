<template>
  <div id="app">
    <web-player :ctx="audio" title="My Title" subtitle="My Subtitle"></web-player>
  </div>
</template>

<script>
// import HelloWorld from './components/HelloWorld'
import WebPlayer from "./components/WebPlayer";

var audioContext =
  typeof audioContext !== "undefined" ? audioContext : new AudioContext();

console.log("audi..");
console.log(audioContext);

export default {
  name: "App",
  components: {
    "web-player": WebPlayer
  },
  data() {
    return {
      audio: audioContext
    };
  }
};
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
