import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoffeLabRoutingModule } from './coffee-lab-routing.module';
import { SharedModule } from '@shared';

import { CoffeeLabComponent } from './coffee-lab.component';
import { RecipeViewComponent } from './google-view/recipe-view/recipe-view.component';
import { QaViewComponent } from './google-view/qa-view/qa-view.component';
import { TranslationDropdownComponent } from './components/translation-dropdown/translation-dropdown.component';
import { ForumCardComponent } from './components/forum-card/forum-card.component';
import { BottomBannerComponent } from './components/bottom-banner/bottom-banner.component';
import { ArticleViewComponent } from './google-view/article-view/article-view.component';
import { SearchForumComponent } from './components/search-forum/search-forum.component';

@NgModule({
    declarations: [CoffeeLabComponent, RecipeViewComponent, QaViewComponent, TranslationDropdownComponent, ForumCardComponent, BottomBannerComponent, ArticleViewComponent, SearchForumComponent],
    imports: [CommonModule, CoffeLabRoutingModule, SharedModule],
})
export class CoffeeLabModule {}
