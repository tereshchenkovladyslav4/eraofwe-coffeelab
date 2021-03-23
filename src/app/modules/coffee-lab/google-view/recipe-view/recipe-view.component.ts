import { Component, OnInit, HostListener } from '@angular/core';
import { DISCUSSIONS_FORUM } from '../data';

@Component({
    selector: 'app-recipe-view',
    templateUrl: './recipe-view.component.html',
    styleUrls: ['./recipe-view.component.scss'],
})
export class RecipeViewComponent implements OnInit {
    forumKeySearch: string;
    data: any[] = DISCUSSIONS_FORUM;
    selectedData: any = DISCUSSIONS_FORUM[0];
    lastScrollTop = 0;
    showBanner = false;

    @HostListener('window:scroll', ['$event'])
    onWindowScroll() {
        const pos = document.documentElement.scrollTop || document.body.scrollTop;
        if (pos > this.lastScrollTop) {
            this.showBanner = true;
        } else {
            this.showBanner = false;
        }
        this.lastScrollTop = pos <= 0 ? 0 : pos;
    }

    constructor() {}

    ngOnInit(): void {}

    getMenuItemsForItem(item) {
        const items = [
            {
                label: 'Share',
                command: () => {
                    this.onShare(item);
                },
            },
            {
                label: 'Save Post',
                command: () => {
                    this.onSavePost(item);
                },
            },
            {
                label: 'Translate answer',
                command: () => {
                    this.onTranslate(item);
                },
            },
        ];
        return [{ items }];
    }

    onShare(postItem) {}
    onSavePost(postItem) {}
    onTranslate(postItem) {}
}
