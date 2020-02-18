import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { CoreModule } from './core/core.module';
import { NZ_I18N, zh_CN } from 'ng-zorro-antd';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    CoreModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
