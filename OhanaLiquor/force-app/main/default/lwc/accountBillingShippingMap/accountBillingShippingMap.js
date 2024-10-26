import { LightningElement, api, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';

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
    connectedCallback() {
        // data-id가 map인 요소를 선택
        const mapElement = this.template.querySelector('[data-id="map"]');
        
        // 요소의 너비를 50%로 변경
        if (mapElement) {
            mapElement.style.width = '50%';
        }
    }

    @api recordId; 
    billingMarkers = [];
    shippingMarkers = [];
    billingCenter = {};
    shippingCenter = {};
    mapInitialized = false;

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

            // Billing 및 Shipping Address 마커 설정
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

            // 지도의 중심 좌표
            this.billingCenter = {
                Street: billingStreet,
                City: billingCity,
                State: billingState,
                PostalCode: billingPostalCode,
                Country: billingCountry,
            };

            this.shippingCenter = {
                Street: shippingStreet,
                City: shippingCity,
                State: shippingState,
                PostalCode: shippingPostalCode,
                Country: shippingCountry,
            };
        } else if (error) {
            console.error('Error fetching account addresses: ', error);
        }
    }

    // renderedCallback() {
    //     if (!this.mapInitialized) {
    //         // 렌더링이 완료된 후 지도의 중심 좌표를 강제로 재조정
    //         this.template.querySelectorAll('lightning-map').forEach(map => {
    //             map.center = map.mapMarkers[0].location; // 첫 번째 마커의 위치로 중심 설정
    //         });
    //         this.mapInitialized = true;
    //     }
    // }
}