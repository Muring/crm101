import { LightningElement, wire, api, track } from 'lwc';
import getOrderProductsForOpportunity from '@salesforce/apex/OpportunityOrderProductsController.getOrderProductsForOpportunity';

export default class OpportunityOrderProductsController extends LightningElement {
    @api recordId; // Opportunity Id
    achievementRate = 0; // 계산된 초과 달성률

    @track orders = [];
    @track filteredOrders = [];
    @track summaryData = []; // 서머리 데이터를 저장할 배열
    @track yearOptions = [];
    @track monthOptions = [];
    @track quarterOptions = [];
    @track selectedYear = '';
    @track selectedMonths = [];
    @track selectedQuarters = []; // 중복 선택 가능한 분기 상태
    error;

    

    // Table columns for Order Products
    columns = [
        { label: '제품 이름', fieldName: 'productName' },
        { label: '수량', fieldName: 'quantity', type: 'number' },
        { label: '권장 주문량', fieldName: 'recommendationOrder', type: 'number' },
        { label: '주문량 차이', fieldName: 'orderDifference', type: 'number' },
        { label: '기준 가격', fieldName: 'listPrice', type: 'currency' },
        { label: '할인율 (%)', fieldName: 'discountRate', type: 'number' },
        { label: '판매 가격', fieldName: 'unitPrice', type: 'currency' },
        { label: '예상 매출', fieldName: 'expectedPrice', type: 'currency' },
        {
            label: '매출 차이', 
            fieldName: 'priceDifference', 
            type: 'currency',
            cellAttributes: {
                style: { fieldName: 'priceDifferenceStyle' } // Price Difference에 따른 스타일 적용
            }
        },
        {
            label: '총 단위 매출', 
            fieldName: 'totalPrice', 
            type: 'currency',
            cellAttributes: {
                style: { fieldName: 'totalPriceStyle' } // Total Price에 Price Difference 기반 스타일 적용
            }
        }
    ];    

    

    // 서머리 테이블의 컬럼 설정
    summaryColumns = [
        { label: '제품 이름', fieldName: 'productName' },
        { label: '총 주문량', fieldName: 'quantity', type: 'number' },
        { label: '총 권장 주문량', fieldName: 'recommendationOrder', type: 'number' },
        { label: '총 주문량 차이', fieldName: 'orderDifference', type: 'number' },
        { label: '판매 가격', fieldName: 'averageUnitPrice', type: 'currency' }, // 평균 단가 추가
        { label: '총 예상 매출', fieldName: 'expectedPrice', type: 'currency' },
        {
            label: '총 매출량 차이', 
            fieldName: 'priceDifference', 
            type: 'currency',
            cellAttributes: {
                style: { fieldName: 'priceDifferenceStyle' } // Price Difference에 따른 스타일 적용
            }
        },
        {
            label: '총 매출', 
            fieldName: 'totalPrice', 
            type: 'currency',
            cellAttributes: {
                style: { fieldName: 'totalPriceStyle' } // Total Price에 Price Difference 기반 스타일 적용
            }
        }
    ];

        // 여기에 메서드 추가 - 클래스 내부의 메서드 영역
    // 초과 달성률을 계산하는 메서드 (예시)
    calculateAchievementRate(totalSales, targetRevenue) {
        if (targetRevenue > 0) {
            this.achievementRate = (totalSales / targetRevenue) * 100;
        } else {
            this.achievementRate = 0;
        }
        // 계산된 초과 달성률 저장
        this.saveAchievementRate();
    }

    // Apex 메서드를 호출해 Account 업데이트
    saveAchievementRate() {
        updateAchievementRate({ accountId: this.recordId, achievementRate: this.achievementRate })
            .then(() => {
                console.log('Achievement rate updated successfully');
            })
            .catch(error => {
                console.error('Error updating achievement rate:', error);
            });
    }
        

    // Wire Apex method to get Order Products
    @wire(getOrderProductsForOpportunity, { opportunityId: '$recordId' })
    wiredOrderProducts({ error, data }) {
        if (data) {
            this.orders = data;
            this.error = undefined;

            // Extract unique years for the picklist
            const years = [...new Set(data.map(order => new Date(order.effectiveDate).getFullYear()))];
            this.yearOptions = years.map(year => ({ label: year.toString(), value: year.toString() }));

            // Extract unique months and quarters for the selected year
            this.updateMonthAndQuarterOptions();
        } else if (error) {
            this.error = error.body.message;
            this.orders = undefined;
        }
    }

    // Update Month and Quarter Options based on selected year, including "전체"
    updateMonthAndQuarterOptions() {
        if (this.selectedYear) {
            const months = [...new Set(
                this.orders
                    .filter(order => new Date(order.effectiveDate).getFullYear().toString() === this.selectedYear)
                    .map(order => new Date(order.effectiveDate).getMonth() + 1)
            )];

            // 월 옵션
            this.monthOptions = [{ label: '전체', value: '전체' }, ...months.map(month => ({
                label: new Date(0, month - 1).toLocaleString('default', { month: 'long' }),
                value: month.toString()
            }))];

            // 각 분기에 해당하는 데이터를 확인하여 분기 옵션 설정 (데이터가 있는 분기만 표시)
            const quartersWithData = this.getQuartersWithData(months);

            this.quarterOptions = [{ label: '전체', value: '전체' }];
            if (quartersWithData.includes('Q1')) {
                this.quarterOptions.push({ label: 'Q1 (1-3월)', value: 'Q1' });
            }
            if (quartersWithData.includes('Q2')) {
                this.quarterOptions.push({ label: 'Q2 (4-6월)', value: 'Q2' });
            }
            if (quartersWithData.includes('Q3')) {
                this.quarterOptions.push({ label: 'Q3 (7-9월)', value: 'Q3' });
            }
            if (quartersWithData.includes('Q4')) {
                this.quarterOptions.push({ label: 'Q4 (10-12월)', value: 'Q4' });
            }
        }
    }

    // Get quarters that have data based on available months
    getQuartersWithData(months) {
        const quarters = [];
        if (months.some(month => month >= 1 && month <= 3)) quarters.push('Q1');
        if (months.some(month => month >= 4 && month <= 6)) quarters.push('Q2');
        if (months.some(month => month >= 7 && month <= 9)) quarters.push('Q3');
        if (months.some(month => month >= 10 && month <= 12)) quarters.push('Q4');
        return quarters;
    }

    // 데이터가 있는 월인지 확인하는 함수 추가
    hasDataForMonth(month) {
        return this.filteredOrders.some(order => {
            const orderMonth = new Date(order.effectiveDate).getMonth() + 1;
            return orderMonth === month;
        });
    }

    // 분기 버튼 클래스 정의 (비활성화 상태 포함)
    getQuarterButtonClass(quarter) {
        if (!this.hasOrdersForQuarter(quarter)) {
            return 'disabled'; // 데이터가 없는 분기는 비활성화
        }
        return this.selectedQuarters.includes(quarter) ? 'active' : '';
    }

    // 월 버튼 클래스 정의 (비활성화 상태 포함)
    getMonthButtonClass(month) {
        if (!this.hasDataForMonth(month)) {
            return 'disabled'; // 데이터가 없는 월은 비활성화
        }
        return this.selectedMonths.includes(String(month)) ? 'active' : '';
    }

    // Handle Quarter Click (중복 선택 가능하게 설정)
    handleQuarterClick(event) {
        const clickedQuarter = event.target.dataset.quarter;

        // 분기에 따라 월 자동 선택 처리
        let monthsToToggle = [];
        switch (clickedQuarter) {
            case 'Q1':
                monthsToToggle = ['1', '2', '3'];
                break;
            case 'Q2':
                monthsToToggle = ['4', '5', '6'];
                break;
            case 'Q3':
                monthsToToggle = ['7', '8', '9'];
                break;
            case 'Q4':
                monthsToToggle = ['10', '11', '12'];
                break;
        }

        // 선택된 분기가 있는지 확인
        if (this.selectedQuarters.includes(clickedQuarter)) {
            // 이미 선택된 분기라면 배열에서 제거 및 해당 월도 제거
            this.selectedQuarters = this.selectedQuarters.filter(quarter => quarter !== clickedQuarter);
            this.selectedMonths = this.selectedMonths.filter(month => !monthsToToggle.includes(month));
        } else {
            // 선택되지 않은 분기라면 배열에 추가 및 해당 월도 추가
            this.selectedQuarters.push(clickedQuarter);
            this.selectedMonths = [...this.selectedMonths, ...monthsToToggle];
        }

        // 필터링 및 데이터 계산 업데이트
        this.filterAndCalculatePerOrderTotals();
    }

    // Handle Month Click (개별 월 선택 가능)
    handleMonthClick(event) {
        const clickedMonth = event.target.dataset.month;
        if (this.selectedMonths.includes(clickedMonth)) {
            this.selectedMonths = this.selectedMonths.filter(month => month !== clickedMonth); // 선택 해제
        } else {
            this.selectedMonths.push(clickedMonth); // 선택 추가
        }
        this.filterAndCalculatePerOrderTotals(); // 필터링과 합계 계산
    }

    // 필터링 및 각 Order 블록별 합계 계산
    filterAndCalculatePerOrderTotals() {
        // 연도와 월, 분기 중 하나를 기준으로 필터링
        this.filteredOrders = this.orders.filter(order => {
            const orderDate = new Date(order.effectiveDate);
            const orderMonth = orderDate.getMonth() + 1;
    
            // 분기를 기준으로 필터링
            let isWithinQuarter = true;
            if (this.selectedQuarters.length > 0 && !this.selectedQuarters.includes('전체')) {
                isWithinQuarter = this.selectedQuarters.some(quarter => {
                    switch (quarter) {
                        case 'Q1':
                            return orderMonth >= 1 && orderMonth <= 3;
                        case 'Q2':
                            return orderMonth >= 4 && orderMonth <= 6;
                        case 'Q3':
                            return orderMonth >= 7 && orderMonth <= 9;
                        case 'Q4':
                            return orderMonth >= 10 && orderMonth <= 12;
                        default:
                            return false;
                    }
                });
            }
    
            // 월을 기준으로 필터링
            const isWithinMonth = this.selectedMonths.length === 0 || this.selectedMonths.includes('전체') ||
                                  this.selectedMonths.includes(orderMonth.toString());
    
            return (
                (this.selectedYear === '' || orderDate.getFullYear().toString() === this.selectedYear) &&
                isWithinQuarter &&
                isWithinMonth
            );
        });
    
        // 서머리 데이터 계산
        this.calculateSummaryData();
    
        this.filteredOrders = this.filteredOrders.map(order => {
            // 기존 제품 정보에서 각 제품의 Price Difference 값을 기준으로 스타일 적용
            const updatedOrderProducts = order.orderProducts.map(product => ({
                ...product,
                // Price Difference는 항상 검정색
                priceDifferenceStyle: 'color: black;', 
                
                // Total Price에 대한 스타일은 Price Difference에 따라 적용
                totalPriceStyle: 
                    product.priceDifference < 0 ? 'color: red;' :  // 음수일 때 빨간색
                    product.priceDifference > 0 ? 'color: blue;' : // 양수일 때 파란색
                    'color: black;' // 0일 때는 검정색
            }));
        
            // Total 행 생성
            let totalQuantity = 0;
            let totalRecommendationOrder = 0;
            let totalOrderDifference = 0;
            let totalPriceSum = 0;
            let totalExpectedPriceSum = 0;
            let totalPriceDifferenceSum = 0;
            
            order.orderProducts.forEach(product => {
                totalQuantity += product.quantity || 0;
                totalRecommendationOrder += product.recommendationOrder || 0;
                totalOrderDifference += product.orderDifference || 0;
                totalPriceSum += product.totalPrice || 0;
                totalExpectedPriceSum += product.expectedPrice || 0;
                totalPriceDifferenceSum += product.priceDifference || 0;
            });
        
            // Total 행 설정
            const totalRow = {
                productName: 'Total',
                quantity: totalQuantity,
                recommendationOrder: totalRecommendationOrder,
                orderDifference: totalOrderDifference,
                expectedPrice: totalExpectedPriceSum,
                priceDifference: totalPriceDifferenceSum,
                totalPrice: totalPriceSum,
                // Total Price도 Price Difference 값에 따라 스타일 적용
                totalPriceStyle: 
                    totalPriceDifferenceSum < 0 ? 'color: red;' :  // 음수일 때 빨간색
                    totalPriceDifferenceSum > 0 ? 'color: blue;' : // 양수일 때 파란색
                    'color: black;', // 0일 때는 검정색
        
                // Total Price Difference도 색상 고정
                priceDifferenceStyle: 'color: black;' // 검정색으로 고정
            };
        
            // 최종 제품 목록 반환 (Total 행 포함)
            return {
                ...order,
                orderProducts: [...updatedOrderProducts, totalRow] // 기존 제품 + Total 행
            };
        });
        
    }

    // 서머리 테이블 데이터 계산
    calculateSummaryData() {
        const summaryMap = {};
    
        // 각 제품별 데이터를 합산합니다.
        this.filteredOrders.forEach(order => {
            order.orderProducts.forEach(product => {
                if (!summaryMap[product.productName]) {
                    summaryMap[product.productName] = {
                        productName: product.productName,
                        quantity: 0,
                        recommendationOrder: 0,
                        orderDifference: 0,
                        expectedPrice: 0,
                        priceDifference: 0,
                        totalPrice: 0,
                        totalUnitPrice: 0,
                        count: 0
                    };
                }
                summaryMap[product.productName].quantity += product.quantity || 0;
                summaryMap[product.productName].recommendationOrder += product.recommendationOrder || 0;
                summaryMap[product.productName].orderDifference += product.orderDifference || 0;
                summaryMap[product.productName].expectedPrice += product.expectedPrice || 0;
                summaryMap[product.productName].priceDifference += product.priceDifference || 0;
                summaryMap[product.productName].totalPrice += product.totalPrice || 0;
                summaryMap[product.productName].totalUnitPrice += product.unitPrice || 0;
                summaryMap[product.productName].count += 1;
            });
        });
    
        // summaryData 배열로 변환하여 평균 단가 계산
        this.summaryData = Object.values(summaryMap).map(product => ({
            ...product,
            averageUnitPrice: product.count > 0 ? (product.totalUnitPrice / product.count) : 0
        }));
    
        // Total 행을 합산합니다.
        let totalSummaryRow = {
            productName: 'Total',
            quantity: 0,
            recommendationOrder: 0,
            orderDifference: 0,
            averageUnitPrice: 0,
            expectedPrice: 0,
            priceDifference: 0,
            totalPrice: 0
        };
    
        // summaryData의 각 제품 데이터를 합산하여 Total 행 생성
        this.summaryData.forEach(product => {
            totalSummaryRow.quantity += product.quantity || 0;
            totalSummaryRow.recommendationOrder += product.recommendationOrder || 0;
            totalSummaryRow.orderDifference += product.orderDifference || 0;
            totalSummaryRow.expectedPrice += product.expectedPrice || 0;
            totalSummaryRow.priceDifference += product.priceDifference || 0;
            totalSummaryRow.totalPrice += product.totalPrice || 0;
        });
    
        // Total 행을 summaryData 배열에 추가합니다.
        this.summaryData.push(totalSummaryRow);
    
        // 스타일을 적용합니다. (Total Price Difference 값에 따라 Total Price의 색상만 변경)
        this.summaryData = this.summaryData.map(product => ({
            ...product,
            totalPriceStyle: 
                product.priceDifference < 0 ? 'color: red;' :  
                product.priceDifference > 0 ? 'color: blue;' : 
                'color: black;', // 0일 경우 검정색
    
            priceDifferenceStyle: 'color: black;' // Price Difference는 색상 고정
        }));
    }
            
    
    
        

    // Handle Year change
    handleYearChange(event) {
        this.selectedYear = event.detail.value;
        this.selectedMonths = []; // Reset months when year changes
        this.selectedQuarters = []; // Reset quarters when year changes
        this.updateMonthAndQuarterOptions(); // 월 및 분기 옵션 업데이트
        this.filterAndCalculatePerOrderTotals(); // 필터링과 합계 계산
    }

    // 각 월에 대한 getter 정의
    get janClass() {
        return this.getMonthButtonClass(1);
    }

    get febClass() {
        return this.getMonthButtonClass(2);
    }

    get marClass() {
        return this.getMonthButtonClass(3);
    }

    get aprClass() {
        return this.getMonthButtonClass(4);
    }

    get mayClass() {
        return this.getMonthButtonClass(5);
    }

    get junClass() {
        return this.getMonthButtonClass(6);
    }

    get julClass() {
        return this.getMonthButtonClass(7);
    }

    get augClass() {
        return this.getMonthButtonClass(8);
    }

    get sepClass() {
        return this.getMonthButtonClass(9);
    }

    get octClass() {
        return this.getMonthButtonClass(10);
    }

    get novClass() {
        return this.getMonthButtonClass(11);
    }

    get decClass() {
        return this.getMonthButtonClass(12);
    }

    // 월 버튼 클래스 설정 (월 번호를 직접 인수로 받음)
    getMonthButtonClass(month) {
        if (!this.hasDataForMonth(month)) {
            return 'disabled'; // 데이터가 없는 월은 비활성화
        }
        return this.selectedMonths.includes(String(month)) ? 'active' : '';
    }

    // 각 분기에 대한 getter 정의
    get hasOrdersForQ1() {
        return this.hasOrdersForQuarter('Q1');
    }

    get hasOrdersForQ2() {
        return this.hasOrdersForQuarter('Q2');
    }

    get hasOrdersForQ3() {
        return this.hasOrdersForQuarter('Q3');
    }

    get hasOrdersForQ4() {
        return this.hasOrdersForQuarter('Q4');
    }

    // 분기 버튼 클래스 설정
    get q1Class() {
        return this.getQuarterButtonClass('Q1');
    }

    get q2Class() {
        return this.getQuarterButtonClass('Q2');
    }

    get q3Class() {
        return this.getQuarterButtonClass('Q3');
    }

    get q4Class() {
        return this.getQuarterButtonClass('Q4');
    }

    // 분기 버튼 클래스 정의
    getQuarterButtonClass(quarter) {
        if (!this.hasOrdersForQuarter(quarter)) {
            return 'disabled'; // 데이터가 없는 분기는 비활성화
        }
        return this.selectedQuarters.includes(quarter) ? 'active' : '';
    }

    // 해당 분기에 데이터가 있는지 확인하는 메소드
    hasOrdersForQuarter(quarter) {
        let monthsInQuarter = [];
        switch (quarter) {
            case 'Q1':
                monthsInQuarter = ['1', '2', '3'];
                break;
            case 'Q2':
                monthsInQuarter = ['4', '5', '6'];
                break;
            case 'Q3':
                monthsInQuarter = ['7', '8', '9'];
                break;
            case 'Q4':
                monthsInQuarter = ['10', '11', '12'];
                break;
        }

        // monthsInQuarter에 해당하는 월에 데이터가 있는지 확인
        return this.filteredOrders.some(order => {
            const orderMonth = new Date(order.effectiveDate).getMonth() + 1;
            return monthsInQuarter.includes(orderMonth.toString());
        });
    }
}