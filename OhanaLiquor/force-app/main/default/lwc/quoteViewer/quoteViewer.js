// quoteViewer.js
import { LightningElement, wire, api } from 'lwc';
import getQuotesForOpportunity from '@salesforce/apex/QuoteViewerController.getQuotesForOpportunity';
import LOCALE from '@salesforce/i18n/locale';
import CURRENCY from '@salesforce/i18n/currency'; //화폐단위
import { NavigationMixin } from 'lightning/navigation';

export default class QuoteViewer extends NavigationMixin(LightningElement) {
    @api recordId; // Opportunity Id를 받아오기 위한 public 속성
    quotes;
    error;

    // Apex 메소드를 호출하여 Quote 데이터를 가져옴
    @wire(getQuotesForOpportunity, { opportunityId: '$recordId' })
    wiredQuotes({ error, data }) { //데이터 받아 처리하는 콜백 함수
        if (data) {
            // 데이터 가공: 통화 형식 적용 및 라인 아이템 처리 
            this.quotes = data.map(quote => ({ 
                ...quote, // 객체의 모든 기촌 속성 새 객체에 복사 - spread 연산자
                formattedTotalPrice: this.formatCurrency(quote.totalPrice),
                lineItems: quote.lineItems.map(item => ({
                    ...item, 
                    formattedUnitPrice: this.formatCurrency(item.unitPrice),
                    formattedTotalPrice: this.formatCurrency(item.totalPrice),
                    formattedQuantity: this.formatQuantity(item.quantity)
                }))
            }));
            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.quotes = undefined;
        }
    }

    // 통화 형식 지정 함수
    formatCurrency(value) {
        return new Intl.NumberFormat(LOCALE, {
            style: 'currency',
            currency: CURRENCY,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    }

    //수량 형식 지정 함수
    formatQuantity(value) {
        return new Intl.NumberFormat(LOCALE, {
            useGrouping: true,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    }

    //Quote 상세 페이지로 이동하는 함수
    navigateToQuoteURL(event) {
        //const quoteId = event.currentTarget.dataset.id;
        //console.log(this.quoteId);
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: '/lightning/r/Quote/' + event.currentTarget.dataset.id + '/view'
            }
        });
    }

    //Contact 상세 페이지로 이동하는 함수
    navigateToContactURL(event) {
        //const quoteId = event.currentTarget.dataset.id;
        //console.log(this.quoteId);
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: '/lightning/r/Contact/' + event.currentTarget.dataset.id + '/view'
            }
        });
    }

}