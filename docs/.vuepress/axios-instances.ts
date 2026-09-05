import axios from "axios";

declare const __APP_DEBUG__: boolean;

const baseApiUrl = "https://api.ziliang.ninja";
const requestTimeout = 12_000;

const axiosMl = axios.create({
  baseURL: baseApiUrl + "/v1/ml",
  timeout: requestTimeout,
  withCredentials: false,
});

axiosMl.defaults.headers.post["Content-Type"] = "application/json";

const axiosCorsProxy = axios.create({
  baseURL: baseApiUrl + "/v1/cors-proxy",
  timeout: requestTimeout,
  withCredentials: false,
});

axiosCorsProxy.defaults.headers.post["Content-Type"] = "application/json";

if (__APP_DEBUG__) {
  [axiosMl, axiosCorsProxy].forEach((instance) => {
    instance.interceptors.request.use((request) => {
      console.log("Starting Request", request);
      return request;
    });

    instance.interceptors.response.use((response) => {
      console.log("Response:", response);
      return response;
    });
  });
}

export { axiosMl, axiosCorsProxy };
