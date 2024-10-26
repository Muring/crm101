public with sharing class QuarterSalesAgreementComponent {
    
    // Order와 관련된 데이터를 담기 위한 Wrapper 클래스
    public class OrderWrapper {
        @AuraEnabled public Order order { get; set; }
        @AuraEnabled public List<ProductWrapper> orderProducts { get; set; }
    }

    // Product 정보를 담기 위한 Wrapper 클래스
    public class ProductWrapper {
        @AuraEnabled public String productName { get; set; }
        @AuraEnabled public Decimal plannedQuantity { get; set; }
        @AuraEnabled public Decimal actualQuantity { get; set; }
        @AuraEnabled public Decimal plannedAmount { get; set; }
        @AuraEnabled public Decimal actualAmount { get; set; }
    }

    // 분기별 합계를 계산하는 메서드
    @AuraEnabled
    public static Map<String, Decimal> getQuarterTotals(String quarter, String year) {
        // 분기에 해당하는 월 범위를 정의
        Integer startMonth;
        Integer endMonth;
        
        if (quarter == 'Q1') {
            startMonth = 1; endMonth = 3;  // 1분기: 1월~3월
        } else if (quarter == 'Q2') {
            startMonth = 4; endMonth = 6;  // 2분기: 4월~6월
        } else if (quarter == 'Q3') {
            startMonth = 7; endMonth = 9;  // 3분기: 7월~9월
        } else if (quarter == 'Q4') {
            startMonth = 10; endMonth = 12; // 4분기: 10월~12월
        } else {
            throw new AuraHandledException('Invalid quarter.');
        }

        // 월별 데이터를 먼저 불러옴
        List<Order> orders = [SELECT Id, Name, EffectiveDate
                              FROM Order
                              WHERE CALENDAR_MONTH(EffectiveDate) >= :startMonth
                                AND CALENDAR_MONTH(EffectiveDate) <= :endMonth
                                AND CALENDAR_YEAR(EffectiveDate) = :Integer.valueOf(year)];

        // 합계를 저장할 변수 선언
        Decimal totalPlannedQuantity = 0;
        Decimal totalActualQuantity = 0;
        Decimal totalPlannedAmount = 0;
        Decimal totalActualAmount = 0;

        // 각 주문의 제품 목록을 조회하여 합계 계산
        for (Order ord : orders) {
            List<OrderItem> products = [SELECT Product2.Name, Quantity, UnitPrice
                                        FROM OrderItem
                                        WHERE OrderId = :ord.Id];
            
            for (OrderItem product : products) {
                Decimal plannedAmount = product.Quantity * product.UnitPrice;
                Decimal actualAmount = product.Quantity * product.UnitPrice;

                totalPlannedQuantity += product.Quantity;
                totalActualQuantity += product.Quantity;
                totalPlannedAmount += plannedAmount;
                totalActualAmount += actualAmount;
            }
        }

        // 합계 값을 Map에 담아 반환
        Map<String, Decimal> totals = new Map<String, Decimal>();
        totals.put('totalPlannedQuantity', totalPlannedQuantity);
        totals.put('totalActualQuantity', totalActualQuantity);
        totals.put('totalPlannedAmount', totalPlannedAmount);
        totals.put('totalActualAmount', totalActualAmount);

        return totals;
    }
}