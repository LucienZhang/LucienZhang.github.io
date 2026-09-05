import * as cheerio from "cheerio";

const SERIES_BLOCK_RE = /series\s*:\s*\[([\s\S]*?)\]\s*\}\s*\);/;
const SERIES_RE = /\{\s*name\s*:\s*'((?:\\.|[^'])*)'\s*,\s*data\s*:\s*\[([\s\S]*?)\]\s*\}/g;
const POINT_RE = /\[\s*Date\.UTC\(\s*(\d{4}),\s*(\d{1,2}),\s*(\d{1,2})\s*\)\s*,\s*(-?\d+(?:\.\d+)?)\s*\]/g;
const MAX_DOCUMENT_SIZE = 1_000_000;
const MAX_SERIES = 20;
const MAX_POINTS_PER_SERIES = 1_000;

export function parseTiobeHtml(html) {
  if (typeof html !== "string" || html.trim() === "") {
    throw new Error("TIOBE returned an empty document.");
  }
  if (html.length > MAX_DOCUMENT_SIZE) {
    throw new Error("TIOBE returned an unexpectedly large document.");
  }

  const $ = cheerio.load(html);
  const script = $("script")
    .toArray()
    .map((element) => $(element).text())
    .find((source) => source.includes("$('#container').highcharts"));

  if (!script) {
    throw new Error("TIOBE chart data was not found.");
  }

  const series = parseSeries(script);
  const table = $("#top20");
  const rows = table
    .find("tbody > tr")
    .toArray()
    .map((row) => parseTableRow($, row))
    .filter(Boolean);

  if (series.length === 0 || rows.length === 0) {
    throw new Error("TIOBE returned no usable ranking data.");
  }

  return {
    series,
    top20: {
      thead: table.find("thead th").toArray().map((cell) => ({
        text: $(cell).text().trim(),
        colspan: boundedColspan($(cell).attr("colspan")),
      })),
      tbody: rows,
    },
  };
}

function parseSeries(source) {
  const blockMatch = source.match(SERIES_BLOCK_RE);
  if (!blockMatch) {
    throw new Error("TIOBE chart series has an unsupported format.");
  }

  const block = blockMatch[1];
  const series = [];
  let seriesMatch;
  SERIES_RE.lastIndex = 0;

  while ((seriesMatch = SERIES_RE.exec(block))) {
    const name = decodeSeriesName(seriesMatch[1]);
    const pointSource = seriesMatch[2];
    const data = [];
    let pointMatch;
    POINT_RE.lastIndex = 0;

    while ((pointMatch = POINT_RE.exec(pointSource))) {
      data.push([
        Date.UTC(
          Number(pointMatch[1]),
          Number(pointMatch[2]),
          Number(pointMatch[3]),
        ),
        Number(pointMatch[4]),
      ]);
      if (data.length > MAX_POINTS_PER_SERIES) {
        throw new Error(`TIOBE series ${name} contains too many data points.`);
      }
    }

    POINT_RE.lastIndex = 0;
    if (data.length === 0 || pointSource.replace(POINT_RE, "").replaceAll(",", "").trim() !== "") {
      throw new Error(`TIOBE series ${name} contains unsupported data.`);
    }
    series.push({ name, data });
    if (series.length > MAX_SERIES) {
      throw new Error("TIOBE chart contains too many series.");
    }
  }

  SERIES_RE.lastIndex = 0;
  if (series.length === 0 || block.replace(SERIES_RE, "").replaceAll(",", "").trim() !== "") {
    throw new Error("TIOBE chart series contains executable or unsupported syntax.");
  }
  return series;
}

function decodeSeriesName(value) {
  if (value.length > 100) {
    throw new Error("TIOBE series name is unexpectedly long.");
  }
  if (/\\(?!['\\])/.test(value)) {
    throw new Error("TIOBE series name contains an unsupported escape sequence.");
  }
  return value.replaceAll("\\'", "'").replaceAll("\\\\", "\\");
}

function parseTableRow($, row) {
  const cells = $(row).find("td").toArray();
  if (cells.length < 7) return null;

  const languageImage = $(cells[3]).find("img").first();
  const languageName = $(cells[4]).text().trim();
  if (!languageName || !languageImage.attr("src")) return null;

  const changeImage = $(cells[2]).find("img").first();
  return {
    now: $(cells[0]).text().trim(),
    pre: $(cells[1]).text().trim(),
    changeArrow: changeImage.length
      ? {
          src: changeImage.attr("src") ?? "",
          alt: changeImage.attr("alt") ?? "",
        }
      : {},
    langIcon: {
      src: languageImage.attr("src"),
      alt: languageImage.attr("alt") ?? languageName,
    },
    langName: languageName,
    rating: $(cells[5]).text().trim(),
    changePercentage: $(cells[6]).text().trim(),
    link: languageSlug(languageName),
  };
}

function languageSlug(name) {
  return encodeURIComponent(
    name
      .replace("/", "-")
      .replace(".", "dot")
      .replace(/\s/g, "-")
      .toLowerCase()
      .replace("#", "sharp")
      .replace(/[+]/g, "plus"),
  );
}

function boundedColspan(value) {
  const colspan = Number.parseInt(value ?? "1", 10);
  return Number.isInteger(colspan) && colspan >= 1 && colspan <= 4 ? colspan : 1;
}
