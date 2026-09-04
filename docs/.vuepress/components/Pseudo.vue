<template>
  <div class="pseudo-wrapper">
    <pre ref="pseudo-content"><slot></slot></pre>
    <p v-if="status === 'loading'" class="pseudo-state" role="status">Loading pseudocode…</p>
    <p v-else-if="status === 'error'" class="pseudo-state" role="status">
      Pseudocode rendering is temporarily unavailable.
      <button type="button" @click="renderPseudo">Retry</button>
    </p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      status: "loading",
      source: "",
      isUnmounted: false,
    };
  },
  mounted() {
    this.source = this.$refs["pseudo-content"].textContent;
    this.renderPseudo();
  },
  methods: {
    async renderPseudo() {
      this.status = "loading";
      const element = this.$refs["pseudo-content"];
      element.textContent = this.source;

      try {
        if (!window.MathJax) {
          window.MathJax = {
            loader: {
              paths: {
                mathjax: "/static/mathjax",
              },
            },
            tex: {
              inlineMath: [['$', '$']],
              displayMath: [['$$', '$$']],
              processEscapes: true,
              processEnvironments: true,
            },
          };
        }

        await import("@mathjax/src/es5/tex-svg.js");
        await window.MathJax.startup?.promise;
        await import("/static/js/pseudocode.js");
        if (this.isUnmounted) return;
        window.pseudocode.renderElement(element, {
          indentSize: "1.5em",
          lineNumber: true,
        });
        this.status = "success";
      } catch (error) {
        if (this.isUnmounted) return;
        console.warn("Failed to render pseudocode:", error);
        this.status = "error";
      }
    },
  },
  beforeUnmount() {
    this.isUnmounted = true;
    this.$refs["pseudo-content"]?.replaceChildren();
  },
};
</script>

<style>
@import url("/static/css/pseudocode.min.css");

.pseudo-state {
  padding: 0.75rem;
  text-align: center;
}

.pseudo-state button {
  border: 0;
  background: transparent;
  color: #2c8f68;
  text-decoration: underline;
  cursor: pointer;
}
</style>
