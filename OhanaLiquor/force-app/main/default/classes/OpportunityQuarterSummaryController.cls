public with sharing class OpportunityQuarterSummaryController {
    @AuraEnabled(cacheable=true)
    public static List<QuarterSummaryWrapper> getQuarterSummaryForOpportunity(Id opportunityId, String year) {
        List<QuarterSummaryWrapper> quarterSummaries = new List<QuarterSummaryWrapper>();

        // Get the Opportunity and its related ContractId
        List<Opportunity> oppList = [SELECT ContractId FROM Opportunity WHERE Id = :opportunityId LIMIT 1];
        if (oppList.isEmpty()) {
            throw new AuraHandledException('Opportunity not found for the given ID');
        }
        Opportunity opp = oppList[0];

        if (opp.ContractId != null) {
            // Get Orders related to the Contract for the specified year
            List<Order> orders = [
                SELECT Id, EffectiveDate 
                FROM Order 
                WHERE ContractId = :opp.ContractId AND CALENDAR_YEAR(EffectiveDate) = :Integer.valueOf(year)
                ORDER BY EffectiveDate ASC
            ];

            // Initialize map to accumulate quarterly data
            Map<String, QuarterSummaryWrapper> summaryMap = new Map<String, QuarterSummaryWrapper>();
            summaryMap.put('Q1', new QuarterSummaryWrapper('Q1'));
            summaryMap.put('Q2', new QuarterSummaryWrapper('Q2'));
            summaryMap.put('Q3', new QuarterSummaryWrapper('Q3'));
            summaryMap.put('Q4', new QuarterSummaryWrapper('Q4'));

            // Loop through orders and aggregate quarterly data
            for (Order ord : orders) {
                List<OrderItem> orderItems = [
                    SELECT Quantity, UnitPrice, TotalPrice, ListPrice, Recommendation_Order__c 
                    FROM OrderItem 
                    WHERE OrderId = :ord.Id
                ];

                String quarter = getQuarter(ord.EffectiveDate);
                QuarterSummaryWrapper summary = summaryMap.get(quarter);

                for (OrderItem item : orderItems) {
                    summary.quantity += item.Quantity != null ? item.Quantity : 0;
                    summary.recommendationOrder += item.Recommendation_Order__c != null ? item.Recommendation_Order__c : 0;
                    summary.orderDifference += (item.Quantity != null && item.Recommendation_Order__c != null) ? (item.Quantity - item.Recommendation_Order__c) : 0;
                    summary.expectedPrice += item.Recommendation_Order__c != null ? (item.Recommendation_Order__c * item.UnitPrice) : 0;
                    summary.priceDifference += item.TotalPrice != null && item.Recommendation_Order__c != null ? (item.TotalPrice - (item.Recommendation_Order__c * item.UnitPrice)) : 0;
                    summary.totalPrice += item.TotalPrice != null ? item.TotalPrice : 0;
                }
            }

            // Add all quarter summaries to the list
            for (String key : summaryMap.keySet()) {
                QuarterSummaryWrapper summary = summaryMap.get(key);
                if (summary.quantity > 0 || summary.recommendationOrder > 0 || summary.totalPrice > 0) {
                    quarterSummaries.add(summary);
                }
            }
        }

        return quarterSummaries;
    }

    // Helper method to determine the quarter of a given date
    private static String getQuarter(Date orderDate) {
        Integer month = orderDate.month();
        if (month >= 1 && month <= 3) {
            return 'Q1';
        } else if (month >= 4 && month <= 6) {
            return 'Q2';
        } else if (month >= 7 && month <= 9) {
            return 'Q3';
        } else {
            return 'Q4';
        }
    }

    // Wrapper class to hold quarterly summary data
    public class QuarterSummaryWrapper {
        @AuraEnabled public String quarter;
        @AuraEnabled public Decimal quantity = 0;
        @AuraEnabled public Decimal recommendationOrder = 0;
        @AuraEnabled public Decimal orderDifference = 0;
        @AuraEnabled public Decimal expectedPrice = 0;
        @AuraEnabled public Decimal priceDifference = 0;
        @AuraEnabled public Decimal totalPrice = 0;

        public QuarterSummaryWrapper(String quarter) {
            this.quarter = quarter;
        }
    }
}