import { LightningElement, api, wire } from 'lwc';
import getNews from '@salesforce/apex/NewsCrawling.getNews';
import { getRecord } from 'lightning/uiRecordApi';

// Account의 Name 필드를 가져오기 위한 필드 경로
const FIELDS = ['Account.Name'];

export default class NewsCrawling extends LightningElement {
    @api recordId; // 현재 레코드의 ID
    newsData;
    error;
    isLoading = false;

    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
    wiredAccount({ error, data }) {
        if (data) {
            const accountName = data.fields.Name.value;
            this.fetchNews(accountName);
        } else if (error) {
            this.error = 'Failed to load account data';
            this.newsData = undefined;
        }
    }

    fetchNews(accountName) {
        this.isLoading = true;
        getNews({ accountName })
            .then(result => {
                this.newsData = result;
                this.error = undefined;
                this.isLoading = false;
            })
            .catch(error => {
                this.error = error.body.message || 'Unknown error';
                this.newsData = undefined;
                this.isLoading = false;
            });
    }
}