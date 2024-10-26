import { LightningElement } from 'lwc';

export default class GoBackHomeButtonComponent extends LightningElement {
    goToHome() {
        // 홈 페이지 URL로 리디렉션
        window.location.href = '/'; // 여기서 '/'는 홈 페이지 URL을 나타냅니다. 실제 URL로 변경할 수 있습니다.
    }
}