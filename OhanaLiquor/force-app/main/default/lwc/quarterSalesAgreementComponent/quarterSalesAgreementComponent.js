import { LightningElement, track } from 'lwc';
import getOrdersByQuarter from '@salesforce/apex/QuarterSalesAgreementComponent.getOrdersByQuarter'; // Apex 클래스 이름에 맞춰 수정

export default class QuarterSalesAgreementComponent extends LightningElement {
    @track orders;
    @track selectedQuarter = '1'; // 기본값: 1분기
    @track selectedYear = new Date().getFullYear(); // 현재 연도
    @track isLoading = false; // 로딩 상태 추적

    quarterOptions = [
        { label: '1st Quarter', value: '1' },
        { label: '2nd Quarter', value: '2' },
        { label: '3rd Quarter', value: '3' },
        { label: '4th Quarter', value: '4' },
    ];

    yearOptions = [
        { label: '2021', value: '2021' },
        { label: '2022', value: '2022' },
        { label: '2023', value: '2023' },
        { label: '2024', value: '2024' },
    ];

    // 초기 데이터 로드
    connectedCallback() {
        this.loadOrders();
    }

    loadOrders() {
        this.isLoading = true;
        getOrdersByQuarter({ quarter: this.selectedQuarter, year: this.selectedYear })
            .then(data => {
                this.orders = data;
            })
            .catch(error => {
                console.error('Error retrieving orders', error);
                this.orders = [];
            })
            .finally(() => {
                this.isLoading = false; // 로딩 완료 후 스피너 종료
            });
    }

    handleQuarterChange(event) {
        this.selectedQuarter = event.detail.value;
        this.loadOrders(); // 새로 선택한 분기에 따라 데이터를 다시 로드
    }

    handleYearChange(event) {
        this.selectedYear = event.detail.value;
        this.loadOrders(); // 새로 선택한 연도에 따라 데이터를 다시 로드
    }
}