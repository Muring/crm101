public with sharing class AccountUpdater {
    @AuraEnabled
    public static void updateAchievementRate(Id accountId, Decimal achievementRate) {
        // Account 레코드 조회
        Account acc = [SELECT Id FROM Account WHERE Id = :accountId LIMIT 1];
        
        // 초과 달성률을 필드에 설정
        acc.Achievement_Rate__c = achievementRate;

        // Account 레코드 업데이트
        update acc;
    }
}