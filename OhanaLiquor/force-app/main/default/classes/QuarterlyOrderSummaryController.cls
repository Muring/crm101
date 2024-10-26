public with sharing class QuarterlyOrderSummaryController {
    
    @AuraEnabled(cacheable=true)
    public static List<QuarterlySummary> getQuarterlySummary(Id accountId, Integer year) {
        List<QuarterlySummary> summaryList = new List<QuarterlySummary>();
        
        // Account에 연결된 오더 정보 가져오기
        List<Order> orders = [SELECT Id, EffectiveDate 
                              FROM Order 
                              WHERE AccountId = :accountId 
                              AND CALENDAR_YEAR(EffectiveDate) = :year];

        // 각 분기별로 데이터를 집계
        for (Integer quarter = 1; quarter <= 4; quarter++) {
            Decimal totalSales = 0;
            Integer totalQuantity = 0;
            Integer totalProducts = 0;
            Decimal totalOrderDifference = 0;

            List<OrderItem> orderItems = [SELECT Quantity, UnitPrice, Recommendation_Order__c 
                                          FROM OrderItem 
                                          WHERE OrderId IN :orders 
                                          AND CALENDAR_QUARTER(Order.EffectiveDate) = :quarter];
            
            for (OrderItem item : orderItems) {
                totalSales += item.Quantity * item.UnitPrice; // 총 매출
                totalQuantity += Integer.valueOf(item.Quantity); // 총 판매량
                totalProducts += 1; // 주문된 제품 수
                if (item.Recommendation_Order__c != null) {
                    totalOrderDifference += item.Quantity - item.Recommendation_Order__c; // 총 주문량 차이
                }
            }

            // 분기별 데이터 추가
            summaryList.add(new QuarterlySummary(
                'Q' + quarter,
                totalSales,
                totalQuantity,
                totalProducts,
                totalOrderDifference
            ));
        }
        
        return summaryList;
    }

    // 분기별 요약을 위한 Wrapper 클래스
    public class QuarterlySummary {
        @AuraEnabled public String quarter;  // 분기 이름 (Q1, Q2 등)
        @AuraEnabled public Decimal totalSales;  // 총 매출
        @AuraEnabled public Integer totalQuantity;  // 총 판매량
        @AuraEnabled public Integer totalProducts;  // 주문된 제품 수
        @AuraEnabled public Decimal totalOrderDifference;  // 총 주문량 차이

        public QuarterlySummary(String quarter, Decimal totalSales, Integer totalQuantity, Integer totalProducts, Decimal totalOrderDifference) {
            this.quarter = quarter;
            this.totalSales = totalSales;
            this.totalQuantity = totalQuantity;
            this.totalProducts = totalProducts;
            this.totalOrderDifference = totalOrderDifference;
        }
    }
}