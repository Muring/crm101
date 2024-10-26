public with sharing class OrderCloneController {

    @AuraEnabled
    public static Order cloneOrderWithProducts(Id opportunityId, String orderItemsJSON) {
        System.debug(orderItemsJSON);
        try {
            // 1. 전달된 orderItemsJSON을 List<OrderItemWrapper>로 변환 (역직렬화)
            List<OrderItemWrapper> orderItems = (List<OrderItemWrapper>) JSON.deserialize(orderItemsJSON, List<OrderItemWrapper>.class);
            
            // // 2. Opportunity에 연결된 Account를 가져옵니다
            // Opportunity opportunity = [SELECT Id, AccountId FROM Opportunity WHERE Id = :opportunityId LIMIT 1];

            // if (opportunity == null || opportunity.AccountId == null) {
            //     throw new AuraHandledException('No Account found for this Opportunity');
            // }

            // // 3. Account와 연결된 Contract를 가져옵니다
            // Contract relatedContract = [SELECT Id FROM Contract WHERE AccountId = :opportunity.AccountId LIMIT 1];
            // 2. Opportunity에서 AccountId와 ContractId를 직접 가져옵니다
            
            Opportunity opportunity = [SELECT Id, AccountId, ContractId FROM Opportunity WHERE Id = :opportunityId LIMIT 1];

            if (opportunity == null || opportunity.AccountId == null) {
                throw new AuraHandledException('No Account found for this Opportunity');
            }

            if (opportunity.ContractId == null) {
                throw new AuraHandledException('No Contract found for this Opportunity');
            }

            // 3. ContractId가 있으면 Contract를 가져옵니다
            Contract relatedContract = [SELECT Id FROM Contract WHERE Id = :opportunity.ContractId LIMIT 1];


            if (relatedContract == null) {
                throw new AuraHandledException('No Contract found for this Account');
            }

            // 4. Contract와 연결된 가장 최근의 Order를 가져옵니다
            Order oldOrder = [SELECT Id, AccountId, EffectiveDate, Status, ContractId, Pricebook2Id,
                                ShippingState, ShippingCity, ShippingStreet, ShippingCountry,
                                BillingState, BillingCity, BillingStreet, BillingCountry
                              FROM Order 
                              WHERE ContractId = :relatedContract.Id 
                              ORDER BY CreatedDate DESC 
                              LIMIT 1];

            if (oldOrder == null) {
                throw new AuraHandledException('No Orders found for this Contract');
            }

            // 5. 새 Order 생성 (기존 Order 정보를 복사)
            Order newOrder = oldOrder.clone(false, false); // 연관된 OrderItem은 복사하지 않음
            newOrder.Status = 'Draft';  // 새 Order는 'Draft' 상태로 생성
            newOrder.EffectiveDate = oldOrder.EffectiveDate.addMonths(1);    // 이전 Order의 Start Date에서 한 달 더한 날짜로 설정
            newOrder.Pricebook2Id = oldOrder.Pricebook2Id;
            newOrder.ShippingState = oldOrder.ShippingState;
            newOrder.ShippingCity = oldOrder.ShippingCity;
            newOrder.ShippingStreet = oldOrder.ShippingStreet;
            newOrder.ShippingCountry = oldOrder.ShippingCountry;
            newOrder.BillingState = oldOrder.BillingState;
            newOrder.BillingCity = oldOrder.BillingCity;
            newOrder.BillingStreet = oldOrder.BillingStreet;
            newOrder.BillingCountry = oldOrder.BillingCountry;
            insert newOrder;  // 새 Order 저장

            // 6. 기존 Order에 연결된 Order Products (OrderItem)를 가져옵니다
            List<OrderItem> oldOrderItems = [SELECT PricebookEntryId, Quantity, UnitPrice
                                             FROM OrderItem
                                             WHERE OrderId = :oldOrder.Id];

            // 7. 새로운 Order에 복사된 Order Products를 추가합니다
            List<OrderItem> newOrderItems = new List<OrderItem>();
            for (OrderItem item : oldOrderItems) {
                // 역직렬화된 orderItems 데이터를 찾아 사용자가 입력한 Quantity로 업데이트
                OrderItemWrapper matchedItem;
                for (OrderItemWrapper orderItem : orderItems) {
                    if (orderItem.PricebookEntryId == item.PricebookEntryId) {
                        matchedItem = orderItem;
                        break;  // PricebookEntryId가 일치하는 항목을 찾으면 루프 종료
                    }
                }

                OrderItem newItem = new OrderItem();
                newItem.OrderId = newOrder.Id;  // 새 Order와 연결
                newItem.PricebookEntryId = item.PricebookEntryId;
                
                // 만약 전달된 orderItemsJSON에 해당 PricebookEntryId가 존재한다면, 수량을 업데이트
                if (matchedItem != null) {
                    newItem.Quantity = matchedItem.Quantity;
                } else {
                    newItem.Quantity = item.Quantity;  // 전달된 값이 없으면 기존 수량 유지
                }

                newItem.UnitPrice = item.UnitPrice;
                newOrderItems.add(newItem);  // 새로운 Order Product 리스트에 추가
            }
            
            // 8. 새로운 Order Products 저장
            insert newOrderItems;

            return newOrder;  // 새로 생성된 Order를 반환
        } catch (Exception e) {
            // Apex 에러 로그 확인을 위해 사용 (디버깅 시 사용 가능)
            System.debug('Error in cloneOrderWithProducts: ' + e.getMessage());
            throw new AuraHandledException(e.getMessage());  // 오류 메시지 반환
        }
    }

    // 사용자 정의 클래스: OrderItem 정보를 담는 Wrapper 클래스
    public class OrderItemWrapper {
        @AuraEnabled
        public Id PricebookEntryId;  // 필수 필드: PricebookEntryId
        @AuraEnabled
        public Decimal Quantity;  // 수량 필드
    }
}