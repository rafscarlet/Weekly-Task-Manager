
export type Settings = {
  showCompleted : boolean;
  showDeadlineOnCopy: boolean;
  darkMode: boolean;
}

export type TagCategory = {
  id: number;
  name: string;
  color: string;
}

export type TaskCard = {
  id: number;
  date: string;
  title: string;
  description: string;
  completed: boolean;
  deadline?: string;
  tag?: TagCategory;
};
