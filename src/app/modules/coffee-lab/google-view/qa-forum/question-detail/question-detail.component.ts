import { Component, OnInit, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { CoffeeLabService, SEOService, StartupService, GlobalsService } from '@services';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { DialogService } from 'primeng/dynamicdialog';
import { SignupModalComponent } from '../../../components/signup-modal/signup-modal.component';
import { environment } from '@env/environment';

@Component({
    selector: 'app-question-detail',
    templateUrl: './question-detail.component.html',
    styleUrls: ['./question-detail.component.scss'],
})
export class QuestionDetailComponent implements OnInit {
    relatedData: any[] = [];
    detailsData: any;
    idOrSlug: string;
    loading = true;
    jsonLD: any;
    lang: any;
    previousUrl: string;

    constructor(
        private coffeeLabService: CoffeeLabService,
        public router: Router,
        private activatedRoute: ActivatedRoute,
        private toastService: ToastrService,
        private seoService: SEOService,
        private startupService: StartupService,
        private globalsService: GlobalsService,
        public dialogSrv: DialogService,
        @Inject(DOCUMENT) private doc,
    ) {
        this.setSEO();
        this.activatedRoute.params.subscribe((params) => {
            if (params.idOrSlug) {
                this.idOrSlug = params.idOrSlug;
                this.getDetails();
            }
            if (!this.relatedData?.length) {
                this.getQaList();
            }
        });
    }

    ngOnInit(): void {
        this.previousUrl = this.globalsService.previousUrl;
    }

    getQaList() {
        this.coffeeLabService.getForumList('question').subscribe((res: any) => {
            if (res.success) {
                this.relatedData = res.result.questions
                    .filter((item) => item.id !== this.idOrSlug && item.slug !== this.idOrSlug)
                    .slice(0, 3);
            }
        });
    }

    getDetails() {
        this.loading = true;
        this.coffeeLabService.getForumDetails('question', this.idOrSlug).subscribe((res: any) => {
            if (res.success) {
                this.detailsData = res.result;
                this.lang = res.result.lang_code;
                this.globalsService.setLimitCounter();
                this.startupService.load(this.lang || 'en');
                this.setSEO();
                this.setSchemaMackup();
            } else {
                this.toastService.error('The question is not exist.');
                this.router.navigate(['/error']);
            }
            this.loading = false;
        });
    }

    setSEO() {
        this.seoService.setPageTitle(this.detailsData?.question || this.idOrSlug.replace('-', ''));
        if (this.detailsData?.answers?.length) {
            const firstAnswer = this.detailsData?.answers[0];
            this.seoService.setMetaData('description', this.globalsService.getJustText(firstAnswer.answer));
        } else {
            this.seoService.setMetaData('description', 'Questions and Answers for Coffee.');
        }
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
                            name: 'Q+A Forum',
                            item: `${environment.coffeeLabWeb}/${this.lang}/qa-forum`,
                        },
                        {
                            '@type': 'ListItem',
                            position: 3,
                            name: this.detailsData?.question,
                        },
                    ],
                },
                {
                    '@type': 'QAPage',
                    mainEntity: {
                        '@type': 'Question',
                        name: this.detailsData?.slug,
                        text: this.detailsData?.question,
                        answerCount: this.detailsData?.answers?.length || 0,
                        dateCreated: this.detailsData?.created_at,
                        author: {
                            '@type': 'Person',
                            name: this.detailsData?.user_name,
                        },
                        suggestedAnswer: this.detailsData?.answers.map((answer, index) => {
                            return {
                                '@type': 'Answer',
                                text: this.globalsService.getJustText(answer.answer),
                                dateCreated: answer.created_at,
                                url: `${this.doc.URL}?#answer-${answer.id}`,
                                author: {
                                    '@type': 'Person',
                                    name: answer.user_name,
                                },
                            };
                        }),
                    },
                },
            ],
        };
    }

    onGoRelatedQuestion(event, item) {
        event.stopPropagation();
        event.preventDefault();
        if (this.globalsService.getLimitCounter() > 0) {
            this.router.navigate([`/${this.lang}/qa-forum/${item.slug}`]);
        } else {
            this.dialogSrv.open(SignupModalComponent, {
                data: {
                    isLimit: true,
                },
                showHeader: false,
                styleClass: 'signup-dialog',
            });
        }
    }
}
