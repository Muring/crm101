import { LightningElement, wire, track, api } from 'lwc';
import getQuarterlySummary from '@salesforce/apex/QuarterlyOrderSummaryController.getQuarterlySummary';

export default class QuarterlyOrderSummary extends LightningElement {
    @api recordId;  // Account 레코드 ID (Account 페이지에서 사용)
    @track selectedYear;
    @track quarterlySummaryData = [];
    @track yearOptions = [];
    @track error;

    // 테이블에 표시할 칼럼 정의
    columns = [
        { label: '분기', fieldName: 'quarter', type: 'text' },
        { label: '총 매출', fieldName: 'totalSales', type: 'currency' },
        { label: '총 판매량', fieldName: 'totalQuantity', type: 'number' },
        { label: '주문 제품 수', fieldName: 'totalProducts', type: 'number' },
        { label: '총 주문량 차이', fieldName: 'totalOrderDifference', type: 'number' }
    ];

    // LWC 로드 시 연도 선택 콤보박스 초기화
    connectedCallback() {
        const currentYear = new Date().getFullYear();
        this.yearOptions = [
            { label: currentYear.toString(), value: currentYear.toString() },
            { label: (currentYear - 1).toString(), value: (currentYear - 1).toString() },
            { label: (currentYear - 2).toString(), value: (currentYear - 2).toString() }
        ];
        this.selectedYear = currentYear.toString();  // 기본 연도 설정
        this.loadQuarterlySummaryData();
    }

    // 연도 변경 시 호출
    handleYearChange(event) {
        this.selectedYear = event.detail.value;
        this.loadQuarterlySummaryData();
    }

    // Apex 호출하여 분기별 요약 데이터 로드
    loadQuarterlySummaryData() {
        getQuarterlySummary({ accountId: this.recordId, year: this.selectedYear })
            .then(result => {
                this.quarterlySummaryData = result;
                this.error = undefined;
            })
            .catch(error => {
                this.error = error;
                this.quarterlySummaryData = [];
            });
    }
}