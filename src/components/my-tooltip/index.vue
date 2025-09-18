<script lang='ts' setup>
import { updateAlarmEventStatus } from "@/api/alarmPlatform/alarmEvents";
import { Edit } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { computed, ref } from "vue";
const props = defineProps({
  real: {
    type: String,
    default: ""
  },
  row: {
    type: Object,
    default: () => ({})
  }
})
const emit = defineEmits(["success"]);
const pushType = ref(props.row.pushType || "");

function handleSubmit() {
  updateAlarmEventStatus({
    ...props.row,
    pushType: pushType.value
  }).then(() => {
    emit("success");
    ElMessage.success("修改成功");
  }).catch(() => {
    ElMessage.error("修改失败");
  });
}


</script>

<template>
  <el-tooltip>
    <el-icon>
      <Edit />
    </el-icon>
    <template #content>
      <el-input v-model="pushType" placeholder="请输入推送类型">
        <template #prepend>
          <el-button type="primary" @click="handleSubmit">提交</el-button>
        </template>
      </el-input>
    </template>
  </el-tooltip>
</template>

<style scoped></style>
