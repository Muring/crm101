public with sharing class QuoteViewerController {
    
    // Opportunity ID를 받아 관련된 Quote 정보를 반환하는 메소드
    @AuraEnabled(cacheable=true)
    public static List<QuoteWrapper> getQuotesForOpportunity(Id opportunityId) {
        List<QuoteWrapper> result = new List<QuoteWrapper>();
        
        // Opportunity에 연결된 Quote 정보를 조회
        List<Quote> quotes = [SELECT Id, QuoteNumber, Name, ExpirationDate, IsSyncing, TotalPrice, Status, Contact.Name, ContactId
                              FROM Quote 
                              WHERE OpportunityId = :opportunityId
                              ORDER BY CreatedDate DESC];
        System.debug('quotes : ' + quotes);
        System.debug('quotes : ' + quotes.size());

        
        // Quote Line Item 정보를 조회하고 Quote ID로 매핑
        Map<Id, List<QuoteLineItem>> quoteLineItemsMap = new Map<Id, List<QuoteLineItem>>();
        for (QuoteLineItem qli : [SELECT Id, QuoteId, Product2.Name, Quantity, UnitPrice, Discount, TotalPrice, Product2.ProductIamge__c, Product2.URL__c
                                  FROM QuoteLineItem
                                  WHERE QuoteId IN :quotes]) {
            if (!quoteLineItemsMap.containsKey(qli.QuoteId)) {
                quoteLineItemsMap.put(qli.QuoteId, new List<QuoteLineItem>());
            }
            quoteLineItemsMap.get(qli.QuoteId).add(qli);
            System.debug('lineItems : ' + qli);
        }
        
        // 각 Quote에 대한 Wrapper 객체 생성
        for (Quote q : quotes) {
            result.add(new QuoteWrapper(q, quoteLineItemsMap.get(q.Id)));
        }
        
        return result;
    }

    // Quote 정보를 담는 Wrapper 클래스
    public class QuoteWrapper {
        @AuraEnabled public Id quoteId { get; set; }
        @AuraEnabled public Id contactId { get; set; }
        @AuraEnabled public String quoteNumber { get; set; }
        @AuraEnabled public String quoteName { get; set; }
        @AuraEnabled public Date expirationDate { get; set; }
        @AuraEnabled public Boolean isSyncing { get; set; }
        //@AuraEnabled public String opportunityName { get; set; }
        //@AuraEnabled public String accountName { get; set; }
        //@AuraEnabled public Decimal grandTotal { get; set; }
        @AuraEnabled public Decimal totalPrice { get; set; }
        @AuraEnabled public String status { get; set; }
        @AuraEnabled public String contactName { get; set; }
        @AuraEnabled public List<QuoteLineItemWrapper> lineItems { get; set; }

        // Quote와 관련 QuoteLineItem 정보로 Wrapper 객체 초기화
        public QuoteWrapper(Quote q, List<QuoteLineItem> qlis) {
            this.quoteId = q.Id;
            this.contactId = q.ContactId;
            this.quoteNumber = q.QuoteNumber;
            this.quoteName = q.Name;
            this.expirationDate = q.ExpirationDate;
            this.isSyncing = q.IsSyncing;
            //this.opportunityName = q.Opportunity.Name;
            //this.accountName = q.Account.Name;
            this.totalPrice = q.TotalPrice;
            this.status = q.Status;
            this.contactName = q.Contact.Name;

            System.debug('QuoteWrapper - quoteId: ' + this.quoteId);

            System.debug('QuoteWrapper - contactId: ' + this.contactId);

            //각 Quote에 대한 QuoteLineItemWrapper 객체 생성
            this.lineItems = new List<QuoteLineItemWrapper>();
            if (qlis != null) {
                for (QuoteLineItem qli : qlis) {
                    this.lineItems.add(new QuoteLineItemWrapper(qli));
                }
            }
        }
    }

    // QuoteLineItem 정보를 담는 Wrapper 클래스
    public class QuoteLineItemWrapper {
        @AuraEnabled public String productName { get; set; }
        @AuraEnabled public Decimal quantity { get; set; }
        @AuraEnabled public Decimal unitPrice { get; set; }
        //@AuraEnabled public Decimal listPrice { get; set; }
        @AuraEnabled public Decimal discount { get; set; }
        @AuraEnabled public Decimal totalPrice { get; set; }
        @AuraEnabled public String productImageUrl;
        
        // QuoteLineItem 정보로 Wrapper 객체 초기화
        public QuoteLineItemWrapper(QuoteLineItem qli) {
            this.productName = qli.Product2.Name;
            this.quantity = qli.Quantity;
            this.unitPrice = qli.UnitPrice;
            //this.listPrice = qli.ListPrice;
            this.discount = qli.Discount;
            this.totalPrice = qli.TotalPrice;
            this.productImageUrl = qli.Product2.URL__c;
            System.debug('productImageUrl : ' + qli.Product2.URL__c);
        }
    }
}