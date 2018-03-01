<template>
  <div id="app">
    <web-player title="My Title" subtitle="My Subtitle"></web-player>
  </div>
</template>

<script>
// import HelloWorld from './components/HelloWorld'
import WebPlayer from './components/WebPlayer'

export default {
  name: 'App',
  components: {
    'web-player': WebPlayer
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
