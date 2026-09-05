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
        v-else-if="previewReady"
        :key="frameKey"
        frameborder="no"
        scrolling="no"
        :src="previewUrl"
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
      previewReady: false,
      previewRequest: null,
      showBinderBadge: true,
    };
  },
  computed: {
    previewUrl() {
      return "/static/jupyter/nb/" + this.htmlFilePath;
    },
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
    async preparePreview() {
      this.status = "loading";
      this.previewReady = false;
      this.previewRequest?.abort();
      const request = new AbortController();
      this.previewRequest = request;
      this.startLoadTimer();

      try {
        const response = await window.fetch(this.previewUrl, {
          method: "HEAD",
          cache: "no-store",
          signal: request.signal,
        });
        if (!response.ok) throw new Error(`Notebook preview returned HTTP ${response.status}.`);

        const contentType = response.headers.get("content-type") ?? "";
        if (contentType && !contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
          throw new Error(`Notebook preview returned unexpected content type: ${contentType}.`);
        }
        if (this.previewRequest !== request) return;

        this.previewRequest = null;
        this.frameKey += 1;
        this.previewReady = true;
      } catch (error) {
        if (error.name === "AbortError" || this.previewRequest !== request) return;
        this.previewRequest = null;
        console.warn("Failed to verify notebook preview:", error);
        this.status = "error";
        this.clearLoadTimer();
      }
    },
    retry() {
      this.preparePreview();
    },
    startLoadTimer() {
      this.clearLoadTimer();
      this.loadTimer = window.setTimeout(() => {
        if (this.status === "loading") {
          this.status = "error";
          this.previewRequest?.abort();
          this.previewRequest = null;
        }
      }, 12_000);
    },
    clearLoadTimer() {
      if (this.loadTimer) window.clearTimeout(this.loadTimer);
      this.loadTimer = null;
    },
  },
  mounted() {
    this.preparePreview();
  },
  beforeUnmount() {
    this.previewRequest?.abort();
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
