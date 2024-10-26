public with sharing class SalesAgreementComponent {

    @AuraEnabled(cacheable=true)
    public static List<OrderWrapper> getOrdersByMonth(Integer month, Integer year) {
        try {
            // Order 및 관련된 OrderItem 데이터를 한 번에 가져옴
            List<Order> orders = getOrdersWithItems(month, year);

            // Order가 없을 경우 빈 리스트 반환
            if (orders.isEmpty()) {
                return new List<OrderWrapper>();
            }

            // Order 및 OrderProduct 데이터 처리
            return buildOrderWrappers(orders);

        } catch (Exception ex) {
            System.debug('Error retrieving orders: ' + ex.getMessage());
            throw new AuraHandledException('An error occurred while retrieving the orders. Please try again.');
        }
    }

    // Order 및 관련된 OrderItem 데이터를 가져오는 메서드
    private static List<Order> getOrdersWithItems(Integer month, Integer year) {
        // Order에 대한 CRUD 권한 확인 (읽기 권한 확인)
        if (!Schema.sObjectType.Order.isAccessible() || !Schema.sObjectType.OrderItem.isAccessible()) {
            throw new SecurityException('User does not have permission to read Order or OrderItem records.');
        }

        return [
            SELECT Id, Name, EffectiveDate, 
                (SELECT Id, Product2.Name, Quantity, UnitPrice, ListPrice, TotalPrice, Recommendation_Order__c
                 FROM OrderItems)
            FROM Order
            WHERE CALENDAR_MONTH(EffectiveDate) = :month AND CALENDAR_YEAR(EffectiveDate) = :year
        ];
    }

    // OrderWrapper와 OrderProductWrapper를 생성하는 메서드
    private static List<OrderWrapper> buildOrderWrappers(List<Order> orders) {
        List<OrderWrapper> orderWrappers = new List<OrderWrapper>();

        for (Order order : orders) {
            List<OrderProductWrapper> productWrappers = new List<OrderProductWrapper>();

            for (OrderItem product : order.OrderItems) {
                // OrderItem 데이터에서 계산 및 null 처리
                productWrappers.add(new OrderProductWrapper(
                    product.Product2.Name != null ? product.Product2.Name : 'Unnamed Product',
                    product.Recommendation_Order__c != null ? product.Recommendation_Order__c : 0,
                    product.Quantity != null ? product.Quantity : 0,
                    product.ListPrice != null ? product.ListPrice : 0,
                    product.UnitPrice != null ? ((product.ListPrice - product.UnitPrice) / product.ListPrice) * 100 : 0,
                    product.UnitPrice != null ? product.UnitPrice : 0,
                    product.Recommendation_Order__c * product.UnitPrice,
                    product.TotalPrice != null ? product.TotalPrice : 0
                ));
            }

            orderWrappers.add(new OrderWrapper(order, productWrappers));
        }

        return orderWrappers;
    }

    // Order 및 OrderItem 데이터를 담는 Wrapper 클래스
    public class OrderWrapper {
        @AuraEnabled public Order order { get; set; }
        @AuraEnabled public List<OrderProductWrapper> orderProducts { get; set; }

        public OrderWrapper(Order order, List<OrderProductWrapper> products) {
            this.order = order;
            this.orderProducts = products;
        }
    }

    // OrderItem 데이터를 캡슐화하는 클래스
    public class OrderProductWrapper {
        @AuraEnabled public String productName { get; set; }
        @AuraEnabled public Decimal plannedQuantity { get; set; }
        @AuraEnabled public Decimal actualQuantity { get; set; }
        @AuraEnabled public Decimal salesPrice { get; set; }
        @AuraEnabled public Decimal discountRate { get; set; }
        @AuraEnabled public Decimal unitPrice { get; set; }
        @AuraEnabled public Decimal plannedAmount { get; set; }
        @AuraEnabled public Decimal actualAmount { get; set; }

        public OrderProductWrapper(String productName, Decimal plannedQuantity, Decimal actualQuantity,
                                   Decimal salesPrice, Decimal discountRate, Decimal unitPrice, 
                                   Decimal plannedAmount, Decimal actualAmount) {
            this.productName = productName;
            this.plannedQuantity = plannedQuantity;
            this.actualQuantity = actualQuantity;
            this.salesPrice = salesPrice;
            this.discountRate = discountRate;
            this.unitPrice = unitPrice;
            this.plannedAmount = plannedAmount;
            this.actualAmount = actualAmount;
        }
    }
}