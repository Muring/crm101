import { LightningElement, wire, api, track } from 'lwc';
import getOrderProductsForAccount from '@salesforce/apex/AccountOpportunityOrdersController.getOrderProductsForAccount';
import updateAchievementRates from '@salesforce/apex/AccountOpportunityOrdersController.updateAchievementRates';

export default class AccountOpportunityOrdersController extends LightningElement {
    @api recordId; // Account Id

    @track orders = [];
    @track totalSummaryForAllQuarters = [];
    @track recentOpportunityLink = ''; // 최근 Opportunity로 이동할 링크
    error;

    // Table columns for Order Products
    columns = [
        { label: '제품 이름', fieldName: 'productName', sortable: false },
        { label: '수량', fieldName: 'quantity', type: 'number', sortable: false },
        { label: '권장 주문량', fieldName: 'recommendationOrder', type: 'number', sortable: false },
        { label: '주문량 차이', fieldName: 'orderDifference', type: 'number', sortable: false },
        { label: '기준 가격', fieldName: 'listPrice', type: 'currency', sortable: false },
        { label: '할인율 (%)', fieldName: 'discountRate', type: 'number', sortable: false },
        { label: '판매 가격', fieldName: 'unitPrice', type: 'currency' },
        { label: '예상 매출', fieldName: 'expectedPrice', type: 'currency', sortable: false },
        {
            label: '매출 차이',
            fieldName: 'priceDifference',
            type: 'currency',
            cellAttributes: {
                style: { fieldName: 'priceDifferenceStyle' } // Price Difference에 따른 스타일 적용
            },
            sortable: false  // 정렬 비활성화
        },
        {
            label: '총 단위 매출',
            fieldName: 'totalPrice',
            type: 'currency',
            cellAttributes: {
                style: { fieldName: 'totalPriceStyle' } // Total Price에 Price Difference 기반 스타일 적용
            },
            sortable: false  // 정렬 비활성화
        }
    ];

    // 서머리 테이블의 컬럼 설정
    summaryColumns = [
        {
            label: '분기 구분',
            fieldName: 'productName',
            type: 'text',
            cellAttributes: {
                alignment: 'center' // 중앙 정렬 설정
            },
            sortable: false  // 정렬 비활성화
        },
        {
            label: '초과 달성률',
            fieldName: 'achievementRate',
            type: 'percent',
            cellAttributes: {
                alignment: 'center',
                style: { fieldName: 'achievementRateStyle' } // 동적으로 설정한 스타일 적용
            },
            sortable: false  // 정렬 비활성화
        }
    ];

    // Apex에서 데이터 로드 (getOrderProductsForAccount 호출)
    @wire(getOrderProductsForAccount, { accountId: '$recordId' })
    wiredOrderProducts({ error, data }) {
        if (data) {
            this.orders = data.map(order => ({
                ...order,
                // OpportunityLink를 기반으로 URL 생성
                opportunityLink: order.opportunityId ? `/lightning/r/Opportunity/${order.opportunityId}/view` : ''
            }));
            this.error = undefined;

            // 최근 Opportunity 링크 설정 (첫 번째 주문의 Opportunity ID 사용)
            this.recentOpportunityLink = this.orders.length > 0 && this.orders[0].opportunityLink
                ? this.orders[0].opportunityLink
                : '';

            this.calculateQuarterSummaryData();
        } else if (error) {
            this.error = error.body.message;
            this.orders = undefined;
        }
    }

    // Div 클릭 시 최근 Opportunity로 이동하는 함수
    handleOpportunityClick() {
        if (this.recentOpportunityLink) {
            window.open(this.recentOpportunityLink, '_blank'); // 새 창에서 최근 Opportunity 열기
        } else {
            console.error('Opportunity link is not available.');
        }
    }

    // "분기별 요약 정보" 클릭 시 최근 Opportunity로 이동하는 함수
    handleDivClick() {
        this.handleOpportunityClick();
    }

    // 분기별 서머리 데이터 계산 후 초과 달성률 업데이트 호출
    calculateQuarterSummaryData() {
        // 기존의 분기별 요약 데이터 계산 로직을 그대로 유지합니다.
        
        const quarters = {
            Q1: { months: [1, 2, 3], data: [] },
            Q2: { months: [4, 5, 6], data: [] },
            Q3: { months: [7, 8, 9], data: [] },
            Q4: { months: [10, 11, 12], data: [] }
        };

        this.totalSummaryForAllQuarters = []; // Q0 요약 데이터를 초기화

        for (const quarterKey in quarters) {
            const quarter = quarters[quarterKey];
            quarter.data = this.orders.filter(order => {
                const orderMonth = new Date(order.effectiveDate).getMonth() + 1;
                return quarter.months.includes(orderMonth);
            });

            const summaryMap = {};

            quarter.data.forEach(order => {
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

            const summaryData = Object.values(summaryMap).map(product => ({
                ...product,
                averageUnitPrice: product.count > 0 ? (product.totalUnitPrice / product.count) : 0
            }));

            let totalSummaryRow = {
                productName: `${quarterKey}(분기) `,
                quantity: 0,
                recommendationOrder: 0,
                orderDifference: 0,
                averageUnitPrice: 0,
                expectedPrice: 0,
                priceDifference: 0,
                totalPrice: 0,
                achievementRate: 0,
                achievementRateStyle: '', // 동적 스타일을 추가하기 위해 초기화
                contractId: ''
            };

            summaryData.forEach(product => {
                totalSummaryRow.quantity += product.quantity || 0;
                totalSummaryRow.recommendationOrder += product.recommendationOrder || 0;
                totalSummaryRow.orderDifference += product.orderDifference || 0;
                totalSummaryRow.expectedPrice += product.expectedPrice || 0;
                totalSummaryRow.priceDifference += product.priceDifference || 0;
                totalSummaryRow.totalPrice += product.totalPrice || 0;
            });

            // 초과 달성률 계산
            totalSummaryRow.achievementRate = totalSummaryRow.expectedPrice > 0
                ? ((totalSummaryRow.totalPrice / totalSummaryRow.expectedPrice) - 1)
                : 0;

            // 초과 달성률에 따라 동적으로 색상을 설정
            if (totalSummaryRow.achievementRate > 0) {
                totalSummaryRow.achievementRateStyle = 'color: blue;'; // 양수일                               때 파란색
            } else if (totalSummaryRow.achievementRate < 0) {
                totalSummaryRow.achievementRateStyle = 'color: red;'; // 음수일 때 빨간색
            } else {
                totalSummaryRow.achievementRateStyle = 'color: black;'; // 0일 때 검정색
            }

            this.totalSummaryForAllQuarters.push({
                ...totalSummaryRow,
                contractId: this.orders.length > 0 ? this.orders[0].contractId : '' // 가장 최근 Contract ID 추가
            });
        }

        // 계산 후 초과 달성률 업데이트
        this.updateQuarterlyAchievementRates();
    }

    // 분기별 초과 달성률 업데이트
    updateQuarterlyAchievementRates() {
        const rates = this.totalSummaryForAllQuarters.map(quarter => quarter.achievementRate || 0);
        while (rates.length < 4) {
            rates.push(0);  // 데이터가 부족한 분기를 위해 0 추가
        }
        updateAchievementRates({ 
            accountId: this.recordId, 
            achievementRate1: rates[0], 
            achievementRate2: rates[1], 
            achievementRate3: rates[2], 
            achievementRate4: rates[3]
        })
        .then(() => {
            console.log('Achievement rates updated successfully');
        })
        .catch(error => {
            console.error('Failed to update achievement rates:', error);
        });
    }
}