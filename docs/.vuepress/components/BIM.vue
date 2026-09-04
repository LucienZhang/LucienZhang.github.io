<template>
  <div ref="bim-content" class="bim-content">
    <canvas ref="three-canvas" id="three-canvas"></canvas>
    <div v-if="status === 'loading'" class="bim-state" role="status">Loading BIM model…</div>
    <div v-else-if="status === 'error'" class="bim-state" role="status">
      <span>The BIM model is temporarily unavailable.</span>
      <button type="button" @click="retry">Retry</button>
    </div>
  </div>
</template>

<script>
import {
  AmbientLight,
  AxesHelper,
  DirectionalLight,
  GridHelper,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { IFCLoader } from "web-ifc-three/IFCLoader";

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
      animationFrame: null,
      resizeHandler: null,
      scene: null,
      camera: null,
      renderer: null,
      controls: null,
      ifcLoader: null,
      ifcModel: null,
      isUnmounted: false,
    };
  },
  methods: {
    initializeViewer() {
      try {
        const scene = new Scene();
        const bimDiv = this.$refs["bim-content"];
        const size = {
          width: bimDiv.clientWidth,
          height: bimDiv.clientHeight,
        };

        const aspect = size.width / size.height;
        const camera = new PerspectiveCamera(75, aspect);
        camera.position.z = 15;
        camera.position.y = 13;
        camera.position.x = 8;

        const lightColor = 0xffffff;
        const ambientLight = new AmbientLight(lightColor, 0.5);
        scene.add(ambientLight);

        const directionalLight = new DirectionalLight(lightColor, 1);
        directionalLight.position.set(0, 10, 0);
        directionalLight.target.position.set(-5, 0, 0);
        scene.add(directionalLight);
        scene.add(directionalLight.target);

        const threeCanvas = this.$refs["three-canvas"];
        const renderer = new WebGLRenderer({
          canvas: threeCanvas,
          alpha: true,
        });
        renderer.setSize(size.width, size.height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const grid = new GridHelper(50, 30);
        scene.add(grid);

        const axes = new AxesHelper();
        axes.material.depthTest = false;
        axes.renderOrder = 1;
        scene.add(axes);

        const controls = new OrbitControls(camera, threeCanvas);
        controls.enableDamping = true;
        controls.target.set(-2, 0, 0);

        const animate = () => {
          if (this.isUnmounted) return;
          controls.update();
          renderer.render(scene, camera);
          this.animationFrame = requestAnimationFrame(animate);
        };
        animate();

        this.resizeHandler = () => {
          size.width = bimDiv.clientWidth;
          size.height = bimDiv.clientHeight;
          camera.aspect = size.width / size.height;
          camera.updateProjectionMatrix();
          renderer.setSize(size.width, size.height);
        };
        window.addEventListener("resize", this.resizeHandler);

        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.controls = controls;
        this.ifcLoader = new IFCLoader();
        this.ifcLoader.ifcManager.setWasmPath("/static/IFCwasm/");
        this.loadModel();
      } catch (error) {
        console.warn("Failed to initialize BIM viewer:", error);
        this.status = "error";
      }
    },
    retry() {
      if (this.ifcLoader) this.loadModel();
      else this.initializeViewer();
    },
    loadModel() {
      if (!this.ifcLoader || !this.scene) return;
      if (this.ifcModel) {
        this.ifcLoader.ifcManager.close(this.ifcModel.modelID, this.scene);
        this.ifcModel = null;
      }
      this.status = "loading";
      this.ifcLoader.load(
        "/static/bim/" + this.filePath,
        (ifcModel) => {
          if (this.isUnmounted) {
            this.ifcLoader?.ifcManager.close(ifcModel.modelID);
            return;
          }
          this.ifcModel = ifcModel;
          this.scene.add(ifcModel);
          this.status = "success";
        },
        undefined,
        (error) => {
          if (this.isUnmounted) return;
          console.warn("Failed to load BIM model:", error);
          this.status = "error";
        },
      );
    },
  },
  mounted() {
    this.initializeViewer();
  },
  beforeUnmount() {
    this.isUnmounted = true;
    if (this.animationFrame != null) cancelAnimationFrame(this.animationFrame);
    if (this.resizeHandler) window.removeEventListener("resize", this.resizeHandler);
    this.controls?.dispose();
    if (this.ifcModel) this.ifcLoader?.ifcManager.close(this.ifcModel.modelID, this.scene);
    this.scene?.traverse((object) => {
      object.geometry?.dispose?.();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.filter(Boolean).forEach((material) => material.dispose?.());
    });
    this.renderer?.dispose();
    this.renderer?.forceContextLoss();
  },
};
</script>

<style lang="scss" scoped>
.bim-content {
  width: 100%;
  height: 600px;

  margin: 0;
  padding: 0;
  box-sizing: border-box;

  overflow: hidden;
  position: relative;

  #three-canvas {
    outline: none;
  }

  .bim-state {
    position: absolute;
    inset: 1rem 1rem auto;
    padding: 0.75rem;
    border-radius: 4px;
    background: rgb(255 255 255 / 90%);
    text-align: center;

    button {
      margin-left: 0.75rem;
      border: 0;
      background: transparent;
      color: #2c8f68;
      text-decoration: underline;
      cursor: pointer;
    }
  }
}
</style>
