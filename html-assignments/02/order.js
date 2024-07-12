// 수량 직접 입력 선택 여부
document
  .getElementById("orderAmountSelect")
  .addEventListener("change", function () {
    const amountInput = document.querySelector(".amount-input");
    if (this.value === "0") {
      amountInput.disabled = false;
    } else {
      amountInput.disabled = true;
      amountInput.value = ""; // 비활성화시 값 초기화
    }
  });

// form 자동 새로고침 제거 및 검증 실행
document
  .getElementById("orderForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    validateFormData();
  });

function validateFormData() {
  // form 입력 받기
  const userInfo = getUserInfo();
  const productType = getProductType();
  const orderAmount = getOrderAmount();
  const agreementsStatus = getAgreementsStatus();

  // 유효성 검사
  if (!validateUserInfo(userInfo)) return;
  if (!validateProductType(productType)) return;
  if (!validateOrderAmount(orderAmount)) return;
  if (!validateUserAgreement(agreementsStatus)) return;

  alert(
    "정상적으로 신청되었습니다.\n\n" +
      `아이디: ${userInfo.userId}\n` +
      `이름: ${userInfo.userName}\n` +
      `이메일: ${userInfo.email}\n` +
      `전화번호: ${userInfo.phoneNumber}\n` +
      `제품 타입: ${productType}\n` +
      `제품 수량: ${orderAmount}\n` +
      `개인정보 수집 및 이용: ${
        agreementsStatus[0].checked ? "동의" : "미동의"
      }\n` +
      `서비스 이용: ${agreementsStatus[1].checked ? "동의" : "미동의"}\n` +
      `email 수신: ${agreementsStatus[2].checked ? "동의" : "미동의"}\n`
  );
  window.location.href = "http://nashhurley.com/projects/sfcampus";
}

// 사용자 정보 받기
function getUserInfo() {
  const userId = document.getElementById("userId").value;
  const userName = document.getElementById("userName").value;
  const email = document.getElementById("email").value;
  const phoneNumber = document.getElementById("phoneNumber").value;
  const password = document.getElementById("password").value;
  const passwordConfirm = document.getElementById("passwordConfirm").value;

  const userInfo = {
    userId: userId,
    userName: userName,
    email: email,
    phoneNumber: phoneNumber,
    password: password,
    passwordConfirm: passwordConfirm,
  };

  return userInfo;
}

// 제품 타입 받기
function getProductType() {
  const productTypeElement = document.querySelector(
    'input[name="productType"]:checked'
  );
  return productTypeElement ? productTypeElement.value : null;
}

// 제품 수량 받기
function getOrderAmount() {
  let orderAmount = document.getElementById("orderAmountSelect").value;
  if (orderAmount == 0) {
    return document.getElementById("orderAmountInput").value;
  }
  return orderAmount;
}

// 약관 동의 정보 받기
function getAgreementsStatus() {
  const agreementsStatus = document.querySelectorAll('input[type="checkbox"]');
  return agreementsStatus ? agreementsStatus : null;
}

// --------------------- 검증 -----------------
function validateUserInfo(userInfo) {
  const patterns = {
    userId: {
      pattern: /^[a-zA-Z0-9]{4,12}$/,
      nullError: "아이디를 입력하시오.",
      patternError: "아이디는 4~12자의 대소문자 영문과 숫자 조합만 가능합니다",
    },
    userName: {
      pattern: /^[가-힣]{2,}$/,
      nullError: "이름을 입력하십시오.",
      patternError: "이름은 국문 이름 2글자 이상만 가능합니다.",
    },
    email: {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      nullError: "이메일을 입력하십시오.",
      patternError: "이메일 형식에 맞지 않습니다.",
    },
    phoneNumber: {
      pattern: /^\d{10,15}$/,
      nullError: "전화번호를 입력하십시오.",
      patternError: "전화번호 형식에 맞지 않습니다.\nex) 01012341234",
    },
    password: {
      pattern: /^[a-zA-Z0-9]{4,12}$/,
      nullError: "비밀번호를 입력하십시오.",
      patternError:
        "비밀번호는 4~12자의 대소문자 영문과 숫자 조합만 가능합니다",
    },
    passwordConfirm: {
      pattern: /^[a-zA-Z0-9]{4,12}$/,
      nullError: "비밀번호 확인을 입력하시오.",
      patternError: "비밀번호가 일치하지 않습니다.",
    },
  };

  for (key in userInfo) {
    if (!userInfo[key]) {
      alert(patterns[key].nullError);
      return false;
    }
    if (!patterns[key].pattern.test(userInfo[key])) {
      alert(patterns[key].patternError);
      return false;
    }
    if (key == "passwordConfirm" && userInfo.password != userInfo[key])
      return false;
  }
  // Form is valid
  return true;
}

function validateProductType(productType) {
  if (!productType) {
    alert("제품 타입이 선택되지 않았습니다.");
    return false;
  }
  return true;
}

function validateOrderAmount(orderAmount) {
  if (!orderAmount) {
    alert("제품 수량을 입력하지 않았습니다.");
    return false;
  }
  return true;
}

function validateUserAgreement(agreementStatus) {
  agreementStatus.forEach((status) => {
    if (status.id == "privacyAgreement" || status.id == "serviceAgreement") {
      if (status.checked == false) {
        alert("필수 약관에 동의해주세요.");
        return false;
      }
    }
  });

  return true;
}

// 에디션 상세
function goDetail() {
  window.location.href = "http://www.google.com";
}

// 아이디 입력 필드의 값이 0일 때 테두리를 빨갛게 변환
Array.from(document.getElementsByName("userInfo")).forEach(function (element) {
  element.addEventListener("input", function () {
    if (this.value.length === 0) {
      this.classList.add("error");
      this.setAttribute("placeholder", "입력 필수");
    } else {
      this.classList.remove("error");
      this.setAttribute("placeholder", "");
    }
  });
});
