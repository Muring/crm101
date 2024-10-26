public with sharing class OpportunityOrderProductsController {
    @AuraEnabled(cacheable=true)
    public static List<OrderWrapper> getOrderProductsForOpportunity(Id opportunityId) {
        List<OrderWrapper> orderWrappers = new List<OrderWrapper>();

        // Get the Opportunity and its related ContractId
        Opportunity opp = [SELECT ContractId FROM Opportunity WHERE Id = :opportunityId LIMIT 1];

        if (opp.ContractId != null) {
            // Get the Orders related to the Contract, including the EffectiveDate
            List<Order> orders = [SELECT Id, Name, EffectiveDate FROM Order WHERE ContractId = :opp.ContractId ORDER BY EffectiveDate ASC];

            Map<String, Decimal> fixedRecommendationOrderMap = new Map<String, Decimal>(); // 각 제품별로 Recommendation Order를 저장할 Map

            // Loop through the orders
            for (Order ord : orders) {
                // Get the Order Products related to the Order
                List<OrderItem> orderProducts = [SELECT Id, Quantity, UnitPrice, TotalPrice, ListPrice, Recommendation_Order__c, Product2.Name 
                                                 FROM OrderItem WHERE OrderId = :ord.Id];

                // 각 제품별로 첫 주문의 Quantity 값을 Recommendation Order로 고정
                for (OrderItem orderProduct : orderProducts) {
                    if (!fixedRecommendationOrderMap.containsKey(orderProduct.Product2.Name)) {
                        fixedRecommendationOrderMap.put(orderProduct.Product2.Name, orderProduct.Quantity); // 첫 주문의 Quantity 값을 저장
                    }
                }

                // Create list of Order Product wrappers for this order
                List<OrderProductWrapper> orderProductWrappers = new List<OrderProductWrapper>();
                for (OrderItem orderProduct : orderProducts) {
                    // 각 제품의 고정된 Recommendation Order 값 사용
                    Decimal recommendationOrder = fixedRecommendationOrderMap.get(orderProduct.Product2.Name);

                    // 주문량 차이 계산
                    Decimal orderDifference = (orderProduct.Quantity != null && recommendationOrder != null)
                        ? orderProduct.Quantity - recommendationOrder
                        : null;

                    // 할인율 계산
                    Decimal discountRate = (orderProduct.ListPrice != null && orderProduct.ListPrice > 0) 
                        ? ((orderProduct.ListPrice - orderProduct.UnitPrice) / orderProduct.ListPrice) * 100 
                        : 0;

                    // Expected Price 계산 (Recommendation Order * Unit Price)
                    Decimal expectedPrice = recommendationOrder * orderProduct.UnitPrice;

                    // Price 차이 계산 (Total Price - Expected Price)
                    Decimal priceDifference = orderProduct.TotalPrice - expectedPrice;

                    orderProductWrappers.add(new OrderProductWrapper(
                        orderProduct.Product2.Name,
                        orderProduct.Quantity,
                        orderProduct.UnitPrice,
                        orderProduct.TotalPrice,
                        orderProduct.ListPrice,  
                        recommendationOrder,  // 고정된 Recommendation Order 값 사용
                        orderDifference,  // 주문량 차이
                        discountRate,  // 할인율
                        expectedPrice,  // Expected Price
                        priceDifference  // Price 차이
                    ));
                }

                // Add each order and its products to the wrapper
                orderWrappers.add(new OrderWrapper(ord.Name, ord.EffectiveDate, orderProductWrappers));
            }
        }

        return orderWrappers;
    }

    // Wrapper class to group orders and order products
    public class OrderWrapper {
        @AuraEnabled public String orderName;
        @AuraEnabled public Date effectiveDate;
        @AuraEnabled public List<OrderProductWrapper> orderProducts;

        public OrderWrapper(String orderName, Date effectiveDate, List<OrderProductWrapper> orderProducts) {
            this.orderName = orderName;
            this.effectiveDate = effectiveDate;
            this.orderProducts = orderProducts;
        }
    }

    // Wrapper class to send Order Product data to LWC
    public class OrderProductWrapper {
        @AuraEnabled public String productName;
        @AuraEnabled public Decimal quantity;
        @AuraEnabled public Decimal unitPrice;
        @AuraEnabled public Decimal totalPrice;
        @AuraEnabled public Decimal listPrice; 
        @AuraEnabled public Decimal recommendationOrder;
        @AuraEnabled public Decimal orderDifference; // 주문량 차이
        @AuraEnabled public Decimal discountRate; // 할인율
        @AuraEnabled public Decimal expectedPrice; // Expected Price
        @AuraEnabled public Decimal priceDifference; // Price 차이

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