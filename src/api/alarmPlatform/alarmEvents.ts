import { http } from "@/utils/http";
import { equipmentListRes } from "../deviceData/equipmentProfile";

//获取报警事件信息
export function alarmEventsInfo(eventId: number) {
  return http.request("get", `/manage/event/${eventId}`);
}

//获取报警事件列表
export interface alarmEventsListRes extends BasePageQuery {
  type: string;
  level: string;
  eventIds: number[];
  exportType?: string;
}
export function alarmEventsList(params: alarmEventsListRes) {
  return http.request("get", "/manage/event", { params });
}

export function exportAlarmEvents(params: alarmEventsListRes) {
  return http.request(
    "get",
    "/manage/event/excel",
    { params },
    {
      responseType: "blob"
    }
  );
}


export function exportEquipment(params: equipmentListRes) {
  return http.request(
    "get",
    "/manage/equipment/excel",
    { params },
    {
      responseType: "blob"
    }
  );
}

//报警事件所有类型
export function typesList() {
  return http.request("get", "/manage/event/types");
}

export function getstatistics(params: { dayType: string }) {
  return http.request("get", "/manage/event/getWeekStatistics", { params });
}

// 更新报警事件状态
export function updateAlarmEventStatus(row) {
  return http.request("put", `/manage/event/${row.eventId}`, {
    data: row
  });
}

export function exportEmergencyAlarm(params) {
  return http.request(
    "get",
    "/manage/emergencyAlarm/excel",
    { params },
    {
      responseType: "blob"
    }
  );
}