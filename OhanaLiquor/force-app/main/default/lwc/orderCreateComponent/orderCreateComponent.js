import { LightningElement, api, wire } from 'lwc';
import cloneOrderWithProducts from '@salesforce/apex/OrderCloneController.cloneOrderWithProducts';
import getOpportunityProducts from '@salesforce/apex/OpportunityProductController.getOpportunityProducts';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class OrderCreateComponent extends LightningElement {
    @api recordId;  // Opportunity의 Id
    products = [];
    regularOrder = 12;   // Opportunity의 Regular_Order__c 값
    isLoading = true;

    // ------- Products를 가져오는 Apex 메서드 호출 -------
    @wire(getOpportunityProducts, { opportunityId: '$recordId' })
    wiredProducts({ error, data }) {
        if (data) {
            console.log(this.regularOrder);
            this.products = data.map(product => {
                const recommendedQuantity = Math.floor(product.Quantity / this.regularOrder);  // 권장 수량 계산
                return {
                    ...product,
                    Quantity: 0,  // 기본 수량
                    PricebookEntryId: product.PricebookEntryId,  // PricebookEntryId 추가
                    recommendedQuantity: recommendedQuantity.toLocaleString()  // 권장 수량
                };
            });
            console.log(this.products);
            this.isLoading = false;
        } else if (error) {
            this.showToast('Error', 'Error fetching products', 'error');
            this.isLoading = false;
        }
    }

    // ------- 사용자가 input을 클릭했을 때 처리 -------
    handleOnFocus(event) {
        const inputElement = event.target;
        let value = inputElement.value;

        // 콤마가 포함된 숫자에서 콤마 제거
        if (value) {
            value = value.replace(/,/g, ''); // 쉼표 제거
            inputElement.value = value; // 콤마 없는 숫자로 설정
        }
    }

    // ------- 사용자가 input에 값을 입력했을 때 백그라운드 처리 -------
    handleQuantityFilled(event) {
        const inputElement = event.target;
        let value = event.target.value;

        // input 상위의 div 요소에 접근
        const parentDiv = inputElement.closest('.order-content');

        // 값이 존재하고, 숫자로 변환할 수 있는지 확인
        if (value && !isNaN(value)) {
            // 값이 존재하고 숫자일 경우
            parentDiv.classList.add('order-filled');
            parentDiv.classList.remove('order-not-filled');
            value = Number(value).toLocaleString(); // 쉼표가 있을 경우 제거 후 처리
            inputElement.value = value; // 쉼표가 추가된 값을 input에 설정

        } else {
            // 값이 없거나 숫자가 아닐 경우
            parentDiv.classList.add('order-not-filled');
            parentDiv.classList.remove('order-filled');
        }
    }

    // ------- 사용자가 수량을 변경할 때마다 실행 -------
    handleQuantityChange(event) {
        const productId = event.target.getAttribute('data-id');
        const newQuantity = Number(event.target.value);  // 입력된 수량을 숫자로 변환
        const pricebookEntryId = event.target.name;  // 소문자로 접근
        console.log('pricebookentryid: ', pricebookEntryId);

        this.products = this.products.map(product => 
            product.Id === productId ? { ...product, Quantity: newQuantity, PricebookEntryId: pricebookEntryId } : product
        );
    }

    // ------- Submit 버튼 클릭 시 처리 -------
    handleSubmit() {
        if(!this.validateSubmit()) {
            return;
        }
        console.log('In submit')
        const orderItems = this.products.map(product => ({
            PricebookEntryId: product.PricebookEntryId,
            // Quantity: Number(product.Quantity.replace(/,/g, '')), // 쉼표 제거 후 숫자로 변환
            Quantity: product.Quantity,
            UnitPrice: product.UnitPrice
        }));
    
        const orderItemsJSON = JSON.stringify(orderItems);
        console.log('orderItemsJSON: ', orderItemsJSON);
    
        cloneOrderWithProducts({ opportunityId: this.recordId, orderItemsJSON: orderItemsJSON })
            .then(result => {
                this.showToast('주문 생성 성공!', '주문이 성공적으로 생성되었습니다.', 'success');
            })
            .catch(error => {
                console.error('Error in cloneOrderWithProducts:', error);
                this.showToast('Error', `Error creating order: ${error.body.message || error.message}`, 'error');
            });
    }

    // ------- Order Validation -------
    validateSubmit() {
        // 모든 input 필드를 가져와서 값이 비어있는지 확인
        const inputs = this.template.querySelectorAll('input');
        let emptyInputCount = 0;

        inputs.forEach(input => {
            if (!input.value) {
                input.closest('.order-content').classList.add('order-not-filled');
                input.closest('.order-content').classList.remove('order-filled');
                emptyInputCount++;
            }
        });

        // 비어있는 input이 있을 경우 제출을 막고 알림을 띄움
        if (emptyInputCount > 0) {
            this.showToast('오류', '모든 주문에 대한 수량을 입력해주시기 바랍니다.', 'error');
            return false; // 제출 중단
        }
        return true;
    }
    

    // ------- Toast 알림 표시 -------
    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                message: message,
                variant: variant
            })
        );
    }
}