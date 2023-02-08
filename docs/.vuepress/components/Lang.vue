<template>
  <div class="tiobe">
    <p>The chart below shows the changes in the popularity of the top 10 programming languages in the last 20 years.</p>
    <a-spin size="large" tip="Loading..." :spinning="chartOptions.series.length <= 0">
      <div>
        <highcharts v-if="chartOptions.series.length > 0" :options="chartOptions"></highcharts>
      </div>
    </a-spin>
    <p>The table below shows the current top 20 most popular programming languages.</p>
    <a-spin size="large" tip="Loading..." :spinning="!top20.tbody">
      <div class="table-wrapper">
        <table v-if="top20.tbody" class="table-top20">
          <thead v-html="top20.thead"></thead>
          <tbody>
            <tr v-for="(row, index) in top20.tbody" :key="index" @click="onClickTableRow(row.link)">
              <td>{{ row.now }}</td>
              <td>{{ row.pre }}</td>
              <td>
                <img v-if="row.changeArrow.src" :src="toLocalAsset(row.changeArrow.src)" :alt="row.changeArrow.alt">
              </td>
              <td class="td-top20">
                <img :src="toLocalAsset(row.langIcon.src)" :alt="row.langIcon.alt" :style="row.langIcon.style">
              </td>
              <td>{{ row.langName }}</td>
              <td>{{ row.rating }}</td>
              <td>{{ row.changePercentage }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </a-spin>
  </div>
</template>

<script>
import highchartsVuePackage from 'highcharts-vue';
const { Chart } = highchartsVuePackage;
import { axiosCorsProxy } from '../axios-instances'
import * as cheerio from 'cheerio';

export default {
  components: {
    highcharts: Chart
  },
  data() {
    return {
      chartOptions: {
        accessibility: {
          enabled: false
        },
        credits: {
          enabled: false
        },
        chart: {
          type: "spline"
        },
        plotOptions: {
          spline: {
            lineWidth: 4,
            states: {
              hover: {
                lineWidth: 5
              }
            },
            marker: {
              enabled: false
            }
          }
        },
        title: {
          text: "TIOBE Programming Community Index",
          x: -20,
          useHTML: true
        },
        subtitle: {
          text: "Source: www.tiobe.com",
          x: -20,
          useHTML: true
        },
        xAxis: {
          type: "datetime",
          dateTimeLabelFormats: {
            year: "%Y"
          }
        },
        yAxis: {
          title: {
            text: "Ratings (%)"
          },
          plotLines: [
            {
              value: 0,
              width: 1,
              color: "#808080"
            }
          ]
        },
        tooltip: {
          valueSuffix: "%",
          dateTimeLabelFormats: {
            week: "%B %Y"
          }
        },
        legend: {
          align: "center",
          borderWidth: 0
        },
        series: []
      },
      top20: {
        thead: null,
        tbody: null
      }
    };
  },
  methods: {
    onClickTableRow(link) {
      window.open("https://www.tiobe.com/tiobe-index/" + link + "/", "_blank");
    },
    getImageUrl(path) {
      return new URL(path, import.meta.url).href;
    },
    toLocalAsset(path) {
      return this.getImageUrl(`./assets/images/tiobe/${path.split('/').at(-1)}`)
    }
  },
  beforeMount() {
    axiosCorsProxy
      .post("", { url: "https://www.tiobe.com/tiobe-index/", method: "GET" }) // To get rid of CORS error
      .then(res => {
        let $ = cheerio.load(res.data.text);
        // highcharts
        let scripts = $("script").get();
        let testRe = /\$\('#container'\)\.highcharts/;
        let matchRe = /series: (\[\n\s*.*\n\s*\])/;
        for (const script of scripts) {
          if (
            script.children.length === 1 &&
            testRe.test(script.children[0].data)
          ) {
            this.chartOptions.series = eval(
              script.children[0].data.match(matchRe)[1]
            );
            break;
          }
        }

        // table top 20
        let table = $("#top20");
        this.top20.thead = table.find("thead").html();
        let tbody = [];
        for (const tr of table.find("tbody > tr").get()) {
          let row = {
            now: tr.children[0].children[0].data,
            pre: tr.children[1].children[0].data,
            changeArrow: tr.children[2].children.length === 1 ? tr.children[2].children[0].attribs : {},
            langIcon: tr.children[3].children[0].attribs,
            langName: tr.children[4].children[0].data,
            rating: tr.children[5].children[0].data,
            changePercentage: tr.children[6].children[0].data,
            link: encodeURIComponent(
              tr.children[4].children[0].data
                .replace("/", "-")
                .replace(".", "dot")
                .replace(/\s/g, "-")
                .toLowerCase()
                .replace("#", "sharp")
                .replace(/[+]/g, "plus")
            )
          };
          tbody.push(row);
        }
        this.top20.tbody = tbody;
      })
      .catch(res => {
        console.log(res);
      });
  },
};
</script>

<style lang="scss" scoped>
.tiobe {
  .ant-spin-nested-loading {
    min-height: 80px;
  }

  .table-wrapper {
    overflow: scroll;

    &::-webkit-scrollbar {
      display: none;
    }

    -ms-overflow-style: none;
  }

  table.table-top20 {
    text-align: center;
    background-color: #f2f7fc;

    tbody {
      td {
        border-color: rgb(166, 170, 175);
      }

      tr:nth-child(2n) {
        background-color: #dbe0e5;
      }

      tr:hover td {
        background-color: lightgrey;
        font-weight: bold;
        cursor: pointer;
      }

      td.td-top20 img {
        max-width: fit-content;
      }
    }
  }
}
</style>

<style lang="scss">
.tiobe {
  table.table-top20 {
    th {
      border-color: rgb(166, 170, 175);
    }
  }
}
</style>
