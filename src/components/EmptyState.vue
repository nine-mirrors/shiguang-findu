  <script setup>
  const props = defineProps({
    title: {
      type: String,
      default: '暂无数据'
    },
    desc: {
      type: String,
      default: '当前没有可展示的内容。'
    },
    buttonText: {
      type: String,
      default: ''
    }
  })

  const emit = defineEmits(['action'])

  const handleAction = () => emit('action')
  </script>

  <template>
    <div class="empty-state">
      <div class="empty-illustration float-slow">🔎</div>

      <h3>{{ props.title }}</h3>

      <p>{{ props.desc }}</p>

      <el-button v-if="props.buttonText" type="primary" @click="handleAction">{{ props.buttonText }}</el-button>
    </div>
  </template>

  <style scoped>
  .empty-state {
    min-height: 280px;
    display: grid;
    place-items: center;
    text-align: center;
    padding: 36px;
    border: 1px dashed rgba(79, 124, 255, .28);
    border-radius: 28px;
    background: rgba(255, 255, 255, .55);
  }

  .empty-illustration {
    width: 86px;
    height: 86px;
    display: grid;
    place-items: center;
    margin-bottom: 10px;
    border-radius: 30px;
    background: linear-gradient(135deg, rgba(79, 124, 255, .12), rgba(0, 184, 148, .12));
    font-size: 42px;
  }

  h3 {
    margin: 0;
    font-size: 22px;
  }

  p {
    margin: 8px 0 18px;
    color: var(--muted);
  }
  </style>