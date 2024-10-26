public with sharing class ApiKeyService {
    // @AuraEnabled(cacheable=true)
    // public static String getGoogleMapsApiKey() {
    //     // Custom Metadata에서 API 키 레코드를 가져오기
    //     APIKeyConfiguration__mdt apiKeyRecord = [
    //         SELECT GoogleMapsAPIKey__c 
    //         FROM APIKeyConfiguration__mdt 
    //         WHERE DeveloperName = 'GoogleMapsAPIKey' // 레코드 이름을 기준으로 필터링
    //         LIMIT 1
    //     ];

    //     // API 키 반환
    //     console.log(getGoogleMapsApiKey());
    //     return apiKeyRecord.GoogleMapsAPIKey__c;
    // }
}