<template>
  <div class="hud">
    <div class="crosshair">+</div>
    <div class="inventory">
      <div v-for="(item, index) in inventory" :key="index" class="inventory-slot">
        {{ item.count > 0 ? `${item.name} (${item.count})` : '' }}
      </div>
    </div>
    <div class="time">{{ formatGameTime(gameTime) }}</div>
    <div class="seed-info">Seed: {{ worldSeed }}</div>
    <div class="fps">FPS: {{ fps }}</div>
  </div>
</template>

<script setup lang="ts">
import { formatGameTime } from '@/utils/timeUtils';
import type { InventoryItem } from '@/types/InventoryItem';

const props = defineProps({
  inventory: Array as () => InventoryItem[],
  gameTime: { type: Number, required: true, default: 0 },
  worldSeed: String,
  fps: Number
});
</script>

<style scoped>
.hud {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  color: white;
  text-shadow: 2px 2px 2px rgba(0, 0, 0, 0.5);
}

.crosshair {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 24px;
  user-select: none;
}

.inventory {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
}

.inventory-slot {
  width: 60px;
  height: 60px;
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid white;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  text-align: center;
}

.time {
  position: absolute;
  top: 20px;
  right: 20px;
  font-size: 24px;
  font-weight: bold;
}

.seed-info {
  position: absolute;
  top: 20px;
  left: 20px;
  font-size: 16px;
}

.fps {
  position: absolute;
  top: 50px;
  left: 20px;
  font-size: 16px;
  font-weight: bold;
}
</style>
