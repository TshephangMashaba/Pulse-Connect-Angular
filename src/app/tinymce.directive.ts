import { Directive, ElementRef, AfterViewInit, Output, EventEmitter, Input, OnChanges, SimpleChanges } from '@angular/core';

declare const tinymce: any;

@Directive({
  selector: '[appTinymce]'
})
export class TinymceDirective implements AfterViewInit, OnChanges {
  @Input() content: string = '';
  @Output() contentChange = new EventEmitter<string>();
  
  private editor: any;
  private initialized = false;

  constructor(private el: ElementRef) {}

  ngAfterViewInit() {
    this.initEditor();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.initialized && changes['content'] && changes['content'].currentValue !== this.editor.getContent()) {
      this.editor.setContent(this.content || '');
    }
  }

  private initEditor() {
    const textarea = this.el.nativeElement;
    
    // Generate a unique ID if needed
    if (!textarea.id) {
      textarea.id = 'tinymce-' + Math.random().toString(36).substr(2, 9);
    }

    // Initialize TinyMCE
    tinymce.init({
      target: textarea,
      plugins: 'advlist autolink lists link image charmap print preview anchor searchreplace visualblocks code fullscreen insertdatetime media table paste code help wordcount',
      toolbar: 'undo redo | formatselect | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help',
      menubar: false,
      height: 300,
      setup: (editor: any) => {
        this.editor = editor;
        editor.on('init', () => {
          this.initialized = true;
          if (this.content) {
            editor.setContent(this.content);
          }
        });
        editor.on('change keyup', () => {
          this.contentChange.emit(editor.getContent());
        });
      }
    });
  }

  ngOnDestroy() {
    if (this.editor) {
      this.editor.remove();
    }
  }
}