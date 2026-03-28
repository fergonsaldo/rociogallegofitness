export type ActivityAction = 'created' | 'deleted';

export interface SessionActivityLog {
  id:          string;
  coachId:     string;
  sessionId:   string | null;
  action:      ActivityAction;
  title:       string | null;
  sessionType: string | null;
  modality:    'online' | 'in_person' | null;
  scheduledAt: Date | null;
  loggedAt:    Date;
}

export interface CreateSessionActivityLogInput {
  coachId:     string;
  sessionId:   string;
  action:      ActivityAction;
  title:       string | null;
  sessionType: string;
  modality:    'online' | 'in_person';
  scheduledAt: Date;
}
