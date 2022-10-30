<template>
  <div class="input-group">
    <span class="input-group-addon front">{{ header }}</span>
    <slot></slot>
    <span v-if="footer" class="input-group-addon bl-0">{{ footer }}</span>
    <span v-else-if="$slots.footer" class="input-group-addon bl-0"><slot name="footer"></slot></span>
  </div>
</template>

<script>
export default {
  props: {
    header: String,
    footer: String,
  },
};
</script>
