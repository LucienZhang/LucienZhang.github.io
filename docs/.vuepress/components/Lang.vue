<template>
  <div class="tiobe">
    <div v-if="status === 'error' || status === 'empty'" class="remote-state" role="status">
      <p>{{ errorMessage }}</p>
      <button type="button" @click="loadData">Retry</button>
    </div>
    <template v-else>
      <p>The chart below shows the changes in the popularity of the top 10 programming languages in the last 20 years.</p>
      <a-spin size="large" tip="Loading..." :spinning="status === 'loading'">
        <div>
          <highcharts v-if="status === 'success'" :options="chartOptions"></highcharts>
        </div>
      </a-spin>
      <p>The table below shows the current top 20 most popular programming languages.</p>
      <a-spin size="large" tip="Loading..." :spinning="status === 'loading'">
        <div class="table-wrapper">
          <table v-if="status === 'success'" class="table-top20">
            <thead>
              <tr>
                <th v-for="(heading, index) in top20.thead" :key="index" :colspan="heading.colspan">
                  {{ heading.text }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in top20.tbody" :key="index" @click="onClickTableRow(row.link)">
                <td>{{ row.now }}</td>
                <td>{{ row.pre }}</td>
                <td>
                  <img v-if="row.changeArrow.src" :src="getImageUrl(row.changeArrow.src)" :alt="row.changeArrow.alt">
                </td>
                <td class="td-top20">
                  <img :src="getImageUrl(row.langIcon.src)" :alt="row.langIcon.alt">
                </td>
                <td>{{ row.langName }}</td>
                <td>{{ row.rating }}</td>
                <td>{{ row.changePercentage }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </a-spin>
    </template>
  </div>
</template>

<script>
import { Chart } from 'highcharts-vue';
import { requestTiobeIndex } from '../remote-data.mjs';
import { parseTiobeHtml } from '../tiobe-parser.mjs';

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
        thead: [],
        tbody: []
      },
      imageUrls: {},
      status: "loading",
      errorMessage: "",
      requestController: null,
      isUnmounted: false
    };
  },
  methods: {
    onClickTableRow(link) {
      window.open(
        "https://www.tiobe.com/tiobe-index/" + link + "/",
        "_blank",
        "noopener,noreferrer",
      );
    },
    getImageUrl(path) {
      return this.imageUrls[`./assets/images/tiobe/${path.split('/').at(-1)}`];
    },
    async loadData() {
      this.requestController?.abort();
      const controller = new AbortController();
      this.requestController = controller;
      this.status = "loading";
      this.errorMessage = "";
      this.chartOptions.series = [];
      this.top20 = { thead: [], tbody: [] };

      try {
        const response = await requestTiobeIndex(controller.signal);
        if (this.isUnmounted || controller !== this.requestController) return;

        const html = response?.data?.text;
        if (typeof html !== "string" || html.trim() === "") {
          this.status = "empty";
          this.errorMessage = "TIOBE returned no data. Please try again later.";
          return;
        }

        const parsed = parseTiobeHtml(html);
        this.chartOptions.series = parsed.series;
        this.top20 = parsed.top20;
        this.status = "success";
      } catch (error) {
        if (controller.signal.aborted || this.isUnmounted) return;
        console.warn("Failed to load TIOBE data:", error);
        this.status = "error";
        this.errorMessage = "TIOBE data is temporarily unavailable.";
      }
    }
  },
  beforeMount() {
    this.imageUrls = import.meta.glob('./assets/images/tiobe/*.png', { eager: true, import: 'default' });
    this.loadData();
  },
  beforeUnmount() {
    this.isUnmounted = true;
    this.requestController?.abort();
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

  .remote-state {
    padding: 1rem;
    border: 1px solid #d8dee4;
    border-radius: 4px;
    text-align: center;

    button {
      padding: 0.4rem 0.9rem;
      border: 1px solid #3eaf7c;
      border-radius: 4px;
      background: transparent;
      color: #2c8f68;
      cursor: pointer;
    }
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
