import { LightningElement, api, wire, track } from 'lwc';
import getOrderProducts from '@salesforce/apex/R_SalesAgreement.getOrderProducts';

export default class OpportunityOrderProductComparison extends LightningElement {
    @api recordId; // 현재 Opportunity의 recordId
    @track orderProducts = []; // 가져온 OrderItem 데이터를 저장하는 배열
    selectedMonths = '1'; // 기본 선택된 개월 수
    searchKey = ''; // 검색 키워드 초기화

    // 개월 수 선택을 위한 옵션
    monthOptions = [
        { label: '1개월', value: '1' },
        { label: '3개월', value: '3' },
        { label: '6개월', value: '6' },
        { label: '12개월', value: '12' }
    ];

    // 테이블에 보여줄 컬럼들
    columns = [
        { label: 'Planned Quantity', fieldName: 'plannedQuantity', type: 'number' },
        { label: 'Actual Quantity', fieldName: 'actualQuantity', type: 'number' },
        { label: 'Sales Price', fieldName: 'salesPrice', type: 'currency' },
        { label: 'Discount Rate', fieldName: 'discountRate', type: 'percent' },
        { label: 'Unit Price', fieldName: 'unitPrice', type: 'currency' },
        { label: 'Planned Amount', fieldName: 'plannedAmount', type: 'currency' },
        { label: 'Actual Amount', fieldName: 'actualAmount', type: 'currency' }
    ];

    // 개월 수 선택 시 처리
    handleMonthsChange(event) {
        this.selectedMonths = event.detail.value; // 선택된 개월 수 업데이트
        this.loadOrderProducts(); // 새로운 개월 수에 맞게 데이터를 다시 불러옴
    }

    // 검색 키워드 입력 처리
    handleSearchChange(event) {
        this.searchKey = event.target.value; // 검색어 업데이트
        this.loadOrderProducts(); // 새로운 검색 키워드에 맞게 데이터를 다시 불러옴
    }

    // 데이터를 Apex에서 가져오는 메서드
    loadOrderProducts() {
        getOrderProducts({ 
            opportunityId: this.recordId, 
            months: this.selectedMonths, 
            searchKey: this.searchKey 
        })
        .then(result => {
            // 결과 데이터를 처리하여 필요한 값들을 테이블 형식으로 준비
            this.orderProducts = result.map(orderItem => {
                const plannedQuantity = orderItem.Recommendation_Order__c;
                const actualQuantity = orderItem.Quantity;
                const unitPrice = orderItem.UnitPrice;
                const listPrice = orderItem.ListPrice;
                const discountRate = ((listPrice - unitPrice) / listPrice) * 100;
                const plannedAmount = plannedQuantity * unitPrice;
                const actualAmount = orderItem.TotalPrice;

                return {
                    id: orderItem.Id,
                    plannedQuantity: plannedQuantity,
                    actualQuantity: actualQuantity,
                    salesPrice: listPrice,
                    discountRate: discountRate.toFixed(2),
                    unitPrice: unitPrice,
                    plannedAmount: plannedAmount.toFixed(2),
                    actualAmount: actualAmount.toFixed(2)
                };
            });
        })
        .catch(error => {
            console.error('Error loading order products:', error);
        });
    }

    // 컴포넌트가 로드되었을 때 초기 데이터를 가져옴
    connectedCallback() {
        this.loadOrderProducts();
    }
}