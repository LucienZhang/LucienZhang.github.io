<template>
  <div class="mnist">
    <canvas ref="mnist-canvas" id="mnist-canvas"></canvas>
    <div class="container-fluid">
      <div class="row text-center">
        <div class="col-2 col-btn">
          <button class="btn btn-info float-left" @click="clear">{{ clearBtnName }}</button>
        </div>
        <div class="col-8">
          <div v-if="result !== ''">
            <p>{{ resultTag }}: {{ result }}</p>
            <p>{{ probTag }}: {{ prob }}</p>
          </div>
        </div>
        <div class="col-2 col-btn">
          <button class="btn btn-success float-right" @click="recognize">{{ recognizeBtnName }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import SignaturePad from "signature_pad";
import { axiosMl } from "../axios-instances";
import { message } from "ant-design-vue";
import "ant-design-vue/lib/message/style/css";

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
    }
  },
  data() {
    return {
      result: "",
      prob: "",
      mnistPad: null
    };
  },
  methods: {
    clear() {
      this.result = "";
      this.prob = "";
      this.mnistPad.clear();
    },
    recognize() {
      if (this.mnistPad.isEmpty()) {
        message.warning(this.warningMsg);
      } else {
        this.getMNISTGridBySize(__APP_DEBUG__, 28, this.img2text);
      }
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

      img.onload = function () {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, grid.w, grid.h);

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
          setTimeout(function () {
            canvas.remove();
          }, 2000);
        }
      };

      img.src = this.mnistPad.toDataURL();
    },
    img2text(b64img) {
      b64img = b64img.split(",")[1]
      axiosMl
        .post("/mnist", { "img": b64img })
        .then(res => {
          if (res.status != 200) {
            message.error("未知错误");
            console.log(res);
          } else {
            this.result = res.data.result;
            this.prob = res.data.prob;
          }
        })
        .catch(res => {
          message.error("未知错误");
          console.log(res);
        });
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

    function resizeCanvas() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      canvas.getContext("2d").scale(1, 1);
      mnistPad.clear(); // otherwise isEmpty() might return incorrect value
    }
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
  }
};
</script>

<style lang="scss" scoped>
@import "bootstrap/scss/functions";
@import "bootstrap/scss/variables";
@import "bootstrap/scss/mixins";
@import "bootstrap/scss/grid";
@import "bootstrap/scss/buttons";
@import "bootstrap/scss/utilities";

.mnist {
  #mnist-canvas {
    width: 100%;
    height: 400px;
    max-width: 100%;
    max-height: 100%;
    border: 1px solid #d3d3d3;
  }

  .row {
    height: 55px;
  }

  p {
    margin: 0;
  }

  .col-btn {
    padding: 0;
  }
}
</style>
