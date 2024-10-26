import { LightningElement, track } from 'lwc';
import getOrdersByMonth from '@salesforce/apex/SalesAgreementComponent.getOrdersByMonth';
import getOrdersByQuarter from '@salesforce/apex/QuarterSalesAgreementComponent.getOrdersByQuarter';

export default class OrderAgreementComponent extends LightningElement {
    @track orders;
    @track selectedType = 'monthly'; // Default to 'monthly'
    @track selectedValue = '1'; // Default to January or 1st Quarter
    @track selectedYear = new Date().getFullYear(); // Current Year
    @track isLoading = false; // Loading state

    typeOptions = [
        { label: 'Monthly', value: 'monthly' },
        { label: 'Quarterly', value: 'quarterly' }
    ];

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
        { label: 'December', value: '12' }
    ];

    quarterOptions = [
        { label: '1st Quarter', value: '1' },
        { label: '2nd Quarter', value: '2' },
        { label: '3rd Quarter', value: '3' },
        { label: '4th Quarter', value: '4' }
    ];

    yearOptions = [
        { label: '2021', value: '2021' },
        { label: '2022', value: '2022' },
        { label: '2023', value: '2023' },
        { label: '2024', value: '2024' },
    ];

    get typeLabel() {
        return this.selectedType === 'monthly' ? 'Select Month' : 'Select Quarter';
    }

    get currentOptions() {
        return this.selectedType === 'monthly' ? this.monthOptions : this.quarterOptions;
    }

    connectedCallback() {
        this.loadOrders();
    }

    handleTypeChange(event) {
        this.selectedType = event.detail.value;
        this.selectedValue = '1'; // Default to first month or first quarter
        this.loadOrders();
    }

    handleValueChange(event) {
        this.selectedValue = event.detail.value;
        this.loadOrders();
    }

    handleYearChange(event) {
        this.selectedYear = event.detail.value;
        this.loadOrders();
    }

    loadOrders() {
        this.isLoading = true;
        if (this.selectedType === 'monthly') {
            getOrdersByMonth({ month: this.selectedValue, year: this.selectedYear })
                .then(data => {
                    console.log('Monthly orders:', data); 
                    this.orders = data;
                })
                .catch(error => {
                    console.error('Error retrieving monthly orders', error);
                    this.orders = [];
                })
                .finally(() => {
                    this.isLoading = false;
                });
        } else {
            getOrdersByQuarter({ quarter: this.selectedValue, year: this.selectedYear })
                .then(data => {
                    console.log('Quarterly orders:', data); 
                    this.orders = data;
                })
                .catch(error => {
                    console.error('Error retrieving quarterly orders', error);
                    this.orders = [];
                })
                .finally(() => {
                    this.isLoading = false;
                });
        }
    }
}