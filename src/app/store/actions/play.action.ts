import { createAction, props } from '@ngrx/store';
import { Song } from 'src/app/services/data-types/common.types';
import { PlayMode } from 'src/app/share/wy-ui/wy-player/player-type';

export const SetPlaying = createAction('[player] Set playing', props<{playing: boolean}>());
export const SetPlayList = createAction('[player] Set play list', props<{ playList: Song[]}>());
export const SetSongList = createAction('[player] Set song list', props<{ songList: Song[]}>());
export const SetPlayMode = createAction('[player] Set play mode', props<{ playMode: PlayMode }>());
export const SetCurrentIndex = createAction('[player] Set current index', props<{ currentIndex: number}>());
