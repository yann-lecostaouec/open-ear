import { Exercise } from '../../../Exercise';
import * as _ from 'lodash';
import {
  ReplaySubject,
  Subject,
} from 'rxjs';
import {
  StaticOrGetter,
  toGetter,
} from '../../../../shared/ts-utility';
import { SettingsParams } from '../settings/SettingsParams';
import { Platforms } from '@ionic/core/dist/types/utils/platform';
import AnswerList = Exercise.AnswerList;
import ExerciseExplanationContent = Exercise.ExerciseExplanationContent;
import SettingsControlDescriptor = Exercise.SettingsControlDescriptor;

export type CreateExerciseParams<GAnswer extends string, GSettings extends Exercise.Settings> = {
  readonly id: string,
  readonly summary: string,
  readonly name: string,
  readonly explanation?: ExerciseExplanationContent,
  readonly answerList: StaticOrGetter<AnswerList<GAnswer>, [GSettings]>,
  readonly getQuestion: (settings: GSettings) => Exercise.Question<GAnswer>,
  readonly blackListPlatform?: Platforms,
} & SettingsParams<GSettings>;

// todo: add tests
export function createExercise<GAnswer extends string, GSettings extends Exercise.Settings>(params: CreateExerciseParams<GAnswer, GSettings>): Exercise.Exercise<GAnswer, GSettings> {
  const settings: GSettings = params.defaultSettings;
  return {
    id: params.id,
    summary: params.summary,
    name: params.name,
    explanation: params.explanation,
    blackListPlatform: params.blackListPlatform,
    getSettingsDescriptor: () => params.settingsDescriptors ? toGetter(params.settingsDescriptors)(settings) : [],
    updateSettings: (_settings: GSettings): void => {
      for (let key in _settings) {
        settings[key] = _.isNil(_settings[key]) ? _settings[key] : _settings[key];
      }
    },
    getCurrentSettings: (): GSettings => {
      return settings;
    },
    getAnswerList: (): AnswerList<GAnswer> => {
      return toGetter(params.answerList)(settings);
    },
    getQuestion: () => params.getQuestion(settings),
  }
}

// todo: remove
export abstract class BaseExercise<GAnswer extends string = string, GSettings extends Exercise.Settings = Exercise.Settings> implements Exercise.Exercise<GAnswer, GSettings> {
  private _settingsChangeSubject = new ReplaySubject<GSettings>(1);

  protected _destroy$ = new Subject<void>();
  protected _settings: GSettings = this._getDefaultSettings();

  abstract readonly id: string;
  abstract readonly summary: string;
  abstract readonly name: string;
  abstract readonly explanation: ExerciseExplanationContent;

  abstract getAnswerList(): AnswerList<GAnswer>;

  abstract getQuestion(): Exercise.Question<GAnswer>;

  updateSettings(settings: GSettings): void {
    for (let key in this._settings) {
      this._settings[key] = _.isNil(settings[key]) ? this._settings[key] : settings[key];
    }

    this._settingsChangeSubject.next(settings);
  }

  getCurrentSettings(): GSettings {
    return this._settings;
  }

  onDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  getSettingsDescriptor(): (SettingsControlDescriptor<GSettings>)[] {
    return [];
  }

  protected _getDefaultSettings(): GSettings {
    return {} as GSettings; // couldn't find a better way around it, it means that extending classes will have the responsibility to override this property
  }
}
