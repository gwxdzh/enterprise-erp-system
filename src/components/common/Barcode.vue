<template>
  <div class="barcode-container">
    <svg ref="barcodeSvg"></svg>
    <div v-if="displayValue" class="barcode-value">{{ value }}</div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import JsBarcode from 'jsbarcode'

const props = defineProps({
  value: { type: String, required: true },
  format: { type: String, default: 'CODE128' },
  width: { type: Number, default: 2 },
  height: { type: Number, default: 80 },
  displayValue: { type: Boolean, default: false }
})

const barcodeSvg = ref(null)

function renderBarcode() {
  if (barcodeSvg.value && props.value) {
    JsBarcode(barcodeSvg.value, props.value, {
      format: props.format,
      width: props.width,
      height: props.height,
      displayValue: props.displayValue
    })
  }
}

onMounted(renderBarcode)
watch(() => props.value, renderBarcode)
</script>

<style scoped>
.barcode-container {
  text-align: center;
  margin-bottom: 10px;
}
.barcode-value {
  font-size: 14px;
  margin-top: 4px;
  letter-spacing: 2px;
  font-family: 'Consolas', 'Menlo', 'Monaco', monospace;
}
</style>
