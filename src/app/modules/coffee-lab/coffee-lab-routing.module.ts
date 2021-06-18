import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CoffeeLabComponent } from './coffee-lab.component';
import { OverviewComponent } from './google-view/overview/overview.component';
import { CoffeeRecipesViewComponent } from './google-view/coffee-recipes/coffee-recipes-view/coffee-recipes-view.component';
import { RecipeDetailComponent } from './google-view/coffee-recipes/recipe-detail/recipe-detail.component';
import { QaForumViewComponent } from './google-view/qa-forum/qa-forum-view/qa-forum-view.component';
import { QuestionDetailComponent } from './google-view/qa-forum/question-detail/question-detail.component';
import { ArticlesViewComponent } from './google-view/articles/articles-view/articles-view.component';
import { ArticleDetailComponent } from './google-view/articles/article-detail/article-detail.component';
import { EraOfWeComponent } from './google-view/era-of-we/era-of-we.component';

const userLang = navigator.language;
const lang = userLang.indexOf('sv') > -1 || userLang.indexOf('SV') > -1 ? 'sv' : 'en';
const routes: Routes = [
    {
        path: '',
        component: CoffeeLabComponent,
        children: [
            {
                path: '',
                component: OverviewComponent,
                children: [
                    {
                        path: '',
                        redirectTo: lang === 'en' ? 'en/qa-forum' : 'sv/fragor-och-svar',
                        pathMatch: 'full',
                    },
                    {
                        path: 'en/qa-forum',
                        component: QaForumViewComponent,
                    },
                    {
                        path: 'en/articles',
                        component: ArticlesViewComponent,
                    },
                    {
                        path: 'en/coffee-recipes',
                        component: CoffeeRecipesViewComponent,
                    },
                    {
                        path: 'en/about-era-of-we',
                        component: EraOfWeComponent,
                    },
                    {
                        path: 'sv/fragor-och-svar',
                        component: QaForumViewComponent,
                    },
                    {
                        path: 'sv/artiklar-och-kunskap',
                        component: ArticlesViewComponent,
                    },
                    {
                        path: 'sv/recept-och-bryggningsmetoder',
                        component: CoffeeRecipesViewComponent,
                    },
                    {
                        path: 'sv/om-era-of-we',
                        component: EraOfWeComponent,
                    },
                ],
            },
            {
                path: ':lang/qa-forum/:idOrSlug',
                component: QuestionDetailComponent,
            },
            {
                path: ':lang/coffee-recipes/:idOrSlug',
                component: RecipeDetailComponent,
            },
            {
                path: ':lang/articles/:idOrSlug',
                component: ArticleDetailComponent,
            },
        ],
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class CoffeLabRoutingModule {}
