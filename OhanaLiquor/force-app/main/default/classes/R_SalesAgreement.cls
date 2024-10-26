public with sharing class R_SalesAgreement {
    @AuraEnabled(cacheable=true)
    public static List<OrderItem> getOrderProducts(Id opportunityId, Integer months, String searchKey) {
        // 개월 수에 따라 대상 날짜를 계산
        Date targetDate = Date.today().addMonths(-months);

        // 검색 키워드를 위한 패턴 설정
        String searchPattern = '%' + searchKey + '%';

        // SOQL 쿼리 실행하여 데이터 필터링
        List<OrderItem> orderItems = [
            SELECT Id, Recommendation_Order__c, Quantity, UnitPrice, ListPrice, TotalPrice
            FROM OrderItem
            WHERE Order.OpportunityId = :opportunityId
            AND CreatedDate >= :targetDate
            AND (Product2.Name LIKE :searchPattern)
        ];

        // 필수로 반환할 리스트
        return orderItems;
    }
}