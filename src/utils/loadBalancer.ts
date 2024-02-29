import axios, { AxiosInstance } from "axios";


export class LoadBalancer {
  endpoints: string[];
  currentIndex: number;
  axiosInstances: AxiosInstance[];

  constructor(endpoints: string[]) {
    this.endpoints = endpoints;
    this.currentIndex = 0;

    this.axiosInstances = this.endpoints.map((endpoint) => {
      return axios.create({
        baseURL: endpoint,
        headers: {
          "Content-Type": "application/json",
        },
      });
    });
  }

  private getNextAxiosInstance(): AxiosInstance {
    const axiosInstance = this.axiosInstances[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.axiosInstances.length;
    return axiosInstance;
  }

  async performRequest(method: string, params: any[], isRpc: boolean = false) {
    const axiosInstance = this.getNextAxiosInstance();

    var body: any;
    if (isRpc) {
      body = {
        jsonrpc: "2.0",
        id: 1,
        method: method,
        params: params,
      };
    } else {
      body = {
        method: method,
        params: params,
      };
    }

    const response = await axiosInstance.post("/", body);
    return response.data;
  }
}
