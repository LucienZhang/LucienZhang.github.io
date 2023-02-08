<template>
  <div ref="bim-content" class="bim-content">
    <canvas ref="three-canvas" id="three-canvas"></canvas>
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
  mounted() {
    const scene = new Scene();

    const bimDiv = this.$refs["bim-content"];

    //Object to store the size of the viewport
    const size = {
      width: bimDiv.clientWidth,
      height: bimDiv.clientHeight,
    };

    //Creates the camera (point of view of the user)
    const aspect = size.width / size.height;
    const camera = new PerspectiveCamera(75, aspect);
    camera.position.z = 15;
    camera.position.y = 13;
    camera.position.x = 8;

    //Creates the lights of the scene
    const lightColor = 0xffffff;

    const ambientLight = new AmbientLight(lightColor, 0.5);
    scene.add(ambientLight);

    const directionalLight = new DirectionalLight(lightColor, 1);
    directionalLight.position.set(0, 10, 0);
    directionalLight.target.position.set(-5, 0, 0);
    scene.add(directionalLight);
    scene.add(directionalLight.target);

    //Sets up the renderer, fetching the canvas of the HTML
    const threeCanvas = this.$refs["three-canvas"];
    const renderer = new WebGLRenderer({
      canvas: threeCanvas,
      alpha: true,
    });

    renderer.setSize(size.width, size.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    //Creates grids and axes in the scene
    const grid = new GridHelper(50, 30);
    scene.add(grid);

    const axes = new AxesHelper();
    axes.material.depthTest = false;
    axes.renderOrder = 1;
    scene.add(axes);

    //Creates the orbit controls (to navigate the scene)
    const controls = new OrbitControls(camera, threeCanvas);
    controls.enableDamping = true;
    controls.target.set(-2, 0, 0);

    //Animation loop
    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    animate();

    //Adjust the viewport to the size of the browser
    window.addEventListener("resize", () => {
      size.width = bimDiv.clientWidth;
      size.height = bimDiv.clientHeight;
      camera.aspect = size.width / size.height;
      camera.updateProjectionMatrix();
      renderer.setSize(size.width, size.height);
    });

    const ifcLoader = new IFCLoader();
    ifcLoader.ifcManager.setWasmPath("../../static/IFCwasm/"); //app.js in under /assets/js/, so ../../ is the root path
    ifcLoader.load("/static/bim/" + this.filePath, (ifcModel) => scene.add(ifcModel));
  }
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

  #three-canvas {
    outline: none;
  }
}
</style>
