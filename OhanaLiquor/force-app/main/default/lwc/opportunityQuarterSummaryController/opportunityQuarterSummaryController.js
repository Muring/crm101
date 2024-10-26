import { LightningElement, wire, api, track } from 'lwc';
import getOrderProductsForOpportunity from '@salesforce/apex/OpportunityOrderProductsController.getOrderProductsForOpportunity';

export default class OpportunityOrderProductsController extends LightningElement {
    @api recordId; // Opportunity Id

    @track quarterSummaryData = []; // 분기별 요약 데이터를 저장할 배열
    @track yearOptions = [];
    @track selectedYear = '';
    error;

    // 분기 요약 테이블의 컬럼 설정
    columns = [
        { label: '분기', fieldName: 'quarter' },
        { label: '총 주문량', fieldName: 'totalQuantity', type: 'number' },
        { label: '총 권장 주문량', fieldName: 'totalRecommendationOrder', type: 'number' },
        { label: '총 주문량 차이', fieldName: 'totalOrderDifference', type: 'number' },
        { label: '총 예상 매출', fieldName: 'totalExpectedPrice', type: 'currency' },
        { label: '총 매출량 차이', fieldName: 'totalPriceDifference', type: 'currency' },
        { label: '총 매출', fieldName: 'totalPrice', type: 'currency' }
    ];

    // Wire Apex method to get Order Products
    @wire(getOrderProductsForOpportunity, { opportunityId: '$recordId' })
    wiredOrderProducts({ error, data }) {
        if (data) {
            this.error = undefined;
            // 연도별 데이터를 가져와 분기별로 요약
            this.calculateQuarterSummary(data);
        } else if (error) {
            this.error = error.body.message;
            this.quarterSummaryData = undefined;
        }
    }

    // 분기별 요약 데이터를 계산하는 함수
    calculateQuarterSummary(orders) {
        // 분기별 요약을 저장할 임시 객체
        let summaryMap = {
            Q1: { quarter: 'Q1', totalQuantity: 0, totalRecommendationOrder: 0, totalOrderDifference: 0, totalExpectedPrice: 0, totalPriceDifference: 0, totalPrice: 0 },
            Q2: { quarter: 'Q2', totalQuantity: 0, totalRecommendationOrder: 0, totalOrderDifference: 0, totalExpectedPrice: 0, totalPriceDifference: 0, totalPrice: 0 },
            Q3: { quarter: 'Q3', totalQuantity: 0, totalRecommendationOrder: 0, totalOrderDifference: 0, totalExpectedPrice: 0, totalPriceDifference: 0, totalPrice: 0 },
            Q4: { quarter: 'Q4', totalQuantity: 0, totalRecommendationOrder: 0, totalOrderDifference: 0, totalExpectedPrice: 0, totalPriceDifference: 0, totalPrice: 0 }
        };

        // 각 주문을 순회하며 분기별로 데이터를 누적
        orders.forEach(order => {
            const orderDate = new Date(order.effectiveDate);
            const quarter = this.getQuarter(orderDate);

            order.orderProducts.forEach(product => {
                summaryMap[quarter].totalQuantity += product.quantity || 0;
                summaryMap[quarter].totalRecommendationOrder += product.recommendationOrder || 0;
                summaryMap[quarter].totalOrderDifference += product.orderDifference || 0;
                summaryMap[quarter].totalExpectedPrice += product.expectedPrice || 0;
                summaryMap[quarter].totalPriceDifference += product.priceDifference || 0;
                summaryMap[quarter].totalPrice += product.totalPrice || 0;
            });
        });

        // summaryMap을 배열로 변환하여 LWC에 사용할 수 있도록 설정
        this.quarterSummaryData = Object.values(summaryMap);
    }

    // Helper method to determine the quarter of a given date
    getQuarter(date) {
        const month = date.getMonth() + 1;
        if (month >= 1 && month <= 3) {
            return 'Q1';
        } else if (month >= 4 && month <= 6) {
            return 'Q2';
        } else if (month >= 7 && month <= 9) {
            return 'Q3';
        } else {
            return 'Q4';
        }
    }

    // Handle Year change
    handleYearChange(event) {
        this.selectedYear = event.detail.value;
    }

    // 연도 선택지를 업데이트하는 메소드 (초기화 시 사용)
    connectedCallback() {
        const currentYear = new Date().getFullYear();
        this.yearOptions = [
            { label: (currentYear - 1).toString(), value: (currentYear - 1).toString() },
            { label: currentYear.toString(), value: currentYear.toString() },
            { label: (currentYear + 1).toString(), value: (currentYear + 1).toString() }
        ];
    }
}