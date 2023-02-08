<template>
  <pre ref="pseudo-content">
    <slot></slot>
  </pre>
</template>

<script>
export default {
  async mounted() {
    if (!window.MathJax) {
      window.MathJax = {
        tex: {
          inlineMath: [['$', '$']],
          displayMath: [['$$', '$$']],
          processEscapes: true,
          processEnvironments: true,
        },
        chtml: {
          fontURL: new URL("./assets/fonts", import.meta.url).href
        }
      };
    }

    await import("https://cdn.jsdelivr.net/npm/mathjax@3.0.0/es5/tex-chtml.js");
    await import("./assets/js/pseudocode");
    import("./assets/css/pseudocode.min.css");
    pseudocode.renderElement(this.$refs["pseudo-content"], {
      indentSize: "1.5em",
      lineNumber: true
    });
  }
};
</script>
