import { Component, OnInit, ViewChild, ElementRef, Inject } from '@angular/core';
import { AppStoreModule } from 'src/app/store';
import { Store, select } from '@ngrx/store';
import { getSongList, getPlayList, getCurrentIndex, getPlayer, getPlayMode, getCurrentSong } from 'src/app/store/selectors/player.selector';
import { Song } from 'src/app/services/data-types/common.types';
import { PlayMode } from './player-type';
import { Element } from '@angular/compiler';
import { SetCurrentIndex } from 'src/app/store/actions/play.action';
import { Subscription, fromEvent } from 'rxjs';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-wy-player',
  templateUrl: './wy-player.component.html',
  styleUrls: ['./wy-player.component.less']
})
export class WyPlayerComponent implements OnInit {
  percent = 0;
  bufferPercent = 0;
  volume = 60;
  songList: Song[];
  playList: Song[];
  currentIndex: number;
  currentSong: Song;
  duration: number;
  currentTime: number;
  playing = false;
  songReady = false;
  showVolumePanel = false;
  selfClick = false;
  private winClick: Subscription;
  @ViewChild('audio', { static: true }) private audio: ElementRef;
  private audioEl: HTMLAudioElement;
  constructor(
    private store$: Store<AppStoreModule>,
    @Inject(DOCUMENT) private doc: Document
  ) { }

  ngOnInit() {
    this.audioEl = this.audio.nativeElement;
    const appStore$ = this.store$.pipe(select(getPlayer));
    appStore$.pipe(select(getSongList)).subscribe(list => this.watchList(list, 'songList'));
    appStore$.pipe(select(getPlayList)).subscribe(list => this.watchList(list, 'playList'));
    appStore$.pipe(select(getCurrentIndex)).subscribe(index => this.watchCurrentIndex(index));
    appStore$.pipe(select(getPlayMode)).subscribe(mode => this.watchPlayMode(mode));
    appStore$.pipe(select(getCurrentSong)).subscribe(song => this.watchCurentSong(song));
  }

  private watchList(list: Song[], type: string) {
    this[type] = list;
  }

  private watchCurrentIndex(index: number) {
    this.currentIndex = index;
  }

  private watchPlayMode(mode: PlayMode) {
    console.log('mode', mode);
  }

  private watchCurentSong(song: Song) {
    this.currentSong = song;
    if (song) {
      this.duration = song.dt / 1000;
    }
  }

  onCanplay() {
    this.songReady = true;
    this.play();
  }

  private play() {
    this.audioEl.play();
    this.playing = true;
  }

  get picUrl(): string {
    return this.currentSong ? this.currentSong.al.picUrl : '//s4.music.126.net/style/web2/img/default/default_album.jpg';
  }

  onTimeUpdate(e: Event) {
    this.currentTime = (e.target as HTMLAudioElement).currentTime;
    this.percent = (this.currentTime / this.duration) * 100;
    const buffered = this.audioEl.buffered;
    if (buffered.length && this.bufferPercent < 100 ) {
      this.bufferPercent = (buffered.end(0) / this.duration) * 100;
    }
  }

  onPrev(index: number) {
    if (!this.songReady) {
      return;
    }
    if (this.playList.length === 1) {
      this.loop();
    } else {
      const newIndex = index < 0 ? this.playList.length - 1 : index;
      this.updateIndex(newIndex);
    }
  }

  onNext(index: number) {
    if (!this.songReady) {
      return;
    }
    if (this.playList.length === 1) {
      this.loop();
    } else {
      const newIndex = index >= this.playList.length ? 0 : index;
      this.updateIndex(newIndex);
    }
  }

  private loop() {
    this.audioEl.currentTime = 0;
    this.play();
  }

  private updateIndex(index: number) {
    this.store$.dispatch(SetCurrentIndex({ currentIndex : index }));
    this.songReady = false;
  }

  onPercentChange(per: number) {
    console.log(per);
    if (this.currentSong) {
      this.audioEl.currentTime = this.duration * (per / 100);
    }
  }

  onVolumeChange(per: number) {
    this.audioEl.volume = per / 100;
  }

  toggleVolPanel(event: MouseEvent) {
    event.stopPropagation();
    this.togglePanel();
  }

  togglePanel() {
    this.showVolumePanel = !this.showVolumePanel;
    if (this.showVolumePanel) {
      this.bindDocumentClickListener();
    } else {
      this.unbindDocumentClickListener();
    }
  }

  private bindDocumentClickListener() {
    if (!this.winClick) {
      this.winClick = fromEvent(this.doc, 'click').subscribe(() => {
        if (!this.selfClick) {
          this.showVolumePanel = false;
          this.unbindDocumentClickListener();
        }
        this.selfClick = false;
      });
    }
  }

  private unbindDocumentClickListener() {
    if (this.winClick) {
      this.winClick.unsubscribe();
      this.winClick = null;
    }
  }

  onToggle() {
    if (!this.currentSong) {
      if (this.playList.length) {
        this.updateIndex(0);
      }
    } else {
      if (this.songReady) {
        this.playing = !this.playing;
        if (this.playing) {
          this.audioEl.play();
        } else {
          this.audioEl.pause();
        }
      }
    }
  }
}
