<template>
  <div class="leetcode">
    <a-spin size="large" tip="Loading..." :spinning="!ranking">
      <p v-if="rating" class="rating">{{ isEnglishSite? "Rating": "竞赛积分" }}: {{ rating }}</p>
      <p v-if="CNranking" class="ranking">
        {{ isEnglishSite? "China Ranking": "中国排名" }}: {{ CNranking }}
      </p>
      <p v-if="ranking" class="ranking">{{ isEnglishSite? "Global Ranking": "全球排名" }}: {{ ranking }}</p>
      <div id="chart">
        <svg></svg>
      </div>
    </a-spin>
  </div>
</template>

<script>
import { useSiteLocaleData } from '@vuepress/client';
import { axiosCorsProxy } from '../axios-instances';

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
  },
  data() {
    return {
      ranking: null,
      rating: null,
      CNranking: null,
    };
  },
  async beforeMount() {
    await import("./assets/js/d3");
    await import("./assets/js/nv.d3");
    // ranking details from global site
    axiosCorsProxy
      .post("", { url: "https://leetcode.com/lucienzhang/", method: "GET" })
      .then(res => {
        return axiosCorsProxy.post("",
          {
            url: "https://leetcode.com/graphql",
            method: "POST",
            headers: {
              referer: "https://leetcode.com/lucienzhang/",
              "content-type": "application/json"
            },
            cookies: res.data.cookies,
            data: JSON.stringify({
              operationName: "getContentRankingData",
              variables: { username: "lucienzhang" },
              query: `
query getContentRankingData($username: String!) {
  userContestRanking(username: $username) {
    attendedContestsCount
    rating
    globalRanking
    __typename
  }
  userContestRankingHistory(username: $username) {
    contest {
      title
      startTime
      __typename
    }
    rating
    ranking
    __typename
  }
}
`,
            }),
          },
        );
      })
      .then((res) => {
        let data = JSON.parse(res.data.text).data;
        this.ranking = data.userContestRanking.globalRanking;
        this.rating = parseInt(data.userContestRanking.rating);

        let ranking_data = [{ values: [], key: "Rating", color: "#ff7f0e" }];

        data.userContestRankingHistory.forEach(function (node, i) {
          ranking_data[0].values.push({
            x: i,
            y: parseInt(node.rating),
            contest_title: node.contest.title,
            ranking: node.ranking,
          });
        });

        nv.addGraph(function () {
          let chart = nv.models
            .lineChart()
            .useInteractiveGuideline(false)
            .margin({ top: 20, right: 20, bottom: 40, left: 55 });

          chart.xAxis.axisLabel("Contest Number");

          chart.yAxis
            .axisLabel("Rating")
            .tickFormat(d3.format(".00f"))
            .axisLabelDistance(-10);

          chart.tooltip.contentGenerator(function (e) {
            let ranking =
              '<p style="text-align: left;">Ranking: <strong>' +
              e.point.ranking +
              "</strong></p>";
            if (e.point.ranking == 0) {
              ranking = '<p style="text-align: left;">Not Attended</p>';
            }
            return (
              '<div><p style="text-align: left;">' +
              e.point.contest_title +
              '</p></div><div><p style="text-align: left;">Rating: <strong>' +
              e.point.y +
              "</strong></p>" +
              ranking +
              "</div>"
            );
          });

          d3.select("#chart svg").datum(ranking_data).call(chart);

          //Update the chart when window resizes.
          nv.utils.windowResize(function () {
            chart.update();
          });
          return chart;
        });
      })
      .catch((res) => {
        console.log(res);
      });

    // CN ranking from CN site
    axiosCorsProxy
      .post("",
        {
          url: "https://leetcode.cn/graphql",
          method: "POST",
          headers: {
            "content-type": "application/json"
          },
          data: JSON.stringify({
            operationName: "userContest",
            variables: { userSlug: "lucien_z" },
            query: `
query userContest($userSlug: String!) {
  userContestRanking(userSlug: $userSlug) {
    currentRatingRanking
    __typename
  }
}
`,
          })
        })
      .then((res) => {
        this.CNranking = JSON.parse(res.data.text).data.userContestRanking.currentRatingRanking;
      })
      .catch((res) => {
        console.log(res);
      });
  },
};
</script>

<style lang="scss" scoped>
@import url("https://cdnjs.cloudflare.com/ajax/libs/nvd3/1.8.6/nv.d3.min.css");

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

  #chart svg {
    height: 450px;
  }
}
</style>
