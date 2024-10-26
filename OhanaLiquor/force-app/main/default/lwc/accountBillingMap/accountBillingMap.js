import { LightningElement, api, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';

// Account의 BillingAddress 및 ShippingAddress 필드
const FIELDS = [
    'Account.BillingStreet',
    'Account.BillingCity',
    'Account.BillingState',
    'Account.BillingPostalCode',
    'Account.BillingCountry',
    'Account.ShippingStreet',
    'Account.ShippingCity',
    'Account.ShippingState',
    'Account.ShippingPostalCode',
    'Account.ShippingCountry'
];

export default class AccountBillingShippingMap extends LightningElement {
    @api recordId; // Account 레코드 ID
    billingMarkers = [];
    shippingMarkers = [];
    billingCenter = {}; // Billing 지도 중심 좌표
    shippingCenter = {}; // Shipping 지도 중심 좌표
    error;

    // Account의 Billing Address 및 Shipping Address 가져오기
    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
    wiredAccount({ error, data }) {
        if (data) {
            const billingStreet = data.fields.BillingStreet.value;
            const billingCity = data.fields.BillingCity.value;
            const billingState = data.fields.BillingState.value;
            const billingPostalCode = data.fields.BillingPostalCode.value;
            const billingCountry = data.fields.BillingCountry.value;

            const shippingStreet = data.fields.ShippingStreet.value;
            const shippingCity = data.fields.ShippingCity.value;
            const shippingState = data.fields.ShippingState.value;
            const shippingPostalCode = data.fields.ShippingPostalCode.value;
            const shippingCountry = data.fields.ShippingCountry.value;

            // Billing Address 마커 및 지도 중심 설정
            this.billingMarkers = [
                {
                    location: {
                        Street: billingStreet,
                        City: billingCity,
                        State: billingState,
                        PostalCode: billingPostalCode,
                        Country: billingCountry,
                    },
                    title: 'Billing Address',
                    description: `${billingStreet}, ${billingCity}, ${billingState}, ${billingPostalCode}, ${billingCountry}`,
                },
            ];

            // Billing 지도 중심 설정 (마커의 첫 번째 좌표로 설정)
            this.billingCenter = {
                Street: billingStreet,
                City: billingCity,
                State: billingState,
                PostalCode: billingPostalCode,
                Country: billingCountry,
            };

            // Shipping Address 마커 및 지도 중심 설정
            this.shippingMarkers = [
                {
                    location: {
                        Street: shippingStreet,
                        City: shippingCity,
                        State: shippingState,
                        PostalCode: shippingPostalCode,
                        Country: shippingCountry,
                    },
                    title: 'Shipping Address',
                    description: `${shippingStreet}, ${shippingCity}, ${shippingState}, ${shippingPostalCode}, ${shippingCountry}`,
                },
            ];

            // Shipping 지도 중심 설정 (마커의 첫 번째 좌표로 설정)
            this.shippingCenter = {
                Street: shippingStreet,
                City: shippingCity,
                State: shippingState,
                PostalCode: shippingPostalCode,
                Country: shippingCountry,
            };
        } else if (error) {
            this.error = error;
            console.error('Error fetching billing and shipping addresses: ', error);
        }
    }
}