
export type Settings = {
  showCompleted : boolean;
  showWeekends: boolean;
  showDeadlineOnCopy: boolean;
  darkMode: boolean;
  launchAtStartup: boolean;
}

export type TagCategory = {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  preselected?: boolean;
}

export type Reminder = {
  id: number;
  value: number; 
  unit: Unit; 
}

export type Unit = 'min' | 'h' | 'w' | 'd';

export type ValueLabels = { 
  value: Unit;
  label: string;
}

export interface Task {
  id: number;
  date: string;
  time?: string;
  title: string;
  description: string;
  completed: boolean;
  completedAt?: string;
  reminderEnabled?: boolean;
  reminderTimes?: Reminder[];
  deadline?: string;
  tagId?: string;
}

export interface TaskCard extends Task {
  tag?: TagCategory;
  formattedReminders?: string[];
}

export type DialogOptions ={
  title: string;
  message: string;
  
  confirmText?: string;
  cancelText?: string;

  icon?: string;
  danger?: boolean;
}

export type ToastState = 'success' | 'error' | 'warning' | 'notification' | 'default' | null;

export type ToastItem = { 
  id: number;
  message: string;
  state: ToastState;
  fading?: boolean;
  action?: (() => void) | null;
}