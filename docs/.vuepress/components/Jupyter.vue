<template>
  <div class="jupyter-content">
    <p>
      <a :href="'https://mybinder.org/v2/gh/LucienZhang/website-binder/master?filepath=notebooks/' + filePath"
        target="_blank" rel="noopener noreferrer">
        <img v-if="showBinderBadge" src="https://mybinder.org/badge_logo.svg" alt="Binder" @error="showBinderBadge = false" />
        <span v-else>Open in Binder</span>
      </a>
    </p>
    <a-spin size="large" tip="Loading..." :spinning="status === 'loading'">
      <div v-if="status === 'error'" class="jupyter-state" role="status">
        <p>The notebook preview is temporarily unavailable.</p>
        <button type="button" @click="retry">Retry</button>
      </div>
      <iframe
        v-else
        :key="frameKey"
        frameborder="no"
        scrolling="no"
        :src="'/static/jupyter/nb/' + htmlFilePath"
        @load="resizeIframe"
      ></iframe>
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
      status: "loading",
      htmlFilePath: this.filePath.replace(/\.ipynb$/, ".html"),
      frameKey: 0,
      loadTimer: null,
      showBinderBadge: true,
    };
  },
  methods: {
    resizeIframe(event) {
      try {
        const iframe = event.currentTarget;
        const documentElement = iframe.contentDocument?.documentElement;
        if (!documentElement) throw new Error("Notebook iframe document is unavailable.");
        iframe.style.height = documentElement.scrollHeight + "px";
        this.status = "success";
        this.clearLoadTimer();
      } catch (error) {
        console.warn("Failed to load notebook preview:", error);
        this.status = "error";
        this.clearLoadTimer();
      }
    },
    retry() {
      this.status = "loading";
      this.frameKey += 1;
      this.startLoadTimer();
    },
    startLoadTimer() {
      this.clearLoadTimer();
      this.loadTimer = window.setTimeout(() => {
        if (this.status === "loading") this.status = "error";
      }, 12_000);
    },
    clearLoadTimer() {
      if (this.loadTimer) window.clearTimeout(this.loadTimer);
      this.loadTimer = null;
    },
  },
  mounted() {
    this.startLoadTimer();
  },
  beforeUnmount() {
    this.clearLoadTimer();
  },
};
</script>

<style lang="scss" scoped>
.jupyter-content {
  iframe {
    width: 100%;
    max-width: 1020px; //keep consistent with sytles/palette.styl->$contentWidth - 40px*2 of padding
  }

  .jupyter-state {
    padding: 1rem;
    text-align: center;

    button {
      border: 0;
      background: transparent;
      color: #2c8f68;
      text-decoration: underline;
      cursor: pointer;
    }
  }
}
</style>
