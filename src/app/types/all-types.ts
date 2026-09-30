
export type Settings = {
  showCompleted : boolean;
  showWeekends: boolean;
  showDeadlineOnCopy: boolean;
  darkMode: boolean;
}

export type TagCategory = {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  preselected?: boolean;
}

export interface Task {
  id: number;
  date: string;
  time?: string;
  title: string;
  description: string;
  completed: boolean;
  completedAt?: string;
  deadline?: string;
  tagId?: string;
}

export interface TaskCard extends Task {
  tag?: TagCategory;
}

export type DialogOptions ={
  title: string;
  message: string;
  
  confirmText?: string;
  cancelText?: string;

  icon?: string;
  danger?: boolean;
}