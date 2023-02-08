<template>
  <main class="home" aria-labelledby="main-title">

    <body :class="{ 'is-preload': isPreload, 'is-touch': isTouchDevice }">
      <!-- Header -->
      <header id="header">
        <div class="inner">
          <a class="image avatar">
            <img src="./assets/images/avatar.jpg" alt="Avatar" />
          </a>
          <h1>
            <strong v-if="isEnglishSite">I am Zhang Ziliang</strong>
            <strong v-else>我是张子良</strong>
            <div>
              <span v-if="isEnglishSite">I like </span>
              <span v-else>我喜欢</span>
              <span id="typed"></span>
            </div>
          </h1>
        </div>
        <footer v-if="largeScreen" id="footer">
          <div class="inner">
            <ul class="icons">
              <li>
                <a href="https://github.com/LucienZhang" target="_blank" class="icon brands fa-github">
                  <span class="label">Github</span>
                </a>
              </li>
              <li>
                <a href="https://www.linkedin.com/in/zhang-ziliang/" target="_blank" class="icon brands fa-linkedin">
                  <span class="label">LinkedIn</span>
                </a>
              </li>
              <li>
                <a class="icon brands fa-weixin" @click="qrcode = true">
                  <span class="label">WeChat</span>
                </a>
              </li>
              <li>
                <a href="mailto:lucienzhangzl@outlook.com" class="icon solid fa-envelope">
                  <span class="label">Email</span>
                </a>
              </li>
            </ul>
            <ul class="copyright">
              <li>&copy; ZHANG Ziliang</li>
              <li>
                Inspired by:
                <a href="http://html5up.net">HTML5 UP</a>
              </li>
              <li><a href="https://beian.miit.gov.cn/" target="_blank">粤ICP备20008417号</a></li>
            </ul>
          </div>
        </footer>
      </header>

      <!-- Main -->
      <div id="main">
        <!-- One -->
        <section id="one">
          <header class="major">
            <h2 v-if="isEnglishSite">
              If I have any hobbies,
              <br />it is creating.
            </h2>
            <h2 v-else>
              如果说我有什么爱好的话，
              <br />那便是创造。
            </h2>
          </header>
          <p v-if="isEnglishSite">
            I am a server-side developer, and I'm also interested in machine learning and game development.
            During the quarantine of the
            <a href="https://en.wikipedia.org/wiki/Coronavirus_disease_2019" target="_blank">COVID-19</a>, I was
            completely obsessed with cooking.
            If programming and cooking have anything in common, I would say it's the fun of creating.
          </p>
          <p v-else>
            我是一名服务端开发者，同时我也对机器学习和游戏开发感兴趣。
            在
            <a href="https://zh.wikipedia.org/wiki/2019%E5%86%A0%E7%8A%B6%E7%97%85%E6%AF%92%E7%97%85"
              target="_blank">COVID-19</a>
            疫情隔离期间，我学会了做菜。如果说写代码和做菜之间有什么共同点的话，那便是创造的乐趣。
          </p>
          <ul class="actions">
            <li>
              <a href="https://www.linkedin.com/in/zhang-ziliang/" class="button" target="_blank">{{
                isEnglishSite? 'My LinkedIn': '我的领英'
              }}</a>
            </li>
          </ul>
        </section>

        <!-- Two -->
        <section id="two">
          <h2>Recent Work</h2>
          <div class="row">
            <article class="col-6 col-12-xsmall work-item">
              <a :href="rootPath + 'programming/prog-lang/overview.html'" class="image fit thumb">
                <img :src="getImageUrl('./assets/images/recent_work/programming.png')" />
              </a>
              <h3>Programming</h3>
              <p>Here I wrote some notes about programming languages and algorithms.</p>
            </article>
            <article class="col-6 col-12-xsmall work-item">
              <a :href="rootPath + 'ml/overview.html'" class="image fit thumb">
                <img :src="getImageUrl('./assets/images/recent_work/ml.jpg')" />
              </a>
              <h3>ML &amp; DL</h3>
              <p>Here I wrote some notes about machine learning and deep learning.</p>
            </article>
          </div>
          <!-- <ul class="actions">
          <li>
            <a href="#" class="button">Full Portfolio</a>
          </li>
        </ul>-->
        </section>

        <!-- Three -->
        <!-- <section id="three">
        <h2>Get In Touch</h2>
        <p>Accumsan pellentesque commodo blandit enim arcu non at amet id arcu magna. Accumsan orci faucibus id eu lorem semper nunc nisi lorem vulputate lorem neque lorem ipsum dolor.</p>
        <div class="row">
          <div class="col-8 col-12-small">
            <form method="post" action="#">
              <div class="row gtr-uniform gtr-50">
                <div class="col-6 col-12-xsmall">
                  <input type="text" name="name" id="name" placeholder="Name" />
                </div>
                <div class="col-6 col-12-xsmall">
                  <input type="email" name="email" id="email" placeholder="Email" />
                </div>
                <div class="col-12">
                  <textarea name="message" id="message" placeholder="Message" rows="4"></textarea>
                </div>
              </div>
            </form>
            <ul class="actions">
              <li>
                <input type="submit" value="Send Message" />
              </li>
            </ul>
          </div>
          <div class="col-4 col-12-small">
            <ul class="labeled-icons">
              <li>
                <h3 class="icon solid fa-home">
                  <span class="label">Address</span>
                </h3>1234 Somewhere Rd.
                <br />Nashville, TN 00000
                <br />United States
              </li>
              <li>
                <h3 class="icon solid fa-mobile-alt">
                  <span class="label">Phone</span>
                </h3>000-000-0000
              </li>
              <li>
                <h3 class="icon solid fa-envelope">
                  <span class="label">Email</span>
                </h3>
                <a href="#">hello@untitled.tld</a>
              </li>
            </ul>
          </div>
        </div>
      </section>-->
      </div>
      <footer v-if="!largeScreen" id="footer">
        <div class="inner">
          <ul class="icons">
            <li>
              <a href="https://github.com/LucienZhang" target="_blank" class="icon brands fa-github">
                <span class="label">Github</span>
              </a>
            </li>
            <li>
              <a href="https://www.linkedin.com/in/zhang-ziliang/" target="_blank" class="icon brands fa-linkedin">
                <span class="label">LinkedIn</span>
              </a>
            </li>
            <li>
              <a class="icon brands fa-weixin" @click="qrcode = true">
                <span class="label">WeChat</span>
              </a>
            </li>
            <li>
              <a href="mailto:lucienzhangzl@outlook.com" class="icon solid fa-envelope">
                <span class="label">Email</span>
              </a>
            </li>
          </ul>
          <ul class="copyright">
            <li>&copy; ZHANG Ziliang</li>
            <li>
              Inspired by:
              <a href="http://html5up.net">HTML5 UP</a>
            </li>
            <li><a href="https://beian.miit.gov.cn/" target="_blank">粤ICP备20008417号</a></li>
          </ul>
        </div>
      </footer>
    </body>
    <a-modal :visible="qrcode" :centered="true" :closable="false" :footer="null" @cancel="qrcode = false">
      <div class="square">
        <img :src="getImageUrl('./assets/images/wechat.jpg')" alt="QR Code" style="width: 100%; height: 100%;" />
      </div>
    </a-modal>
  </main>
</template>

<script>
import Typed from "typed.js";
import { useSiteLocaleData } from '@vuepress/client';

export default {
  name: "Home",
  data() {
    return {
      typed: null,
      qrcode: false,
      isPreload: true,
      largeScreen: false,
      bp: false,
      isTouchDevice: false
    };
  },
  computed: {
    siteLocale() {
      return useSiteLocaleData();
    },
    isEnglishSite() {
      return ["en", "en-us"].includes(this.siteLocale.value.lang.toLowerCase());
    },
    rootPath() {
      return this.isEnglishSite ? "/" : "/zh/";
    }
  },
  methods: {
    getImageUrl(path) {
      return new URL(path, import.meta.url).href;
    },
    restartTyped() {
      let strings = this.isEnglishSite ? [
        "coding",
        "cooking",
        "hiking",
        "mountaineering",
        "board games"
      ] : ["编程", "做菜", "徒步", "登山", "桌游"];
      if (this.typed) {
        this.typed.destroy();
      }
      this.typed = new Typed(".home #typed", {
        strings: strings,
        typeSpeed: 40,
        shuffle: true,
        loop: true
      });
    }
  },
  mounted() {
    this.isTouchDevice = (('ontouchstart' in window) ||
      (navigator.maxTouchPoints > 0) ||
      (navigator.msMaxTouchPoints > 0));

    let that = this;

    that.restartTyped();

    setTimeout(() => {
      that.isPreload = false;
    }, 100);

    import("breakpoints-js").then(Breakpoints => {
      that.bp = Breakpoints = Breakpoints.default;
      Breakpoints({
        small: {
          min: 0,
          max: 980
        },
        medium: {
          min: 981,
          max: Infinity
        }
      });

      Breakpoints.get("medium").on({
        enter: function () {
          that.largeScreen = true;
        }
      });
      Breakpoints.get("small").on({
        enter: function () {
          that.largeScreen = false;
        }
      });
    });
    //    $window.on("load", function() {
    //   $("#two").poptrox({
    //     caption: function($a) {
    //       return $a.next("h3").text();
    //     },
    //     overlayColor: "#2c2c2c",
    //     overlayOpacity: 0.85,
    //     popupCloserText: "",
    //     popupLoaderText: "",
    //     selector: ".work-item a.image",
    //     usePopupCaption: true,
    //     usePopupDefaultStyling: false,
    //     usePopupEasyClose: false,
    //     usePopupNav: true,
    //     windowMargin: breakpoints.active("<=small") ? 0 : 50,
    //   });
    // });
  },
  watch: {
    isEnglishSite() {
      this.restartTyped();
    }
  },
  beforeDestroy() {
    this.typed.destroy();
    this.bp.off("medium");
    this.bp.off("small"); // this may affect other usage
  }
};
</script>

<style scoped>
@import "./assets/css/home.css";
</style>

<style lang="scss" scoped>
$navbarHeight: 3.6em;
$homepageWidth: 100%;

.home {
  box-sizing: border-box;
  padding: $navbarHeight 0 0;
  max-width: $homepageWidth;
  margin: 0px auto;
  display: block;

  @media screen and (min-width: 737px) {
    #header {
      padding-top: 6em + $navbarHeight
    }
  }

}
</style>
