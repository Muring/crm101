import { LightningElement, track } from 'lwc';
import getOrdersByMonth from '@salesforce/apex/SalesAgreementComponent.getOrdersByMonth';

export default class SalesAgreementComponent extends LightningElement {
    @track orders;
    @track selectedMonth = '1'; // 기본값: 1월
    @track selectedYear = new Date().getFullYear(); // 현재 연도
    @track isLoading = false; // 로딩 상태 추적

    monthOptions = [
        { label: 'January', value: '1' },
        { label: 'February', value: '2' },
        { label: 'March', value: '3' },
        { label: 'April', value: '4' },
        { label: 'May', value: '5' },
        { label: 'June', value: '6' },
        { label: 'July', value: '7' },
        { label: 'August', value: '8' },
        { label: 'September', value: '9' },
        { label: 'October', value: '10' },
        { label: 'November', value: '11' },
        { label: 'December', value: '12' },
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
        getOrdersByMonth({ month: this.selectedMonth, year: this.selectedYear })
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

    handleMonthChange(event) {
        this.selectedMonth = event.detail.value;
        this.loadOrders(); // 새로 선택한 월에 따라 데이터를 다시 로드
    }

    handleYearChange(event) {
        this.selectedYear = event.detail.value;
        this.loadOrders(); // 새로 선택한 연도에 따라 데이터를 다시 로드
    }
}