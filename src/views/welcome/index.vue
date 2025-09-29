<script setup lang="ts">
import * as echarts from "echarts";
import { ref, onMounted, nextTick, computed, h } from "vue";
import { Search } from "@element-plus/icons-vue";
import renyuan from "@/assets/images/renyuan.png";
import shebei from "@/assets/images/shebei.png";
import wuliao from "@/assets/images/wuliao.png";
import zhishiku from "@/assets/images/zhishiku.png";
import { useRouter } from "vue-router";
import TuOne from "./tuone/index.vue";
import TuTwo from "./tutwo/index.vue";
import TuThree from "./tuthree/index.vue";
import TuFour from "./tufour/index.vue";
import { menusList } from "@/utils/menus";

// src/api/notificationCenter
import { notificationList } from "@/api/notificationCenter";
import {
  allGroup,
  getNormalMaterails,
  unitNameAndArea
} from "@/api/environmentalData/alarmLevelSetting";
import { getThresholdOnline } from "@/api/alarmPlatform/thresholdSetting";

import { useUserStore } from "@/store/modules/user";
import {
  getDayStatus,
  getDoorEventList,
  getMaterialsEasy
} from "@/api/door/door";
import dayjs from "dayjs";
import { equipmentList } from "@/api/deviceData/equipmentProfile";

defineOptions({
  name: "Welcome"
});

const router = useRouter();
const routerList = [
  {
    name: "人员数据",
    url: "/personnelData/personnelProfile/index",
    back: renyuan
  },
  {
    name: "设备数据",
    url: "/deviceData/equipmentProfile/index",
    back: shebei
  },
  {
    name: "物料数据",
    url: "/materialData/materialFiles/index",
    back: wuliao
  },
  {
    name: "知识库",
    url: "/manage/knowledge/index",
    back: zhishiku
  }
];

const searchValue = ref("");
const notificationType = ref("");

const routerClick = item => {
  router.push(item.url);
};

const viewMoreClick = () => {
  router.push("/notificationCenter/index");
};

const nlist = ref([]);

const notificationListFun = async () => {
  // @ts-ignore
  const { data } = await notificationList({
    notificationTitle: searchValue.value,
    notificationType: notificationType.value,
    orderColumn: "createTime",
    orderDirection: "descending",
    pageNum: 1,
    pageSize: 100
  });

  nlist.value = data.rows;

  // 转换数据
  nlist.value = data.rows.map(item => {
    return {
      title: item.notificationTitle,
      type: item.notificationType,
      time: item.sendTime,
      content: item.notificationContent
    };
  });
};

const list2 = ref([
  {
    color: "#3FD599",
    name: "在线设备",
    num: "0",
    baifen: "0%"
  },
  {
    color: "#3A77FF",
    name: "离线设备",
    num: "0",
    baifen: "0%"
  }
  // {
  //   color: "#C7E2FE",
  //   name: "异常设备",
  //   num: "0",
  //   baifen: "0%"
  // }
]);

let environmentChart: any = null;
const environmentRef = ref();
const environmentoption = {
  title: {
    text: "环境指标",
    top: "5%",
    left: "4%",
    textStyle: {
      color: "#242424",
      fontSize: "16px"
    }
  },
  grid: {
    left: "5%",
    right: "5%",
    bottom: "10%",
    top: "20%",
    containLabel: true
  },
  xAxis: {
    type: "category",
    data: []
  },
  yAxis: {
    type: "value",
    splitLine: {
      show: true,
      lineStyle: {
        type: "dashed"
      }
    }
  },
  series: [
    {
      data: [],
      type: "line",
      smooth: true,
      symbol: "none",
      lineStyle: {
        color: "rgba(68, 125, 253, 1)"
      },
      areaStyle: {
        color: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            {
              offset: 0,
              color: "rgba(68, 125, 253, 0.6)"
            },
            {
              offset: 1,
              color: "rgba(25, 104, 255, 0)"
            }
          ],
          global: false
        }
      }
    }
  ]
};

let equipmentStatusChart: any = null;
const equipmentStatusRef = ref();
const equipmentStatusoption = {
  color: ["#3FD599", "#3A77FF"],
  title: {
    text: "设备状态",
    top: "5%",
    left: "4%",
    textStyle: {
      color: "#242424",
      fontSize: "16px"
    }
  },
  grid: {
    left: "5%", // 左侧边距
    right: "5%", // 右侧边距
    bottom: "10%",
    top: "20%",
    containLabel: true
  },
  legend: {
    top: "5%",
    left: "center"
  },
  series: [
    {
      type: "pie",
      radius: ["40%", "70%"],
      avoidLabelOverlap: false,
      label: {
        show: false,
        position: "center"
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 40,
          fontWeight: "bold"
        }
      },
      labelLine: {
        show: false
      },
      data: [
        // {
        //   value: 1048,
        //   itemStyle: {
        //     color: "#3FD599"
        //   }
        // },
        // {
        //   value: 735,
        //   itemStyle: {
        //     color: "#3A77FF"
        //   }
        // },
        // {
        //   value: 580,
        //   itemStyle: {
        //     color: "#C7E2FE"
        //   }
        // },
        // {
        //   value: 484,
        //   itemStyle: {
        //     color: "#F1F4FF"
        //   }
        // }
      ]
    }
  ],
  graphic: {
    type: "text",
    left: "center",
    top: "center",
    style: {
      text: "289\n设备总量", // \n 用于换行
      textAlign: "center",
      fill: "#242424", // 文本颜色
      fontSize: 16,
      fontWeight: "bold"
    }
  }
};

const searchChange = () => {
  notificationListFun();
};

window.onresize = function () {
  environmentChart.resize();
  equipmentStatusChart.resize();
};

const allGroupList = ref({
  area: [],
  unitName: []
});

const area = ref("");
const unitName = ref("");

// 出勤率
const attendanceRate = ref(0);

const noticeListRef = ref();

let scrollInterval: any = null;
let isScrollingByWheel = false;

const startNoticeScroll = () => {
  nextTick(() => {
    const noticeList = noticeListRef.value;
    // if (noticeList && !isScrollingByWheel) {
    //   const scrollHeight = noticeList.scrollHeight;
    //   let currentHeight = noticeList.scrollTop;
    //   scrollInterval = setInterval(() => {
    //     if (currentHeight < scrollHeight) {
    //       currentHeight += 1;
    //       noticeList.scrollTop = currentHeight;
    //     } else {
    //       currentHeight = 0;
    //       noticeList.scrollTop = 0;
    //     }
    //   }, 50);
    // }
    if (noticeList && !isScrollingByWheel) {
      const scrollHeight = noticeList.scrollHeight;
      let currentHeight = noticeList.scrollTop;

      scrollInterval = setInterval(() => {
        // 获取容器可视高度
        const containerHeight = noticeList.clientHeight;

        // 每次向下滚动一点
        currentHeight += 1;
        noticeList.scrollTop = currentHeight;

        // 判断是否到底部
        if (noticeList.scrollTop + containerHeight >= scrollHeight) {
          // notificationListFun();
          // console.log('已经滚动到底部！触发事件');
          // 👉 执行你想要的事件（只触发一次可以加标志）
          // 可选：停止滚动
          // clearInterval(scrollInterval);
        }
      }, 50);
    }
  });
};

const pauseScroll = () => {
  clearInterval(scrollInterval);
};

const resumeScroll = () => {
  isScrollingByWheel = false;
  startNoticeScroll();
};

const handleScroll = () => {
  isScrollingByWheel = true;
  clearInterval(scrollInterval);
};

const shangwu = computed(() => {
  const now = new Date();
  const hours = now.getHours();
  console.log("1231");
  if (hours < 12) {
    return "上午";
  } else {
    return "下午";
  }
});

const materailsNormal = ref();

const eventData = ref([]);
const getEventDataList = () => {
  getDoorEventList({
    pageNum: 1,
    pageSize: 500,
    beginTime: dayjs().startOf("day").format("YYYY-MM-DD"),
    endTime: dayjs().endOf("day").format("YYYY-MM-DD"),
    enterStatus: "通行"
  })
    .then(res => {
      eventData.value = res.data.rows;
    })
    .catch(err => {
      console.log("err", err);
    });
};

const onlineEquipment = ref([]);
const notOnlineEquipment = ref([]);
const getEquipmentStatus = () => {
  equipmentList({
    pageSize: 300,
    pageNum: 1
  })
    .then(res => {
      onlineEquipment.value = res.data.rows.filter(item => item.isOnline);
      notOnlineEquipment.value = res.data.rows.filter(item => !item.isOnline);
    })
    .catch(err => {
      console.log("err", err);
    });
};

const normalMaterialsList = ref([]);
const notNormalMaterialsList = ref([]);
const getMaterialsEasyList = () => {
  getMaterialsEasy().then(res => {
    normalMaterialsList.value = res.data.filter(
      item => item.description == null
    );
    notNormalMaterialsList.value = res.data.filter(
      item => item.description != null && item.description != ""
    );
  });
};

onMounted(async () => {
  if (environmentChart == null) {
    environmentChart = echarts.init(environmentRef.value);
  }
  environmentChart.setOption(environmentoption, true);
  if (equipmentStatusChart == null) {
    equipmentStatusChart = echarts.init(equipmentStatusRef.value);
  }
  equipmentStatusChart.setOption(equipmentStatusoption, true);
  notificationListFun();

  const res = await allGroup();
  // @ts-ignore
  // console.log(res);

  //遍历 转换

  // @ts-ignore
  allGroupList.value.area = res.data?.area?.filter(Boolean).map(item => ({
    value: item,
    label: item
  }));

  // @ts-ignore
  allGroupList.value.unitName = res.data?.unitName
    ?.filter(Boolean)
    .map(item => ({
      value: item,
      label: item
    }));

  // 设置默认选中第一个选项
  if (allGroupList.value.area.length > 0) {
    area.value = allGroupList.value.area[0].value;
  }
  if (allGroupList.value.unitName.length > 0) {
    unitName.value = allGroupList.value.unitName[0].value;
  }

  await unitNameAndAreaFun();

  getThresholdOnlineFun();

  getDayStatusFun();

  startNoticeScroll();

  getNormalMaterails().then(res => {
    materailsNormal.value = res.data;
    console.log("materailsNormal.value", materailsNormal.value);
  });
});

// getThresholdOnline
const getThresholdOnlineFun = async () => {
  const { data } = await getThresholdOnline();

  // 计算总数和百分比
  const total = data.total || 1; // 避免除以0

  // 更新列表数据
  list2.value = [
    {
      color: "#3FD599",
      name: "在线设备",
      num: data.onlineCount + data.exceptionCount,
      baifen: `${Math.round(
        ((data.onlineCount + data.exceptionCount) / total) * 100
      )}%`
    },
    {
      color: "#3A77FF",
      name: "离线设备",
      num: data.offlineCount.toString(),
      baifen: `${Math.round((data.offlineCount / total) * 100)}%`
    }
    // {
    //   color: "#C7E2FE",
    //   name: "异常设备",
    //   num: data.exceptionCount.toString(),
    //   baifen: `${Math.round((data.exceptionCount / total) * 100)}%`
    // }
  ];

  // 更新饼图数据
  equipmentStatusoption.series[0].data = [
    {
      value: data.onlineCount + data.exceptionCount,
      itemStyle: { color: "#3FD599" }
    },
    {
      value: data.offlineCount,
      itemStyle: { color: "#3A77FF" }
    }
  ];

  // 更新设备总量显示
  equipmentStatusoption.graphic.style.text = `${total}\n设备总量`;

  // 重新渲染图表
  equipmentStatusChart.setOption(equipmentStatusoption, true);
};

const unitNameAndAreaFun = async () => {
  const { data } = await unitNameAndArea({
    area: area.value,
    unitName: unitName.value,
    dayType: "week"
  });

  // 新图表数据
  environmentoption.xAxis.data = data.time;
  environmentoption.series[0].data = data.data;

  // 重新设置图表配置
  environmentChart.setOption(environmentoption);
};

const handleSelectionChange = async () => {
  await unitNameAndAreaFun();
};

// getDayStatus
const getDayStatusFun = async () => {
  const res = await getDayStatus();
  attendanceRate.value = res.data as number;
};

const activeName = ref("一层");

const kuaisuSearch = ref("");
const kuaisuShow = ref(false);
const kuaisuList = ref([]);
const kuaisuSearchChange = val => {
  if (val == "") {
    kuaisuList.value = [];
    return;
  }
  kuaisuList.value = menusList.filter(item => {
    return item.menu_name.includes(kuaisuSearch.value);
  });
};
const toPath = item => {
  router.push(item);
};
</script>

<template>
  <div class="home">
    <div class="home_t">
      <div class="home_t_l">
        <el-card
          class="home_t_lt"
          :body-style="{
            width: '100%',
            display: 'flex',
            'justify-content': 'space-between',
            'align-items': 'center',
            padding: 0
          }"
        >
          <div class="home_t_lt_l">
            <div class="home_t_lt_l_title">{{ shangwu }}好！系统管理员</div>
            <div class="home_t_lt_l_bottom">
              <!--  @click="
                  router.push({
                    path: '/personnelData/chuqin/index'
                  })
                " -->
              <div class="home_t_lt_l_bottom_nei">
                <img src="/src/assets/images/renyuan1.png" alt="" />
                <div class="home_t_lt_l_bottom_nei_right">
                  <div>
                    <div style="font-size: 14px; color: rgba(0, 0, 0, 0.4)">
                      人员出勤率
                    </div>
                    <ElPopover @before-enter="getEventDataList" width="300">
                      <template #reference>
                        <div>
                          {{
                            Math.floor(
                              parseFloat((attendanceRate * 100).toFixed(2))
                            )
                          }}%
                        </div>
                      </template>
                      <ElTable height="500" :data="eventData">
                        <ElTableColumn prop="personnel.code" label="员工编号" />
                        <ElTableColumn prop="personnel.name" label="员工姓名" />
                        <ElTableColumn prop="doorDate" label="出勤时间">
                          <template #default="{ row }">
                            {{ dayjs(row.doorDate).format("HH:mm:ss") }}
                          </template>
                        </ElTableColumn>
                      </ElTable>
                    </ElPopover>
                  </div>
                </div>
              </div>
              <div class="home_t_lt_l_bottom_nei">
                <img src="/src/assets/images/zaixian.png" alt="" />
                <div class="home_t_lt_l_bottom_nei_right">
                  <div>
                    <div style="font-size: 14px; color: rgba(0, 0, 0, 0.4)">
                      在线设备
                    </div>
                    <ElPopover @before-enter="getEquipmentStatus" width="300">
                      <template #reference>
                        <div>
                          {{ Number(list2[0].num) }}
                        </div>
                      </template>
                      <ElTable height="500" :data="onlineEquipment">
                        <ElTableColumn prop="equipmentName" label="设备名称" />
                        <ElTableColumn prop="equipmentCode" label="设备编号" />
                      </ElTable>
                    </ElPopover>
                  </div>
                  <div style="margin-left: 15px">
                    <div style="font-size: 14px; color: rgba(0, 0, 0, 0.4)">
                      离线设备
                    </div>
                    <ElPopover @before-enter="getEquipmentStatus" width="300">
                      <template #reference>
                        <div>{{ list2[1].num }}</div>
                      </template>
                      <ElTable height="500" :data="notOnlineEquipment">
                        <ElTableColumn prop="equipmentName" label="设备名称" />
                        <ElTableColumn prop="equipmentCode" label="设备编号" />
                      </ElTable>
                    </ElPopover>
                  </div>
                </div>
              </div>
              <div class="home_t_lt_l_bottom_nei">
                <img src="/src/assets/images/tongzhi.png" alt="" />
                <div class="home_t_lt_l_bottom_nei_right">
                  <div>
                    <div style="font-size: 14px; color: rgba(0, 0, 0, 0.4)">
                      通知和提醒
                    </div>
                    <div>{{ useUserStore()?.noticesNum }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="home_t_lt_r" />
        </el-card>
        <div class="home_t_lb">
          <el-card
            :body-style="{
              width: '100%',
              padding: '21px 24px'
            }"
          >
            <div @click="kuaisuShow = true">
              快速导航 &nbsp;&nbsp;
              <el-icon style="vertical-align: middle">
                <Search />
              </el-icon>
            </div>
            <div class="home_bl">
              <div
                v-for="item in routerList"
                :key="item.name"
                @click="routerClick(item)"
              >
                <img :src="item.back" alt="" />
                <span>{{ item.name }}</span>
              </div>
            </div>
          </el-card>
          <el-card
            :body-style="{
              width: '100%',
              height: '100%',
              padding: '20px 20px',
              display: 'flex',
              'justify-content': 'space-between',
              'align-items': 'center',
              'flex-direction': 'column'
            }"
          >
            <div class="home_rt">
              <span>通知提醒</span>
              <div style="display: flex; align-items: center">
                <el-input
                  v-model="searchValue"
                  style="width: 130px; margin-right: 20px"
                  placeholder="请输入信息"
                  size="small"
                  @change="searchChange"
                  :prefix-icon="Search"
                />
                <el-select
                  size="small"
                  style="width: 130px; margin-right: 20px"
                  v-model="notificationType"
                  @change="searchChange"
                  clearable
                  placeholder="请选择类型"
                >
                  <el-option label="通知" value="通知" />
                  <el-option label="提醒" value="提醒" />
                </el-select>
                <el-button type="text" @click="viewMoreClick"
                  >查看更多</el-button
                >
              </div>
            </div>
            <div
              class="home_rb"
              ref="noticeListRef"
              @mouseenter="pauseScroll"
              @mouseleave="resumeScroll"
              @wheel="handleScroll"
            >
              <div class="home_rb_nei" v-for="item in nlist" :key="item.title">
                <div style="display: flex; align-items: center">
                  <div
                    style="
                      width: 8px;
                      height: 8px;
                      border-radius: 50%;
                      background-color: #ffa914;
                      margin-right: 5px;
                    "
                  />
                  <el-tag v-if="item.type" type="primary" size="small">{{
                    item.type
                  }}</el-tag>
                  <el-tooltip
                    class="box-item"
                    effect="dark"
                    :content="item.content"
                    placement="top"
                  >
                    <span
                      style="
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                      "
                    >
                      <span class="notice-item-content">
                        <span>
                          {{ item.content }}
                        </span>
                        &nbsp; &nbsp; &nbsp;
                        <span>
                          {{ item.time }}
                        </span>
                      </span>
                    </span>
                  </el-tooltip>
                </div>
              </div>
            </div>
          </el-card>
        </div>
      </div>
      <el-card
        :body-style="{
          width: '100%',
          height: '100%',
          padding: 0
        }"
        class="home_t_r"
      >
        <div class="equipmentStatus" ref="equipmentStatusRef" />
        <div class="home_t_rb">
          <template v-for="item in list2" :key="item.name">
            <div
              class="home_t_rb_nei"
              v-if="item.name != '异常设备'"
              :key="item.name"
            >
              <div
                :style="{
                  background: item.color
                }"
              />
              <div>{{ item.name }}</div>
              <div>{{ item.baifen }}</div>
              <div>{{ item.num }}</div>
            </div>
          </template>
        </div>
      </el-card>
    </div>
    <div class="home_b">
      <el-card
        :body-style="{
          width: '100%',
          padding: 0
        }"
      >
        <div class="home_bt">
          <span>车间平面图</span>
        </div>
        <div class="home_bb">
          <ElTabs v-model="activeName" style="margin: 0 30px">
            <ElTabPane label="一层" name="一层">
              <TuOne v-if="activeName == '一层'" />
            </ElTabPane>
            <ElTabPane label="二层" name="二层">
              <TuFour v-if="activeName == '二层'" />
            </ElTabPane>
            <ElTabPane label="三层" name="三层">
              <TuThree v-if="activeName == '三层'" />
            </ElTabPane>
            <ElTabPane label="四层" name="四层">
              <TuTwo v-if="activeName == '四层'" />
            </ElTabPane>
          </ElTabs>
        </div>
      </el-card>
      <el-card
        :body-style="{
          width: '100%',
          height: '100%',
          padding: 0,
          position: 'relative'
        }"
      >
        <el-select
          class="environment-area-select"
          style="width: 127px; height: 31.98px; z-index: 999999"
          v-model="area"
          placeholder="请选择区域"
          clearable
          @change="handleSelectionChange"
        >
          <el-option
            v-for="item in allGroupList.area"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-select
          class="environment-metric-select"
          style="width: 127px; height: 31.98px; z-index: 999999"
          v-model="unitName"
          placeholder="请选择指标"
          clearable
          @change="handleSelectionChange"
        >
          <el-option
            v-for="item in allGroupList.unitName"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <div class="chart" ref="environmentRef" />
      </el-card>
    </div>
    <el-dialog
      :z-index="99999999"
      title="快速导航"
      v-model="kuaisuShow"
      width="400px"
    >
      <el-input v-model="kuaisuSearch" @input="kuaisuSearchChange" />
      <el-card
        @click="toPath(item.path)"
        v-for="item in kuaisuList"
        :key="item.path"
      >
        <h3>{{ item.menu_name }}</h3>
      </el-card>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
$design-width: 1920;
$design-height: 1080;

@function adaptiveWidth($px) {
  @return #{$px / $design-width * 100}vw;
}

@function adaptiveHeight($px) {
  @return #{$px / $design-height * 100}vh;
}

.home_t {
  display: flex;
  justify-content: space-between;
  height: adaptiveHeight(572);

  .home_t_l {
    width: 73.5%;

    .home_t_lt {
      width: 100%;
      height: adaptiveHeight(292);
      background-color: #ebf1fd;
      display: flex;
      justify-content: space-between;

      .home_t_lt_l {
        width: calc(100% - adaptiveWidth(440));
        margin-left: adaptiveWidth(20);

        .home_t_lt_l_title {
          font-size: 40px;
          color: rgba(0, 0, 0, 1);
        }

        .home_t_lt_l_bottom {
          display: flex;
          justify-content: space-between;
          margin-top: adaptiveHeight(30);

          .home_t_lt_l_bottom_nei {
            width: 32%;
            height: adaptiveHeight(147);
            background-color: #ffffff;
            display: flex;
            justify-content: center;
            flex-direction: column;

            img {
              width: 54px;
              height: 50px;
              margin-left: adaptiveWidth(21);
            }

            .home_t_lt_l_bottom_nei_right {
              margin-left: adaptiveWidth(21);
              margin-top: adaptiveHeight(10);
              display: flex;
            }
          }
        }
      }

      .home_t_lt_r {
        width: adaptiveWidth(460);
        height: 100%;
        background: url("/src/assets/images/主视觉图标.png") no-repeat;
        background-size: 110% 110%;
        background-position: 10px 0;
      }
    }

    .home_t_lb {
      display: flex;
      justify-content: space-between;
      margin-top: adaptiveHeight(16);

      .el-card {
        width: 49.5%;
        height: adaptiveHeight(261);

        &:nth-child(1) {
          .home_bl {
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            flex-wrap: wrap;
            margin-top: adaptiveHeight(16);

            div {
              width: adaptiveWidth(250);
              height: adaptiveHeight(84);
              background: linear-gradient(180deg, #f3f9ff 0%, #f9ffff 100%);
              display: flex;
              align-items: center;

              &:nth-child(3),
              &:nth-child(4) {
                margin-top: adaptiveHeight(10);
              }

              img {
                width: 64px;
                height: 64px;
                margin: 0 adaptiveWidth(16);
              }

              span {
                font-size: 16px;
              }
            }
          }
        }

        &:nth-child(2) {
          .home_rt {
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
          }

          .home_rb_nei {
            width: adaptiveWidth(560);
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 15px;
            border-radius: 4px;
            transition: all 0.3s ease;

            &:hover {
              background-color: #f5f7fa;
              cursor: pointer;
            }

            &:not(:last-child) {
              margin-bottom: 8px;
            }

            .el-tag {
              margin-left: auto;
              margin-right: 15px;
            }

            // 时间样式
            div:last-child {
              color: #909399;
              font-size: 12px;
              white-space: nowrap;
            }
          }
        }
      }
    }
  }

  .home_t_r {
    width: 25.5%;
    height: adaptiveHeight(572);
    position: relative;

    .equipmentStatus {
      width: 100%;
      height: adaptiveHeight(344);
    }

    .home_t_rb {
      width: adaptiveWidth(366);
      height: adaptiveHeight(228);
      border-top: 1px solid #e7e7e7;
      margin: 0 auto;
      padding: adaptiveHeight(20) adaptiveWidth(20);
      display: flex;
      flex-direction: column;
      gap: adaptiveHeight(20);

      .home_t_rb_nei {
        display: grid;
        grid-template-columns: adaptiveWidth(14) auto 80px 60px;
        align-items: center;
        gap: adaptiveWidth(15);

        div {
          &:nth-child(1) {
            width: adaptiveWidth(14);
            height: adaptiveHeight(12);
            border-radius: 2px;
          }

          &:nth-child(2) {
            // 设备名称
            color: #606266;
          }

          &:nth-child(3) {
            // 百分比
            text-align: right;
            color: #909399;
          }

          &:nth-child(4) {
            // 数量
            text-align: right;
            font-weight: 500;
          }
        }
      }
    }
  }
}

.home_b {
  height: adaptiveHeight(387);
  margin-top: adaptiveHeight(16);
  display: flex;
  justify-content: space-between;

  .el-card {
    width: 49.5%;
    height: adaptiveHeight(387);

    &:nth-child(1) {
      .home_bt {
        width: 100%;
        height: adaptiveHeight(56);
        display: flex;
        align-items: center;

        span {
          font-size: 16px;
          font-weight: bold;
          padding-left: adaptiveWidth(25);
        }
      }

      .home_bb {
        width: 100%;
        height: adaptiveHeight(331);
        overflow: auto;
      }
    }

    &:nth-child(2) {
      position: relative;

      .environment-area-select {
        position: absolute;
        top: adaptiveHeight(24);
        right: adaptiveWidth(180);
        z-index: 10;
      }

      .environment-metric-select {
        position: absolute;
        top: adaptiveHeight(24);
        right: adaptiveWidth(24);
        z-index: 10;
      }

      .chart {
        width: 100%;
        height: 100%;
        padding-top: adaptiveHeight(20);
      }
    }
  }
}

// .chart{
//   width: 100%;
//   height: 100%;
// }

//  <el-input class="home_t_r_input"/>
//  <el-select class="home_t_r_select"></el-select>

:deep(.home_t_r_input) {
  position: absolute;
  top: 24px;
  right: 170px;
}

:deep(.home_t_r_select) {
  position: absolute;
  top: 24px;
  right: 25px;
}

.home_rb {
  flex: 1;
  overflow: hidden;

  .home_rb_nei {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 15px;
    border-radius: 4px;
    transition: all 0.3s ease;

    &:hover {
      background-color: #f5f7fa;
      cursor: pointer;
    }

    &:not(:last-child) {
      margin-bottom: 8px;
    }

    .el-tag {
      margin-left: auto;
      margin-right: 15px;
    }

    // 时间样式
    div:last-child {
      color: #909399;
      font-size: 12px;
      white-space: nowrap;
    }
  }
}

// box-item 下面的span适配笔记本的宽度,让时间那个span固定宽就行,
.notice-item-content {
  display: flex;
  // 横向
  flex-wrap: wrap;

  span:nth-child(1) {
    // flex: 1;
    // 超过行后省略号
    max-width: 300px;
    /* 关键：允许收缩 */
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  span:last-child {
    // 如果这一行放不下,换行
    margin-left: auto;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-wrap: wrap;
  }
}
</style>
