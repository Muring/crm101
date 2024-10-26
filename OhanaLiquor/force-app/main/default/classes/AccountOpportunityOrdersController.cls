public with sharing class AccountOpportunityOrdersController {

    @AuraEnabled(cacheable=true)
    public static List<OrderWrapper> getOrderProductsForAccount(Id accountId) {
        List<OrderWrapper> orderWrappers = new List<OrderWrapper>();

        // Get the most recent Contract related to the Account
        Contract latestContract;
        try {
            latestContract = [
                SELECT Id, StartDate
                FROM Contract
                WHERE AccountId = :accountId
                ORDER BY StartDate DESC
                LIMIT 1
            ];
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching latest contract: ' + e.getMessage());
        }

        if (latestContract == null) {
            throw new AuraHandledException('No contract found for the specified account.');
        }

        // Get the related Opportunity for the most recent Contract
        Opportunity relatedOpportunity;
        try {
            List<Opportunity> opportunities = [
                SELECT Id, Name
                FROM Opportunity
                WHERE ContractId = :latestContract.Id
                ORDER BY CloseDate DESC
                LIMIT 1
            ];
            
            if (!opportunities.isEmpty()) {
                relatedOpportunity = opportunities[0];
            }
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching related opportunity: ' + e.getMessage());
        }

        if (relatedOpportunity == null) {
            throw new AuraHandledException('No opportunity found for the specified contract.');
        }

        // Get the Orders related to the most recent Contract, including the EffectiveDate
        List<Order> orders;
        try {
            orders = [
                SELECT Id, Name, EffectiveDate, OpportunityId
                FROM Order
                WHERE ContractId = :latestContract.Id
                ORDER BY EffectiveDate ASC
            ];
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching orders: ' + e.getMessage());
        }

        Map<Id, Decimal> fixedRecommendationOrderMap = new Map<Id, Decimal>();

        for (Order ord : orders) {
            List<OrderItem> orderProducts;
            try {
                orderProducts = [
                    SELECT Id, Quantity, UnitPrice, TotalPrice, ListPrice, Recommendation_Order__c, Product2.Name, Product2Id
                    FROM OrderItem
                    WHERE OrderId = :ord.Id
                ];
            } catch (Exception e) {
                throw new AuraHandledException('Error fetching order products: ' + e.getMessage());
            }

            for (OrderItem orderProduct : orderProducts) {
                if (!fixedRecommendationOrderMap.containsKey(orderProduct.Product2Id)) {
                    fixedRecommendationOrderMap.put(orderProduct.Product2Id, orderProduct.Quantity != null ? orderProduct.Quantity : 0);
                }
            }

            List<OrderProductWrapper> orderProductWrappers = new List<OrderProductWrapper>();
            for (OrderItem orderProduct : orderProducts) {
                Decimal recommendationOrder = fixedRecommendationOrderMap.get(orderProduct.Product2Id);

                Decimal orderDifference = (orderProduct.Quantity != null && recommendationOrder != null)
                    ? orderProduct.Quantity - recommendationOrder
                    : 0;

                Decimal discountRate = (orderProduct.ListPrice != null && orderProduct.ListPrice > 0 && orderProduct.UnitPrice != null)
                    ? ((orderProduct.ListPrice - orderProduct.UnitPrice) / orderProduct.ListPrice) * 100
                    : 0;

                Decimal expectedPrice = (recommendationOrder != null && orderProduct.UnitPrice != null)
                    ? recommendationOrder * orderProduct.UnitPrice
                    : 0;

                Decimal priceDifference = (orderProduct.TotalPrice != null && expectedPrice != null)
                    ? orderProduct.TotalPrice - expectedPrice
                    : 0;

                orderProductWrappers.add(new OrderProductWrapper(
                    orderProduct.Product2.Name,
                    orderProduct.Quantity != null ? orderProduct.Quantity : 0,
                    orderProduct.UnitPrice != null ? orderProduct.UnitPrice : 0,
                    orderProduct.TotalPrice != null ? orderProduct.TotalPrice : 0,
                    orderProduct.ListPrice != null ? orderProduct.ListPrice : 0,
                    recommendationOrder, 
                    orderDifference,
                    discountRate,
                    expectedPrice,
                    priceDifference
                ));
            }

            orderWrappers.add(new OrderWrapper(ord.Name, ord.EffectiveDate, orderProductWrappers, latestContract.Id, relatedOpportunity.Id));
        }

        return orderWrappers;                  
    }


    // APEX 메서드: 초과 달성률을 Account에 업데이트
    @AuraEnabled
                  public static void updateAchievementRates(Id accountId, Decimal achievementRate1, Decimal achievementRate2, Decimal achievementRate3, Decimal achievementRate4) {
        try {
            Account acc = [SELECT Id, Achievement_Rate__c, Achievement_Rate_2__c, Achievement_Rate_3__c, Achievement_Rate_4__c FROM Account WHERE Id = :accountId LIMIT 1];
            acc.Achievement_Rate__c = achievementRate1 != null ? achievementRate1 * 100 : 0;
            acc.Achievement_Rate_2__c = achievementRate2 != null ? achievementRate2 * 100 : 0;
            acc.Achievement_Rate_3__c = achievementRate3 != null ? achievementRate3 * 100 : 0;
            acc.Achievement_Rate_4__c = achievementRate4 != null ? achievementRate4 * 100 : 0;
            update acc;
        } catch (Exception e) {
            throw new AuraHandledException('Failed to update Achievement Rates: ' + e.getMessage());
        }
    }
    

    public class OrderWrapper {
        @AuraEnabled public String orderName;
        @AuraEnabled public Date effectiveDate;
        @AuraEnabled public List<OrderProductWrapper> orderProducts;
        @AuraEnabled public Id contractId;
        @AuraEnabled public Id opportunityId;

        public OrderWrapper(String orderName, Date effectiveDate, List<OrderProductWrapper> orderProducts, Id contractId, Id opportunityId) {
            this.orderName = orderName;
            this.effectiveDate = effectiveDate;
            this.orderProducts = orderProducts;
            this.contractId = contractId;
            this.opportunityId = opportunityId;
        }
    }

    public class OrderProductWrapper {
        @AuraEnabled public String productName;
        @AuraEnabled public Decimal quantity;
        @AuraEnabled public Decimal unitPrice;
        @AuraEnabled public Decimal totalPrice;
        @AuraEnabled public Decimal listPrice;
        @AuraEnabled public Decimal recommendationOrder;
        @AuraEnabled public Decimal orderDifference;
        @AuraEnabled public Decimal discountRate;
        @AuraEnabled public Decimal expectedPrice;
        @AuraEnabled public Decimal priceDifference;

        public OrderProductWrapper(String productName, Decimal quantity, Decimal unitPrice, Decimal totalPrice, Decimal listPrice, Decimal recommendationOrder, Decimal orderDifference, Decimal discountRate, Decimal expectedPrice, Decimal priceDifference) {
            this.productName = productName;
            this.quantity = quantity;
            this.unitPrice = unitPrice;
            this.totalPrice = totalPrice;
            this.listPrice = listPrice;
            this.recommendationOrder = recommendationOrder;
            this.orderDifference = orderDifference;
            this.discountRate = discountRate;
            this.expectedPrice = expectedPrice;
            this.priceDifference = priceDifference;
        }
    }
}