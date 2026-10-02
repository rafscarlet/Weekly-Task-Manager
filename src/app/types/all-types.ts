
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

export type Reminder = {
  id: number;
  value: number; 
  unit: Unit; 
}

export type Unit = 'min' | 'h' | 'w' | 'd';

export type ValueLabels = { 
  value: string | number;
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