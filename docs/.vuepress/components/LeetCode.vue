<template>
  <div class="leetcode">
    <a-spin size="large" :tip="isEnglishSite ? 'Loading...' : '加载中…'" :spinning="status === 'loading'">
      <div v-if="status === 'error' || status === 'empty'" class="remote-state" role="status">
        <p>{{ status === 'empty' ? emptyText : unavailableText }}</p>
        <button type="button" @click="loadData">{{ retryText }}</button>
      </div>
      <template v-else>
        <p v-if="rating" class="rating">{{ isEnglishSite ? "Rating" : "竞赛积分" }}: {{ rating }}</p>
        <p v-if="CNranking" class="ranking">
          {{ isEnglishSite ? "China Ranking" : "中国排名" }}: {{ CNranking }}
        </p>
        <p v-if="ranking" class="ranking">{{ isEnglishSite ? "Global Ranking" : "全球排名" }}: {{ ranking }}</p>
        <div v-if="ranking" class="chart">
          <svg ref="chart"></svg>
        </div>
        <div v-if="status === 'partial'" class="remote-state remote-state--warning" role="status">
          <p>{{ partialText }}</p>
          <button type="button" @click="loadData">{{ retryText }}</button>
        </div>
      </template>
    </a-spin>
  </div>
</template>

<script>
import { useSiteLocaleData } from '@vuepress/client';
import {
  requestLeetCodeCnRanking,
  requestLeetCodeGlobalRanking,
  requestLeetCodeProfile,
} from '../remote-data.mjs';

export default {
  props: {
    lang: {
      type: String,
      required: false,
    },
  },
  computed: {
    siteLocale() {
      return useSiteLocaleData();
    },
    isEnglishSite() {
      return ["en", "en-us"].includes(this.siteLocale.value.lang.toLowerCase());
    },
    retryText() {
      return this.isEnglishSite ? "Retry" : "重试";
    },
    unavailableText() {
      return this.isEnglishSite
        ? "LeetCode ranking is temporarily unavailable."
        : "LeetCode 排名暂时不可用。";
    },
    emptyText() {
      return this.isEnglishSite ? "LeetCode returned no ranking data." : "LeetCode 没有返回排名数据。";
    },
    partialText() {
      return this.isEnglishSite
        ? "Some LeetCode ranking data is temporarily unavailable."
        : "部分 LeetCode 排名数据暂时不可用。";
    },
  },
  data() {
    return {
      ranking: null,
      rating: null,
      CNranking: null,
      status: "loading",
      requestController: null,
      resizeListener: null,
      chartInstance: null,
      assetsReady: false,
      isUnmounted: false,
    };
  },
  async mounted() {
    if (typeof window === 'undefined') return;

    try {
      await import("/static/js/d3.js");
      await import("/static/js/nv.d3.js");
      if (this.isUnmounted) return;
      this.assetsReady = true;
      await this.loadData();
    } catch (error) {
      if (this.isUnmounted) return;
      console.warn("Failed to initialize LeetCode chart:", error);
      this.status = "error";
    }
  },
  methods: {
    async loadData() {
      if (!this.assetsReady) return;

      this.requestController?.abort();
      this.cleanupChart();
      const controller = new AbortController();
      this.requestController = controller;
      this.status = "loading";
      this.ranking = null;
      this.rating = null;
      this.CNranking = null;

      const [globalResult, cnResult] = await Promise.allSettled([
        this.loadGlobalRanking(controller.signal),
        this.loadCnRanking(controller.signal),
      ]);
      if (this.isUnmounted || controller !== this.requestController || controller.signal.aborted) return;

      if (globalResult.status === "fulfilled") {
        this.ranking = globalResult.value.ranking;
        this.rating = globalResult.value.rating;
        this.renderChart(globalResult.value.history);
      } else {
        console.warn("Failed to load global LeetCode ranking:", globalResult.reason);
      }

      if (cnResult.status === "fulfilled") {
        this.CNranking = cnResult.value;
      } else {
        console.warn("Failed to load China LeetCode ranking:", cnResult.reason);
      }

      const successCount = Number(globalResult.status === "fulfilled") + Number(cnResult.status === "fulfilled");
      if (successCount === 0) {
        this.status = "error";
      } else if (!this.ranking && !this.CNranking) {
        this.status = "empty";
      } else {
        this.status = successCount === 2 ? "success" : "partial";
      }
    },
    async loadGlobalRanking(signal) {
      const profile = await requestLeetCodeProfile(signal);
      const response = await requestLeetCodeGlobalRanking(profile?.data?.cookies, signal);
      const data = parseProxyJson(response)?.data;
      const ranking = data?.userContestRanking;
      const history = data?.userContestRankingHistory;
      if (!ranking || !Array.isArray(history)) {
        throw new Error("Global LeetCode response is missing ranking data.");
      }
      return {
        ranking: finiteInteger(ranking.globalRanking, "global ranking"),
        rating: finiteInteger(ranking.rating, "rating"),
        history: history.slice(-1_000),
      };
    },
    async loadCnRanking(signal) {
      const response = await requestLeetCodeCnRanking(signal);
      const ranking = parseProxyJson(response)?.data?.userContestRanking?.currentRatingRanking;
      if (ranking == null) {
        throw new Error("China LeetCode response is missing ranking data.");
      }
      return finiteInteger(ranking, "China ranking");
    },
    renderChart(history) {
      this.$nextTick(() => {
        if (this.isUnmounted || !this.$refs.chart) return;
        const rankingData = [{
          values: history
            .map((node, index) => ({
              x: index,
              y: Number.parseInt(node.rating, 10),
              contest_title: String(node.contest?.title ?? "").slice(0, 200),
              ranking: Number.parseInt(node.ranking, 10),
            }))
            .filter((point) => Number.isFinite(point.y) && Number.isFinite(point.ranking)),
          key: "Rating",
          color: "#ff7f0e",
        }];
        const chart = nv.models
          .lineChart()
          .useInteractiveGuideline(false)
          .margin({ top: 20, right: 20, bottom: 40, left: 55 });

        chart.xAxis.axisLabel("Contest Number");
        chart.yAxis
          .axisLabel("Rating")
          .tickFormat(d3.format(".00f"))
          .axisLabelDistance(-10);
        chart.tooltip.contentGenerator((event) => {
          const title = escapeHtml(event.point.contest_title);
          const rating = escapeHtml(event.point.y);
          const rank = escapeHtml(event.point.ranking);
          const ranking = event.point.ranking == 0
            ? '<p style="text-align: left;">Not Attended</p>'
            : `<p style="text-align: left;">Ranking: <strong>${rank}</strong></p>`;
          return `<div><p style="text-align: left;">${title}</p></div>`
            + `<div><p style="text-align: left;">Rating: <strong>${rating}</strong></p>${ranking}</div>`;
        });

        d3.select(this.$refs.chart).datum(rankingData).call(chart);
        this.chartInstance = chart;
        this.resizeListener = nv.utils.windowResize(() => chart.update());
      });
    },
    cleanupChart() {
      this.resizeListener?.clear();
      this.resizeListener = null;
      this.chartInstance = null;
      if (this.$refs.chart) this.$refs.chart.replaceChildren();
    },
  },
  beforeUnmount() {
    this.isUnmounted = true;
    this.requestController?.abort();
    this.cleanupChart();
  },
};

function parseProxyJson(response) {
  const text = response?.data?.text;
  if (typeof text !== "string" || text.trim() === "") {
    throw new Error("Proxy returned an empty response.");
  }
  if (text.length > 2_000_000) {
    throw new Error("Proxy returned an unexpectedly large response.");
  }
  return JSON.parse(text);
}

function finiteInteger(value, label) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) throw new Error(`LeetCode returned an invalid ${label}.`);
  return parsed;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}
</script>

<style lang="scss" scoped>
@import url("/static/css/nv.d3.min.css");

.leetcode {
  .ranking {
    font-weight: bold;
    font-size: 1.3em;
    color: #ef4743;
  }

  .rating {
    font-weight: bold;
    font-size: 1.3em;
    color: rgb(255, 127, 14);
  }

  .chart svg {
    height: 450px;
  }

  .remote-state {
    padding: 1rem;
    border: 1px solid #d8dee4;
    border-radius: 4px;
    text-align: center;

    &--warning {
      margin-top: 1rem;
      border-color: #e6a23c;
    }

    button {
      padding: 0.4rem 0.9rem;
      border: 1px solid #3eaf7c;
      border-radius: 4px;
      background: transparent;
      color: #2c8f68;
      cursor: pointer;
    }
  }
}
</style>
