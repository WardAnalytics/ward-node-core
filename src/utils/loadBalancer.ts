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

  async performRequest(method: string, params: (string | number)[]) {
    const axiosInstance = this.getNextAxiosInstance();
    const response = await axiosInstance.post("/", {
      method: method,
      params: params,
    });
    return response.data;
  }
}
