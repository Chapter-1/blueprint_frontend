<script setup>
import { ref, computed, onMounted } from "vue";
import { useSubscriptionStore } from "@/stores/subscription.js";

const store = useSubscriptionStore();
const subscriptionList = ref([]);
const currentPage = ref(0);
const totalPages = ref(0);
const pageSize = 10;
const loading = ref(false);
const error = ref(null);
const activeTab = ref('current'); // 'current' 또는 'past'

// 페이지네이션 표시 개수
const visiblePageCount = 5;

// 필터링된 구독 리스트
const filteredSubscriptions = computed(() => {
  const currentTimestamp = Date.now();
  return store.subscription?.filter(item => {
    const isPast = parseInt(item.rceptEndde) < currentTimestamp;
    return activeTab.value === 'past' ? isPast : !isPast;
  }) || [];
});

// 현재 페이지에 표시할 구독 리스트
const displayedSubscriptions = computed(() => {
  const startIndex = currentPage.value * pageSize;
  const endIndex = startIndex + pageSize;
  return filteredSubscriptions.value.slice(startIndex, endIndex);
});

// 표시할 페이지 번호 계산
const displayedPages = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  const half = Math.floor(visiblePageCount / 2);
  
  let start = current - half;
  let end = current + half;
  
  if (start < 0) {
    start = 0;
    end = Math.min(visiblePageCount - 1, total - 1);
  }
  
  if (end >= total) {
    end = total - 1;
    start = Math.max(0, end - visiblePageCount + 1);
  }
  
  const pages = [];
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  
  return pages;
});

const formatDate = (dateString) => {
  if (!dateString) return "날짜 정보 없음";
  try {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(parseInt(dateString)).toLocaleDateString('ko-KR', options);
  } catch (err) {
    return "날짜 형식 오류";
  }
};

const fetchData = async (page) => {
  loading.value = true;
  error.value = null;
  
  try {
    await store.getSubscription(page, pageSize);
    subscriptionList.value = displayedSubscriptions.value;
    totalPages.value = Math.ceil(filteredSubscriptions.value.length / pageSize);
    currentPage.value = page;
  } catch (err) {
    console.error('데이터 로딩 중 오류 발생:', err);
    error.value = err.message || '데이터를 불러오는데 실패했습니다. 다시 시도해주세요.';
    subscriptionList.value = [];
    totalPages.value = 0;
  } finally {
    loading.value = false;
  }
};

const switchTab = (tab) => {
  activeTab.value = tab;
  currentPage.value = 0;
  fetchData(0);
};

const retryFetch = () => {
  fetchData(currentPage.value);
};

const prevPage = () => {
  if (currentPage.value > 0) {
    fetchData(currentPage.value - 1);
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value - 1) {
    fetchData(currentPage.value + 1);
  }
};

const goToPage = (page) => {
  if (page >= 0 && page < totalPages.value) {
    fetchData(page);
  }
};

onMounted(async () => {
  await fetchData(0);
});
</script>

<template>
  <div class="min-h-screen p-4">
    <!-- Header Section -->
    <div class="flex items-center space-x-2 text-gray-800">
      <!-- <i class="fas fa-arrow-left"></i>
      <h1 class="text-lg font-medium">청약</h1>
      <div class="flex-1"></div>
      <i class="fas fa-info-circle"></i> -->
    </div>

    <!-- Tab Navigation -->
    <div class="flex mt-4 border-b">
      <button 
        class="px-4 py-2 font-semibold border-b-2 mr-2"
        :class="activeTab === 'current' ? 'border-black' : 'border-transparent'"
        @click="switchTab('current')"
      >
        청약
      </button>
      <button 
        class="px-4 py-2 font-semibold border-b-2"
        :class="activeTab === 'past' ? 'border-black' : 'border-transparent'"
        @click="switchTab('past')"
      >
        지난 청약
      </button>
    </div>

    <!-- Error State -->
    <div v-if="error" class="mt-4 p-4 bg-red-100 text-red-700 rounded">
      {{ error }}
      <button @click="retryFetch" class="ml-2 underline">다시 시도</button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="mt-4 p-4 text-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
      <p class="mt-2">데이터를 불러오는 중...</p>
    </div>

    <!-- Subscription List -->
    <div v-else-if="subscriptionList && subscriptionList.length > 0" class="space-y-4 mt-4">
      <div
        v-for="item in subscriptionList"
        :key="item.idx"
        class="bg-white rounded-lg shadow-md p-4"
      >
      <div class="flex items-start justify-between">
        <h2 class="text-lg font-semibold w-full max-w-[80%] break-words">
          {{ item.name }}
        </h2>

        <div class="text-gray-500 text-sm bg-gray-100 rounded-full px-3 py-1 ml-2 flex-shrink-0 custom_color">
          {{ item.houseDtlSecd }}
        </div>
      </div>




        <div class="mt-4 space-y-2 text-gray-700 text-sm">
          <div class="flex justify-between">
            <span>지역</span>
            <span>{{ item.region || "지역 정보 없음" }}</span>
          </div>
          <div class="flex justify-between">
            <span>도시</span>
            <span>{{ item.city || "도시 정보 없음" }}</span>
          </div>
          <div class="flex justify-between">
            <span>구</span>
            <span>{{ item.district || "구 정보 없음" }}</span>
          </div>
          <div class="flex justify-between">
            <span>상세주소</span>
            <span>{{ item.detail || "상세주소 정보 없음" }}</span>
          </div>
          <div class="flex justify-between">
            <span>분류</span>
            <span>{{ item.rentSecd }}</span>
          </div>
          <div class="flex justify-between">
            <span>청약 시작일</span>
            <span>{{ formatDate(item.rceptBgnde) }}</span>
          </div>
          <div class="flex justify-between">
            <span>청약 종료일</span>
            <span>{{ formatDate(item.rceptEndde) }}</span>
          </div>
          <div class="flex justify-between">
            <span>청약 페이지</span>
            <a
              :href="item.pblancUrl"
              class="text-blue-500 underline"
              target="_blank"
              rel="noopener noreferrer"
            >상세 정보 페이지</a>
          </div>
        </div>
      </div>
    </div>
    
    <p v-else class="mt-4 text-center text-gray-500">
      {{ activeTab === 'current' ? '진행중인 청약이 없습니다' : '지난 청약이 없습니다' }}
    </p>

    <!-- Pagination -->
    <div v-if="totalPages > 0" class="flex justify-center items-center mt-4 space-x-2">
      <button 
        class="pagination-button"
        @click="prevPage" 
        :disabled="currentPage === 0"
      >
        이전
      </button>

      <!-- 첫 페이지 버튼 -->
      <button
        v-if="displayedPages[0] > 0"
        class="pagination-button"
        @click="goToPage(0)"
      >
        1
      </button>

      <!-- 첫 페이지 이후 생략 부호 -->
      <span v-if="displayedPages[0] > 1" class="px-2">...</span>

      <!-- 페이지 번호 -->
      <button
        v-for="page in displayedPages"
        :key="page"
        @click="goToPage(page)"
        :class="{'pagination-button': true, 'active': page === currentPage}"
      >
        {{ page + 1 }}
      </button>

      <!-- 마지막 페이지 이전 생략 부호 -->
      <span v-if="displayedPages[displayedPages.length - 1] < totalPages - 2" class="px-2">...</span>

      <!-- 마지막 페이지 버튼 -->
      <button
        v-if="displayedPages[displayedPages.length - 1] < totalPages - 1"
        class="pagination-button"
        @click="goToPage(totalPages - 1)"
      >
        {{ totalPages }}
      </button>

      <button 
        class="pagination-button"
        @click="nextPage" 
        :disabled="currentPage >= totalPages - 1"
      >
        다음
      </button>
    </div>
  </div>
</template>

<style scoped>
.pagination-button {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  background-color: white;
  color: #1e3a8a;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.pagination-button.active {
  background-color: #1e3a8a;
  color: white;
}

.custom_color {
  color: white;
  background-color: #0E429D;
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

</style>