
export type Settings = {
  showCompleted : boolean;
  showDeadlineOnCopy: boolean;
  darkMode: boolean;
}

export type TagCategory = {
  id: string;
  name: string;
  color: string;
}

export interface Task {
  id: number;
  date: string;
  title: string;
  description: string;
  completed: boolean;
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