<script lang="ts" setup>
import { batchUpdateHealthyMoni, getHealthMoniList } from "@/api/healthyMoni";
import VDialog from "@/components/VDialog/VDialog.vue";
import { computed, ref } from "vue";
interface Props {
  type: "add" | "update";
  modelValue: boolean;
  // typeOptions: Array<KnowledgeTypeEntity>;
}

const emits = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
  (e: "success"): void;
}>();

const props = defineProps<Props>();
const loading = ref(false);
const visible = ref(false);
const list = ref([])

function handleOpen(personnelId: number) {
  visible.value = true
  getHealthMoniList(personnelId).then(res => {
    list.value = res?.data?.rows
    list.value.forEach(item => {
      isPush.value = item.isPush
      // pushFrequency.value = item.pushFrequency
      pinInput.value = item.pushFrequency
    })
  })
}

const isPush = ref(false);
const pushFrequency = ref(0);
const selectPinValue = ref("3");
const pinInput = ref(0);

function handleConfirm() {
  if (selectPinValue.value === "1") {
    list.value.forEach(item => {
      item.min = Number(item.min)
      item.max = Number(item.max)
      item.pushFrequency = Number(pinInput.value) * 3600;
      item.isPush = isPush.value
    })
  } else if (selectPinValue.value === "2") {
    list.value.forEach(item => {
      item.min = Number(item.min)
      item.max = Number(item.max)
      item.pushFrequency = Number(pinInput.value) * 60;
      item.isPush = isPush.value
    })
  } else {
    list.value.forEach(item => {
      item.min = Number(item.min)
      item.max = Number(item.max)
      item.pushFrequency = Number(pinInput.value)
      item.isPush = isPush.value
    })
  }


  batchUpdateHealthyMoni(list.value).then(res => {
    visible.value = false
  }).catch(err => {

  })
}

function cancelConfirm() {
  visible.value = false;
}

defineExpose({
  handleOpen
})
</script>

<template>
  <!--   @confirm="handleConfirm"
    @cancel="cancelConfirm"
    @opened="handleOpened"
    @closed="handleClosed" -->
  <v-dialog show-full-screen :fixed-body-height="false" use-body-scrolling :title="'设置人员健康填报规则'" v-model="visible"
    :loading="loading" @confirm="handleConfirm" @cancel="cancelConfirm">
    <el-form label-width="100px">
      <el-row>
        <el-col :span="12">
          <el-form-item label="填报频率:">
            <el-input v-model="pinInput" type="number">
              <template #append>
                <el-select v-model="selectPinValue" style="width: 115px">
                  <el-option label="时" value="1" />
                  <el-option label="分" value="2" />
                  <el-option label="秒" value="3" />
                </el-select>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="是否开启填报:">
            <el-switch v-model="isPush" />
          </el-form-item>
        </el-col>
      </el-row>
      <template v-for="item in list">
        <el-row>
          <el-col :span="12">
            <el-form-item label="推送类型:">
              <el-input v-model="item.fieldType" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="最小值:">
              <el-input type="number" v-model="item.min" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最大值:">
              <el-input type="number" v-model="item.max" />
            </el-form-item>
          </el-col>
        </el-row>
      </template>
    </el-form>

  </v-dialog>
</template>