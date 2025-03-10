<script setup>
import { ref, reactive, watch, computed, onMounted } from "vue";
import { useMyPageStore } from "@/stores/myPage";
import { useFinanceStore } from "@/stores/finance";
import { usePolicyStore } from "@/stores/policy";
import { useSubscriptionStore } from "@/stores/subscription";
import { useAuthStore } from "@/stores/auth.js";

const myPageStore = useMyPageStore();
const financeStore = useFinanceStore();
const policyStore = usePolicyStore();
const subscriptionStore = useSubscriptionStore();
const authStore = useAuthStore();

const token = authStore.token;
const isLogin = ref(!!token);
const policyList = ref([]);
const subscriptionList = ref([]);
const filterSavings = ref([]);
const filterLoan = ref([]);
const peerPolicyList = ref([]);
const cities = ref(null);
const districts = ref(null);
const locals = ref(null);

const memberName = computed(() =>
  authStore.member ? authStore.member.memberName : ""
);

const member = reactive({
  occupation: null,
  region: null,
  district: null,
  local: null,
  maritalStatus: null,
  hasChildren: null,
  housingType: null,
});

const MyPageInfo = computed(() => myPageStore.MyPageInfo);
const hasValuesInMyPageInfo = computed(() =>
  Object.entries(MyPageInfo.value)
    .filter(([key]) => key !== "email")
    .filter(([key]) => key !== "password")
    .some(([, value]) => value !== null)
);

const showModal = ref(false);

const openModal = () => {
  showModal.value = true;
};

const submitInfo = async () => {
  Object.assign(myPageStore.MyPageInfo, member);
  await myPageStore.updateMyPageInfo();
  showModal.value = false;
};

const closeModal = async () => {
  showModal.value = false;
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const year = date.getFullYear();
  if (year > 2030) {
    return "예산 소진 시까지";
  }
  return date.toISOString().split("T")[0];
};

const fetchPolicy = async () => {
  await policyStore.getRecommendPolicy();
  policyList.value = policyStore.RecommedPolicyList;
};

const fetchSubscription = async () => {
  await subscriptionStore.getRecommendSubscription();
  subscriptionList.value = subscriptionStore.RecommedSubscriptionList;
};

const fetchCity = async () => {
  await myPageStore.getCity();
  cities.value = myPageStore.cities;
};

watch(
  () => member.region,
  async (newRegion) => {
    if (newRegion) {
      await myPageStore.getDistrict(newRegion);
      districts.value = myPageStore.districts;
    }
  }
);

watch(
  () => member.district,
  async (newDistrict) => {
    if (newDistrict && member.region) {
      myPageStore.selectedCity = member.region;
      myPageStore.selectedDistrict = newDistrict;
      await myPageStore.getLocal();
      locals.value = myPageStore.locals;
    }
  }
);

const fetchSavings = async () => {
  await financeStore.getSavings();
  filterSavings.value = financeStore.SavingsList;
};

const fetchLoan = async () => {
  await financeStore.getLoan();
  filterLoan.value = financeStore.LoanList;
};

const fetchPeerPolicy = async () => {
  await policyStore.getPeerPolicy();
  peerPolicyList.value = policyStore.PeerPolicyList;
  console.log(peerPolicyList.value);
};

onMounted(async () => {
  if (!token) {
    isLogin.value = false;
    return;
  }
  await fetchPolicy();
  await fetchSubscription();
  await fetchSavings();
  await fetchLoan();
  await myPageStore.getMyPageInfo();
  await fetchCity();
  await fetchPeerPolicy();
});
</script>

<template>
  <div v-if="isLogin">
    <div
      v-if="hasValuesInMyPageInfo"
      class="flex flex-col items-center space-y-4"
    >
      <p class="text-3xl font-semibold text-gray-800 text-center mt-2 mb-2">
        <span
          class="shake text-3xl font-semibold text-gray-800 text-center mt-2 mb-2"
          >{{ memberName }}</span
        >
        님을 위한 맞춤형 정보를 알려드릴게요!
      </p>

      <div class="mx-auto p-4 sm:p-6 lg:p-8">
        <p
          class="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 text-center text-[24px] sm:text-[28px] md:text-[32px]"
        >
          정책
        </p>
        <div class="flex border-t-4 border-darkBlue py-4"></div>
        <div
          v-if="policyList.length === 0"
          class="text-xl font-semibold text-center"
        >
          <div class="text-xl font-semibold text-center">
            조건에 해당하는 정책이 없습니다.
          </div>
          <div class="text-xl font-semibold text-center mt-2">
            {{ memberName }}님의 또래가 선호하는 정책을 보여드릴게요!
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 text-center mt-4">
            <div
              v-for="peerPolicy in peerPolicyList"
              :key="peerPolicy"
              :value="peerPolicy"
              class="bg-pink-100 relative bg-white p-6 rounded-lg shadow-md sm:max-w-sm lg:w-[500px]"
              @click="
                $router.push({
                  name: 'PolicyDetail',
                  params: { idx: peerPolicy.idx },
                })
              "
            >
              <p class="text-xl font-bold mb-4 text-center underline">
                {{ peerPolicy.name }}
              </p>
              <p class="text-xl font-bold mb-4 text-center">
                {{ peerPolicy.type }}
              </p>
              <p class="text-xl font-bold mb-4 text-center">
                {{ formatDate(peerPolicy.applyStartDate) }} ~
                {{ formatDate(peerPolicy.applyEndDate) }}
              </p>
            </div>
          </div>
        </div>

        <div v-else class="overflow-x-auto">
          <table
            class="table-auto w-full border-collapse border-gray-300 text-sm sm:text-base"
          >
            <thead class="border-b border-gray-300">
              <tr>
                <th
                  class="px-4 sm:px-6 md:px-10 py-2 sm:py-3 md:py-4 text-center font-bold"
                >
                  제목
                </th>
                <th
                  class="px-4 sm:px-6 md:px-10 py-2 sm:py-3 md:py-4 text-left font-bold"
                >
                  유형
                </th>
                <th
                  class="px-4 sm:px-6 md:px-10 py-2 sm:py-3 md:py-4 text-center font-bold"
                >
                  신청 기간
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="policy in policyList"
                :key="policy"
                class="hover:bg-gray-100 cursor-pointer"
                @click="
                  $router.push({
                    name: 'PolicyDetail',
                    params: { idx: policy.idx },
                  })
                "
              >
                <td
                  class="px-4 sm:px-6 md:px-10 py-2 sm:py-3 md:py-4 text-gray-600"
                >
                  {{ policy.name }}
                </td>
                <td
                  class="px-4 sm:px-6 md:px-10 py-2 sm:py-3 md:py-4 text-gray-600"
                >
                  {{ policy.type }}
                </td>
                <td
                  class="px-4 sm:px-6 md:px-10 py-2 sm:py-3 md:py-4 text-gray-600"
                >
                  {{ formatDate(policy.applyStartDate) }} ~
                  {{ formatDate(policy.applyEndDate) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="mx-auto p-4 max-w-4xl">
        <p class="text-2xl font-bold mb-4 text-[28px] text-center">청약</p>
        <div class="flex border-t-4 border-darkBlue py-4"></div>
        <div v-if="subscriptionList.length === 0" class="text-xl font-semibold">
          {{ memberName }}님의 조건에 해당하는 청약이 없습니다.
        </div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-6 text-center">
          <div
            v-for="subscription in subscriptionList"
            :key="subscription"
            :value="subscription"
            class="relative bg-white p-6 rounded-lg shadow-md sm:max-w-sm lg:w-[500px]"
          >
            <p class="text-xl font-bold mb-4 text-center underline">
              {{ subscription.name }}
            </p>
            <p class="text-gray-600 mb-2 font-semibold">
              {{ subscription.region }} {{ subscription.city }}
            </p>
            <p class="text-gray-600 mb-3 font-semibold">
              {{ subscription.district }} {{ subscription.detail }}
            </p>
            <p class="text-gray-600 mb-3">
              {{ subscription.rentSecd }}
            </p>
            <p class="text-gray-600 mb-3">
              {{ subscription.houseDtlSecdNm }} /
              {{ subscription.houseDtlSecd }}
            </p>
            <p class="text-gray-600 font-bold underline">
              {{ formatDate(subscription.rceptBgnde) }} ~
              {{ formatDate(subscription.rceptEndde) }}
            </p>
            <p class="mt-2 text-right font-semibold">
              <a
                :href="subscription.pblancUrl"
                class="text-blue-500 underline"
                target="_blank"
                rel="noopener noreferrer"
                >상세 정보</a
              >
            </p>
          </div>
        </div>
      </div>

      <div class="mx-auto p-8 max-w-5xl">
        <p class="text-3xl font-bold mb-6 text-[32px] text-center">금융</p>
        <div class="flex border-t-4 border-darkBlue py-6"></div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 text-center">
          <div
            class="relative bg-white p-8 rounded-lg shadow-lg max-w-md w-full"
          >
            <span
              class="absolute top-0 left-6 -translate-y-1/2 bg-lightBlue text-black text-base font-semibold px-4 py-2 rounded-md"
            >
              예금 BEST
            </span>
            <p class="text-2xl font-bold mb-6 text-center">
              {{ filterSavings.finPrdtNm }}
            </p>
            <div>
              <img
                src="@/assets/bank/busanbank.png"
                alt="부산은행 로고"
                class="w-36 h-auto mx-auto mb-6"
              />
            </div>
            <p class="text-gray-700 mb-4 text-lg">
              가입 가능 대상 : {{ filterSavings.joinMember }}
            </p>
            <p class="text-gray-700 mb-4 text-lg">
              가입 방법 : {{ filterSavings.joinWay }}
            </p>
            <p class="text-gray-700 mb-4 text-lg">
              {{ filterSavings.intrRateNm }} /
              <span> {{ filterSavings.saveTrm }} 개월 </span>
            </p>
            <p class="text-gray-700 font-bold underline text-lg">
              최대 연 {{ filterSavings.intrRate2 }}%
            </p>
          </div>

          <div
            class="relative bg-white p-8 rounded-lg shadow-lg max-w-md w-full"
          >
            <span
              class="absolute top-0 left-6 -translate-y-1/2 bg-lightBlue text-black text-base font-semibold px-4 py-2 rounded-md"
            >
              대출 BEST
            </span>
            <p class="text-2xl font-bold mb-6 text-center">
              {{ filterLoan.korCoNm }}
            </p>
            <p class="text-gray-700 font-semibold mb-4 text-lg">
              {{ filterLoan.finPrdtNm }}
            </p>
            <p class="text-gray-700 mb-4 text-lg">
              가입 방법 : {{ filterLoan.joinWay }}
            </p>
            <p class="text-gray-700 mb-4 text-lg">
              한도 : {{ filterLoan.loanLmt }}
            </p>
            <p v-if="filterLoan.mrtgTypeNm" class="text-gray-700 mb-4 text-lg">
              담보 유형 : {{ filterLoan.mrtgTypeNm }}
            </p>
            <p class="text-gray-700 mb-4 text-lg">
              {{ filterLoan.lendRateTypeNm }}
              <span> / {{ filterLoan.rpayTypeNm }} </span>
            </p>
            <p class="text-gray-700 font-bold underline text-lg">
              최저 연 {{ filterLoan.lendRateMin }}%
              <span class="text-gray-700 font-bold underline">
                ~ 최고 연 {{ filterLoan.lendRateMax }}%
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>

    <div v-else>
      <p
        class="text-lg sm:text-xl md:text-2xl font-semibold text-gray-800 text-center mb-6 sm:mb-8 md:mb-10 mt-10 sm:mt-15 md:mt-20"
      >
        등록된 추가 정보가 없어서 맞춤형 정보를 제공해 드리기 어려워요.
      </p>
      <p
        class="text-lg sm:text-xl md:text-2xl font-semibold text-gray-800 text-center mb-10 sm:mb-15 md:mb-20"
      >
        추가 정보를 등록하시겠습니까?
        <span
          @click="openModal"
          class="cursor-pointer text-base sm:text-lg md:text-xl text-darkBlue underline hover:text-midBlue"
        >
          등록하러 가기
        </span>
      </p>
    </div>

    <div
      v-if="showModal"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50"
    >
      <div class="bg-white p-6 rounded-lg shadow-lg max-w-xl w-full">
        <p class="text-2xl font-bold mb-4">추가 정보 등록</p>

        <p class="flex items-center mb-4">
          <span class="w-1/5 text-xl font-semibold">지역</span>
          <select class="w-4/5 py-2" v-model="member.region">
            <option value="null" disabled>지역 선택</option>
            <option v-for="city in cities" :key="city" :value="city">
              {{ city }}
            </option>
          </select>
        </p>

        <p class="flex items-center mb-4">
          <span class="w-1/5 text-xl font-semibold">지역구</span>
          <select class="w-4/5 py-2" v-model="member.district">
            <option value="null" disabled>지역구 선택</option>
            <option
              v-for="district in districts"
              :key="district"
              :value="district"
            >
              {{ district }}
            </option>
          </select>
        </p>

        <p class="flex items-center mb-4">
          <span class="w-1/5 text-xl font-semibold">읍/면/동</span>
          <select class="w-4/5 py-2" v-model="member.local">
            <option value="null" disabled>동 선택</option>
            <option v-for="local in locals" :key="local" :value="local">
              {{ local }}
            </option>
          </select>
        </p>

        <p class="flex items-center mb-4">
          <span class="w-1/5 text-xl font-semibold">주거 형태</span>
          <select class="w-4/5 py-2" v-model="member.housingType">
            <option value="null" disabled>주거 형태 선택</option>
            <option value="아파트">아파트</option>
            <option value="오피스텔">오피스텔</option>
            <option value="연립 주택">연립 주택</option>
            <option value="단독 주택">단독 주택</option>
            <option value="기타">기타</option>
          </select>
        </p>

        <p class="flex items-center mb-4">
          <span class="w-1/5 text-xl font-semibold">직업</span>
          <select class="w-4/5 py-2" v-model="member.occupation">
            <option value="null" disabled>직업 선택</option>
            <option value="직장인">직장인</option>
            <option value="사업가">사업가</option>
            <option value="프리랜서">프리랜서</option>
            <option value="취업 준비생">취업 준비생</option>
            <option value="학생">학생</option>
            <option value="기타">기타</option>
          </select>
        </p>

        <p class="flex items-center mb-4">
          <span class="w-1/5 text-xl font-semibold">결혼 여부</span>
          <select class="w-4/5 py-2" v-model="member.maritalStatus">
            <option value="null" disabled>결혼 여부 선택</option>
            <option value="1">O</option>
            <option value="0">X</option>
          </select>
        </p>

        <p class="flex items-center mb-4">
          <span class="w-1/5 text-xl font-semibold">자녀 유무</span>
          <select class="w-4/5 py-2" v-model="member.hasChildren">
            <option value="null" disabled>자녀 유무 선택</option>
            <option value="1">O</option>
            <option value="0">X</option>
          </select>
        </p>

        <div class="flex justify-center mt-6 space-x-10">
          <button
            @click="submitInfo"
            class="px-4 py-2 bg-darkBlue text-white rounded"
          >
            저장
          </button>

          <button
            @click="closeModal"
            class="px-4 py-2 bg-darkBlue text-white rounded"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  </div>

  <div v-else>
    <div class="relative">
      <img src="@/assets/guestMyservice.png" class="w-full h-auto" />
      <div
        class="absolute inset-0 flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 sm:top-[-500px] lg:top-[-200px]"
      >
        <p
          class="sm:text-xl lg:text-3xl font-bold text-darkBlue sm:mb-1 lg:mb-4 bg-opacity-70 px-4 sm:px-6 lg:px-8 py-2 rounded"
        >
          로그인하지 않은 상태입니다.
        </p>
        <p
          class="sm:text-lg lg:text-xl text-darkBlue font-semibold bg-opacity-70 px-4 sm:px-6 lg:px-8 py-2 rounded"
        >
          로그인하시면 맞춤형 정보를 확인할 수 있습니다.
        </p>
        <div
          class="text-sm sm:text-base lg:text-lg px-4 sm:px-6 lg:px-8 py-2 text-darkBlue rounded mt-4 underline cursor-pointer bg-opacity-70"
          @click="$router.push({ name: 'login' })"
        >
          로그인 하러 가기
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.shake {
  display: inline-block;
  animation: shake 0.5s infinite;
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-2px);
  }
  75% {
    transform: translateX(2px);
  }
}
</style>
