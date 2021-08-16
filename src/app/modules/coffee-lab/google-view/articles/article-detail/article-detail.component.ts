import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { Location, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { CoffeeLabService, SEOService, StartupService, GlobalsService } from '@services';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { environment } from '@env/environment';
import { DISCUSSIONS_FORUM } from '../../data';
import { RouterMap, seoVariables } from '@constants';
import { RouterSlug } from '@enums';

@Component({
    selector: 'app-article-detail',
    templateUrl: './article-detail.component.html',
    styleUrls: ['./article-detail.component.scss'],
})
export class ArticleDetailComponent implements OnInit {
    relatedData: any[] = [];
    detailsData: any;
    idOrSlug: string;
    loading = true;
    jsonLD: any;
    lang: any;
    previousUrl: string;
    buttonList = [{ button: 'Roasting' }, { button: 'Coffee grinding' }, { button: 'Milling' }, { button: 'Brewing' }];
    addComment = false;

    constructor(
        private coffeeLabService: CoffeeLabService,
        public router: Router,
        private activatedRoute: ActivatedRoute,
        private seoService: SEOService,
        private location: Location,
        private toastService: ToastrService,
        private startupService: StartupService,
        private globalsService: GlobalsService,
        @Inject(DOCUMENT) private doc,
        @Inject(PLATFORM_ID) private platformId: object,
    ) {
        // this.setSEO();
        this.activatedRoute.params.subscribe((params) => {
            if (params.idOrSlug) {
                this.idOrSlug = params.idOrSlug;
                this.getDetails();
            }
            if (!this.relatedData?.length) {
                this.getArticleList();
            }
        });
    }

    ngOnInit(): void {
        if (isPlatformBrowser(this.platformId)) {
            window.scrollTo(0, 0);
        }
    }

    getArticleList() {
        this.coffeeLabService.getForumList('article', { page: 1, per_page: 4 }).subscribe((res: any) => {
            if (res.success) {
                this.relatedData = res.result
                    .filter((item) => item.id !== this.idOrSlug && item.slug !== this.idOrSlug)
                    .slice(0, 3);
            }
        });
    }

    getDetails() {
        this.loading = true;
        this.coffeeLabService.getForumDetails('article', this.idOrSlug).subscribe((res: any) => {
            if (res.success) {
                this.detailsData = res.result;
                console.log(this.detailsData);
                this.lang = res.result.language;
                if (res.result?.is_era_of_we) {
                    this.previousUrl = `/${this.lang}/${RouterMap[this.lang][RouterSlug.EOW]}`;
                } else {
                    this.previousUrl = `/${this.lang}/${RouterMap[this.lang][RouterSlug.ARTICLE]}`;
                    this.globalsService.setLimitCounter();
                }
                this.startupService.load(this.lang || 'en');
                this.setSEO();
                this.setSchemaMackup();
            } else {
                this.toastService.error('The article is not exist.');
                this.router.navigate(['/error']);
            }
            this.loading = false;
        });
    }

    setSEO() {
        let title: string;
        let description: string;
        if (this.detailsData?.title) {
            if (this.detailsData?.title.length < 40) {
                title = this.detailsData?.title.concat(' - Era of We Coffee Marketplace');
            } else {
                title = this.detailsData?.title;
            }
        } else {
            title = 'Era of We Coffee Marketplace';
        }
        if (this.detailsData?.content) {
            if (this.globalsService.getJustText(this.detailsData?.content).length < 60) {
                description = this.detailsData?.content.concat(
                    ' - Era of We A global coffee marketplace and community that brings together all members of the supply chain',
                );
            } else {
                description = this.globalsService.getJustText(this.detailsData?.content);
            }
        } else {
            description =
                'Era of We A global coffee marketplace and community that brings together all members of the supply chain';
        }
        const imageUrl = this.detailsData?.cover_image_url || seoVariables.image;

        this.seoService.setSEO(title, description);
    }

    setSchemaMackup() {
        this.jsonLD = {
            '@context': 'https://schema.org',
            '@graph': [
                {
                    '@type': 'BreadcrumbList',
                    itemListElement: [
                        {
                            '@type': 'ListItem',
                            position: 1,
                            name: 'Overview',
                            item: `${environment.coffeeLabWeb}/${this.lang}`,
                        },
                        {
                            '@type': 'ListItem',
                            position: 2,
                            name: 'Posts',
                            item: `${environment.coffeeLabWeb}/${this.lang}/articles`,
                        },
                        {
                            '@type': 'ListItem',
                            position: 3,
                            name: this.detailsData?.title,
                        },
                    ],
                },
                {
                    '@type': 'Article',
                    '@id': this.doc.URL,
                    headline: this.seoService.getPageTitle(),
                    description: this.globalsService.getJustText(this.detailsData?.content),
                    image: this.detailsData?.cover_image_url,
                    datePublished: this.detailsData?.created_at,
                    author: {
                        '@type': 'Person',
                        name: this.detailsData.user_name,
                    },
                },
            ],
        };
    }
}
