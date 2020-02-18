import { Component, OnInit, ViewChild, TemplateRef, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-wy-carousel',
  templateUrl: './wy-carousel.component.html',
  styleUrls: ['./wy-carousel.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WyCarouselComponent implements OnInit {
  @Input() activeIndex = 0;
  @ViewChild('dot', { static: true}) dotRef: TemplateRef<any>;
  @Output() changeSlide = new EventEmitter<'pre' | 'next'>();
  constructor() { }

  ngOnInit() {
  }
  onChangesSide(type: 'pre' | 'next') {
    this.changeSlide.emit(type);
  }

}
