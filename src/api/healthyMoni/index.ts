import { http } from "@/utils/http";

export function getHealthMoniList(personnelId: number) {
  return http.request("get", "/manage/healthyMoni", {
    params: {
      personnelId: personnelId
    }
  });
}

export function batchUpdateHealthyMoni(data: any) {
  return http.request("post", "/manage/healthyMoni/batchUpdateHealthyMoni", {
    data: data
  })
}