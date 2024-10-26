import { LightningElement, wire, api } from 'lwc';
import getQuoteAndOrderData from '@salesforce/apex/QuoteOrderController.getQuoteAndOrderData';

export default class QuoteOrderComponent extends LightningElement {
    @api recordId;  // 현재 Order 레코드의 ID
    quoteOrderData;  // Order, Quote, 그리고 Quote Line Items 데이터를 저장

    @wire(getQuoteAndOrderData, { orderId: '$recordId' })  // 수정된 Apex 메서드 사용
    wiredQuoteAndOrder({ error, data }) {
        if (data) {
            console.log('Quote and Order Data:', data);  // 데이터를 콘솔에 출력하여 확인
            this.quoteOrderData = data;  // Apex에서 받은 데이터를 저장
        } else if (error) {
            console.error('Error retrieving quote and order data:', error);
        }
    }

    // 데이터가 있는지 확인하는 헬퍼 메서드
    get hasData() {
        return this.quoteOrderData != null && this.quoteOrderData.lineItems.length > 0;
    }
}