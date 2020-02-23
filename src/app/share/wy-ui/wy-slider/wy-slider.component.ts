import { Component, OnInit, ViewEncapsulation, ChangeDetectionStrategy,
  ElementRef, ViewChild, Input, Inject, ChangeDetectorRef, OnDestroy, forwardRef, Output, EventEmitter } from '@angular/core';
import { fromEvent, Observable, merge, Subscription } from 'rxjs';
import { filter, tap, pluck, map, distinctUntilChanged, takeUntil } from 'rxjs/internal/operators';
import { SliderEventObsererConfig, SliderValue } from './wy-slider-types';
import { DOCUMENT } from '@angular/common';
import { sliderEvent, getElementOffset } from './wy-slider-helper';
import { inArray } from 'src/app/utils/array';
import { limitNumberInRange, getPercent } from 'src/app/utils/number';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-wy-slider',
  templateUrl: './wy-slider.component.html',
  styleUrls: ['./wy-slider.component.less'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => WySliderComponent),
    multi: true
  }]
})
export class WySliderComponent implements OnInit, OnDestroy, ControlValueAccessor {
  @ViewChild('wySlider', { static: true }) private wySlider: ElementRef;
  @Input() wyVertical = false;
  @Input() wyMin = 0;
  @Input() wyMax = 100;
  @Input() bufferOffset: SliderValue = 0;
  @Output() wyOnAfterChange = new EventEmitter<SliderValue>();
  private dragStart$: Observable<number>;
  private dragMove$: Observable<number>;
  private dragEnd$: Observable<Event>;

  // tslint:disable-next-line: variable-name
  private dragStart_: Subscription | null;
  // tslint:disable-next-line: variable-name
  private dragMove_: Subscription | null;
  // tslint:disable-next-line: variable-name
  private dragEnd_: Subscription | null;

  private sliderDom: HTMLDivElement;
  private isDragging: boolean;
  value: SliderValue = null;
  offSet: SliderValue = null;
  constructor(
  @Inject(DOCUMENT) private doc: Document,
  private cdr: ChangeDetectorRef) { }
  ngOnInit() {
    this.sliderDom = this.wySlider.nativeElement;
    this.createDraggingObservables();
    this.subscribeDrag(['start']);
  }

  private createDraggingObservables() {
    const orientField = this.wyVertical ? 'pageY' : 'pageX';
    const mouse: SliderEventObsererConfig = {
      start: 'mousedown',
      move: 'mousemove',
      end: 'mouseup',
      filters: (e: MouseEvent) => e instanceof MouseEvent,
      pluckKey: [orientField]
    };
    const touch: SliderEventObsererConfig = {
      start: 'touchstart',
      move: 'touchmove',
      end: 'touchend',
      filters: (e: TouchEvent) => e instanceof TouchEvent,
      pluckKey: ['touches', '0', orientField]
    };
    [mouse, touch].forEach(source => {
      const { start, move, end, filters, pluckKey } = source;
      source.startPlucked$ = fromEvent(this.sliderDom, start)
      .pipe(
        filter(filters),
        tap(sliderEvent),
        pluck(...pluckKey),
        map((postion: number) => this.findClosestValue(postion))
      );
      source.end$ = fromEvent(this.doc, end);
      source.moveResolved$ = fromEvent(this.doc, move)
      .pipe(
        filter(filters),
        tap(sliderEvent),
        pluck(...pluckKey),
        distinctUntilChanged(),
        map((position: number) => this.findClosestValue(position)),
        takeUntil(source.end$)
      );
    });
    this.dragStart$ = merge(mouse.startPlucked$, touch.startPlucked$);
    this.dragMove$ = merge(mouse.moveResolved$, touch.moveResolved$);
    this.dragEnd$ = merge(mouse.end$, mouse.end$);
  }

  private subscribeDrag(events: string[] = ['start', 'move', 'end']) {
    if (inArray(events, 'start') && this.dragStart$ && !this.dragStart_) {
      this.dragStart_ = this.dragStart$.subscribe(this.onDragStart.bind(this));
    }
    if (inArray(events, 'move') && this.dragMove$ && !this.dragMove_) {
      this.dragMove_ = this.dragMove$.subscribe(this.onDragMove.bind(this));
    }
    if (inArray(events, 'end') && this.dragEnd$ && !this.dragEnd_) {
      this.dragEnd_ = this.dragEnd$.subscribe(this.onDragEnd.bind(this));
    }
  }

  private findClosestValue(position: number): number {
    // Get silder total length
    const silderLength = this.getSliderLength();
    // Get slider left or hight position
    const sliderStart = this.getSliderStartPosition();
    const ratio = limitNumberInRange((position - sliderStart) / silderLength, 0, 1 );
    const ratioTrue = this.wyVertical ? 1 - ratio : ratio;
    return ratioTrue * (this.wyMax - this.wyMin) + this.wyMin;
  }

  private getSliderStartPosition(): number {
    const offset = getElementOffset(this.sliderDom);
    return this.wyVertical ? offset.top : offset.left;
  }

  private getSliderLength(): number {
    return this.wyVertical ? this.sliderDom.clientHeight : this.sliderDom.clientWidth;
  }

  private onDragStart(value: number) {
    this.toggleDragMoving(true);
    this.setValue(value);
  }

  private onDragMove(value: number) {
    if (this.isDragging) {
      this.setValue(value);
      this.cdr.markForCheck();
    }
  }

  private onDragEnd() {
    this.wyOnAfterChange.emit(this.value);
    this.toggleDragMoving(false);
    this.cdr.markForCheck();
  }

  private setValue(value: SliderValue, needCheck = false) {
    if (needCheck) {
      if (this.isDragging) { return; }
      this.value = this.formatValue(value);
      this.updateTrackAndHandles();
    } else if (!this.valuesEqual(this.value, value)) {
      this.value = value;
      this.updateTrackAndHandles();
      this.onValueChange(this.value);
    }
  }

  private formatValue(value: SliderValue): SliderValue {
    let res = value;
    if (this.assertValueValid(value)) {
      res = this.wyMin;
    } else {
      res = limitNumberInRange(value, this.wyMin, this.wyMax);
    }
    return res;
  }

  private assertValueValid(value: SliderValue): boolean {
    return isNaN(typeof value !== 'number' ? parseFloat(value) : value);
  }

  private valuesEqual(valA: SliderValue, valB: SliderValue): boolean {
    if (typeof valA !== typeof valB) {
      return false;
    }
    return valA === valB;
  }

  private updateTrackAndHandles() {
    this.offSet = this.getValueToOffset(this.value);
    this.cdr.markForCheck();
  }

  private getValueToOffset(value: SliderValue): SliderValue {
    return getPercent(this.wyMin, this.wyMax, value);
  }

  private toggleDragMoving(movable: boolean) {
    this.isDragging = movable;
    if (movable) {
      this.subscribeDrag(['move', 'end']);
    } else {
      this.unsubscribeDrag(['move', 'end']);
    }
  }

  private unsubscribeDrag(events: string[] = ['start', 'move', 'end']) {
    if (inArray(events, 'start') && this.dragStart_) {
      this.dragStart_.unsubscribe();
      this.dragStart_ = null;
    }
    if (inArray(events, 'move') && this.dragMove_) {
      this.dragMove_.unsubscribe();
      this.dragMove_ = null;
    }
    if (inArray(events, 'end') && this.dragEnd_) {
      this.dragEnd_.unsubscribe();
      this.dragEnd_ = null;
    }
  }

  private onValueChange(value: SliderValue): void {}
  private onTouched(): void {}

  writeValue(value: SliderValue): void {
    this.setValue(value, true);
  }

  registerOnChange(fn: (value: SliderValue) => void): void {
    this.onValueChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  ngOnDestroy(): void {
    this.unsubscribeDrag();
  }

}
