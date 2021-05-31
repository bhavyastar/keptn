import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild
} from '@angular/core';
import {Sequence} from '../../_models/sequence';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {ClipboardService} from '../../_services/clipboard.service';
import {DateUtil} from '../../_utils/date.utils';
import {takeUntil} from 'rxjs/operators';
import {ActivatedRoute} from '@angular/router';
import {Subject} from 'rxjs';
import {DtTableDataSource} from '@dynatrace/barista-components/table';
import {DataService} from '../../_services/data.service';

@Component({
  selector: 'ktb-service-remediation-list',
  templateUrl: './ktb-service-remediation-list.component.html',
  styleUrls: ['./ktb-service-remediation-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KtbServiceRemediationListComponent implements OnInit, OnDestroy {
  private _stage: {stageName: string, remediations: Sequence[], config: string };
  @Input()
  set stage(stage: {stageName: string, remediations: Sequence[], config: string }) {
    this._stage = stage;
    this.updateDataSource();
  }
  get stage(): {stageName: string, remediations: Sequence[], config: string } {
    return this._stage;
  }

  @ViewChild('remediationDialog')
  public remediationDialog: TemplateRef<any>;
  public remediationDialogRef: MatDialogRef<any, any>;
  private unsubscribe$: Subject<void> = new Subject<void>();
  public projectName: string;
  public dataSource = new DtTableDataSource();

  constructor(private dialog: MatDialog, private clipboard: ClipboardService, public dateUtil: DateUtil, private route: ActivatedRoute, private dataService: DataService, private _changeDetectorRef: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(params => {
        this.projectName = params.projectName;
        this.dataService._remediationsUpdated.pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
          this.updateDataSource();
        });
      });
  }

  private updateDataSource() {
    this.dataSource.data = this.stage.remediations;
    this._changeDetectorRef.markForCheck();
  }

  public showDialog(): void {
    this.remediationDialogRef = this.dialog.open(this.remediationDialog, {data: this.stage.config});
  }

  public closeDialog(): void {
    if (this.remediationDialogRef) {
      this.remediationDialogRef.close();
    }
  }

  public copyPayload(plainEvent: string): void {
    this.clipboard.copy(plainEvent, 'remediation payload');
  }

  public getRemediationLink(remediation: Sequence) {
    return ['/', 'project', this.projectName, 'sequence', remediation.shkeptncontext, 'event', remediation.getStage(this.stage.stageName).latestEvent.id];
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
  }

}
