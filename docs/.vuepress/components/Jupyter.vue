<template>
  <div class="jupyter-content">
    <p>
      <a :href="'https://mybinder.org/v2/gh/LucienZhang/website-binder/master?filepath=notebooks/' + filePath"
        target="_blank">
        <img src="https://mybinder.org/badge_logo.svg" alt="Binder" />
      </a>
    </p>
    <a-spin size="large" tip="Loading..." :spinning="spinning">
      <iframe frameborder="no" scrolling="no" :src="'/static/jupyter/nb/' + filePath" @load="resizeIframe"></iframe>
    </a-spin>
  </div>
</template>

<script>
export default {
  props: {
    filePath: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      spinning: true,
    };
  },
  methods: {
    resizeIframe(event) {
      let path = event.path || (event.composedPath && event.composedPath());
      let e = path[0];
      e.style.height =
        e.contentWindow.document.documentElement.scrollHeight + "px";
      this.spinning = false;
    },
  },
};
</script>

<style lang="scss" scoped>
.jupyter-content {
  iframe {
    width: 100%;
    max-width: 1020px; //keep consistent with sytles/palette.styl->$contentWidth - 40px*2 of padding
  }
}
</style>
