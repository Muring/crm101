public with sharing class NewsCrawling {
    // Named Credential을 통한 NewsAPI 엔드포인트 설정
    private static final String NEWS_API_ENDPOINT = '/v2/everything';
    
    // 뉴스 항목을 나타내는 내부 클래스
    public class NewsItem {
        @AuraEnabled public String title { get; set; }
        @AuraEnabled public String urlToImage { get; set; }
        @AuraEnabled public String url { get; set; }
    }

    // 어카운트 이름을 기반으로 뉴스를 검색하는 @AuraEnabled 메서드
    @AuraEnabled(cacheable=true)
    public static List<NewsItem> getNews(String accountName) {
        // 쿼리 매개변수 설정
        String query = EncodingUtil.urlEncode(accountName, 'UTF-8');
        String requestUrl = NEWS_API_ENDPOINT + '?q=' + query + '&pageSize=5';
        
        // HTTP 요청 설정
        Http http = new Http();
        HttpRequest request = new HttpRequest();
        request.setEndpoint('callout:NewsAPI' + requestUrl);
        request.setMethod('GET');

        try {
            // HTTP 호출
            HttpResponse response = http.send(request);
            if (response.getStatusCode() == 200) {
                // JSON 응답 파싱
                Map<String, Object> results = (Map<String, Object>) JSON.deserializeUntyped(response.getBody());
                List<Object> articles = (List<Object>) results.get('articles');
                List<NewsItem> newsList = new List<NewsItem>();

                for (Object articleObj : articles) {
                    Map<String, Object> article = (Map<String, Object>) articleObj;
                    NewsItem item = new NewsItem();
                    item.title = (String) article.get('title');
                    item.urlToImage = (String) article.get('urlToImage');
                    item.url = (String) article.get('url');
                    newsList.add(item);
                }
                return newsList;
            } else {
                // 오류 처리
                throw new AuraHandledException('Error from NewsAPI: ' + response.getStatus());
            }
        } catch (Exception e) {
            throw new AuraHandledException('Exception: ' + e.getMessage());
        }
    }
}