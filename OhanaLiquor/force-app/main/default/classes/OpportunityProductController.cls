public with sharing class OpportunityProductController {
    @AuraEnabled(cacheable=true)
    public static List<OpportunityLineItem> getOpportunityProducts(Id opportunityId) {
        return [SELECT Id, Product2.Name, Quantity, UnitPrice, PricebookEntryId
                FROM OpportunityLineItem 
                WHERE OpportunityId = :opportunityId];
    }

}