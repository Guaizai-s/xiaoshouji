<template>
  <div class="wx-page">
    <nav-bar title="我" />

    <div class="wx-content">
      <div class="wx-list">
        <div class="wx-list-item" @click="openProfile">
          <img class="wx-list-avatar" :src="userAvatar" alt="avatar" />
          <div class="wx-list-content">
            <div class="wx-list-title">{{ userName }}</div>
            <div class="wx-list-desc">微信号: {{ userWxId }}</div>
          </div>
          <svg style="width: 18px; height: 18px; color: #999;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      <div class="wx-divider"></div>

      <section class="wallet-section">
        <div class="wallet-card">
          <div class="wallet-card-top">
            <div>
              <div class="wallet-eyebrow">零钱</div>
              <div class="wallet-balance">¥{{ walletBalanceText }}</div>
            </div>
            <div class="wallet-mark">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z"/>
                <path d="M16 12h4v4h-4a2 2 0 0 1 0-4Z"/>
              </svg>
            </div>
          </div>
          <div class="wallet-card-bottom">
            <span>用于红包、转账的本地零钱</span>
            <button @click="openWalletSheet">充值</button>
          </div>
        </div>
      </section>

      <div class="wx-divider"></div>

      <div class="wx-list">
        <div class="wx-list-item" @click="router.push('/personas')">
          <div style="width: 24px; height: 24px; margin-right: 12px; color: #10aeff;">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          </div>
          <div class="wx-list-content">
            <div class="wx-list-title">用户设定</div>
          </div>
          <svg style="width: 18px; height: 18px; color: #999;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
        <div class="wx-list-item" @click="router.push('/stickers')">
          <div style="width: 24px; height: 24px; margin-right: 12px; color: #ffc300;">
            <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="15.5" cy="9.5" r="1.5"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M12 16c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
          </div>
          <div class="wx-list-content">
            <div class="wx-list-title">表情包库</div>
          </div>
          <svg style="width: 18px; height: 18px; color: #999;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      <div class="wx-empty" style="margin-top: 48px;">
        <div class="wx-empty-text" style="font-size: 12px; color: #999;">
          小手机 v1.0.0
        </div>
        <div class="wx-empty-text" style="font-size: 12px; color: #999; margin-top: 8px;">
          高仿微信AI聊天应用
        </div>
      </div>
    </div>

    <teleport to="body">
      <div v-if="showWalletSheet" class="wallet-sheet-overlay" @click.self="closeWalletSheet">
        <div class="wallet-sheet" @click.stop>
          <div class="wallet-sheet-handle"></div>
          <div class="wallet-sheet-title">零钱充值</div>
          <div class="wallet-sheet-subtitle">这是本地剧情钱包，不会产生真实支付</div>

          <div class="quick-amounts">
            <button
              v-for="item in quickAmounts"
              :key="item"
              :class="{ active: rechargeAmount === String(item) }"
              @click="selectQuickAmount(item)"
            >
              ¥{{ item }}
            </button>
          </div>

          <div class="custom-amount">
            <span>¥</span>
            <input
              v-model="rechargeAmount"
              inputmode="decimal"
              placeholder="输入金额"
              @input="walletError = ''"
            />
          </div>

          <div v-if="walletError" class="wallet-error">{{ walletError }}</div>

          <button class="wallet-primary-btn" @click="confirmRecharge">确认充值</button>
          <button class="wallet-secondary-btn" @click="closeWalletSheet">取消</button>
        </div>
      </div>
    </teleport>

    <tab-bar />
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import NavBar from '../components/NavBar.vue';
import TabBar from '../components/TabBar.vue';
import { formatCents, parseAmountToCents, walletService } from '../services/db';

const router = useRouter();
const route = useRoute();

const defaultAvatar = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48"%3E%3Crect fill="%2307C160" width="48" height="48" rx="4"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="24" fill="white"%3E我%3C/text%3E%3C/svg%3E';

const userName = ref('小手机用户');
const userWxId = ref('xiaoshouji_001');
const userAvatar = ref(defaultAvatar);
const walletBalanceCents = ref(0);
const showWalletSheet = ref(false);
const rechargeAmount = ref('100');
const walletError = ref('');
const quickAmounts = [20, 50, 100, 200];

const walletBalanceText = computed(() => formatCents(walletBalanceCents.value));

const loadUserProfile = () => {
  const saved = localStorage.getItem('userProfile');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      userName.value = data.name || '小手机用户';
      userWxId.value = data.wxId || 'xiaoshouji_001';
      userAvatar.value = data.avatar || defaultAvatar;
    } catch (error) {
      console.error('读取用户信息失败', error);
    }
  }
};

const loadWallet = async () => {
  walletBalanceCents.value = await walletService.getUserBalance();
};

onMounted(async () => {
  loadUserProfile();
  await loadWallet();
});

watch(() => route.path, async (newPath) => {
  if (newPath === '/me') {
    loadUserProfile();
    await loadWallet();
  }
});

const openProfile = () => {
  router.push('/profile');
};

const openWalletSheet = () => {
  walletError.value = '';
  showWalletSheet.value = true;
};

const closeWalletSheet = () => {
  showWalletSheet.value = false;
  walletError.value = '';
};

const selectQuickAmount = (amount) => {
  rechargeAmount.value = String(amount);
  walletError.value = '';
};

const confirmRecharge = async () => {
  try {
    const cents = parseAmountToCents(rechargeAmount.value);
    walletBalanceCents.value = await walletService.adjustUserBalance(cents, '个人页充值');
    closeWalletSheet();
  } catch (error) {
    walletError.value = error.message;
  }
};
</script>

<style scoped>
.wallet-section {
  padding: 0;
  background: var(--wx-white);
  border-top: 1px solid var(--wx-border);
  border-bottom: 1px solid var(--wx-border);
}

.wallet-card {
  overflow: hidden;
  border-radius: 0;
  background: var(--wx-white);
  color: var(--wx-text-primary);
  border: none;
  box-shadow: none;
}

.wallet-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 82px;
  padding: 14px 32px 14px 32px;
  box-sizing: border-box;
}

.wallet-eyebrow {
  font-size: 13px;
  color: var(--wx-text-secondary);
}

.wallet-balance {
  margin-top: 5px;
  font-size: 30px;
  line-height: 1.1;
  font-weight: 700;
}

.wallet-mark {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f5;
  color: #6f7a83;
}

.wallet-mark svg {
  width: 23px;
  height: 23px;
}

.wallet-card-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 50px;
  padding: 9px 32px;
  background: #fafafa;
  font-size: 13px;
  color: var(--wx-text-secondary);
  border-top: 1px solid rgba(0, 0, 0, 0.035);
  box-sizing: border-box;
}

.wallet-card-bottom button {
  border: 1px solid var(--wx-border);
  border-radius: 999px;
  padding: 7px 16px;
  background: var(--wx-white);
  color: #576b95;
  font-size: 14px;
  font-weight: 600;
}

[data-theme="dark"] .wallet-card {
  border-color: rgba(255, 255, 255, 0.06);
  box-shadow: none;
}

[data-theme="dark"] .wallet-mark {
  background: #2a2a2a;
  color: #d6d6d6;
}

[data-theme="dark"] .wallet-card-bottom {
  background: #252525;
}

.wallet-sheet-overlay {
  position: fixed;
  inset: 0;
  z-index: 2200;
  display: flex;
  align-items: flex-end;
  background: rgba(0, 0, 0, 0.35);
}

.wallet-sheet {
  width: 100%;
  padding: 8px 18px calc(18px + env(safe-area-inset-bottom));
  background: var(--wx-bg);
  border-radius: 18px 18px 0 0;
  box-sizing: border-box;
}

.wallet-sheet-handle {
  width: 36px;
  height: 4px;
  margin: 0 auto 14px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.12);
}

.wallet-sheet-title {
  text-align: center;
  color: var(--wx-text-primary);
  font-size: 18px;
  font-weight: 700;
}

.wallet-sheet-subtitle {
  margin-top: 6px;
  text-align: center;
  color: var(--wx-text-secondary);
  font-size: 12px;
}

.quick-amounts {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-top: 20px;
}

.quick-amounts button {
  height: 48px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: var(--wx-white);
  color: var(--wx-text-primary);
  font-size: 16px;
  font-weight: 600;
}

.quick-amounts button.active {
  border-color: #576b95;
  color: #576b95;
  background: rgba(87, 107, 149, 0.08);
}

.custom-amount {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 12px 16px;
  border-radius: 10px;
  background: var(--wx-white);
}

.custom-amount span {
  color: var(--wx-text-primary);
  font-size: 22px;
  font-weight: 700;
}

.custom-amount input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: var(--wx-text-primary);
  font-size: 22px;
  font-weight: 600;
}

.wallet-error {
  margin-top: 12px;
  text-align: center;
  color: #fa5151;
  font-size: 13px;
}

.wallet-primary-btn,
.wallet-secondary-btn {
  width: 100%;
  height: 46px;
  border: none;
  border-radius: 10px;
  font-size: 16px;
}

.wallet-primary-btn {
  margin-top: 16px;
  background: #576b95;
  color: #fff;
  font-weight: 700;
}

.wallet-secondary-btn {
  margin-top: 10px;
  background: var(--wx-white);
  color: var(--wx-text-primary);
}

[data-theme="dark"] .wallet-sheet-handle {
  background: rgba(255, 255, 255, 0.18);
}
</style>
