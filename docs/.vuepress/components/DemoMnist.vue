<template>
  <div class="mnist">
    <canvas ref="mnist-canvas" id="mnist-canvas"></canvas>
    <div class="mnist-controls">
      <div class="mnist-controls__row">
        <div class="mnist-controls__action mnist-controls__action--start">
          <button type="button" class="mnist-button mnist-button--clear" @click="clear">{{ clearBtnName }}</button>
        </div>
        <div class="mnist-controls__result">
          <div v-if="result !== ''">
            <p>{{ resultTag }}: {{ result }}</p>
            <p>{{ probTag }}: {{ prob }}</p>
          </div>
        </div>
        <div class="mnist-controls__action mnist-controls__action--end">
          <button
            type="button"
            class="mnist-button mnist-button--recognize"
            :disabled="isRecognizing"
            @click="recognize"
          >
            {{ isRecognizing ? recognizingBtnName : recognizeBtnName }}
          </button>
        </div>
      </div>
      <div v-if="requestError" class="mnist-error" role="status">
        <span>{{ requestError }}</span>
        <button type="button" class="mnist-retry" @click="retry">{{ retryBtnName }}</button>
      </div>
    </div>
  </div>
</template>

<script>
import SignaturePad from "signature_pad";
import { axiosMl } from "../axios-instances";
import { message } from "ant-design-vue";

export default {
  props: {
    clearBtnName: {
      type: String,
      required: false,
      default: "Clear"
    },
    recognizeBtnName: {
      type: String,
      required: false,
      default: "Recognize"
    },
    resultTag: {
      type: String,
      required: false,
      default: "Result"
    },
    probTag: {
      type: String,
      required: false,
      default: "Probability"
    },
    warningMsg: {
      type: String,
      required: false,
      default: "Please write down a digit!"
    },
    recognizingBtnName: {
      type: String,
      default: "Recognizing..."
    },
    retryBtnName: {
      type: String,
      default: "Retry"
    },
    errorMsg: {
      type: String,
      default: "Recognition is temporarily unavailable."
    }
  },
  data() {
    return {
      result: "",
      prob: "",
      mnistPad: null,
      isRecognizing: false,
      requestError: "",
      lastImage: "",
      requestController: null,
      resizeHandler: null,
      previewTimer: null,
      isUnmounted: false
    };
  },
  methods: {
    clear() {
      this.result = "";
      this.prob = "";
      this.requestError = "";
      this.lastImage = "";
      this.requestController?.abort();
      this.isRecognizing = false;
      this.mnistPad?.clear();
    },
    recognize() {
      if (this.mnistPad.isEmpty()) {
        message.warning(this.warningMsg);
      } else {
        this.requestError = "";
        this.getMNISTGridBySize(__APP_DEBUG__, 28, this.img2text);
      }
    },
    retry() {
      if (this.lastImage) this.img2text(this.lastImage);
    },
    getArea() {
      let xs = [];
      let ys = [];

      let orign = this.mnistPad.toData();

      for (let i = 0; i < orign.length; i++) {
        const orignChild = orign[i].points;

        for (let j = 0; j < orignChild.length; j++) {
          xs.push(orignChild[j].x);
          ys.push(orignChild[j].y);
        }
      }
      let paddingNum = 30;

      let min_x = Math.min.apply(null, xs) - paddingNum;
      let min_y = Math.min.apply(null, ys) - paddingNum;
      let max_x = Math.max.apply(null, xs) + paddingNum;
      let max_y = Math.max.apply(null, ys) + paddingNum;

      let width = max_x - min_x,
        height = max_y - min_y;

      let grid = {
        x: min_x,
        y: min_y,
        w: width,
        h: height
      };

      return grid;
    },
    change2grid(area) {
      let w = area.w,
        h = area.h,
        x = area.x,
        y = area.y;

      let xc = x,
        yc = y,
        wc = w,
        hc = h;

      if (h >= w) {
        xc = x - (h - w) * 0.5;
        wc = h;
      } else {
        yc = y - (w - h) * 0.5;
        hc = w;
      }
      return {
        x: xc,
        y: yc,
        w: wc,
        h: hc
      };
    },
    getMNISTGridBySize(isDev, size, cb) {
      let area = this.getArea();
      let grid = this.change2grid(area);

      if (isDev) {
        this.mnistPad._ctx.strokeStyle = "green";
        this.mnistPad._ctx.strokeRect(area.x, area.y, area.w, area.h);

        this.mnistPad._ctx.strokeStyle = "pink";
        this.mnistPad._ctx.strokeRect(grid.x, grid.y, grid.w, grid.h);
      }
      let canvas = document.createElement("canvas"),
        ctx = canvas.getContext("2d");
      canvas.width = size;
      canvas.height = size;

      let img = new Image();

      img.onload = () => {
        if (this.isUnmounted) return;
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, size, size);

        ctx.drawImage(img, grid.x, grid.y, grid.w, grid.h, 0, 0, size, size);

        let imgData = ctx.getImageData(0, 0, size, size);

        for (let i = 0; i < imgData.data.length; i += 4) {
          imgData.data[i] = 255 - imgData.data[i];
          imgData.data[i + 1] = 255 - imgData.data[i + 1];
          imgData.data[i + 2] = 255 - imgData.data[i + 2];
          imgData.data[i + 3] = 255;
        }

        ctx.putImageData(imgData, 0, 0);

        cb(canvas.toDataURL());

        if (isDev) {
          document.body.append(canvas);
          this.previewTimer = window.setTimeout(() => {
            canvas.remove();
          }, 2000);
        }
      };

      img.src = this.mnistPad.toDataURL();
    },
    async img2text(dataUrl) {
      this.requestController?.abort();
      const controller = new AbortController();
      this.requestController = controller;
      this.lastImage = dataUrl;
      this.isRecognizing = true;
      this.requestError = "";

      try {
        const response = await axiosMl.post(
          "/mnist",
          { img: dataUrl.split(",")[1] },
          { signal: controller.signal },
        );
        if (this.isUnmounted || controller !== this.requestController) return;
        if (response.data?.result == null || response.data?.prob == null) {
          throw new Error("MNIST response is missing recognition data.");
        }
        this.result = response.data.result;
        this.prob = response.data.prob;
      } catch (error) {
        if (controller.signal.aborted || this.isUnmounted) return;
        console.warn("Failed to recognize MNIST image:", error);
        this.requestError = this.errorMsg;
        message.error(this.errorMsg);
      } finally {
        if (!this.isUnmounted && controller === this.requestController) {
          this.isRecognizing = false;
        }
      }
    }
  },
  mounted() {
    let canvas = this.$refs["mnist-canvas"];
    let mnistPad = new SignaturePad(canvas, {
      backgroundColor: "transparent",
      minWidth: 6,
      maxWidth: 6
    });

    this.mnistPad = mnistPad;

    this.resizeHandler = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      canvas.getContext("2d").scale(1, 1);
      mnistPad.clear(); // otherwise isEmpty() might return incorrect value
    };
    window.addEventListener("resize", this.resizeHandler);
    this.resizeHandler();
  },
  beforeUnmount() {
    this.isUnmounted = true;
    this.requestController?.abort();
    if (this.resizeHandler) window.removeEventListener("resize", this.resizeHandler);
    if (this.previewTimer) window.clearTimeout(this.previewTimer);
    this.mnistPad?.off();
  }
};
</script>

<style scoped>
.mnist {
  width: 100%;
}

#mnist-canvas {
  width: 100%;
  height: 400px;
  max-width: 100%;
  max-height: 100%;
  border: 1px solid #d3d3d3;
}

.mnist-controls {
  width: 100%;
}

.mnist-controls__row {
  display: flex;
  align-items: flex-start;
  width: 100%;
  min-height: 55px;
  text-align: center;
}

.mnist-controls__action {
  display: flex;
  flex: 0 0 16.666667%;
  max-width: 16.666667%;
}

.mnist-controls__action--start {
  justify-content: flex-start;
}

.mnist-controls__action--end {
  justify-content: flex-end;
}

.mnist-controls__result {
  flex: 0 0 66.666667%;
  max-width: 66.666667%;
}

.mnist-controls__result p {
  margin: 0;
}

.mnist-button {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  border: 1px solid transparent;
  border-radius: 0.25rem;
  color: #fff;
  font-family: inherit;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.5;
  text-align: center;
  vertical-align: middle;
  user-select: none;
  cursor: pointer;
  transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out,
    border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.mnist-button:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

.mnist-button--clear {
  border-color: #17a2b8;
  background-color: #17a2b8;
}

.mnist-button--clear:hover {
  border-color: #117a8b;
  background-color: #138496;
}

.mnist-button--recognize {
  border-color: #28a745;
  background-color: #28a745;
}

.mnist-button--recognize:hover {
  border-color: #1e7e34;
  background-color: #218838;
}

.mnist-button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.mnist-error {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  justify-content: center;
  color: #c0392b;
}

.mnist-retry {
  border: 0;
  background: transparent;
  color: inherit;
  text-decoration: underline;
  cursor: pointer;
}
</style>
