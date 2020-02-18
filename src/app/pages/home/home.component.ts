import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { Banner, HotTag, SongSheet, Singer } from 'src/app/services/data-types/common.types';
import { NzCarouselComponent } from 'ng-zorro-antd';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/internal/operators';
import { SheetService } from 'src/app/services/sheet.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.less']
})
export class HomeComponent implements OnInit {
  @ViewChild(NzCarouselComponent, { static: true }) private nzCarousel: NzCarouselComponent;
  carouselActiveIndex = 0;
  banners: Banner[];
  hotTags: HotTag[];
  singers: Singer[];
  songSheets: SongSheet[];
  constructor(
    private route: ActivatedRoute,
    private sheetService: SheetService) { }
  ngOnInit() {
    this.route.data.pipe(map(res => res.homeDatas)).subscribe(([banners, tags, sheets, singers]) => {
      this.banners = banners;
      this.hotTags = tags;
      this.songSheets = sheets;
      this.singers = singers;
    });
  }

  onBeforeChange({ to }) {
    console.log('to:' + to);
    this.carouselActiveIndex = to;
  }

  onChangeSide(type: 'pre' | 'next') {
    this.nzCarousel[type]();
  }

  onPlaySheet(id: number) {
    this.sheetService.playSheet(id).subscribe(res => {
      console.log('res:', res);
    });
  }
}
