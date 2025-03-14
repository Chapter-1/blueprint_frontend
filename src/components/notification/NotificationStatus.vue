<script setup>
import { ref, onMounted, computed } from "vue";
import { useNotificationStore } from "@/stores/notificationStore";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";

const notificationStore = useNotificationStore();
const authStore = useAuthStore();
const router = useRouter();

const notificationStatus = ref(
  JSON.parse(localStorage.getItem("notificationStatus")) || false
);
const isModalOpen = ref(false);
const notifications = ref([]);
const isLoading = ref(false);
const showNotificationAlert = ref(false);
const unreadCount = computed(() => notificationStore.unreadNotificationsCount);

const fetchInitialNotificationStatus = async () => {
  try {
    const response = await notificationStore.fetchNotificationStatus();
    notificationStatus.value = response.notificationEnabled;
    localStorage.setItem(
      "notificationStatus",
      JSON.stringify(notificationStatus.value)
    );
    console.log("초기 알림 상태 가져오기 성공:", notificationStatus.value);
  } catch (error) {
    console.error(
      "초기 알림 상태 가져오는 중 오류 발생:",
      error.response?.data || error.message
    );
  }
};

const handleToggleChange = async () => {
  try {
    await notificationStore.toggleNotificationStatus(notificationStatus.value);
    localStorage.setItem(
      "notificationStatus",
      JSON.stringify(notificationStatus.value)
    );
    console.log("알림 상태 변경 성공:", notificationStatus.value);
  } catch (error) {
    console.error("알림 상태 변경 중 오류:", error);
  }
};

const fetchPushNotifications = async () => {
  try {
    isLoading.value = true;
   
    await notificationStore.fetchPushNotifications();
  
    notifications.value = notificationStore.pushNotifications.filter((n) => !n.isRead);

    localStorage.setItem("pushNotifications", JSON.stringify(notifications.value));

    notificationStore.unreadNotificationsCount = notifications.value.length;
    console.log("Push 알림 동기화 성공:", notifications.value);
  } catch (error) {
    console.error("Push 알림 목록 로드 중 오류:", error);
  } finally {
    isLoading.value = false;
  }
};

const openNotificationModal = () => {
  if (!notificationStatus.value) {
    showNotificationAlert.value = true;
    return;
  }
  if (isModalOpen.value) return;
  isModalOpen.value = true;
};

const closeNotificationAlert = () => {
  showNotificationAlert.value = false;
};

const closeModal = () => {
  isModalOpen.value = false;
};

const markAsReadAndNavigate = async (policyIdx) => {
  if (!policyIdx || isNaN(policyIdx)) {
    console.error("Invalid policyIdx:", policyIdx);
    return;
  }
  try {
    console.log("Navigating to policy detail with policyIdx:", policyIdx);

    await notificationStore.markNotificationAsRead(policyIdx);

    const index = notifications.value.findIndex((n) => n.policyIdx === policyIdx);
    if (index !== -1) {
      notifications.value[index].isRead = true;  
      notificationStore.unreadNotificationsCount -= 1;
    }

    router.push({ path: `/policy/detail/${policyIdx}`, query: { isLiked: true } });
  } catch (error) {
    console.error("알림 읽음 처리 중 오류:", error);
  }
};

const navigateToNotificationSummary = () => {
  router.push({ name: "notificationSummary" });
};

onMounted(async () => {
  if (authStore.isLoggedIn && authStore.token) {
    await fetchInitialNotificationStatus();

    const cachedPushNotifications = JSON.parse(localStorage.getItem("pushNotifications")) || [];
    if (cachedPushNotifications.length > 0) {
      notifications.value = cachedPushNotifications;
      notificationStore.unreadNotificationsCount = cachedPushNotifications.length;
    } else {
      await fetchPushNotifications();
    }
  } else {
    console.error("로그인 상태가 유효하지 않습니다. 로그인을 다시 시도하세요.");
    router.push({ name: "login" });
  }
});

</script>

<template>
  <div class="flex items-center space-x-4">
    <!-- 알림 설정 토글 -->
    <label for="notification-toggle" class="flex items-center cursor-pointer">
      <div class="relative">
        <input
          type="checkbox"
          id="notification-toggle"
          v-model="notificationStatus"
          class="hidden"
          @change="handleToggleChange"
        />
        <div
          class="toggle-bg w-10 h-5 bg-gray-300 rounded-full"
          :class="{ 'bg-green-500': notificationStatus, 'bg-gray-300': !notificationStatus }"
        ></div>
        <div
          :class="{
            'translate-x-5': notificationStatus,
            'translate-x-1': !notificationStatus,
          }"
          class="toggle-dot absolute w-4 h-4 bg-white rounded-full transition transform"
        ></div>
      </div>
      <span class="ml-3">알림 설정</span>
    </label>

    <!-- 알림 아이콘 -->
    <div
      class="notification-icon relative cursor-pointer"
      :class="{ disabled: !notificationStatus }"
      @click="openNotificationModal"
    >
      <span class="icon">🔔</span>
      <span v-if="unreadCount > 0 && notificationStatus" class="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
        {{ unreadCount }}
      </span>
    </div>

    <!-- 알림 팝업 -->
    <div v-if="showNotificationAlert" class="alert-popup">
      <div class="popup-content">
        <p class="text-gray-700">
          알림 설정을 ON으로 변경해야 이 기능을 사용할 수 있습니다.
        </p>
        <button @click="closeNotificationAlert" class="close-button">✕</button>
      </div>
    </div>

    <!-- 모달 -->
    <div v-if="isModalOpen" class="modal">
      <div class="modal-content">
        <h2 class="text-lg font-bold mb-4">Push 알림</h2>

        <!-- 로딩 상태 -->
        <p v-if="isLoading" class="text-center text-gray-500">로딩 중...</p>

        <!-- 알림 목록 -->
        <ul v-else-if="notifications.length > 0" class="space-y-2">
          <li
            v-for="(notification, index) in notifications"
            :key="index"
            :class="[
              'border rounded-lg p-4 flex items-center space-x-4 text-sm cursor-pointer',
              notification.isRead ? 'bg-gray-200' : 'bg-white'
              ]"
            @click="markAsReadAndNavigate(notification.policyIdx)"
          >
            <!-- 라벨 -->
            <div
              class="px-3 py-1 rounded-full text-white text-xs"
              :class="notification.message === '이메일 발송' ? 'bg-blue-500' : 'bg-red-500'"
            >
              {{ notification.message }}
            </div>

            <!-- 내용 -->
            <div class="flex-1">
              <p class="font-semibold">{{ notification.policyName }}</p>
            </div>

            <!-- 알림 날짜 -->
            <div class="text-gray-400 text-xs">{{ notification.pushDate }}</div>
          </li>
        </ul>

        <p v-else class="text-center text-gray-500">Push 알림이 없습니다.</p>

        <!-- 버튼 -->
        <div class="flex justify-end mt-4">
          <button
            @click="navigateToNotificationSummary"
            class="bg-blue-500 text-white px-4 py-2 rounded mr-2"
          >
            알림 모아보기
          </button>
          <button @click="closeModal" class="bg-gray-500 text-white px-4 py-2 rounded">
            닫기
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.toggle-bg {
  position: relative;
}
.toggle-dot {
  top: 1px;
  transition: all 0.3s ease;
}
.notification-icon .icon {
  font-size: 1.5rem;
}
.notification-icon.disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 50;
}
.modal-content {
  background: white;
  padding: 20px;
  border-radius: 10px;
  width: 500px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  z-index: 60;
}

.alert-popup {
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5); 
  z-index: 50; 
}

.popup-content {
  background: white; 
  padding: 1.5rem;
  border-radius: 0.5rem; 
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2); 
  position: relative;
}

.close-button {
  position: absolute;
  top: 0.4rem;
  right: 0.7rem;
  background: none;
  border: none; 
  font-size: 0.7rem; 
  cursor: pointer; 
  color: #000000; 
}

.close-button:hover {
  color: #000;
}

.text-gray-700 {
  color: #4a5568; 
}

.bg-blue-500 {
  background-color: #002842;
}
.bg-red-500 {
  background-color: #f31616;
}
</style>

