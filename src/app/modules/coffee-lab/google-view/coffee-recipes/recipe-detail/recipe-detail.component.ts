import { DOCUMENT, isPlatformBrowser, isPlatformServer } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ResizeableComponent } from '@base-components';
import { MetaDespMinLength, RouterMap, seoVariables } from '@constants';
import { PostType, RouterSlug } from '@enums';
import { environment } from '@env/environment';
import { SignupModalComponent } from '@modules/coffee-lab/components/signup-modal/signup-modal.component';
import { CoffeeLabService, GlobalsService, ResizeService, SEOService, StartupService } from '@services';
import { getLangRoute } from '@utils';
import { MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { fromEvent } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-recipe-detail',
    templateUrl: './recipe-detail.component.html',
    styleUrls: ['./recipe-detail.component.scss'],
    providers: [MessageService],
})
export class RecipeDetailComponent extends ResizeableComponent implements OnInit, AfterViewInit {
    readonly PostType = PostType;
    relatedData: any[] = [];
    detailsData: any;
    idOrSlug: string;
    infoData: any[] = [
        {
            icon: 'assets/images/aeropress.svg',
            label: 'equipment',
            key: 'equipment_name',
        },
        {
            icon: 'assets/images/brew-ratio.svg',
            label: 'brew_ratio',
            key: 'coffee_ratio',
            key2: 'water_ratio',
        },
        {
            icon: 'assets/images/yeild.svg',
            label: 'yeild',
            key: 'serves',
        },
    ];

    loading = false;
    jsonLD: any;
    lang: any;
    previousUrl = '';
    stickySecData: any;
    orginalUserData: any;
    commentData: any[] = [];
    allComments: any[] = [];
    showCommentBtn = false;
    urlLang: string;
    showToaster = false;
    showAll = true;

    constructor(
        @Inject(DOCUMENT) private doc,
        @Inject(PLATFORM_ID) private platformId: object,
        private activatedRoute: ActivatedRoute,
        private cdr: ChangeDetectorRef,
        private coffeeLabService: CoffeeLabService,
        private dialogSrv: DialogService,
        private globalsService: GlobalsService,
        private messageService: MessageService,
        private router: Router,
        private seoService: SEOService,
        private startupService: StartupService,
        protected resizeService: ResizeService,
    ) {
        super(resizeService);
        this.activatedRoute.params.subscribe((params) => {
            this.urlLang = params?.lang;
            if (params.idOrSlug) {
                this.idOrSlug = params.idOrSlug;
                this.getDetails();
            }
            this.getRecipeList();
            if (isPlatformBrowser(this.platformId)) {
                window.scrollTo(0, 0);
            }
        });

        if (isPlatformBrowser(this.platformId)) {
            if (this.isMobile$) {
                this.showAll = false;
            }
            window.scrollTo(0, 0);
        }
    }

    ngOnInit(): void {}

    ngAfterViewInit() {
        if (isPlatformBrowser(this.platformId) && this.isMobile$) {
            const scrollEvent = fromEvent(window, 'scroll')
                .pipe(debounceTime(100))
                .pipe(takeUntil(this.unsubscribeAll$))
                .subscribe((res) => {
                    if (window.scrollY > 10) {
                        scrollEvent.unsubscribe();
                        this.showAll = true;
                        this.cdr.detectChanges();
                    }
                });
        }
    }

    onRealtedRoute(langCode: string, slug: string) {
        return `/${getLangRoute(langCode)}/coffee-recipes/${slug}`;
    }

    scrollToTop() {
        window.scrollTo(0, 0);
    }

    getRecipeList() {
        this.coffeeLabService
            .getPopularList(
                PostType.RECIPE,
                {
                    count: 11,
                },
                this.urlLang === 'pt-br' ? 'pt' : this.urlLang,
            )
            .subscribe((res) => {
                if (res.success) {
                    this.relatedData = (res.result || [])
                        .filter((item) => item && item?.slug !== this.idOrSlug)
                        .slice(0, 10);
                }
            });
    }

    getDetails() {
        this.loading = true;
        this.coffeeLabService.getForumDetails(PostType.RECIPE, this.idOrSlug).subscribe((res: any) => {
            if (res.success) {
                if (getLangRoute(res.result.lang_code) !== this.urlLang) {
                    this.router.navigateByUrl('/error');
                } else {
                    this.detailsData = {
                        ...res.result,
                        descriptionText: this.globalsService.getJustText(res.result?.description),
                    };
                    this.globalsService.setLimitCounter();
                    this.lang = res.result.lang_code;
                    this.startupService.load(this.lang || 'en');
                    this.previousUrl = `/${getLangRoute(this.lang)}/${
                        (RouterMap[this.lang] || RouterMap.en)[RouterSlug.RECIPE]
                    }`;
                    this.getAllData();
                    this.setSEO();
                    if (isPlatformServer(this.platformId)) {
                        this.setSchemaMackup();
                    }
                    this.messageService.clear();
                    this.messageService.add({ key: 'translate', severity: 'success', closable: false });
                }
            } else {
                this.router.navigate(['/error']);
            }
            this.loading = false;
            this.cdr.detectChanges();
        });
    }

    getAllData() {
        const promises = [];
        if (this.detailsData?.original_recipe_state && this.detailsData?.original_recipe_state === 'ACTIVE') {
            promises.push(
                new Promise((resolve) => this.getOriginalUserDetail(this.detailsData.original_details, resolve)),
            );
        }
        promises.push(new Promise((resolve) => this.getUserDetail(this.detailsData, resolve)));
        promises.push(new Promise((resolve) => this.getCommentsData(resolve)));
        Promise.all(promises)
            .then(() => this.cdr.detectChanges())
            .catch(() => this.cdr.detectChanges());
    }

    getUserDetail(userDatils: any, resolve): void {
        this.coffeeLabService.getUserDetail(userDatils.posted_by, userDatils.organisation_type).subscribe((res) => {
            if (res.success) {
                this.stickySecData = res.result;
            }
            resolve();
        });
    }

    getOriginalUserDetail(userDetails: any, resolve): void {
        this.coffeeLabService.getUserDetail(userDetails.user_id, userDetails.organisation_type).subscribe((res) => {
            if (res.success) {
                this.orginalUserData = res.result;
            }
            resolve();
        });
    }

    getCommentsData(resolve): void {
        this.coffeeLabService.getCommentList(PostType.RECIPE, this.detailsData.slug).subscribe((res: any) => {
            if (res.success) {
                this.allComments = res.result;
                this.commentData = this.allComments?.slice(0, 3);
                if (this.allComments?.length > 3) {
                    this.showCommentBtn = true;
                } else {
                    this.showCommentBtn = false;
                }
            }
            resolve();
        });
    }

    viewAllComments() {
        this.commentData = this.allComments;
        this.showCommentBtn = false;
    }

    setSEO() {
        let title: string;
        let description: string;
        if (this.detailsData?.name) {
            title = this.detailsData?.name.concat(' - Era of We Coffee Forum');
        } else {
            title = 'Era of We Coffee Forum';
        }
        if (this.detailsData?.descriptionText) {
            if (this.detailsData?.descriptionText.length < MetaDespMinLength) {
                description = this.detailsData?.descriptionText.concat(
                    ' - Era of We A global coffee marketplace and community that brings together all members of the supply chain',
                );
            } else {
                description = this.detailsData?.descriptionText;
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
                            item: `${environment.coffeeLabWeb}${getLangRoute(this.lang)}`,
                        },
                        {
                            '@type': 'ListItem',
                            position: 2,
                            name: 'Brewing guides',
                            item: `${environment.coffeeLabWeb}${getLangRoute(this.lang)}/coffee-recipes`,
                        },
                        {
                            '@type': 'ListItem',
                            position: 3,
                            name: this.detailsData?.name,
                        },
                    ],
                },
                {
                    '@type': 'Recipe',
                    author: this.detailsData?.posted_user,
                    cookTime: this.detailsData?.cooking_time,
                    datePublished: this.detailsData?.posted_at,
                    description: this.detailsData?.descriptionText,
                    image: this.detailsData?.cover_image_url,
                    recipeIngredient: this.detailsData?.ingredients?.map((item) => {
                        return `${item.quantity} ${item.quantity_unit}  ${item.name}`;
                    }),
                    name: this.detailsData?.name,
                    prepTime: this.detailsData?.preparation_time,
                    recipeInstructions: this.detailsData?.steps?.map((item, index) => {
                        return {
                            '@type': 'HowToStep',
                            name: `Step ${index + 1}`,
                            text: this.globalsService.getJustText(item.description),
                            url: `${this.doc.URL}#step${index + 1}`,
                        };
                    }),
                    recipeYield: this.detailsData?.serves,
                },
            ],
        };
    }

    onFocus() {
        this.dialogSrv.open(SignupModalComponent, {});
    }

    toastCalled(event) {
        if (event) {
            this.showToaster = true;
        }
    }
}
