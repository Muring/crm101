import { LightningElement, track } from 'lwc';
import BlackLabel from '@salesforce/resourceUrl/MainBannerBlackLabel';
import SojuCheers from '@salesforce/resourceUrl/HanaLabel';

export default class CarouselComponent extends LightningElement {
    @track currentSlideIndex = 0;

    // 이미지 목록
    @track slides = [
        { id: 1, imageUrl: BlackLabel, altText: 'Slide 1', class: 'carousel-item active' },
        { id: 2, imageUrl: SojuCheers, altText: 'Slide 2', class: 'carousel-item' }
    ];

    // 슬라이드 클래스 업데이트
    updateSlideClasses() {
        this.slides = this.slides.map((slide, index) => {
            return {
                ...slide,
                class: index === this.currentSlideIndex ? 'carousel-item active' : 'carousel-item'
            };
        });
    }

    // 이전 슬라이드로 이동
    prevSlide() {
        this.currentSlideIndex = (this.currentSlideIndex === 0) ? this.slides.length - 1 : this.currentSlideIndex - 1;
        this.updateSlideClasses();
    }

    // 다음 슬라이드로 이동
    nextSlide() {
        this.currentSlideIndex = (this.currentSlideIndex === this.slides.length - 1) ? 0 : this.currentSlideIndex + 1;
        this.updateSlideClasses();
    }
}