public with sharing class QuoteOrderController {

    // Order, Quote, 그리고 Quote Line Item 데이터를 가져오는 메서드
    @AuraEnabled(cacheable=true)
    public static QuoteAndOrderData getQuoteAndOrderData(Id orderId) {
        // Step 1: Order에서 QuoteId 가져오기
        Order order = [SELECT Id, Name, QuoteId, TotalAmount FROM Order WHERE Id = :orderId LIMIT 1];
        System.debug(order);

        // 반환할 데이터를 저장할 객체 생성 (Order 데이터를 생성자에 전달)
        QuoteAndOrderData result = new QuoteAndOrderData(order.Name, order.TotalAmount);

        // Step 2: Order에 연결된 Quote 가져오기
        if (order.QuoteId != null) {
            Quote quote = [SELECT Id, Name, TotalPrice FROM Quote WHERE Id = :order.QuoteId];
            result.quoteName = quote.Name;
            result.quoteTotal = quote.TotalPrice;
            System.debug('quote' + quote);

            // Step 3: 해당 Quote에 연결된 Quote Line Items 가져오기
            List<QuoteLineItem> lineItems = [SELECT Product2.Name, Quantity, ListPrice, Discount
                                             FROM QuoteLineItem
                                             WHERE QuoteId = :quote.Id];
            System.debug('lineitems' + lineItems);

            // Step 4: 각 Quote Line Item의 데이터를 리스트에 저장
            for (QuoteLineItem item : lineItems) {
                result.lineItems.add(new LineItemData(
                    item.Product2.Name,    // 제품 이름
                    item.Quantity,         // 수량
                    item.ListPrice,        // 리스트 가격
                    item.Discount          // 할인율    
                ));
            }
        }
        return result;
    }

    // Order 및 Quote, 그리고 Quote Line Item 정보를 담을 클래스
    public class QuoteAndOrderData {
        @AuraEnabled public String orderName;
        @AuraEnabled public Decimal orderTotal;
        @AuraEnabled public String quoteName;
        @AuraEnabled public Decimal quoteTotal;
        @AuraEnabled public List<LineItemData> lineItems = new List<LineItemData>();

        // 생성자: Order 정보를 초기화
        public QuoteAndOrderData(String orderName, Decimal orderTotal) {
            this.orderName = orderName;
            this.orderTotal = orderTotal;
        }
    }

    // Quote Line Item 정보를 저장할 클래스
    public class LineItemData {
        @AuraEnabled public String productName;   // 제품 이름
        @AuraEnabled public Decimal quantity;     // 수량
        @AuraEnabled public Decimal listPrice;    // 리스트 가격
        @AuraEnabled public Decimal discount;     // 할인율

        // 생성자: Line Item 정보를 초기화
        public LineItemData(String productName, Decimal quantity, Decimal listPrice, Decimal discount) {
            this.productName = productName;
            this.quantity = quantity;
            this.listPrice = listPrice;
            this.discount = discount;
        }
    }
}