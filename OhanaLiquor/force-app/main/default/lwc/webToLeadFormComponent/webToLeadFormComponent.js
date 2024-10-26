import { LightningElement } from 'lwc';
import dropDownArrow from '@salesforce/resourceUrl/DropDownArrow';

export default class WebToLeadFormComponent extends LightningElement {
    imageUrl = dropDownArrow;
    isRendered = false;  // 이미 한 번 렌더링했는지 체크
    validatedInputCnt = 0;
    patterns = {
        first_name: {
            pattern: /^[가-힣a-zA-Z]{2,}$/, // 한글 또는 영어 2글자 이상
            nullError: "이름을 입력하십시오.",
            patternError: "이름은 한글 또는 영어 2글자 이상만 가능합니다.",
        },
        last_name: {
            pattern: /^[가-힣a-zA-Z]{1,}$/, // 한글 또는 영어 1글자 이상
            nullError: "성을 입력하십시오.",
            patternError: "성은 한글 또는 영어 1글자 이상만 가능합니다.",
        },
        email: {
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            nullError: "이메일을 입력하십시오.",
            patternError: "이메일 형식에 맞지 않습니다.",
        },
        phone: {
            pattern: /^\d{10,15}$/,
            nullError: "전화번호를 입력하십시오.",
            patternError: "전화번호 형식에 맞지 않습니다. ex) 01012341234",
        },
        company: {
            pattern: /^[가-힣a-zA-Z0-9]{2,12}$/, // 한글, 영어, 숫자 2글자 이상
            nullError: "회사 이름을 입력하십시오.",
            patternError: "회사 이름은 2~12자의 대소문자 영문, 숫자, 또는 한글 조합만 가능합니다.",
        },
        type: {
            pattern: /^[가-힣a-zA-Z]{2,12}$/, // 한글 또는 영어 2글자 이상
            nullError: "업종 유형을 선택하십시오.",
            patternError: "업종 유형을 선택하십시오.",
        },
    };

    // DOM이 완전히 로딩 된 후에 select 태그를 쿼리해 오기 위해 renderedCallback 사용
    renderedCallback() {
        // 중복 호출 방지
        if (this.isRendered) {
            return; 
        } else {
            // ------------------ select에 화살표 이미지 ------------------
            const selectElement = this.template.querySelector('select');

            if (selectElement) {
                selectElement.style.backgroundImage = `url(${this.imageUrl})`;
            }
            this.isRendered = true;
        }
    }

    handleInputChange(event) {
        const inputValue = event.target.value;
        const inputName = event.target.name;
        const status = this.validateInput(inputName, inputValue);
        if(status[0]) {
            event.target.classList.remove('error');
            event.target.removeAttribute('placeholder');  // placeholder 제거
        } else {
            event.target.classList.add('error');
            event.target.setAttribute('placeholder', `${status[1]}`);  // placeholder 제거
        }
    }

    handleSelect(event) {
        const selectValue = event.target.value;
        if(selectValue === '') {
            event.target.classList.add('error');
        } else {
            event.target.classList.remove('error');
        }
    }

    handleSubmit(event) {
        event.preventDefault();  // 기본 폼 제출 방지

        // 유효성 검사
        const errorMessage = this.template.querySelector('.error-message');
        const successMessage = this.template.querySelector('.success-message');
        
        if (this.validateFormInfo() != 0) {
            // 에러 메시지 표시
            if (errorMessage) {
                errorMessage.style.display = 'block';
            }
            return;
        } else {
            const form = this.template.querySelector('form');
            if (form) {
                errorMessage.style.display = 'none';
                successMessage.style.display = 'block';
                form.submit();  // 폼이 유효하면 제출
            }
        }
    }

    // 클래스 내에서 getFormInfo를 정의하여 this.template을 사용 가능하게 함
    getFormInfo() {
        const firstName = this.template.querySelector('input[name="first_name"]').value;
        const lastName = this.template.querySelector('input[name="last_name"]').value;
        const email = this.template.querySelector('input[name="email"]').value;
        const phone = this.template.querySelector('input[name="phone"]').value;
        const company = this.template.querySelector('input[name="company"]').value;
        const type = this.template.querySelector('select[name="00NdL0000061tWr"]').value;

        const formInfo = {
            firstName: firstName ? firstName : null,
            lastName: lastName ? lastName : null,
            email: email ? email : null,
            phone: phone ? phone : null,
            company: company ? company : null,
            type: type ? type : null,
        };
        return formInfo;
    }

    // --------------------- 검증 -----------------
    validateInput(inputName, inputValue) {
        if (!inputValue) {
            return [false, this.patterns[inputName].nullError];
        }
        if (!this.patterns[inputName].pattern.test(inputValue)) {
            return [false, this.patterns[inputName].patternError];
        }
        return [true, ''];
    }

    validateFormInfo() {
        // form 내에서 모든 input과 select 요소를 찾습니다.
        const form = this.template.querySelector('form');
        const inputs = form.querySelectorAll('input');
        const selects = form.querySelectorAll('select');
    
        // error 클래스를 포함하거나 값이 없는 요소를 카운트합니다.
        let errorCount = 0;
    
        // input 요소에서 error 클래스를 카운트하거나 값이 없는 경우 처리합니다.
        inputs.forEach(input => {
            if (input.classList.contains('error') || input.value === '' || input.value === null || input.value === undefined) {
                input.classList.add('error');
                input.setAttribute('placeholder', `입력 필수`); 
                errorCount++;
            }
        });
    
        // select 요소에서 error 클래스를 카운트하거나 값이 없는 경우 처리합니다.
        selects.forEach(select => {
            // select.value가 빈 문자열일 때도 에러로 처리
            if (select.classList.contains('error') || select.value === '' || select.value === null || select.value === undefined) {
                select.classList.add('error');
                errorCount++;
            }
        });
    
        // 에러 개수 출력
        console.log(`총 ${errorCount}개의 에러가 있습니다.`);
        return errorCount; // 에러 개수를 반환
    }
    
}